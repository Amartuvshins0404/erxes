import { Agent } from '@mastra/core/agent';
import { ToolSearchProcessor } from '@mastra/core/processors';
import type { ToolsInput } from '@mastra/core/agent';
import type { IModels } from '~/connectionResolvers';
import type { IMastraAgentDocument } from '@/agent/@types/agent';
import { BUILTIN_TOOLS } from './tools/builtins';
import { buildModel } from './providers';
import { buildSystemPrompt, ToolInfo } from './instructions/routing';
import { getOperationRegistry } from './tools/operationRegistry';
import { buildErxesSupportTools } from './tools/metaTools';
import {
  buildErxesOperationTools,
  type ErxesOperationTools,
} from './tools/operationTools';
import {
  isBuiltinAllowed,
  hasAnyOperation,
  scopeSummary,
  capabilityInventory,
} from './tools/scope';
import type { ToolPolicy } from './tools/scope';
import { resolveDestructiveOpsPolicy } from './tools/destructiveGuard';
import type { DestructiveOpsPolicy } from './tools/destructiveGuard';
import { writeAgentAction, AgentActionInput } from './auditLog';
import { isAdvancedMemoryEnabled } from './memory/config';
import { getMastraMemory } from './memory/mastraMemory';
import { ToolCallSignalFilter } from './memory/toolCallSignalFilter';
import { isEvaluationEnabled } from './scoring/config';
import { buildAgentScorers } from './scoring/scorers';
import { getObservabilityHost } from './scoring/observability';
import { getSkillsWorkspace } from '@/skills/store/skillsWorkspace';
import { createMakeSkillTool } from '@/skills/tools/makeSkill';
import type { OperationRegistry } from './tools/operationRegistry';
import type { IMastraProviderDocument } from '@/provider/@types/provider';
import type { IMastraSettingsDocument } from '@/settings/@types/settings';
import { resolveAgentGrantPolicy } from './tools/agentGrantPolicy';

// Cache agents by config ID + updatedAt + routing version.
const agentCache = new Map<string, Agent>();

// Also cache the raw tools map so the resolver can execute them directly
// when a model outputs function calls as plain text instead of tool_calls.
const toolsCache = new Map<string, ToolsInput>();

// Increment this whenever routing, operation discovery, or provider logic changes.
const ROUTING_VERSION = 32;

export interface AgentWithTools {
  agent: Agent;
  tools: ToolsInput;
}

export interface GetOrCreateAgentOptions {
  // Already-loaded config the caller fetched for its own use. When BOTH are
  // supplied the duplicate Mongo reads here are skipped (prepareTurn loads them
  // alongside the agent config in one Promise.all). Standalone callers omit them
  // and the values are fetched here — getSettings() is process-cached anyway.
  providers?: IMastraProviderDocument[];
  settings?: IMastraSettingsDocument;
}

/**
 * Composite cache key over every dimension that changes the built agent.
 *
 * A different composition would silently break cache hits/evictions, so this
 * mirrors the original key exactly:
 *   • updatedAt + ROUTING_VERSION + inventory fingerprint rebuild on config /
 *     routing / installed-plugin changes.
 *   • resolved tool-policy mode + exact allowed identities ensure an agent
 *     cannot reuse stale grants whose inventories have the same count.
 *   • memory joins the subdomain only when advanced memory is on.
 *   • evaluation binds each tenant to its own Langfuse project (per-subdomain
 *     observability host) when on.
 *   • skills key the subdomain + allowlist so a cached agent can't be reused
 *     for another tenant with the wrong skills source.
 */
/**
 * Unambiguous, allocation-light identity for the resolved server-side grant.
 * The resolver produces a stable allowlist order, so preserve it rather than
 * sorting and allocating a second array on every runtime lookup.
 */
function policyCacheTag(policy: ToolPolicy): string {
  let tag = `${policy.mode.length}:${policy.mode}`;
  for (const identity of policy.allowed) {
    tag += `:${identity.length}:${identity}`;
  }
  return tag;
}

function buildAgentCacheKey(params: {
  agentConfig: IMastraAgentDocument;
  subdomain?: string;
  useMemory: boolean;
  evaluationEnabled: boolean;
  inventoryFingerprint: string;
  policy: ToolPolicy;
}): string {
  const {
    agentConfig,
    subdomain,
    useMemory,
    evaluationEnabled,
    inventoryFingerprint,
    policy,
  } = params;
  const evalTag = evaluationEnabled ? subdomain || 'os' : 'off';
  const skillsTag = agentConfig.skills?.length
    ? `${subdomain || 'os'}:${agentConfig.skills.join('|')}`
    : 'off';

  return `${agentConfig._id}:${
    agentConfig.updatedAt?.getTime?.() ?? 0
  }:v${ROUTING_VERSION}:${inventoryFingerprint}:policy${policyCacheTag(
    policy,
  )}:mem${useMemory ? subdomain : 'off'}:eval${evalTag}:skills${skillsTag}`;
}

/**
 * Assemble directly-bound support/builtin tools plus the policy-filtered erxes
 * operation catalog searched by ToolSearchProcessor. Also returns the ToolInfo
 * list that grounds the system prompt.
 */
function assembleAgentTools(params: {
  agentConfig: IMastraAgentDocument;
  models: IModels;
  providers: IMastraProviderDocument[];
  registry: OperationRegistry;
  settings: IMastraSettingsDocument;
  policy: ToolPolicy;
  destructiveOps: DestructiveOpsPolicy;
  hasErxes: boolean;
}): {
  tools: ToolsInput;
  operationTools: ErxesOperationTools;
  builtinInfos: ToolInfo[];
} {
  const {
    agentConfig,
    models,
    providers,
    registry,
    settings,
    policy,
    destructiveOps,
    hasErxes,
  } = params;

  const tools: ToolsInput = {};
  const builtinInfos: ToolInfo[] = [];

  // Per-agent audit sink: every mutation the agent runs (or is blocked from)
  // is recorded against this agent. Fire-and-forget inside writeAgentAction.
  const recordAction = (entry: AgentActionInput) =>
    writeAgentAction(models, {
      ...entry,
      source: 'chat',
      agentId: agentConfig.agentId,
    });

  const operationTools = hasErxes
    ? buildErxesOperationTools({
        registry,
        settings,
        policy,
        destructiveOps,
        recordAction,
      })
    : {};

  if (hasErxes) {
    Object.assign(
      tools,
      buildErxesSupportTools({
        policy,
        destructiveOps,
      }),
    );
  }

  // Standalone builtin tools, filtered by policy.
  for (const [key, tool] of Object.entries(BUILTIN_TOOLS)) {
    if (!isBuiltinAllowed(key, policy)) continue;
    tools[key] = tool;
    builtinInfos.push({
      id: key,
      name: key,
      description: tool.description,
    });
  }

  // file_reader is bound regardless of policy: the agent must always be able to
  // open a file the user attached or one it generated. (It only reads files from
  // this instance's own storage / artifacts — no external reach.)
  if (!tools.fileReader) {
    const tool = BUILTIN_TOOLS.fileReader;
    tools.fileReader = tool;
    builtinInfos.push({
      id: 'fileReader',
      name: 'fileReader',
      description: tool.description,
    });
  }

  // Skills-enabled agents can distill the current conversation into a SKILL.md
  // draft via the makeSkill tool (the only creation path). Bound with the
  // agent's own provider/model; the thread/user come from the request context.
  if (agentConfig.skills?.length) {
    const makeSkillTool = createMakeSkillTool({
      provider: agentConfig.provider,
      model: agentConfig.model,
      providers,
    });
    tools.make_skill = makeSkillTool;
    builtinInfos.push({
      id: 'make_skill',
      name: 'make_skill',
      description: makeSkillTool.description,
    });
  }

  return { tools, operationTools, builtinInfos };
}

/**
 * Step budget for a turn. Workflow builds are 20+ steps (guide → searches →
 * validate → simulate → save → run), so workflow-capable agents floor at 32.
 * Pure chat/search/chart agents only ever need ~5 steps — use the configured
 * value with a floor of 8 so they don't waste LLM round-trips. Tool-less agents
 * take the configured value verbatim.
 */
function resolveMaxSteps(
  agentConfig: IMastraAgentDocument,
  toolNames: string[],
  hasErxes: boolean,
): number {
  const configuredSteps = agentConfig.maxSteps || 8;
  const hasWorkflowTools = toolNames.some((k) => k.startsWith('workflow'));
  const stepFloor = hasWorkflowTools ? 32 : 8;
  return toolNames.length || hasErxes
    ? Math.max(configuredSteps, stepFloor)
    : configuredSteps;
}

/**
 * Wire the agent to the per-tenant observability host so traces + scores reach
 * the central Langfuse. Two distinct hooks, both guarded (internal Mastra APIs):
 *   • __registerMastra(host)  → the agent emits TRACES to host.observability.
 *   • host.addScorer(scorer)  → registers each scorer so Mastra's onScorerRun
 *     hook can resolve it (findScorer → getScorerById) AND sets scorer.#mastra
 *     = host, so the scorer's run() emits its SCORE to Langfuse. (The host's
 *     storage, set above, is what stops the hook from bailing.)
 * Null host = evaluation off or Langfuse unconfigured → no-op.
 */
async function wireAgentObservability(params: {
  agent: Agent;
  subdomain?: string;
  scorers?: ReturnType<typeof buildAgentScorers>;
}): Promise<void> {
  const { agent, subdomain, scorers } = params;

  const host = await getObservabilityHost(subdomain);
  if (!host) return;

  const register = (
    agent as unknown as { __registerMastra?: (m: unknown) => void }
  ).__registerMastra;
  if (typeof register === 'function') register.call(agent, host);

  const addScorer = (
    host as unknown as {
      addScorer?: (s: unknown, key?: string, o?: { source: string }) => void;
    }
  ).addScorer;
  if (scorers && typeof addScorer === 'function') {
    for (const [id, entry] of Object.entries(scorers)) {
      addScorer.call(host, entry.scorer, id, { source: 'code' });
    }
  }
}

/** Build (or return the cached) Mastra agent for a stored agent config. */
export async function getOrCreateAgent(
  agentConfig: IMastraAgentDocument,
  models: IModels,
  subdomain?: string,
  options: GetOrCreateAgentOptions = {},
): Promise<AgentWithTools> {
  // Mastra Memory (persistence + semantic recall + working memory) is attached
  // whenever advanced memory is on and the agent hasn't opted out. An unknown
  // tenant must NOT detach memory — that would stop the turn from being
  // persisted (and lose the session); scopedResource defaults an empty subdomain
  // to the "os" scope.
  const useMemory =
    isAdvancedMemoryEnabled() && agentConfig.memoryEnabled !== false;
  // Reuse the caller's already-fetched config when present; otherwise load it.
  const [providers, settings] =
    options.providers && options.settings
      ? [options.providers, options.settings]
      : await Promise.all([
          models.MastraProvider.find({ isEnabled: true }),
          models.MastraSettings.getSettings(),
        ]);

  // Resolve the live server-side grant on every cache build. Missing groups,
  // missing tenant context, and core lookup failures all produce zero tools.
  const registry = await getOperationRegistry(settings);
  const policy = await resolveAgentGrantPolicy({
    subdomain,
    grantGroupId: agentConfig.grantGroupId,
    registry,
  });

  // Consent for irreversible deletes/merges. Defaults to 'block' (including
  // legacy agents with no persisted field); direct operation tools enforce it.
  const destructiveOps = resolveDestructiveOpsPolicy(agentConfig);


  // The installed-services inventory both grounds the system prompt AND keys
  // the cache: enabling/disabling a plugin changes the fingerprint, so the
  // agent (and its prompt) is rebuilt as soon as the registry refreshes.
  const inventory = capabilityInventory(registry.list, policy);

  // Evaluation is process-wide (env), but the observability host is per-tenant
  // — so when it's on, the subdomain joins the cache key to keep each tenant's
  // agent bound to its own Langfuse project (serviceName).
  const evaluationEnabled = isEvaluationEnabled();

  const cacheKey = buildAgentCacheKey({
    agentConfig,
    subdomain,
    useMemory,
    evaluationEnabled,
    inventoryFingerprint: inventory.fingerprint,
    policy,
  });

  const cached = agentCache.get(cacheKey);
  if (cached) {
    return {
      agent: cached,
      tools: toolsCache.get(cacheKey) ?? {},
    };
  }

  // Evict stale entries for this agent
  for (const key of agentCache.keys()) {
    if (key.startsWith(`${agentConfig._id}:`)) {
      agentCache.delete(key);
      toolsCache.delete(key);
    }
  }

  const model = buildModel(agentConfig.provider, agentConfig.model, providers);

  const hasErxes = hasAnyOperation(registry.list, policy);
  const { tools, operationTools, builtinInfos } = assembleAgentTools({
    agentConfig,
    models,
    providers,
    registry,
    settings,
    policy,
    destructiveOps,
    hasErxes,
  });

  // Conversation persistence + recent-history replay + recall are owned by the
  // attached Mastra Memory (the chat store IS the native memory store; see
  // memory below + session/nativeStore.ts). No custom message store.
  const toolNames = Object.keys(tools);
  const systemPrompt = buildSystemPrompt(agentConfig.instructions || '', {
    hasErxesTools: hasErxes,
    scopeLine: scopeSummary(policy),
    inventoryLines: inventory.lines,
    builtins: builtinInfos,
  });

  const maxSteps = resolveMaxSteps(agentConfig, toolNames, hasErxes);

  // Configured sampling temperature. Unset → provider/SDK default (the legacy
  // loop hardcodes 0, which models like Kimi thinking — "only 1 is allowed" —
  // reject; setting it here lets the dashboard fix that per agent).
  const temperature = agentConfig.temperature;
  const hasTemperature = typeof temperature === 'number';

  // Per-tenant Mastra Memory (recall + working memory). ToolCallSignalFilter
  // strips raw tool-call frames from any replayed/recalled history so reasoning
  // models (Kimi) don't reject the request, but leaves a text breadcrumb so the
  // model keeps calling render tools on later turns. Both are opt-in via
  // advanced memory.
  const memory = useMemory ? await getMastraMemory(subdomain) : undefined;

  // Quality scorers (heuristic + LLM-judge using this agent's own model) — only
  // when ERXES_AGENT_EVALUATION=enable. Results export to Langfuse via the host
  // registered below.
  const scorers = evaluationEnabled ? buildAgentScorers(model) : undefined;

  // Native Mastra skills: a per-subdomain Workspace (Mongo-backed SkillSource +
  // dynamic per-user resolver). Passing `workspace` makes the Agent auto-wire the
  // SkillsProcessor (name+description into the prompt) and the skill /
  // skill_search / skill_read tools (progressive disclosure). Additive: only
  // attached when the agent declares a skills allowlist.
  const skillsWorkspace = agentConfig.skills?.length
    ? getSkillsWorkspace(subdomain || 'os', agentConfig.skills)
    : undefined;

  const inputProcessors = [
    ...(hasErxes
      ? [
          new ToolSearchProcessor({
            tools: operationTools,
            search: { topK: 3, minScore: 0.1, autoLoad: true },
            storage: 'context',
          }),
        ]
      : []),
    ...(memory ? [new ToolCallSignalFilter()] : []),
  ];

  const agent = new Agent({
    id: agentConfig.agentId,
    name: agentConfig.name,
    instructions: systemPrompt,
    model,
    tools: toolNames.length ? tools : undefined,
    ...(memory ? { memory } : {}),
    ...(inputProcessors.length ? { inputProcessors } : {}),
    ...(scorers ? { scorers } : {}),
    ...(skillsWorkspace ? { workspace: skillsWorkspace } : {}),
    // generate()/stream() read defaultOptions. Temperature is only set when the
    // agent configures it — otherwise the provider default applies (sending an
    // explicit 0 is what reasoning models like Kimi reject).
    defaultOptions: {
      maxSteps,
      ...(hasTemperature ? { modelSettings: { temperature } } : {}),
    },
  } as never);

  if (evaluationEnabled) {
    await wireAgentObservability({ agent, subdomain, scorers });
  }

  const executableTools = { ...tools, ...operationTools };
  agentCache.set(cacheKey, agent);
  toolsCache.set(cacheKey, executableTools);
  return { agent, tools: executableTools };
}

/** Drop every cached agent built from the given stored config id. */
export function invalidateAgentCache(agentId: string) {
  for (const key of agentCache.keys()) {
    if (key.startsWith(`${agentId}:`)) {
      agentCache.delete(key);
      toolsCache.delete(key);
    }
  }
}
