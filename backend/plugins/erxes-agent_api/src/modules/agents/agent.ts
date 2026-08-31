import type { Agent } from '@mastra/core/agent' with {
  'resolution-mode': 'import',
};
import type { MastraMemory } from '@mastra/core/memory' with {
  'resolution-mode': 'import',
};
import type { Mastra } from '@mastra/core/mastra' with {
  'resolution-mode': 'import',
};
import type { IAiAgentConnection } from 'erxes-api-shared/core-modules';
import type { ProviderOptions } from '@mastra/core/llm/model/provider-options' with {
  'resolution-mode': 'import',
};
import {
  createModelConfig,
  resolveModelConnection,
} from '@/agents/providers';
import { buildAgentsTools } from '@/agents/tools';

/**
 * Builds the single agents chat agent per request from one of the acting
 * user's BYOK connections (provider/model/credentials stored on this
 * plugin's per-user connections document). There are no agent definition
 * documents and no per-agent configuration: instructions are fixed and the
 * per-request inputs are the chosen connection and thinking level.
 */

const DEFAULT_INSTRUCTIONS = `You are a helpful assistant inside the erxes XOS. Answer concisely and accurately.

You can ask the user a question with the ask_user tool when you need
clarification, must validate an assumption, or need the user to decide
between options. Provide 2-4 options for structured choices or omit them
for an open-ended question; the question is shown to the user and the run
resumes with their answer. Prefer asking over guessing when the request is
ambiguous or the action would be hard to undo.`;;

const TEMPERATURE = 0.2;
const MAX_OUTPUT_TOKENS = 2000;

/** Thinking depth the chat UI can pick per turn. */
export type IAgentsThinkingLevel =
  | 'off'
  | 'minimal'
  | 'low'
  | 'medium'
  | 'high';

const THINKING_LEVELS: readonly IAgentsThinkingLevel[] = [
  'off',
  'minimal',
  'low',
  'medium',
  'high',
];

export const isAgentsThinkingLevel = (value: unknown): value is IAgentsThinkingLevel =>
  typeof value === 'string' &&
  (THINKING_LEVELS as readonly string[]).includes(value);

const OPENAI_REASONING_EFFORT: Record<
  Exclude<IAgentsThinkingLevel, 'off'>,
  'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max'
> = {
  minimal: 'minimal',
  low: 'low',
  medium: 'medium',
  high: 'high',
};

/** xAI has no 'minimal'; its floor is 'low'. */
const XAI_REASONING_EFFORT: Record<
  Exclude<IAgentsThinkingLevel, 'off'>,
  'none' | 'low' | 'medium' | 'high'
> = {
  minimal: 'low',
  low: 'low',
  medium: 'medium',
  high: 'high',
};

const ANTHROPIC_THINKING_BUDGET: Record<
  Exclude<IAgentsThinkingLevel, 'off'>,
  number
> = {
  minimal: 1000,
  low: 4000,
  medium: 10000,
  high: 16000,
};

/**
 * Maps the normalized thinking level to each provider family's native
 * option shape. Kimi's OpenAI-compatible endpoint has no verified thinking
 * control, so it is left untouched. Returns undefined when the provider
 * takes no options for the requested level.
 */
const buildThinkingProviderOptions = (
  provider: string,
  thinkingLevel: IAgentsThinkingLevel,
): ProviderOptions | undefined => {
  if (thinkingLevel === 'off') {
    return undefined;
  }

  switch (provider) {
    case 'openai':
      return { openai: { reasoningEffort: OPENAI_REASONING_EFFORT[thinkingLevel] } };
    case 'grok':
      return { xai: { reasoningEffort: XAI_REASONING_EFFORT[thinkingLevel] } };
    case 'kimi-code': {
      // Anthropic requires maxTokens > budgetTokens; keep a healthy margin
      // for the visible response and floor the budget so 'minimal' is real.
      const budget = Math.min(
        ANTHROPIC_THINKING_BUDGET[thinkingLevel],
        MAX_OUTPUT_TOKENS - 500,
      );

      return {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: Math.max(budget, 1000) },
        },
      };
    }
    default:
      return undefined;
  }
};

export const buildAgentsAgent = async ({
  connection,
  memory,
  mastra,
  thinkingLevel = 'off',
}: {
  /** The BYOK connection the chat selected for this turn. */
  connection: IAiAgentConnection;
  /** Tenant memory instance; wired when the caller wants persisted threads. */
  memory?: MastraMemory;
  /**
   * Mastra instance owning persistent snapshot storage. Required for
   * destructive-tool approval suspend/resume to survive across requests;
   * without it a standalone Agent falls back to an ephemeral in-memory
   * snapshot store and a suspended run can never be resumed later.
   */
  mastra?: Mastra;
  /** Thinking depth for this turn; mapped to per-provider options. */
  thinkingLevel?: IAgentsThinkingLevel;
}): Promise<Agent> => {
  const resolved = resolveModelConnection({
    connection,
  });
  const model = await createModelConfig(resolved);

  // @mastra/core/agent is ESM-only; load it dynamically from CommonJS.
  const { Agent } = await import('@mastra/core/agent');
  const [{ searchTools, callTool }, { askUserTool }] = await Promise.all([
    buildAgentsTools(),
    import('@mastra/core/tools'),
  ]);

  // Anthropic thinking consumes the output-token budget, so raise the cap
  // when a budget is requested instead of starving the visible response.
  const thinkingBudget =
    thinkingLevel === 'off'
      ? 0
      : Math.min(
          ANTHROPIC_THINKING_BUDGET[thinkingLevel],
          MAX_OUTPUT_TOKENS - 500,
        );
  const maxOutputTokens =
    resolved.provider === 'kimi-code' && thinkingBudget > 0
      ? Math.max(MAX_OUTPUT_TOKENS, thinkingBudget + 1000)
      : MAX_OUTPUT_TOKENS;
  const providerOptions = buildThinkingProviderOptions(
    resolved.provider,
    thinkingLevel,
  );

  return new Agent({
    id: 'agents',
    name: 'agents',
    instructions: DEFAULT_INSTRUCTIONS,
    // The model sees the two-tier tool bridge (discover tools, then execute
    // one) plus Mastra's built-in ask_user tool for human-in-the-loop
    // questions. The acting user is provided per-request via RequestContext.
    tools: { searchTools, callTool, askUser: askUserTool },
    // `modelSettings` is not an Agent constructor option — it lives on each
    // entry of a model-fallback array (AgentConfig.model accepts
    // `MastraModelConfig | ModelWithRetries[]`). A single-entry array applies
    // the module's fixed temperature / maxOutputTokens and, when requested,
    // the per-provider thinking options.
    model: [
      {
        model,
        modelSettings: {
          temperature: TEMPERATURE,
          maxOutputTokens,
        },
        ...(providerOptions ? { providerOptions } : {}),
      },
    ],
    ...(memory ? { memory } : {}),
    ...(mastra ? { mastra } : {}),
  });
};
