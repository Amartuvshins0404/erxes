import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { sendTRPCMessage } from 'erxes-api-shared/utils';
import {
  executeErxesOperation,
  graphqlTypeToString,
  type ErxesToolSettings,
} from './erxesTools';
import {
  describeSelectableFields,
  isRequiredType,
  parseJsonPreprocess,
  underlyingNamedType,
  type GqlArgDef,
  type SchemaMaps,
} from './schemaIntrospect';
import { truncateChars } from './humanize';
import {
  getStaticOperationHints,
  applyStaticHints,
  paginationConvention,
} from './operationHints';
import { OperationMeta, OperationRegistry } from './operationRegistry';
import { ToolPolicy, isOperationAllowed } from './scope';
import {
  DestructiveOpsPolicy,
  isDestructiveOperation,
  isApprovedOperation,
  destructiveApprovalRequiredResult,
  destructiveOpsPreapproved,
} from './destructiveGuard';
import {
  isSecurityBlockedOperation,
  securityBlockedResult,
} from './securityGuard';
import { redactSecrets } from './secretRedaction';
import { getCurrentAuth } from '../requestContext';
import { makeAgentProcessId, type AgentActionInput } from '../auditLog';

// LLMs sometimes pass the args object as a JSON string (standard or
// single-quoted). parseJsonPreprocess coerces it back; keep only real objects.
function coerceArgs(val: unknown): Record<string, unknown> {
  const parsed = typeof val === 'string' ? parseJsonPreprocess(val) : val;
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

// LLMs may pass the fields list as a real array, a JSON string, or a
// comma-separated string. Normalise to a string[] of trimmed, non-empty paths.
function coerceFields(val: unknown): string[] {
  const fromString = (raw: string): string[] => {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    const parsed = parseJsonPreprocess(trimmed);
    return Array.isArray(parsed) ? parsed.map(String) : trimmed.split(',');
  };
  const arr = Array.isArray(val)
    ? val.map(String)
    : typeof val === 'string'
      ? fromString(val)
      : [];
  return arr.map((field) => field.trim()).filter(Boolean);
}

// One field of an INPUT_OBJECT arg, broken out so the model sees the object's
// shape (names + types + which are required) instead of a bare type name.
// `enumValues` and `requiredNote` are set from the static operation-hints seed
// (see operationHints.ts) when a constraint is enforced in server code but
// absent from the GraphQL schema.
export interface ArgFieldSpec {
  name: string;
  type: string;
  required: boolean;
  enumValues?: string[];
  requiredNote?: string;
}

// A model-readable arg signature: the type string, required flag (strict
// GraphQL semantics — outermost NON_NULL), plus — where they exist — the
// enum choices, the INPUT_OBJECT field breakdown, and a short description.
// The breakdown is capped; when cut, its last entry is an "…and N more"
// marker string so the model knows the shape is truncated.
export interface ArgSpec extends ArgFieldSpec {
  description?: string;
  fields?: Array<ArgFieldSpec | string>;
}

// Cap on the per-arg INPUT_OBJECT field breakdown — signatures ship with every
// search result, so a fat input type must not blow up the payload.
const MAX_INPUT_OBJECT_FIELDS = 24;

const fieldSpecOf = (arg: GqlArgDef): ArgFieldSpec => ({
  name: arg.name,
  type: graphqlTypeToString(arg.type),
  required: isRequiredType(arg.type),
});

// Render an operation's args as a compact, model-readable signature. Enum args
// carry their allowed values and input-object args their one-level field
// breakdown, so the model stops inventing tokens/shapes the schema already knows.
function argSignature(
  op: OperationMeta,
  schemaMaps: Pick<SchemaMaps, 'inputTypesMap' | 'enumValuesMap'>,
): ArgSpec[] {
  const { inputTypesMap, enumValuesMap } = schemaMaps;
  return (op.graphqlArgs || []).map((arg) => {
    const spec: ArgSpec = fieldSpecOf(arg);
    const description = arg.description?.trim();
    if (description) spec.description = truncateChars(description, 160);

    const underlying = underlyingNamedType(arg.type);
    if (underlying.kind === 'ENUM' && enumValuesMap[underlying.name]?.length) {
      spec.enumValues = enumValuesMap[underlying.name];
    } else if (
      underlying.kind === 'INPUT_OBJECT' &&
      inputTypesMap[underlying.name]?.length
    ) {
      const inputFields = inputTypesMap[underlying.name];
      const specs: Array<ArgFieldSpec | string> = inputFields
        .slice(0, MAX_INPUT_OBJECT_FIELDS)
        .map(fieldSpecOf);
      if (inputFields.length > MAX_INPUT_OBJECT_FIELDS) {
        specs.push(`…and ${inputFields.length - MAX_INPUT_OBJECT_FIELDS} more`);
      }
      spec.fields = specs;
    }
    return spec;
  });
}

// erxes operation names follow regular verbs: mutations end in Add / Edit /
// Remove, reads are the plural or *Detail noun. Map the natural-language verbs a
// user is likely to type onto those canonical name fragments so "create deal"
// still finds "dealsAdd". Synonym-derived tokens score below a direct match.
const VERB_SYNONYMS: Record<string, string[]> = {
  create: ['add'],
  new: ['add'],
  make: ['add'],
  insert: ['add'],
  register: ['add'],
  update: ['edit', 'update'],
  change: ['edit'],
  modify: ['edit'],
  set: ['edit'],
  rename: ['edit'],
  delete: ['remove'],
  destroy: ['remove'],
  drop: ['remove'],
  find: ['list', 'detail'],
  get: ['detail', 'list'],
  fetch: ['list'],
  search: ['list'],
  view: ['detail'],
  show: ['detail'],
  list: ['list'],
};

interface WeightedToken {
  token: string;
  weight: number;
}

/** Levenshtein edit distance — small inputs (query tokens vs name parts). */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** Split an operation name into lowercased word parts (camelCase + non-alnum). */
function nameParts(operation: string): string[] {
  return operation
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** A token fuzzy-hits a name when it's within one typo's distance of a part. */
function fuzzyHitsParts(token: string, parts: string[]): boolean {
  if (token.length < 4) return false;
  const threshold = token.length >= 7 ? 2 : 1;
  return parts.some((part) => editDistance(token, part) <= threshold);
}

/** Expand a raw query into weighted tokens: direct tokens plus verb synonyms. */
function buildQueryTokens(query: string): WeightedToken[] {
  const direct = (query || '')
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean);

  const seen = new Map<string, number>();
  const add = (token: string, weight: number) => {
    const prev = seen.get(token);
    if (prev === undefined || weight > prev) seen.set(token, weight);
  };
  for (const token of direct) {
    add(token, 1);
    for (const synonym of VERB_SYNONYMS[token] || []) add(synonym, 0.6);
  }
  return [...seen.entries()].map(([token, weight]) => ({ token, weight }));
}

// Keyword relevance score for a search query. Name matches weigh most, then
// module, then description, then plugin — enough to float the right op to the
// top of a short result list without a real search index. Verb synonyms widen
// recall (create→add) and a one-typo fuzzy pass tolerates misspellings.
function scoreOperation(op: OperationMeta, tokens: WeightedToken[]): number {
  const name = op.operation.toLowerCase();
  const module = (op.module || '').toLowerCase();
  const plugin = (op.plugin || '').toLowerCase();
  const desc = (op.description || '').toLowerCase();
  const parts = nameParts(op.operation);

  let score = 0;
  for (const { token, weight } of tokens) {
    if (name === token) score += 40 * weight;
    if (name.includes(token)) score += 10 * weight;
    if (module.includes(token)) score += 6 * weight;
    if (desc.includes(token)) score += 3 * weight;
    if (plugin.includes(token)) score += 2 * weight;
    // Typo tolerance — only for direct tokens the name didn't already contain.
    if (weight === 1 && !name.includes(token) && fuzzyHitsParts(token, parts))
      score += 5;
  }
  return score;
}

const AUDIT_ERROR_MAX = 500;

/**
 * Audit-row error text for a failed mutation: `error`, then `instruction`,
 * else compact JSON — so structured failures are never logged as ''.
 */
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
    return String(result).slice(0, AUDIT_ERROR_MAX);
  }
}

/** Top few registry operation names closest to an unknown name (same scorer). */
function suggestOperations(operation: string, pool: OperationMeta[]): string[] {
  const tokens = buildQueryTokens(nameParts(operation).join(' '));
  if (!tokens.length) return [];
  return pool
    .map((op) => ({ op, score: scoreOperation(op, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((entry) => entry.op.operation);
}

const AUDIT_ERROR_MAX = 500;

/**
 * Audit-row error text for a failed mutation: `error`, then `instruction`,
 * else compact JSON — so structured failures are never logged as ''.
 */
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
    return String(result).slice(0, AUDIT_ERROR_MAX);
  }
}

/** Top few registry operation names closest to an unknown name (same scorer). */
function suggestOperations(operation: string, pool: OperationMeta[]): string[] {
  const tokens = buildQueryTokens(nameParts(operation).join(' '));
  if (!tokens.length) return [];
  return pool
    .map((op) => ({ op, score: scoreOperation(op, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((entry) => entry.op.operation);
}

/**
 * Builds the two meta-tools that replace per-operation tool binding:
 *
 *   search_erxes_operations(query)         → discover what's runnable
 *   execute_erxes_operation(operation,args)→ run one by exact name
 *
 * Both are closed over the agent's policy, so a restricted agent can neither
 * see nor run anything outside its allowlist — the search results are filtered
 * AND execute re-checks, so the boundary holds even if the model guesses a name.
 */
export function buildErxesMetaTools(params: {
  registry: OperationRegistry;
  settings: ErxesToolSettings;
  policy: ToolPolicy;
  destructiveOps: DestructiveOpsPolicy;
  recordAction?: (entry: AgentActionInput) => void;
}) {
  const { registry, settings, policy, destructiveOps, recordAction } = params;

  /** Operations visible to this agent after policy filtering. */
  const allowedList = (): OperationMeta[] =>
    policy.mode === 'all'
      ? registry.list
      : registry.list.filter((op) => isOperationAllowed(op, policy));

  const search = createTool({
    id: 'search_erxes_operations',
    description:
      'Search the available erxes operations (GraphQL queries and mutations) by keyword. ' +
      'Call this FIRST to discover the exact operation name and arguments before executing. ' +
      'Example queries: "create deal", "list customers", "send email", "update task".',
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'Keywords describing the action, e.g. "create deal" or "list customers".',
        ),
      operationType: z
        .enum(['query', 'mutation'])
        .optional()
        .describe('Optional filter: "query" for reads, "mutation" for writes.'),
      limit: z.coerce.number().int().min(1).max(50).default(12).optional(),
    }),
    outputSchema: z.any(),
    execute: ({ query, operationType, limit }) => {
      let pool = allowedList();
      if (operationType)
        pool = pool.filter((op) => op.operationType === operationType);

      const tokens = buildQueryTokens(query);

      const max = limit ?? 12;
      let ranked: OperationMeta[];
      if (!tokens.length) {
        ranked = [...pool]
          .sort((a, b) => a.operation.localeCompare(b.operation))
          .slice(0, max);
      } else {
        ranked = pool
          .map((op) => ({ op, score: scoreOperation(op, tokens) }))
          .filter((r) => r.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, max)
          .map((r) => r.op);
      }

      return Promise.resolve({
        total: ranked.length,
        // Every result carries its selectable-field menu so the agent can choose
        // a response shape (the execute tool's "fields") for whichever op it runs
        // in this same round-trip. The menu is already bounded (leaf scalars plus
        // a capped set of nested objects), so the payload stays small.
        results: ranked.map((op) => {
          // Merge the static census: mark server-required args, add code-only
          // enum tokens (schema enums already win inside applyStaticHints), and
          // collect cross-field/pagination rules as a compact `constraints`
          // array. Advisory only — the server stays the enforcer.
          const hint = getStaticOperationHints(op.operation);
          const args = hint
            ? applyStaticHints(argSignature(op, registry), hint)
            : argSignature(op, registry);
          const constraints = [
            ...(hint?.rules ?? []),
            ...paginationConvention(args),
          ];
          const base = {
            operation: op.operation,
            type: op.operationType,
            plugin: op.plugin,
            module: op.module,
            description: op.description,
            args,
          };
          const fields = describeSelectableFields(
            op.returnType,
            registry.objectFieldsMap,
          );
          return {
            ...base,
            ...(fields ? { fields } : {}),
            ...(constraints.length ? { constraints } : {}),
          };
        }),
        note: ranked.length
          ? 'Call execute_erxes_operation with one of these "operation" names and an "args" object built from its arguments. Optionally pass "fields" (names from a result\'s "fields" menu, dotted for one level of nesting, e.g. ["_id","name","customer.name"]) to choose exactly what the response returns.'
          : 'No matching operations. Try different keywords.',
      });
    },
  });

  const execute = createTool({
    id: 'execute_erxes_operation',
    description:
      'Execute a single erxes operation (query or mutation) by its exact name. ' +
      'Use the operation name and arguments returned by search_erxes_operations. ' +
      'Returns the operation result, or { success:false, … } with guidance if it fails. ' +
      "When you need several operations that don't depend on each other's results, " +
      'issue multiple calls to this tool in the SAME turn — they run in parallel. ' +
      "Only sequence calls when one needs a previous call's output (e.g. create, " +
      'then use the returned id).' +
      (destructiveOps !== 'allow'
        ? ' For destructive operations (delete / merge / remove), call ' +
          'request_approval FIRST and run them here only after the user approves.'
        : ''),
    inputSchema: z.object({
      operation: z
        .string()
        .describe(
          'Exact operation name from search_erxes_operations, e.g. "dealsAdd".',
        ),
      args: z
        .preprocess(coerceArgs, z.record(z.any()))
        .optional()
        .describe("Arguments object keyed by the operation's argument names."),
      fields: z
        .preprocess(coerceFields, z.array(z.string()))
        .optional()
        .describe(
          'Optional response fields to return, taken from the operation\'s ' +
            '"fields" menu in search results. Dotted paths give one level of ' +
            'nesting, e.g. ["_id","name","amount","customer.name"]. Unknown ' +
            'fields are ignored; omit for a sensible default selection.',
        ),
    }),
    outputSchema: z.any(),
    execute: async ({ operation, args, fields }) => {
      // Hard security block, checked FIRST — before any registry lookup — so a
      // guessed or hard-coded name can't run a denied op even though it never
      // appears in search. A few operations expose secrets or whole-system
      // state (notably `configs`, which returns every Config document); they are
      // refused here with a generic message that leaks nothing about the
      // operation or the data it would have returned. The attempt is audited.
      if (isSecurityBlockedOperation(operation)) {
        recordAction?.({
          operation,
          operationType: 'query',
          destructive: false,
          // Redact secret-valued args (a blocked `login`/`resetPassword` attempt
          // otherwise writes a plaintext password into the audit store).
          args: redactSecrets(coerceArgs(args)),
          status: 'blocked',
          error: 'security-blocked',
        });
        return securityBlockedResult();
      }

      const op = registry.operations.get(operation);
      if (!op) {
        return {
          success: false,
          error: `Unknown operation "${operation}"`,
          suggestions: suggestOperations(operation, allowedList()),
          instruction:
            'Use one of the suggested operations or call search_erxes_operations first.',
        };
      }
      if (!isOperationAllowed(op, policy)) {
        return {
          success: false,
          error: `Operation "${operation}" is not permitted for this agent.`,
        };
      }

      const callArgs = coerceArgs(args);
      const isMutation = op.operationType === 'mutation';

      // Safety gate: irreversible deletes/merges need the user's approval unless
      // the agent is configured with destructiveOps: 'allow'. The user grants it
      // per-turn (approvedOps on the request's auth context); until then the tool
      // asks instead of running — it never silently destroys data, and never
      // hard-refuses. Enforced here, beside the policy check, so the boundary
      // holds even if the model guesses a name.
      //
      // Defense-in-depth: a background run (scheduled agent / bot) is unattended,
      // so it can never carry an approval — force 'ask' regardless of the agent's
      // destructiveOps, making destructive ops impossible without a human even if
      // the agent is configured 'allow'.
      const background = getCurrentAuth()?.background === true;
      const destructiveAllowed = destructiveOpsPreapproved(
        destructiveOps,
        background,
      );
      if (!destructiveAllowed && isDestructiveOperation(op)) {
        const approvedOps = getCurrentAuth()?.approvedOps;
        if (!isApprovedOperation(operation, approvedOps)) {
          recordAction?.({
            operation,
            operationType: op.operationType,
            destructive: true,
            args: redactSecrets(callArgs),
            status: 'blocked',
            error: 'awaiting user approval',
          });
          return destructiveApprovalRequiredResult(operation, callArgs);
        }
      }

      // Stamp a correlation id on mutations so every DB change this op makes is
      // traceable/revertable as a unit; reads need none.
      const processId = isMutation ? makeAgentProcessId() : undefined;

      const result = await executeErxesOperation(
        op,
        callArgs,
        settings,
        registry,
        processId,
        fields?.length ? fields : undefined,
      );

      // Audit trail: record mutations only (executed or failed); reads are not
      // logged. Best-effort — never blocks or fails the operation.
      if (isMutation) {
        const failed =
          Boolean(result) &&
          typeof result === 'object' &&
          (result as { success?: unknown }).success === false;
        recordAction?.({
          operation,
          operationType: op.operationType,
          destructive: isDestructiveOperation(op),
          // Audit records the secret-redacted args (never plaintext credentials).
          args: redactSecrets(callArgs),
          status: failed ? 'failed' : 'success',
          error: failed ? auditErrorMessage(result) : undefined,
          processId,
        });
      }

      return result;
    },
  });

  // Explicit human-in-the-loop gate. The model calls this BEFORE a destructive
  // op so the user sees a clean, model-authored confirmation line (the bar reads
  // `summary`) and an Approve / Deny prompt. It executes nothing; on approval the
  // model runs the listed ops via execute_erxes_operation. The destructive guard
  // above is the backstop if the model skips this and calls a delete directly.
  const requestApproval = createTool({
    id: 'request_approval',
    description:
      'Ask the user to approve destructive operations (delete / merge / remove) BEFORE running them. ' +
      'Provide `summary` — one short line naming exactly what will be affected, e.g. "Delete these 3 products?" — ' +
      'and `operations`, the operations you will run once approved. This executes nothing; the user gets an ' +
      'Approve / Deny prompt. Only after they approve, run those operations with execute_erxes_operation. ' +
      'Do NOT call the destructive operation before approval.',
    inputSchema: z.object({
      summary: z
        .string()
        .describe('One short confirmation line shown to the user.'),
      operations: z
        .array(
          z.object({
            operation: z.string(),
            args: z.record(z.any()).optional(),
          }),
        )
        .describe('The destructive operations to run once approved.'),
    }),
    outputSchema: z.any(),
    execute: async ({ summary, operations }) => ({
      requiresApproval: true,
      summary,
      operations: operations ?? [],
    }),
  });

  // Names-only config discovery. Lets the model see WHICH configuration codes are
  // set (so it can answer "is Cloudflare/SES configured?" and avoid re-wiring
  // something already present) while never exposing a value — core returns only
  // the codes (`configs.getCodes` → `.distinct('code')`). This is why the bulk
  // `configs` read can stay hard-blocked in securityGuard: discovery is a
  // separate, structurally value-free channel, not a redacted config dump.
  const listConfigKeys = createTool({
    id: 'list_config_keys',
    description:
      'List which erxes configuration codes are currently SET (names only — the ' +
      'values are never returned and cannot be read). Use this to check whether an ' +
      'integration or credential is already configured before wiring it, e.g. ' +
      '"is Cloudflare or SES set up?".',
    inputSchema: z.object({}),
    outputSchema: z.any(),
    execute: async () => {
      const subdomain = getCurrentAuth()?.subdomain || '';
      try {
        // defaultValue null (not []) so a failed/absent core call is
        // distinguishable from a genuinely empty config set — otherwise the tool
        // would falsely report "nothing is configured" when it simply couldn't
        // reach core.
        const codes = await sendTRPCMessage({
          subdomain,
          pluginName: 'core',
          module: 'configs',
          action: 'getCodes',
          method: 'query',
          input: {},
          defaultValue: null,
        });
        if (codes == null) {
          return {
            success: false,
            error: 'Could not reach the configuration service.',
            instruction:
              'Tell the user the configuration list is temporarily unavailable; do not guess what is configured.',
          };
        }
        const list = Array.isArray(codes) ? codes.map(String) : [];
        return {
          total: list.length,
          codes: list,
          note: list.length
            ? 'These configuration codes are set. Values are hidden and cannot be read. ' +
              'To change a config that holds a secret, send ONLY the fields you are ' +
              'changing — omitted keys keep their stored values.'
            : 'No configuration codes are set on this instance.',
        };
      } catch {
        return {
          success: false,
          error: 'Could not reach the configuration service.',
          instruction:
            'Tell the user the configuration list is temporarily unavailable; do not guess what is configured.',
        };
      }
    },
  });

  return {
    search_erxes_operations: search,
    execute_erxes_operation: execute,
    // Config discovery is bound ONLY for unrestricted (mode:'all') agents — a
    // narrowly-scoped agent (e.g. a customer-facing bot) has no business
    // enumerating the instance's configuration topology, even names-only.
    ...(policy.mode === 'all' ? { list_config_keys: listConfigKeys } : {}),
    // Only offered when approval is needed — with 'allow', ops run directly.
    ...(destructiveOps !== 'allow' ? { request_approval: requestApproval } : {}),
  };
}
