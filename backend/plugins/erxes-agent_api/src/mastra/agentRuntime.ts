import { Agent } from '@mastra/core/agent';
import { ToolSearchProcessor } from '@mastra/core/processors';
import type { ToolsInput } from '@mastra/core/agent';
import { stepCountIs } from 'ai';
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
import { writeAgentAction, AgentActionInput } from './auditLog';
import { isWorkspaceMemoryEnabled } from './memory/config';
import { getMastraMemory } from './memory/mastraMemory';
import { withToolExecutionControl } from './requestContext';
import { ToolCallSignalFilter } from './memory/toolCallSignalFilter';
import { RepeatedToolCallFilter } from './repeatedToolCallFilter';
import {
  PROVIDER_COMPLETION_MAX_RETRIES,
  ProviderCompletionGuard,
  shouldGuardProviderOutput,
} from './providerOutputGuard';
import { getRuntimeSkillsWorkspace } from './runtimeSkills';
import { createTerminalTool } from './tools/terminalTool';
import {
  createPublishWebsiteTool,
  createWorkspaceWriteTool,
} from './tools/workspaceTools';
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
const promptContextCache = new Map<string, AgentPromptContext>();

const SIDE_EFFECTING_STANDALONE_TOOLS: Record<string, true> = {
  publishWebsite: true,
  removeImageBackground: true,
  terminal: true,
  updateWorkingMemory: true,
  workspaceWrite: true,
};

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
const ROUTING_VERSION = 39;

export interface AgentPromptContext {
  agentInstructions: string;
  hasErxesTools: boolean;
  scopeLine: string;
  inventoryLines: string[];
  builtins: ToolInfo[];
  operationToolNames: string[];
  hasRuntimeSkills: boolean;
}

export interface AgentWithTools {
  agent: Agent;
  tools: ToolsInput;
  promptContext: AgentPromptContext;
}

export function buildTurnSystemPrompt(
  context: AgentPromptContext,
  activeTools: string[],
): string {
  const active = new Set(activeTools);
  return buildSystemPrompt(context.agentInstructions, {
    hasErxesTools: context.hasErxesTools,
    scopeLine: context.scopeLine,
    inventoryLines: context.inventoryLines,
    builtins: context.builtins.filter(
      (tool) => active.has(tool.id) || active.has(tool.name),
    ),
  });
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
 *   • memory joins the subdomain only when workspace memory is on.
 */
function buildAgentCacheKey(params: {
  agentConfig: IMastraAgentDocument;
  backgroundRemovalEnabled: boolean;
  subdomain?: string;
  useMemory: boolean;
  inventoryFingerprint: string;
  permissionFingerprint: string;
  providerFingerprint: string;
}): string {
  const {
    agentConfig,
    subdomain,
    backgroundRemovalEnabled,
    useMemory,
    inventoryFingerprint,
    permissionFingerprint,
    providerFingerprint,
  } = params;

  return `${agentConfig._id}:${
    agentConfig.updatedAt?.getTime?.() ?? 0
  }:v${ROUTING_VERSION}:${inventoryFingerprint}:permissions${permissionFingerprint}:provider${providerFingerprint}:mem${
    useMemory ? subdomain : 'off'
  }:bg${backgroundRemovalEnabled ? 'on' : 'off'}`;
}

/**
 * Assemble the agent's tool map: erxes meta-tools (only when the policy grants
 * an operation), policy-filtered builtins, and the always-on fileReader. Also
 * returns the ToolInfo list that grounds the system prompt.
 */
function assembleAgentTools(params: {
  agentConfig: IMastraAgentDocument;
  models: IModels;
  registry: OperationRegistry;
  policy: ToolPolicy;
  hasErxes: boolean;
  settings: IMastraSettingsDocument;
}): {
  tools: ToolsInput;
  operationTools: ErxesOperationTools;
  builtinInfos: ToolInfo[];
} {
  const { agentConfig, models, registry, policy, hasErxes, settings } = params;

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
        recordAction,
      })
    : {};

  if (hasErxes) {
    Object.assign(tools, buildErxesSupportTools());
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

  if (isBuiltinAllowed('terminal', policy)) {
    const terminalTool = createTerminalTool({
      models,
      agentId: agentConfig._id,
    });
    const workspaceWriteTool = createWorkspaceWriteTool({
      models,
      agentId: agentConfig._id,
    });
    const publishWebsiteTool = createPublishWebsiteTool({
      models,
      agentId: agentConfig._id,
    });
    Object.assign(tools, {
      terminal: terminalTool,
      workspaceWrite: workspaceWriteTool,
      publishWebsite: publishWebsiteTool,
    });
    builtinInfos.push(
      {
        id: 'terminal',
        name: 'terminal',
        description: terminalTool.description,
      },
      {
        id: 'workspaceWrite',
        name: 'workspaceWrite',
        description: workspaceWriteTool.description,
      },
      {
        id: 'publishWebsite',
        name: 'publishWebsite',
        description: publishWebsiteTool.description,
      },
    );
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

  return { tools, operationTools, builtinInfos };
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
  // Mastra Memory is controlled by the workspace setting for every agent.
  // Missing workspace settings default to enabled for existing tenants.
  const useMemory = isWorkspaceMemoryEnabled(settings);

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
    additionalTools: agentConfig.additionalTools,
    registry,
  });
  const permissionFingerprint = JSON.stringify([
    account.permissionGroupIds ?? [],
    account.customPermissions ?? [],
    agentConfig.additionalTools ?? [],
  ]);
  const providerFingerprint = providerRuntimeFingerprint(providers);
  const policy: ToolPolicy = { mode: 'custom', allowed: allowedTools };
  // The installed-services inventory both grounds the system prompt AND keys
  // the cache: enabling/disabling a plugin changes the fingerprint, so the
  // agent (and its prompt) is rebuilt as soon as the registry refreshes.
  const inventory = capabilityInventory(registry.list, policy);

  const cacheKey = buildAgentCacheKey({
    agentConfig,
    subdomain,
    useMemory,
    backgroundRemovalEnabled: settings.backgroundRemovalEnabled !== false,
    inventoryFingerprint: inventory.fingerprint,
    permissionFingerprint,
    providerFingerprint,
  });

  const cached = agentCache.get(cacheKey);
  const cachedPromptContext = promptContextCache.get(cacheKey);
  if (cached && cachedPromptContext) {
    return {
      agent: cached,
      tools: toolsCache.get(cacheKey) ?? {},
      promptContext: cachedPromptContext,
    };
  }

  // Evict stale entries for this agent
  for (const key of agentCache.keys()) {
    if (key.startsWith(`${agentConfig._id}:`)) {
      agentCache.delete(key);
      toolsCache.delete(key);
      promptContextCache.delete(key);
    }
  }

  const model = buildModel(agentConfig.provider, agentConfig.model, providers);

  const hasErxes = hasAnyOperation(registry.list, policy);
  const { tools, operationTools, builtinInfos } = assembleAgentTools({
    agentConfig,
    models,
    registry,
    settings,
    policy,
    hasErxes,
  });
  const controlledTools = Object.fromEntries(
    Object.entries(tools).map(([name, tool]) => [
      name,
      // fileReader and exact erxes operations already use runToolOnce at their
      // execution boundary; wrapping them twice would recursively share the
      // same in-flight promise. Standalone writes share the mutation queue so
      // four-way read concurrency cannot race workspace state.
      name === 'fileReader'
        ? tool
        : withToolExecutionControl(name, tool, {
            serial: Boolean(SIDE_EFFECTING_STANDALONE_TOOLS[name]),
          }),
    ]),
  ) as ToolsInput;

  // Conversation persistence + recent-history replay + recall are owned by the
  // attached Mastra Memory (the chat store IS the native memory store; see
  // memory below + session/nativeStore.ts). No custom message store.
  const toolNames = Object.keys(controlledTools);
  const runtimeSkillsWorkspace = getRuntimeSkillsWorkspace(toolNames);
  const promptContext: AgentPromptContext = {
    agentInstructions: agentConfig.instructions || '',
    hasErxesTools: hasErxes,
    scopeLine: scopeSummary(policy),
    inventoryLines: inventory.lines,
    builtins: builtinInfos,
    operationToolNames: Object.keys(operationTools),
    hasRuntimeSkills: Boolean(runtimeSkillsWorkspace),
  };
  const systemPrompt = buildTurnSystemPrompt(promptContext, toolNames);

  // Per-tenant Mastra Memory (recall + working memory). ToolCallSignalFilter
  // strips raw tool-call frames from any replayed/recalled history so reasoning
  // models (Kimi) don't reject the request, but leaves a text breadcrumb so the
  // model keeps calling render tools on later turns. Both are active when
  // workspace memory is enabled.
  const memory = useMemory ? await getMastraMemory(subdomain) : undefined;

  // Native Mastra skills load from plugin-owned SKILL.md files. Passing this
  // workspace makes Mastra add its skill discovery processor and skill tools.
  const hasExecutableTools = hasErxes || toolNames.length > 0;
  const completionGuard =
    hasExecutableTools && shouldGuardProviderOutput(agentConfig.model)
      ? new ProviderCompletionGuard()
      : null;

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
    ...(completionGuard ? [completionGuard] : []),
    ...(hasExecutableTools ? [new RepeatedToolCallFilter()] : []),
  ];
  const outputProcessors = completionGuard ? [completionGuard] : [];

  const agent = new Agent({
    id: agentConfig._id,
    name: agentAccountName(account),
    instructions: systemPrompt,
    model,
    ...(memory ? { memory } : {}),
    tools: toolNames.length ? controlledTools : undefined,
    ...(inputProcessors.length ? { inputProcessors } : {}),
    ...(outputProcessors.length
      ? {
          outputProcessors,
          maxProcessorRetries: PROVIDER_COMPLETION_MAX_RETRIES,
        }
      : {}),
    ...(runtimeSkillsWorkspace ? { workspace: runtimeSkillsWorkspace } : {}),
    defaultOptions: {
      // Eight model steps cover multi-part work while preventing a malformed
      // provider response from running an unbounded tool loop.
      stopWhen: [stepCountIs(8)],
      // Independent reads may execute together. Exact GraphQL mutations and
      // state-changing standalone tools share the per-turn serial queue.
      toolCallConcurrency: 4,
    },
  } as never);

  const executableTools = { ...controlledTools, ...operationTools };
  agentCache.set(cacheKey, agent);
  promptContextCache.set(cacheKey, promptContext);
  toolsCache.set(cacheKey, executableTools);
  return { agent, tools: executableTools, promptContext };
}

/** Drop every cached agent built from the given stored config id. */
export function invalidateAgentCache(agentId: string) {
  for (const key of agentCache.keys()) {
    if (key.startsWith(`${agentId}:`)) {
      agentCache.delete(key);
      toolsCache.delete(key);
      promptContextCache.delete(key);
    }
  }
}
