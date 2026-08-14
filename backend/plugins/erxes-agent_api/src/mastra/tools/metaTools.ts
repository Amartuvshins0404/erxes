import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const AUDIT_ERROR_MAX = 500;

/** Compact, secret-safe error text stored for a failed mutation audit row. */
export function auditErrorMessage(result: unknown): string {
  if (!result || typeof result !== 'object') return '';
  const record = result as Record<string, unknown>;
  const error = typeof record.error === 'string' ? record.error.trim() : '';
  if (error) return error.slice(0, AUDIT_ERROR_MAX);
  const instruction =
    typeof record.instruction === 'string' ? record.instruction.trim() : '';
  if (instruction) return instruction.slice(0, AUDIT_ERROR_MAX);
  try {
    return JSON.stringify(result).slice(0, AUDIT_ERROR_MAX);
  } catch {
    return '';
  }
}

/** Standalone erxes helpers that remain directly bound beside tool discovery. */
export function buildErxesSupportTools() {
  const requestApproval = createTool({
    id: 'request_approval',
    description:
      'Ask the user to approve destructive operations (delete / merge / remove) BEFORE running them. ' +
      'Provide one short summary and the exact operations you will call after approval. This executes nothing.',
    inputSchema: z.object({
      summary: z
        .string()
        .describe('One short confirmation line shown to the user.'),
      operations: z
        .array(
          z.object({
            operation: z.string(),
            args: z.record(z.unknown()).optional(),
          }),
        )
        .describe('The destructive operations to run once approved.'),
    }),
    outputSchema: z.unknown(),
    execute: async ({ summary, operations }) => ({
      requiresApproval: true,
      summary,
      operations: operations ?? [],
    }),
  });

  // Every destructive mutation asks for approval; the agent config cannot bypass this.
  return { request_approval: requestApproval };
}

/**
 * ask_user — ask the user a structured question when a request is ambiguous in
 * a way that changes the outcome. Same input contract as Mastra's built-in
 * askUserTool (question + options + selectionMode), but instead of suspending
 * the run (which needs Mastra snapshot storage this service does not run) it
 * returns the question payload as a plain tool result and ends the turn — the
 * chat UI renders an interactive question card and the user's answer arrives as
 * their next message, exactly like the request_approval replay pattern.
 */
export const askUserTool = createTool({
  id: 'ask_user',
  description:
    'Ask the user a question to clarify an ambiguous request when the missing answer changes what you would do. ' +
    'Provide a short question and up to four concrete options (the user can also write their own answer or skip). ' +
    'Omit options for a free-text answer. This asks and waits — it executes nothing. ' +
    'After calling this tool, END your turn immediately: no summary, no narration, never answer your own question. ' +
    "The user's next message answers it (or says it was skipped — then proceed with your best judgment).",
  inputSchema: z.object({
    question: z.string().min(1).describe('The short question shown to the user.'),
    options: z
      .array(
        z.object({
          label: z
            .string()
            .describe(
              'Short display text; this value is the answer when selected.',
            ),
          description: z
            .string()
            .optional()
            .describe('One line of extra context for this option.'),
        }),
      )
      .max(6)
      .optional()
      .describe('Structured choices. Omit for a free-text answer.'),
    selectionMode: z
      .enum(['single_select', 'multi_select'])
      .optional()
      .describe(
        'How many options the user may pick. Defaults to single_select when options are given.',
      ),
  }),
  outputSchema: z.unknown(),
  execute: async ({ question, options, selectionMode }) => ({
    awaitingUserAnswer: true,
    question,
    options: options ?? [],
    selectionMode:
      selectionMode ?? (options?.length ? 'single_select' : undefined),
  }),
});

/** True for a settled ask_user tool result — the turn is waiting on the user. */
export const isAwaitingUserAnswer = (result: unknown): boolean =>
  !!result &&
  typeof result === 'object' &&
  (result as { awaitingUserAnswer?: unknown }).awaitingUserAnswer === true;
