import { Agent } from '@mastra/core/agent';
import { ToolSearchProcessor } from '@mastra/core/processors';
import type { ToolsInput } from '@mastra/core/agent';
import { ExpectedError } from 'erxes-api-shared/utils';
import type { IModels } from '~/connectionResolvers';
import type { IMastraAgentDocument } from '@/agent/@types/agent';
import { BUILTIN_TOOLS } from './tools/builtins';
import { buildModel, providerRuntimeFingerprint } from './providers';
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
import { resolveAgentAllowedTools } from './tools/permissionCapabilities';
import type { GroupPermission } from './tools/actionsToAllowedTools';
import { resolveDestructiveOpsPolicy } from './tools/destructiveGuard';
import type { DestructiveOpsPolicy } from './tools/destructiveGuard';
import { writeAgentAction, AgentActionInput } from './auditLog';
import { isWorkspaceMemoryEnabled } from './memory/config';
import { getMastraMemory } from './memory/mastraMemory';
import { ToolCallSignalFilter } from './memory/toolCallSignalFilter';
import {
  evaluationConfigFingerprint,
  isEvaluationEnabled,
} from './scoring/config';
import {
  buildAgentScorers,
  type AgentScorerEntry,
} from './scoring/scorers';
import { getObservabilityHost } from './scoring/observability';
import { getSkillsWorkspace } from '@/skills/store/skillsWorkspace';
import { createMakeSkillTool } from '@/skills/tools/makeSkill';
import type { OperationRegistry } from './tools/operationRegistry';
import type { IMastraProviderDocument } from '@/provider/@types/provider';
import type { IMastraSettingsDocument } from '@/settings/@types/settings';
import {
  agentAccountName,
  getAgentAccount,
  getCoreUserById,
  type AgentAccount,
} from './auth/servicePrincipal';

// Cache agents by config ID + updatedAt + routing version.
const agentCache = new Map<string, Agent>();

// Also cache the raw tools map so the resolver can execute them directly
// when a model outputs function calls as plain text instead of tool_calls.
const toolsCache = new Map<string, ToolsInput>();

const PERMISSION_SCOPE_RANK = { own: 0, group: 1, all: 2 } as const;

const safePermissionScope = (
  scope: string | undefined,
): keyof typeof PERMISSION_SCOPE_RANK =>
  scope === 'all' || scope === 'group' ? scope : 'own';

const intersectCustomPermissions = (
  delegated: GroupPermission[],
  current: GroupPermission[],
): GroupPermission[] =>
  delegated.flatMap((permission) => {
    const live = current.find(
      (candidate) =>
        candidate.plugin === permission.plugin &&
        candidate.module === permission.module,
    );
    const actions = (permission.actions ?? []).filter((action) =>
      live?.actions?.includes(action),
    );
    if (!actions.length) return [];
    const delegatedScope = safePermissionScope(permission.scope);
    const liveScope = safePermissionScope(live?.scope);
    const scope =
      PERMISSION_SCOPE_RANK[delegatedScope] <= PERMISSION_SCOPE_RANK[liveScope]
        ? delegatedScope
        : liveScope;
    return [{ ...permission, actions, scope }];
  });

const enforceDelegatedPermissionCeiling = async ({
  account,
  agentConfig,
  subdomain,
}: {
  account: AgentAccount;
  agentConfig: IMastraAgentDocument;
  subdomain: string;
}): Promise<AgentAccount> => {
  if (agentConfig.permissionMode !== 'delegated') return account;
  if (!agentConfig.createdBy) {
    throw new ExpectedError('AI team member permission owner not found');
  }
  const creator = await getCoreUserById(subdomain, agentConfig.createdBy);
  if (!creator || creator.isActive === false) {
    throw new ExpectedError('AI team member permission owner is inactive');
  }
  if (creator.isOwner || creator.role === 'admin') return account;

  const creatorGroupIds = new Set(creator.permissionGroupIds ?? []);
  return {
    ...account,
    permissionGroupIds: (account.permissionGroupIds ?? []).filter((groupId) =>
      creatorGroupIds.has(groupId),
    ),
    customPermissions: intersectCustomPermissions(
      account.customPermissions ?? [],
      creator.customPermissions ?? [],
    ),
  };
};

// Increment this whenever routing.ts, the meta-tools, or provider logic changes.
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
  account?: AgentAccount;
}

/**
 * Composite cache key over every dimension that changes the built agent.
 *
 * A different composition would silently break cache hits/evictions, so this
 * mirrors the original key exactly:
 *   • updatedAt + ROUTING_VERSION + inventory fingerprint rebuild on config /
 *     routing / installed-plugin changes.
 *   • memory joins the subdomain only when advanced memory is on.
 *   • evaluation binds each tenant to its own Langfuse project (per-subdomain
 *     observability host) when on.
 *   • skills key the subdomain + allowlist so a cached agent can't be reused
 *     for another tenant with the wrong skills source.
 */
function buildAgentCacheKey(params: {
  agentConfig: IMastraAgentDocument;
  backgroundRemovalEnabled: boolean;
  subdomain?: string;
  useMemory: boolean;
  evaluationFingerprint: string;
  inventoryFingerprint: string;
  permissionFingerprint: string;
  providerFingerprint: string;
}): string {
  const {
    agentConfig,
    subdomain,
    backgroundRemovalEnabled,
    useMemory,
    evaluationFingerprint,
    inventoryFingerprint,
    permissionFingerprint,
    providerFingerprint,
  } = params;

  const evalTag = evaluationFingerprint;
  const skillsTag = agentConfig.skills?.length
    ? `${subdomain || 'os'}:${agentConfig.skills.join('|')}`
    : 'off';

  return `${agentConfig._id}:${
    agentConfig.updatedAt?.getTime?.() ?? 0
  }:v${ROUTING_VERSION}:${inventoryFingerprint}:permissions${permissionFingerprint}:provider${providerFingerprint}:mem${
    useMemory ? subdomain : 'off'
  }:eval${evalTag}:bg${
    backgroundRemovalEnabled ? 'on' : 'off'
  }:skills${skillsTag}`;
}

/**
 * Assemble the agent's tool map: erxes meta-tools (only when the policy grants
 * an operation), policy-filtered builtins, the always-on fileReader, and — for
 * skills-enabled agents — the make_skill tool. Also returns the ToolInfo list
 * that grounds the system prompt.
 */
function assembleAgentTools(params: {
  agentConfig: IMastraAgentDocument;
  models: IModels;
  providers: IMastraProviderDocument[];
  registry: OperationRegistry;
  policy: ToolPolicy;
  destructiveOps: DestructiveOpsPolicy;
  hasErxes: boolean;
  settings: IMastraSettingsDocument;
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
    policy,
    destructiveOps,
    hasErxes,
    settings,
  } = params;

  const tools: ToolsInput = {};
  const builtinInfos: ToolInfo[] = [];

  // Per-agent audit sink: every mutation the agent runs (or is blocked from)
  // is recorded against this agent. Fire-and-forget inside writeAgentAction.
  const recordAction = (entry: AgentActionInput) =>
    writeAgentAction(models, {
      ...entry,
      source: 'chat',
      agentId: agentConfig._id,
    });

  const operationTools = hasErxes
    ? buildErxesOperationTools({
        registry,
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
    if (
      key === 'removeImageBackground' &&
      settings.backgroundRemovalEnabled === false
    ) {
      continue;
    }
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

  // Personal skill creation is visible only when the AI team member has the
  // corresponding skills permission and a human initiated this turn.
  if (agentConfig.skills?.length && isBuiltinAllowed('make_skill', policy)) {
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
  scorers?: Record<string, AgentScorerEntry>;
  settings: IMastraSettingsDocument;
}): Promise<void> {
  const { agent, subdomain, scorers, settings } = params;

  const host = await getObservabilityHost(subdomain, settings);
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
  // Reuse the caller's already-fetched config when present; otherwise load it.
  const [providers, settings] =
    options.providers && options.settings
      ? [options.providers, options.settings]
      : await Promise.all([
          models.MastraProvider.getRuntimeProviders(),
          models.MastraSettings.getSettings(),
        ]);
  // Mastra Memory (chat persistence + semantic recall + working memory) is
  // attached only when both the workspace setting and this agent allow it.
  // Missing workspace settings default to enabled for existing tenants.
  const useMemory =
    isWorkspaceMemoryEnabled(settings) && agentConfig.memoryEnabled !== false;
  const destructiveOps = resolveDestructiveOpsPolicy(agentConfig);

  // Core is authoritative for both identity and permissions. Reading the
  // account here also makes permission changes invalidate the runtime cache
  // even when they were made from the standard Team Members UI.
  const storedAccount =
    options.account ??
    (await getAgentAccount({
      userId: agentConfig._id,
      subdomain: subdomain || 'os',
    }));
  const account = await enforceDelegatedPermissionCeiling({
    account: storedAccount,
    agentConfig,
    subdomain: subdomain || 'os',
  });
  const registry = await getOperationRegistry(settings);
  const allowedTools = await resolveAgentAllowedTools({
    subdomain: subdomain || 'os',
    permissionGroupIds: account.permissionGroupIds ?? [],
    customPermissions: account.customPermissions ?? [],
    registry,
  });
  const permissionFingerprint = JSON.stringify([
    account.permissionGroupIds ?? [],
    account.customPermissions ?? [],
  ]);
  const providerFingerprint = providerRuntimeFingerprint(providers);
  const policy: ToolPolicy = { mode: 'custom', allowed: allowedTools };
  // The installed-services inventory both grounds the system prompt AND keys
  // the cache: enabling/disabling a plugin changes the fingerprint, so the
  // agent (and its prompt) is rebuilt as soon as the registry refreshes.
  const inventory = capabilityInventory(registry.list, policy);

  // Evaluation is persisted per tenant. Its secret-safe fingerprint forces an
  // immediate cache rebuild when either the switch or Langfuse DSN changes.
  const evaluationEnabled = isEvaluationEnabled(settings);
  const evaluationFingerprint = evaluationConfigFingerprint(settings);

  const cacheKey = buildAgentCacheKey({
    agentConfig,
    subdomain,
    useMemory,
    evaluationFingerprint,
    backgroundRemovalEnabled: settings.backgroundRemovalEnabled !== false,
    inventoryFingerprint: inventory.fingerprint,
    permissionFingerprint,
    providerFingerprint,
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

  // Quality scorers (heuristic + LLM-judge using this agent's own model) are
  // controlled by the tenant's runtime settings and export through Langfuse.
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
    id: agentConfig._id,
    name: agentAccountName(account),
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
    await wireAgentObservability({ agent, subdomain, scorers, settings });
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
