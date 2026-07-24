import {
  getActivePlugins,
  getPlugins,
  getPluginAddress,
} from 'erxes-api-shared/utils';
import { getCurrentAuth } from '../requestContext';
import type { OperationMeta } from './operationRegistry';
import {
  buildGraphqlOperation,
  buildZodSchemaFromArgs,
  chooseResponseFields,
  coercePerArg,
  graphqlTypeToString,
  withNeutralDefaults,
  type GqlArgDef,
  type GqlFieldDef,
  type GqlTypeRef,
  type SchemaMaps,
} from './schemaIntrospect';
import {
  deriveModule,
  detectPlugin,
  humanizeOperation,
  truncateWords,
} from './humanize';
import {
  INTERNAL_ERROR_RE,
  looksLikeStackFrame,
  sanitizeServerError,
} from './serverErrorClassifier';
import { redactSecrets, REDACTED } from './secretRedaction';
import { scrubArgs } from './argScrub';
import {
  findEntityKeyInError,
  lookupCandidates,
  resolveIdArgs,
  type EntityResolverDeps,
} from './entityResolver';

// Re-export the introspection + humanisation surface so existing importers
// (metaTools, operationRegistry, tests) keep their `from './erxesTools'` paths.
export type { GqlArgDef, GqlFieldDef, GqlTypeRef, SchemaMaps };
export { graphqlTypeToString, sanitizeServerError };

/** Connection settings for reaching the erxes gateway (API URL + app token). */
export interface ErxesToolSettings {
  erxesApiUrl?: string;
  erxesApiToken?: string;
}

/** Minimal GraphQL HTTP response envelope. */
interface GraphqlEnvelope {
  data?: Record<string, unknown> | null;
  errors?: Array<{ message: string }>;
}

/** One named type entry from a `__schema { types }` introspection result. */
interface IntrospectedNamedType {
  name: string;
  kind: string;
  inputFields?: GqlArgDef[] | null;
  fields?: GqlFieldDef[] | null;
  enumValues?: Array<{ name: string }> | null;
}

// The gateway's userMiddleware only accepts `Authorization: Bearer <token>`
// (raw tokens silently fall through to anonymous → "Login required").
export const asBearer = (token?: string | null): string =>
  !token ? '' : /^Bearer\s/i.test(token) ? token : `Bearer ${token}`;

// ---------------------------------------------------------------------------
// Auto-resolution helpers
//
// When a GraphQL operation fails with "X not found", the tool should NOT tell
// the LLM to call other tools (those tools may not be in the agent's toolset).
// Instead, the tool resolves the dependency chain itself and returns real IDs
// in the error payload so the LLM can retry immediately with a valid value.
// ---------------------------------------------------------------------------

/**
 * POST a GraphQL request to `${apiUrl}/graphql` and return the parsed JSON
 * envelope. The single fetch+json site every gateway/subgraph caller routes
 * through; per-site error handling (null / {} / warnings) stays at the callers.
 */
async function gqlFetch<TJson>(
  apiUrl: string,
  authHeaders: Record<string, string>,
  body: Record<string, unknown>,
): Promise<TJson> {
  const res = await fetch(`${apiUrl}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(body),
  });
  return (await res.json()) as TJson;
}

/** Fire one GraphQL query and return its `data` payload, or null on any failure. */
async function gqlCall<TData = Record<string, unknown>>(
  apiUrl: string,
  authHeaders: Record<string, string>,
  query: string,
): Promise<TData | null> {
  try {
    const json = await gqlFetch<{ data?: TData | null }>(apiUrl, authHeaders, {
      query,
    });
    return json?.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Gateway access the entity resolver needs, bound to this request's auth. Every
 * candidate lookup runs through the same `gqlCall` (Bearer + tenant hostname)
 * the operation itself uses. The cache scope carries subdomain AND userId —
 * entity visibility (pipelines, stages, customers) is per-user, so cached rows
 * must never cross users.
 */
function makeResolverDeps(
  apiUrl: string,
  authHeaders: Record<string, string>,
): EntityResolverDeps {
  const auth = getCurrentAuth();
  return {
    runQuery: (query) => gqlCall(apiUrl, authHeaders, query),
    scope: `${auth?.subdomain || ''}::${auth?.userId || ''}`,
  };
}

/**
 * Map a server-side "<Entity> not found" error onto a structured failure that
 * carries the real candidates for that entity, so the model can retry with an
 * exact id. Unmapped entities keep the plain sanitized error.
 */
async function buildNotFoundResult(
  rawMessage: string,
  deps: EntityResolverDeps,
): Promise<Record<string, unknown>> {
  const entity = findEntityKeyInError(rawMessage);
  if (entity) {
    const candidates = await lookupCandidates(entity, deps);
    if (candidates.length) {
      return {
        success: false,
        ...sanitizeServerError(rawMessage),
        candidates,
        instruction: `The ${entity} you specified was not found. Retry this operation with the exact "id" value of the intended ${entity} from the candidates list — never a name.`,
      };
    }
  }
  return { success: false, ...sanitizeServerError(rawMessage) };
}

// Shape the executor needs: an operation descriptor as produced by
// fetchAvailableErxesTools / the operation registry.
export interface ErxesOperationRef {
  operation: string;
  operationType: 'query' | 'mutation';
  plugin: string;
  graphqlArgs?: GqlArgDef[];
  returnType?: GqlTypeRef | null;
}

/**
 * Auth headers for gateway calls: the calling user's login token as a Bearer,
 * otherwise the configured app token (bot/no-session calls). The decoded
 * `userHeader` is NEVER sent outbound — it stays in requestContext for INTERNAL
 * gating only (requireTeamMember, currentUserId, resource scoping). Exported so
 * the header contract can be unit-tested in isolation.
 */
export function buildAuthHeaders(
  appToken: string,
  processId?: string,
): Record<string, string> {
  const reqAuth = getCurrentAuth();
  const authHeaders: Record<string, string> = {};
  // Forward identity as `Authorization: Bearer <token>` only (the gateway's
  // userMiddleware resolves the request as that user); never a `user` header.
  const bearer = reqAuth?.token || appToken;
  if (bearer) {
    authHeaders['Authorization'] = asBearer(bearer);
  }
  if (reqAuth?.subdomain) {
    // The gateway resolves the tenant via getSubdomain(), which reads the
    // 'hostname' header before falling back to the request host.
    authHeaders['hostname'] = reqAuth.subdomain;
  }
  if (processId) {
    // Correlation id honored by the subgraph's request context, so every DB
    // change this mutation makes is stamped with it (traceable / revertable).
    authHeaders['x-erxes-process-id'] = processId;
  }
  return authHeaders;
}

/** Joins GraphQL error messages into one semicolon-separated string. */
const joinErrors = (errs: Array<{ message: string }>): string =>
  errs.map((err) => err.message).join('; ');

// The agent has no way to read or inject secret VALUES — that path is
// deliberately closed (see secretRedaction). Blocked secret material in ANY
// operation's args (queries included; the guard runs op-wide as a uniform net,
// though writes are where corruption bites) is refused. Two shapes:
//   1. invented reference syntax — `{{secret:CODE}}` / `{{keep}}` — which, with
//      no server-side resolver, would land as a literal placeholder in a
//      credential field and silently break the integration;
//   2. the redactor's own REDACTED sentinel — echoed back in a read-modify-write
//      it would overwrite the real stored secret with the placeholder string.
// Both mean the same fix: OMIT that field. configsUpdate is a partial upsert, so
// an omitted key keeps its stored value untouched. Refusing the whole op (rather
// than silently stripping the field) is deliberate — stripping would WIPE the
// secret on replace-on-edit sinks; the instruction tells the model to retry.
const SECRET_REF_RE = /\{\{\s*(?:secret\s*:|keep\s*\}\})/i;

/** True when any string leaf in the args carries blocked secret material. */
function hasBlockedSecretMaterial(value: unknown, depth = 0): boolean {
  // Fail SAFE past the defensive depth cap (mirrors secretRedaction): if the
  // tree can't be fully scanned, REFUSE rather than let unvetted material
  // through. Real argument trees never approach this depth.
  if (depth > 16) return true;
  if (typeof value === 'string')
    return SECRET_REF_RE.test(value) || value.includes(REDACTED);
  if (Array.isArray(value))
    return value.some((v) => hasBlockedSecretMaterial(v, depth + 1));
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some((v) =>
      hasBlockedSecretMaterial(v, depth + 1),
    );
  }
  return false;
}

/** Structured refusal returned when the model uses secret-reference syntax. */
function secretRefRefusedResult() {
  return {
    success: false,
    error: 'Secret references are not supported.',
    instruction:
      'You cannot read or set secret values (API tokens, passwords and keys are ' +
      'hidden). To update a configuration that already contains a secret while ' +
      'changing other fields, send ONLY the fields you are changing — omitted keys ' +
      'keep their stored values. Never invent a secret value or paste one the user gave you.',
  };
}

/**
 * Runs a single erxes GraphQL operation by name on the user's behalf and returns
 * its result (or a structured { success:false, … } payload the model can act on).
 *
 * This is the shared execution core behind the `execute_erxes_operation`
 * meta-tool. It owns everything that used to live in the per-operation tool:
 *   • coercing LLM-supplied args through the operation's Zod schema,
 *   • resolving entity NAMES in *Id/*Ids args → real ids (membership-based),
 *   • building a valid GraphQL operation + response selection,
 *   • turning "not found"/validation errors into actionable instructions.
 *
 * Auth is read from the async request context (the calling user's header) and
 * falls back to the configured app token for bot/no-session calls.
 */
export async function executeErxesOperation(
  op: ErxesOperationRef,
  rawArgs: Record<string, unknown>,
  settings: ErxesToolSettings | null,
  schemaMaps?: Partial<SchemaMaps>,
  processId?: string,
  requestedFields?: string[],
): Promise<unknown> {
  // Any internal failure (a malformed introspection shape, an undefined field
  // access, a network blip) must become a STRUCTURED result the model can act
  // on — never an exception that surfaces to the user as a raw stack message
  // and strands them.
  try {
    const apiUrl = settings?.erxesApiUrl || 'http://localhost:4000';
    const token = settings?.erxesApiToken || '';
    const erxesOperation = op.operation;
    const erxesOperationType = op.operationType;
    const args = op.graphqlArgs || [];

    // Coerce the model's args through the per-operation Zod schema (numbers sent
    // as strings, JSON-as-string arrays/objects, date normalisation, …). The
    // execute meta-tool passes a plain object, so this is where validation runs.
    // Coercion is per-arg: each field is parsed against its own schema and kept
    // when it validates, otherwise passed through raw — so one bad sibling no
    // longer discards the coercion of every other field.
    const inputSchema = buildZodSchemaFromArgs(
      args,
      schemaMaps?.inputTypesMap,
      schemaMaps?.enumValuesMap,
    );
    let resolvedArgs: Record<string, unknown> = coercePerArg(
      inputSchema,
      rawArgs || {},
    );

    // Strip high-risk keys the agent must never set (e.g. usersEdit password /
    // email / groupIds, usersInvite permissionGroupIds) before the args become a
    // GraphQL call — the arg-scoped complement to the full-operation denylist.
    resolvedArgs = scrubArgs(erxesOperation, resolvedArgs);

    // Refuse blocked secret material — invented reference syntax
    // ({{secret:CODE}} / {{keep}}) or an echoed REDACTED sentinel. There is NO
    // server-side secret resolver by design; letting either through would
    // silently corrupt a credential field. The guard sits at this shared
    // chokepoint so both the chat meta-tool and the workflow runtime are covered;
    // the chat path audits the refusal via recordAction (the args it logs hold
    // only placeholders, never a real secret).
    if (hasBlockedSecretMaterial(resolvedArgs)) {
      return secretRefRefusedResult();
    }

    // Auth must be resolved first — needed for the entity-resolver lookups.
    const authHeaders = buildAuthHeaders(token, processId);
    const resolverDeps = makeResolverDeps(apiUrl, authHeaders);

    const idResolution = await resolveIdArgs(
      resolvedArgs,
      resolverDeps,
      op.plugin,
    );
    if (!idResolution.ok) return idResolution.failure;
    resolvedArgs = idResolution.args;

    // Build the GraphQL operation after ids have been resolved. Choose a
    // VALID response selection derived from the schema (so types without a
    // `name` field, like User, still produce a runnable query).
    const finalResponseFields = chooseResponseFields(
      erxesOperation,
      op.returnType,
      schemaMaps?.objectFieldsMap,
      requestedFields,
    );

    /** Builds and POSTs the GraphQL operation with the given args. */
    const runCall = async (
      callArgs: Record<string, unknown>,
    ): Promise<GraphqlEnvelope> => {
      const { query, variables } = buildGraphqlOperation(
        erxesOperation,
        erxesOperationType,
        args,
        callArgs,
        op.returnType,
        finalResponseFields,
      );
      return gqlFetch<GraphqlEnvelope>(apiUrl, authHeaders, { query, variables });
    };

    let data = await runCall(resolvedArgs);

    // ── Crash auto-recovery ───────────────────────────────────────────────
    // Several erxes resolvers crash (500) when a schema-optional arg is
    // omitted. When the failure looks like such a crash, retry once with
    // neutral defaults filled into the missing args before reporting failure.
    if (
      data?.errors &&
      (INTERNAL_ERROR_RE.test(joinErrors(data.errors)) ||
        looksLikeStackFrame(joinErrors(data.errors)))
    ) {
      const defaulted = withNeutralDefaults(args, resolvedArgs);
      if (defaulted) {
        const retried = await runCall(defaulted);
        if (!retried?.errors) data = retried;
      }
    }

    if (data?.errors) {
      return buildNotFoundResult(joinErrors(data.errors), resolverDeps);
    }
    // Redact secret VALUES (storage/SES/Cloudflare keys, ERP tokens, integration
    // passwords) before the result reaches the model. Reads like `configs`
    // otherwise dump raw credentials into the transcript and on to the LLM
    // provider; this is the single chokepoint both chat and workflows route
    // through, so the guard holds for every operation, current and future.
    return redactSecrets(data?.data?.[erxesOperation] ?? null);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Could not run "${op?.operation}": ${message}`,
      instruction:
        'This is an internal system problem, not a mistake by you or the user. Do NOT silently retry the same call. Tell the user in plain words that this one step could not be completed, and either continue with the rest of the task or ask how they want to proceed.',
    };
  }
}

// The type { name kind ofType … } sub-selection shared by every named-type
// introspection query.
const TYPE_REF_SELECTION =
  'type { name kind ofType { name kind ofType { name kind ofType { name kind } } } }';

/**
 * Fetch `__schema { types }` with the given per-type sub-selection. The shared
 * scaffold behind fetchInputSchemaMaps / fetchObjectFieldsMap — one round-trip
 * per call, and any failure degrades to an empty list rather than throwing.
 */
async function introspectSchemaTypes(
  settings: ErxesToolSettings | null,
  selection: string,
): Promise<IntrospectedNamedType[]> {
  const apiUrl = settings?.erxesApiUrl || 'http://localhost:4000';
  const token = settings?.erxesApiToken || '';

  const query = `{
    __schema {
      types {
        name
        kind
        ${selection}
      }
    }
  }`;

  try {
    const data = await gqlFetch<{
      data?: { __schema?: { types?: IntrospectedNamedType[] } };
    }>(apiUrl, token ? { Authorization: asBearer(token) } : {}, { query });
    return data?.data?.__schema?.types || [];
  } catch {
    return [];
  }
}

/** Project named types onto a name-keyed map, skipping empty picks. */
function mapNamedTypes<TField>(
  types: IntrospectedNamedType[],
  pick: (namedType: IntrospectedNamedType) => TField[] | null | undefined,
): Record<string, TField[]> {
  const map: Record<string, TField[]> = {};
  for (const namedType of types) {
    const fields = pick(namedType);
    if (fields?.length) map[namedType.name] = fields;
  }
  return map;
}

/** The two input-side maps the Zod builders consume, fetched in one pass. */
export interface InputSchemaMaps {
  inputTypesMap: Record<string, GqlArgDef[]>;
  enumValuesMap: Record<string, string[]>;
}

/**
 * Fetches all INPUT_OBJECT field definitions AND every ENUM's value names in a
 * single `__schema { types }` round-trip, so graphqlTypeToZod builds real
 * object/enum schemas (and argSignature surfaces field breakdowns + allowed
 * values) instead of falling back to z.unknown(). A failed introspection
 * degrades to empty maps — it never fails the registry build.
 */
export async function fetchInputSchemaMaps(
  settings: ErxesToolSettings | null,
): Promise<InputSchemaMaps> {
  const types = await introspectSchemaTypes(
    settings,
    `inputFields { name ${TYPE_REF_SELECTION} }
        enumValues(includeDeprecated: false) { name }`,
  );
  return {
    inputTypesMap: mapNamedTypes(types, (namedType) =>
      namedType.kind === 'INPUT_OBJECT' ? namedType.inputFields : undefined,
    ),
    enumValuesMap: mapNamedTypes(types, (namedType) =>
      namedType.kind === 'ENUM'
        ? (namedType.enumValues || [])
            .map((value) => value.name)
            .filter(Boolean)
        : undefined,
    ),
  };
}

// ─── Plugin ownership via live subgraph introspection ────────────────────────
//
// Source of truth for "which plugin owns this operation": introspect each
// configured or gateway-active plugin's own subgraph (discovered through erxes
// service discovery)
// and record every Query/Mutation field it declares. This:
//   • only ever sees enabled/running plugins (disabled ones aren't registered),
//   • re-derives from the live schema on every call (auto-adapts to changes),
//   • needs no static prefix lists and no supergraph SDL access.
// (The gateway does not expose `{ _service { sdl } }`, so SDL parsing isn't an
// option here.)
async function fetchPluginMap(token: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const authHeaders: Record<string, string> = token
    ? { Authorization: asBearer(token) }
    : {};

  let plugins: string[] = [];
  try {
    const [configuredPlugins, activePlugins] = await Promise.all([
      getPlugins(),
      getActivePlugins(),
    ]);
    // Plugin workloads can have a narrower ENABLED_PLUGINS value than the
    // gateway. Include the gateway's Redis-backed active list so ownership does
    // not fall back to operation-name prefixes for those subgraphs.
    plugins = [...new Set([...configuredPlugins, ...activePlugins])];
  } catch {
    return map;
  }

  await Promise.all(
    plugins.map(async (name) => {
      try {
        const address = await getPluginAddress(name);
        if (!address) return;

        const json = await gqlFetch<{
          data?: {
            __schema?: {
              queryType?: { fields?: Array<{ name?: string }> | null };
              mutationType?: { fields?: Array<{ name?: string }> | null };
            };
          };
        }>(address, authHeaders, {
          query:
            '{ __schema { queryType { fields { name } } mutationType { fields { name } } } }',
        });
        const schema = json?.data?.__schema;
        const fields = [
          ...(schema?.queryType?.fields || []),
          ...(schema?.mutationType?.fields || []),
        ];
        for (const field of fields) {
          // Skip federation internals (_service/_entities) and ClientPortal ops.
          // First subgraph to declare a field name wins.
          if (!field?.name || /^(_|cp[A-Z])/.test(field.name)) continue;
          if (!map.has(field.name)) map.set(field.name, name);
        }
      } catch {
        // Plugin unreachable — its ops just won't be categorized via this map.
      }
    }),
  );

  return map;
}

/**
 * Introspect all OBJECT types → their fields, so chooseResponseFields can build
 * a valid selection set for any return type (replacing the naive `_id name`).
 */
export async function fetchObjectFieldsMap(
  settings: ErxesToolSettings | null,
): Promise<Record<string, GqlFieldDef[]>> {
  const types = await introspectSchemaTypes(
    settings,
    `fields { name ${TYPE_REF_SELECTION} }`,
  );
  return mapNamedTypes(types, (namedType) =>
    namedType.kind === 'OBJECT' && !String(namedType.name).startsWith('__')
      ? namedType.fields
      : undefined,
  );
}

/**
 * Discovers every executable operation on the gateway (queries + mutations),
 * with plugin/module attribution and a model-readable description.
 */
export async function fetchAvailableErxesTools(
  settings: ErxesToolSettings | null,
): Promise<OperationMeta[]> {
  const apiUrl = settings?.erxesApiUrl || 'http://localhost:4000';
  const token = settings?.erxesApiToken || '';
  const authHeaders: Record<string, string> = token
    ? { Authorization: asBearer(token) }
    : {};

  const introspectionQuery = `{
    __schema {
      queryType {
        fields {
          name description
          type { name kind ofType { name kind ofType { name kind } } }
          args {
            name description
            type { name kind ofType { name kind ofType { name kind ofType { name kind } } } }
          }
        }
      }
      mutationType {
        fields {
          name description
          type { name kind ofType { name kind ofType { name kind } } }
          args {
            name description
            type { name kind ofType { name kind ofType { name kind ofType { name kind } } } }
          }
        }
      }
    }
  }`;

  // Resolve plugin ownership (per-subgraph introspection) and the full gateway
  // field list (for descriptions/args/types) in parallel.
  type SchemaResult = {
    data?: {
      __schema?: {
        queryType?: { fields?: GqlFieldDef[] | null };
        mutationType?: { fields?: GqlFieldDef[] | null };
      };
    };
  };
  let pluginMap: Map<string, string>;
  let schemaData: SchemaResult;
  try {
    [pluginMap, schemaData] = await Promise.all([
      fetchPluginMap(token),
      gqlFetch<SchemaResult>(apiUrl, authHeaders, { query: introspectionQuery }),
    ]);
  } catch {
    console.warn('[mastra] gateway introspection failed');
    return [];
  }
  const schema = schemaData?.data?.__schema;

  if (pluginMap.size === 0) {
    console.warn(
      '[mastra] _service { sdl } returned no data — falling back to first-word detection',
    );
  }

  const tools: OperationMeta[] = [];

  const SKIP_RE = /^(_|cp[A-Z])/;

  /** Maps gateway schema fields onto operation descriptors, skipping internals. */
  const processFields = (
    fields: GqlFieldDef[] | null | undefined,
    opType: 'query' | 'mutation',
  ) => {
    for (const field of fields || []) {
      // Always skip internal and ClientPortal operations
      if (SKIP_RE.test(field.name)) continue;

      const plugin = pluginMap.get(field.name) ?? detectPlugin(field.name);
      if (!plugin) continue;

      tools.push({
        plugin,
        module: deriveModule(field.name),
        operation: field.name,
        operationType: opType,
        description: field.description?.trim()
          ? truncateWords(field.description, 15)
          : humanizeOperation(field.name, opType),
        graphqlArgs: field.args || [],
        returnType: field.type,
      });
    }
  };

  processFields(schema?.queryType?.fields, 'query');
  processFields(schema?.mutationType?.fields, 'mutation');

  return tools;
}
