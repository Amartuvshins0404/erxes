import { z } from 'zod';

/**
 * Plugin-owned replacement for Mastra's built-in `ask_user` tool: the same
 * human-in-the-loop suspension, but the model can batch several related
 * questions into ONE suspension instead of pausing the run once per
 * question. The host renders every question, collects all answers, and
 * resumes the run once with the positional answer list.
 *
 * Kept contract-compatible with the built-in for single-question calls:
 * a resumed bare string (or string array for multi-select) still answers a
 * one-question suspension, so older clients and tests keep working.
 */

/** A structured choice rendered by the host for one ask_user question. */
export interface IAskUserOption {
  label: string;
  description?: string;
}

/**
 * How many provided options a question accepts. `single_select` is the
 * default when options exist; `multi_select` resumes that question with an
 * array of selected labels.
 */
export type IAskUserSelectionMode = 'single_select' | 'multi_select';

/** One question's answer, as submitted by the host. */
export type IAskUserAnswer = string | string[];

export interface IAskUserQuestion {
  question: string;
  options?: IAskUserOption[];
  selectionMode?: IAskUserSelectionMode;
}

const optionSchema = z.object({
  label: z.string().describe('Short display text for this option (1-5 words)'),
  description: z.string().optional().describe('Explanation of what this option means'),
});

const questionSchema = z.object({
  question: z
    .string()
    .min(1)
    .describe('The question to ask the user. Should be clear and specific.'),
  options: z
    .array(optionSchema)
    .optional()
    .describe(
      'Optional choices for this question. If omitted, the host shows a free-text input.',
    ),
  selectionMode: z
    .enum(['single_select', 'multi_select'])
    .optional()
    .describe(
      'Controls how many provided options the user can select. Defaults to single_select when options are provided. Requires options.',
    ),
});

const answerSchema = z.union([z.string(), z.array(z.string())]);

const questionAnswerSchema = z.object({
  question: z.string(),
  answer: answerSchema,
});

/** Formats one answer the way the model reads it back. */
const formatAnswer = (answer: IAskUserAnswer): string =>
  Array.isArray(answer) ? answer.join(', ') : answer;

/**
 * Builds the plugin's `askUser` tool. Async because `@mastra/core/tools` is
 * ESM-only and this plugin compiles as CommonJS.
 */
export const buildAskUserTool = async () => {
  const { createTool } = await import('@mastra/core/tools');

  return createTool({
    id: 'ask_user',
    description:
      'Ask the user one or more questions and wait for their response. Use this when you need clarification, want to validate assumptions, or need the user to make decisions between options. Batch every question you need into ONE call via `questions` instead of suspending repeatedly. Each question takes optional structured choices (2-4 options; omit them for open-ended free-text) and an optional selectionMode for single vs multiple selection.',
    inputSchema: z.object({
      questions: z
        .array(questionSchema)
        .min(1)
        .max(5)
        .describe(
          'The questions to ask, in order. Batch related questions here instead of calling the tool once per question.',
        ),
    }),
    suspendSchema: z.object({
      questions: z.array(questionSchema),
    }),
    resumeSchema: z.union([
      answerSchema,
      z.array(questionAnswerSchema),
    ]),
    execute: async ({ questions }, context) => {
      try {
        for (const question of questions) {
          if (question.selectionMode && !question.options?.length) {
            return {
              content: 'Failed to ask user: selectionMode requires options.',
              isError: true,
            };
          }
        }

        const resumeData = context?.agent?.resumeData as
          | IAskUserAnswer
          | IAskUserAnswer[]
          | undefined;

        if (resumeData !== undefined) {
          // One-question suspensions keep the built-in's legacy shapes: a
          // bare string (or string array for multi-select) answers the only
          // question. Multi-question suspensions resume positionally —
          // element i answers question i.
          const perQuestion: IAskUserAnswer[] =
            questions.length === 1
              ? [resumeData as IAskUserAnswer]
              : (resumeData as IAskUserAnswer[]);

          const lines = questions.map((question, index) => {
            const answer = perQuestion[index];

            return `${question.question}: ${
              answer === undefined ? '(no answer)' : formatAnswer(answer)
            }`;
          });

          return {
            content: `User answered:\n${lines.join('\n')}`,
            isError: false,
          };
        }

        const suspend = context?.agent?.suspend;

        if (suspend) {
          await suspend({ questions });
          return;
        }

        // No agent context available: surface the questions as readable text
        // so non-agent execution paths still expose them to the model.
        const fallback = questions
          .map((question) => {
            const options = question.options?.length
              ? ` Options: ${question.options.map((o) => o.label).join(', ')}.`
              : '';

            return `[Question for user]: ${question.question}${options}`;
          })
          .join('\n');

        return { content: fallback, isError: false };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';

        return { content: `Failed to ask user: ${msg}`, isError: true };
      }
    },
  });
};
