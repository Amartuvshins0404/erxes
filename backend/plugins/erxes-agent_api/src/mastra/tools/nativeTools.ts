import { createTool, type Tool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  agentToolsAuthHeaderName,
  encodeAgentToolsAuthHeader,
  ExpectedError,
  getPlugin,
  getPlugins,
  type AgentToolDescriptor,
  type AgentToolField,
  type AgentToolManifest,
} from 'erxes-api-shared/utils';
import type { IModels } from '~/connectionResolvers';
import { auditErrorMessage } from './metaTools';
import {
  destructiveApprovalRequiredResult,
  isApprovedOperation,
  isDestructiveTool,
} from './destructiveGuard';
import { withEmptyResultGuidance } from './emptyResult';
import { isOperationAllowed, type ToolPolicy } from './scope';
import { redactSecrets } from './secretRedaction';
import { makeAgentProcessId, type AgentActionInput } from '../auditLog';
import {
  getCurrentAuth,
  runMutationSerially,
  runToolOnce,
} from '../requestContext';

// The live picture of what the agent can do, aggregated from every plugin's
// /agent-tools/manifest. `tools` is a descriptor-id lookup for O(1) execute
// resolution; `list` is the same set for searching; `byPlugin` groups the
// surface for capability summaries.
export interface NativeToolRegistry {
  tools: Map<string, AgentToolDescriptor>;
  list: AgentToolDescriptor[];
  byPlugin: Map<string, AgentToolDescriptor[]>;
}

// Manifests change only when plugins deploy, so the aggregated registry is
// cached per tenant with a short TTL. Tool factories derive a fresh,
// policy-scoped searchable surface from it whenever an agent is built.
const TTL_MS = 60 * 1000;
const cache = new Map<string, { registry: NativeToolRegistry; at: number }>();

// Never fetch our own manifest: the agent plugin's tools are not erxes
// capabilities, and self-calls would recurse through the discovery path.
export const SELF_PLUGIN_NAME = 'erxes-agent';

interface SuccessEnvelope<TData> {
  status: 'success';
  data?: TData;
}

interface ErrorEnvelope {
  status: 'error';
  error?: { code?: string; message?: string };
}

type ResponseEnvelope<TData> = SuccessEnvelope<TData> | ErrorEnvelope;

const joinAddress = (address: string, path: string): string =>
  `${address.replace(/\/+$/, '')}${path}`;

export interface PluginManifestResult {
  /** false when the endpoint did not answer with a success envelope. */
  supported: boolean;
  tools: AgentToolDescriptor[];
}

/**
 * Fetch one plugin's tool manifest; HTTP and envelope failures report
 * `supported: false` with an empty list (transport errors still throw to the
 * caller, which treats them the same).
 */
export async function fetchPluginManifest(
  subdomain: string,
  address: string,
): Promise<PluginManifestResult> {
  const res = await fetch(joinAddress(address, '/agent-tools/manifest'), {
    method: 'GET',
    headers: {
      [agentToolsAuthHeaderName]: encodeAgentToolsAuthHeader(subdomain),
    },
  });
  if (!res.ok) return { supported: false, tools: [] };
  const envelope = (await res
    .json()
    .catch(() => null)) as ResponseEnvelope<AgentToolManifest> | null;
  if (!envelope || envelope.status !== 'success' || !envelope.data) {
    return { supported: false, tools: [] };
  }
  return {
    supported: true,
    tools: Array.isArray(envelope.data.tools) ? envelope.data.tools : [],
  };
}

/**
 * Returns the cached native tool registry for this tenant, refreshing it from
 * every running plugin's manifest endpoint when stale (or absent). A plugin
 * that is down, unaddressable, or answers an error envelope is skipped
 * silently — discovery is best-effort and fail-closed (an empty registry
 * grants no tools).
 *
 * Two filters always apply on top of the raw manifests:
 *  - descriptors marked `agentUsable: false` are inventory-only and never
 *    enter the executable surface;
 *  - the tenant's plugin curation is default-deny: a plugin contributes
 *    tools only when its curation row exists with `enabled: true`, minus any
 *    `disabledTools` entries. Without tenant `models` no curation rows can
 *    be read, so every plugin is denied.
 */
export async function getNativeToolRegistry(
  subdomain: string,
  opts?: { force?: boolean; models?: IModels },
): Promise<NativeToolRegistry> {
  const cached = cache.get(subdomain);
  if (cached && !opts?.force && Date.now() - cached.at < TTL_MS) {
    return cached.registry;
  }

  const tools = new Map<string, AgentToolDescriptor>();
  const byPlugin = new Map<string, AgentToolDescriptor[]>();

  try {
    const curations = opts?.models
      ? await opts.models.MastraPluginToolCuration.find({}).lean()
      : [];
    const curationByPlugin = new Map(curations.map((row) => [row.plugin, row]));

    const pluginNames = await getPlugins();
    const manifests = await Promise.all(
      pluginNames
        .filter((name) => name && name !== SELF_PLUGIN_NAME)
        .map(async (name): Promise<AgentToolDescriptor[]> => {
          try {
            const plugin = await getPlugin(name);
            const address = plugin?.address?.trim();
            if (!address) return [];
            const manifest = await fetchPluginManifest(subdomain, address);
            return manifest.tools;
          } catch {
            // Per-plugin failure must not take down tenant-wide discovery.
            return [];
          }
        }),
    );

    for (const descriptors of manifests) {
      for (const descriptor of descriptors) {
        const curation = curationByPlugin.get(descriptor.plugin);
        if (!curation || curation.enabled !== true) continue;
        if (curation.disabledTools?.includes(descriptor.id)) continue;
        if (tools.has(descriptor.id)) continue;
        tools.set(descriptor.id, descriptor);
        const group = byPlugin.get(descriptor.plugin) ?? [];
        group.push(descriptor);
        byPlugin.set(descriptor.plugin, group);
      }
    }
  } catch {
    // Service discovery itself failed — fail closed with an empty registry.
  }

  const registry: NativeToolRegistry = {
    tools,
    list: [...tools.values()],
    byPlugin,
  };
  cache.set(subdomain, { registry, at: Date.now() });
  return registry;
}

/** Drop every cached registry (all tenants). */
export function invalidateNativeToolRegistry(): void {
  cache.clear();
}

/**
 * Execute one native capability tool on its owning plugin as the given user.
 * The plugin enforces the descriptor's permission authoritatively; this layer
 * only transports the call and normalizes failures into ExpectedError so raw
 * stack traces never leak toward the model or the user.
 */
export async function callNativeTool(opts: {
  subdomain: string;
  userId: string;
  processId?: string;
  toolId: string;
  input?: Record<string, unknown>;
  models?: IModels;
}): Promise<unknown> {
  const { subdomain, userId, processId, toolId, input, models } = opts;

  const registry = await getNativeToolRegistry(subdomain, { models });
  const descriptor = registry.tools.get(toolId);
  if (!descriptor) {
    throw new ExpectedError(`Unknown agent tool '${toolId}'`);
  }

  const plugin = await getPlugin(descriptor.plugin);
  const address = plugin?.address?.trim();
  if (!address) {
    throw new ExpectedError(
      `Erxes service "${descriptor.plugin}" is unavailable`,
    );
  }

  let res: Response;
  try {
    res = await fetch(joinAddress(address, '/agent-tools/call'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Identity travels only in the HMAC-signed auth header; the plugin
        // verifies it against the shared secret before enforcing permissions.
        [agentToolsAuthHeaderName]: encodeAgentToolsAuthHeader(
          subdomain,
          userId,
        ),
      },
      body: JSON.stringify({
        toolId,
        input: processId ? { ...input, __processId: processId } : input,
      }),
    });
  } catch {
    throw new ExpectedError(
      `Erxes service "${descriptor.plugin}" could not be reached`,
    );
  }

  const envelope = (await res
    .json()
    .catch(() => null)) as ResponseEnvelope<unknown> | null;
  if (!res.ok || !envelope || envelope.status !== 'success') {
    const serverMessage =
      envelope && envelope.status === 'error'
        ? envelope.error?.message?.trim()
        : '';
    throw new ExpectedError(
      serverMessage || `Agent tool '${toolId}' could not be completed`,
    );
  }
  return envelope.data ?? null;
}

// ─── Mastra tool surface ─────────────────────────────────────────────────────

// Mastra tool ids cannot contain dots, so the descriptor id
// ("sales.model.Deals.find" / "sales.trpc.deal.findOne") is sanitized to
// "sales_model_Deals_find" / "sales_trpc_deal_findOne". The factory keeps a
// name → descriptor map so execution always resolves the canonical id.
export function sanitizeNativeToolName(descriptorId: string): string {
  return descriptorId.replace(/\./g, '_');
}

const STRING_TYPES = new Set(['string', 'zodstring', 'date', 'objectid']);
const NUMBER_TYPES = new Set(['number', 'zodnumber']);
const BOOLEAN_TYPES = new Set(['boolean', 'zodboolean']);
const ARRAY_TYPES = new Set(['array', 'zodarray']);

/** Map one manifest field type onto a flat Zod schema. */
function fieldToZod(field: AgentToolField): z.ZodTypeAny {
  const type = (field.type || '').toLowerCase();
  let schema: z.ZodTypeAny;
  if (type === 'string-array') {
    schema = z.array(z.string());
  } else if (STRING_TYPES.has(type)) {
    schema = z.string();
  } else if (NUMBER_TYPES.has(type)) {
    schema = z.number();
  } else if (BOOLEAN_TYPES.has(type)) {
    schema = z.boolean();
  } else if (ARRAY_TYPES.has(type)) {
    schema = z.array(z.unknown());
  } else {
    // object / Mixed / ZodObject / ZodRecord / unknown and anything
    // unrecognized: a free-form JSON object.
    schema = z.record(z.unknown());
  }

  let result: z.ZodTypeAny = field.required ? schema : schema.optional();
  if (field.enumValues?.length) {
    result = result.describe(
      `${field.name} — allowed values: ${field.enumValues.join(', ')}`,
    );
  }
  return result;
}

/** Flat input schema for one tool; null fields mean a free-form object. */
function buildInputSchema(
  fields: AgentToolField[] | null,
): z.ZodType<Record<string, unknown>> {
  if (!fields) return z.record(z.unknown());
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) shape[field.name] = fieldToZod(field);
  // Passthrough, NOT strip (the z.object default): unknown keys must survive
  // Mastra's schema validation so validateNativeToolInput can see — and
  // correctively reject — the model's invented wrapper keys (e.g. "arg")
  // instead of having them silently stripped to a valid-looking {}.
  return z.object(shape).passthrough();
}

// Corrective instruction for input the guard rejected. Deliberately different
// from the transport-failure wording: this is a model-fixable mistake, so it
// must invite an immediate corrected retry — never "internal system problem".
const INVALID_INPUT_INSTRUCTION =
  'This call was rejected before reaching the service because its input was invalid. This is a fixable input mistake, not a system problem: correct the call to use only the listed fields and try again with the same intent.';

/**
 * Validate model-supplied input against the manifest's declared fields BEFORE
 * any network call. Unknown top-level keys (invented wrappers like "arg",
 * which a plugin would silently treat as a document filter and match nothing)
 * and missing required fields become a corrective failure — the owning plugin
 * is never called with input it would silently misinterpret. Free-form tools
 * (inputFields: null) skip key validation; their input rules are enforced by
 * the owning plugin server-side.
 */
function validateNativeToolInput(
  descriptor: AgentToolDescriptor,
  input: Record<string, unknown>,
): { ok: true } | { ok: false; result: { success: false; error: string; instruction: string } } {
  const fields = descriptor.inputFields;
  if (!fields) return { ok: true };

  const validNames = fields.map((field) => field.name);
  const unknownKeys = Object.keys(input).filter(
    (key) => !validNames.includes(key),
  );
  if (unknownKeys.length) {
    return {
      ok: false,
      result: {
        success: false,
        error: `Invalid input for "${descriptor.id}": unknown field(s) ${unknownKeys
          .map((key) => `"${key}"`)
          .join(', ')}. Valid fields: ${validNames.join(', ')}.`,
        instruction: INVALID_INPUT_INSTRUCTION,
      },
    };
  }

  const missing = fields
    .filter((field) => field.required && input[field.name] === undefined)
    .map((field) => field.name);
  if (missing.length) {
    return {
      ok: false,
      result: {
        success: false,
        error: `Invalid input for "${descriptor.id}": missing required field(s) ${missing
          .map((key) => `"${key}"`)
          .join(', ')}. Valid fields: ${validNames.join(', ')}.`,
        instruction: INVALID_INPUT_INSTRUCTION,
      },
    };
  }

  return { ok: true };
}

function nativeToolDescription(descriptor: AgentToolDescriptor): string {
  const base = (descriptor.description.trim() || descriptor.id).slice(0, 160);
  const permission = descriptor.permission
    ? ` Permission: ${descriptor.permission.action}.`
    : '';
  return `${base} (${descriptor.method} in ${descriptor.plugin}/${descriptor.module}).${permission}`;
}

function coerceInput(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Builds one exact-schema Mastra tool per policy-permitted native capability.
 * Mastra searches the sanitized tool name, plugin, module, and description.
 */
export function buildNativeOperationTools(params: {
  registry: NativeToolRegistry;
  policy: ToolPolicy;
  recordAction?: (entry: AgentActionInput) => void;
  models?: IModels;
}): Record<string, Tool> {
  const { registry, policy, recordAction, models } = params;
  const tools: Record<string, Tool> = {};
  // Sanitized Mastra name → canonical descriptor (execution never trusts the
  // model-visible name to be a real capability).
  const descriptorByToolName = new Map<string, AgentToolDescriptor>();

  for (const descriptor of registry.list) {
    if (!isOperationAllowed(descriptor, policy)) continue;

    const toolName = sanitizeNativeToolName(descriptor.id);
    if (descriptorByToolName.has(toolName)) continue;
    descriptorByToolName.set(toolName, descriptor);

    tools[toolName] = createTool({
      id: toolName,
      description: nativeToolDescription(descriptor),
      inputSchema: buildInputSchema(descriptor.inputFields),
      outputSchema: z.unknown(),
      execute: async (input) => {
        const callArgs = coerceInput(input);

        // Defense in depth: discovery filters policy, and execution re-checks it.
        if (!isOperationAllowed(descriptor, policy)) {
          return {
            success: false,
            error: `Operation "${descriptor.id}" is not permitted for this agent.`,
          };
        }

        const auth = getCurrentAuth();
        const subdomain = auth?.subdomain?.trim();
        const userId = auth?.principalUserId?.trim();
        if (!subdomain || !userId) {
          return {
            success: false,
            error: 'Agent execution context is unavailable.',
            instruction:
              'This is an internal system problem, not a mistake by you or the user. Do NOT silently retry the same call. Tell the user in plain words that this one step could not be completed, and either continue with the rest of the task or ask how they want to proceed.',
          };
        }

        const isMutation = descriptor.method === 'mutation';
        const destructive = isDestructiveTool(descriptor);

        // Input shape is validated against the manifest BEFORE the approval
        // gate and any network call — a malformed call is corrected by the
        // model, never approved by the user or misread by the plugin.
        const inputCheck = validateNativeToolInput(descriptor, callArgs);
        if (!inputCheck.ok) {
          return inputCheck.result;
        }

        // Every destructive capability asks for approval; the agent config
        // cannot bypass this. Matched on the name the model sees (the Mastra
        // tool name it echoes into request_approval) or the canonical id.
        if (destructive) {
          const approvedOps = auth?.approvedOps;
          if (
            !isApprovedOperation(toolName, approvedOps) &&
            !isApprovedOperation(descriptor.id, approvedOps)
          ) {
            recordAction?.({
              operation: descriptor.id,
              operationType: descriptor.method,
              destructive: true,
              args: redactSecrets(callArgs),
              status: 'blocked',
              error: 'awaiting user approval',
            });
            return destructiveApprovalRequiredResult(toolName, callArgs);
          }
        }

        const processId = isMutation ? makeAgentProcessId() : undefined;
        // Any failure becomes a STRUCTURED result the model can act on —
        // never an exception that strands the user with a raw stack message.
        const execute = async (): Promise<unknown> => {
          try {
            const data = await callNativeTool({
              subdomain,
              userId,
              processId,
              toolId: descriptor.id,
              input: callArgs,
              models,
            });
            return withEmptyResultGuidance(data);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            return {
              success: false,
              error: `Could not run "${descriptor.id}": ${message}`,
              instruction:
                'This is an internal system problem, not a mistake by you or the user. Do NOT silently retry the same call. Tell the user in plain words that this one step could not be completed, and either continue with the rest of the task or ask how they want to proceed.',
            };
          }
        };
        const result = await runToolOnce(toolName, { args: callArgs }, () =>
          isMutation ? runMutationSerially(execute) : execute(),
        );

        if (isMutation) {
          const failed =
            result !== null &&
            typeof result === 'object' &&
            'success' in result &&
            (result as { success: unknown }).success === false;
          recordAction?.({
            operation: descriptor.id,
            operationType: descriptor.method,
            destructive,
            args: redactSecrets(callArgs),
            status: failed ? 'failed' : 'success',
            error: failed ? auditErrorMessage(result) : undefined,
            processId,
          });
        }

        return result;
      },
    });
  }

  return tools;
}
