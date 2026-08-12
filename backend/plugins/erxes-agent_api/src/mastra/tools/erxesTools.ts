import { getPluginAddress } from 'erxes-api-shared/utils';
import { gql } from 'graphql-tag';
import { getCurrentAuth } from '../requestContext';
import type { OperationMeta } from './operationRegistry';
import { fetchSubgraphSdls } from './subgraphSchemaSource';
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
import { deriveModule, detectPlugin } from './humanize';
import {
  INTERNAL_ERROR_RE,
  looksLikeStackFrame,
  sanitizeServerError,
} from './serverErrorClassifier';
import { redactSecrets, REDACTED } from './secretRedaction';
import { scrubArgs } from './argScrub';
import { withEmptyResultGuidance } from './emptyResult';

// Re-export the introspection surface used by the registry and tests.
export type { GqlArgDef, GqlFieldDef, GqlTypeRef, SchemaMaps };
export { graphqlTypeToString, sanitizeServerError };

/** Gateway URL used for schema discovery, not acting-user authentication. */
export interface ErxesToolSettings {
  erxesApiUrl?: string;
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

/**
 * POST a GraphQL request to `${apiUrl}/graphql` and return the parsed JSON
 * envelope. Discovery calls omit auth; execution calls pass the resolved
 * principal headers.
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
 * Build headers for an internal subgraph call from the resolved principal only.
 */
export function buildAuthHeaders(processId?: string): Record<string, string> {
  const reqAuth = getCurrentAuth();
  const userHeader = reqAuth?.userHeader?.trim();
  const hostname = reqAuth?.subdomain?.trim();
  if (!userHeader || !hostname) {
    throw new Error('Agent principal unavailable');
  }

  const authHeaders: Record<string, string> = {
    user: userHeader,
    hostname,
  };
  if (processId) {
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
 * This is the shared execution core behind every exact operation tool. It owns:
 *   • coercing LLM-supplied args through the live operation schema,
 *   • building a valid GraphQL operation + response selection,
 *   • returning sanitized GraphQL errors without inventing argument values.
 *
 * Auth is read only from the resolved AI team-member request context.
 */
export async function executeErxesOperation(
  op: ErxesOperationRef,
  rawArgs: Record<string, unknown>,
  schemaMaps?: Partial<SchemaMaps>,
  processId?: string,
): Promise<unknown> {
  // Any internal failure (a malformed introspection shape, an undefined field
  // access, a network blip) must become a STRUCTURED result the model can act
  // on — never an exception that surfaces to the user as a raw stack message
  // and strands them.
  try {
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
    // chokepoint so every agent tool path is covered;
    // the chat path audits the refusal via recordAction (the args it logs hold
    // only placeholders, never a real secret).
    if (hasBlockedSecretMaterial(resolvedArgs)) {
      return secretRefRefusedResult();
    }

    // Every request stays on the private service network and runs as the
    // validated AI team member.
    const authHeaders = buildAuthHeaders(processId);
    const operationAddress = (await getPluginAddress(op.plugin))?.trim();
    if (!operationAddress) {
      throw new Error(`Erxes service "${op.plugin}" is unavailable`);
    }
    // GraphQL object results need a valid selection. Use only the live object
    // schema map; callers pass exact values for every operation argument.
    const finalResponseFields = chooseResponseFields(
      op.returnType,
      schemaMaps?.objectFieldsMap,
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
      return gqlFetch<GraphqlEnvelope>(operationAddress, authHeaders, {
        query,
        variables,
      });
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
      return {
        success: false,
        ...sanitizeServerError(joinErrors(data.errors)),
      };
    }
    // Redact secret VALUES (storage/SES/Cloudflare keys, ERP tokens, integration
    // passwords) before the result reaches the model. Reads like `configs`
    // otherwise dump raw credentials into the transcript and on to the LLM
    // provider; this is the single chokepoint all agent operations route
    // through, so the guard holds for every operation, current and future.
    // Empty success payloads ({}/[]/null) get an explicit 0-records envelope so
    // the model pivots or reports instead of retrying a bare anonymous `{}`.
    return withEmptyResultGuidance(
      redactSecrets(data?.data?.[erxesOperation] ?? null),
    );
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
    }>(apiUrl, {}, { query });
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

const addPluginOperationsFromSdl = (
  map: Map<string, string>,
  plugin: string,
  sdl: string,
) => {
  const document = gql(sdl);

  for (const definition of document.definitions) {
    if (
      (definition.kind !== 'ObjectTypeDefinition' &&
        definition.kind !== 'ObjectTypeExtension') ||
      (definition.name.value !== 'Query' &&
        definition.name.value !== 'Mutation')
    ) {
      continue;
    }

    for (const field of definition.fields || []) {
      const operation = field.name.value;
      if (/^(_|cp[A-Z])/.test(operation)) continue;
      if (!map.has(operation)) map.set(operation, plugin);
    }
  }
};

// ─── Plugin ownership via live subgraph introspection ────────────────────────
//
// Source of truth for "which plugin owns this operation": fetch each configured
// or gateway-active plugin's federation SDL from its internal subgraph and
// record every Query/Mutation field it declares. This:
//   • only ever sees enabled/running plugins (disabled ones aren't registered),
//   • works while production GraphQL introspection remains disabled,
//   • re-derives from the live schema on every call (auto-adapts to changes),
//   • needs no static prefix lists or public supergraph SDL access.
async function fetchPluginMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const sdls = await fetchSubgraphSdls();
  for (const [name, sdl] of sdls) {
    try {
      addPluginOperationsFromSdl(map, name, sdl);
    } catch {
      // Unparseable SDL — its ops just won't be categorized via this map.
    }
  }
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
    `fields {
      name
      args { name ${TYPE_REF_SELECTION} }
      ${TYPE_REF_SELECTION}
    }`,
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
      fetchPluginMap(),
      gqlFetch<SchemaResult>(
        apiUrl,
        {},
        {
          query: introspectionQuery,
        },
      ),
    ]);
  } catch {
    console.warn('[mastra] gateway introspection failed');
    return [];
  }
  const schema = schemaData?.data?.__schema;

  if (pluginMap.size === 0) {
    console.warn(
      '[mastra] subgraph federation SDL returned no data — falling back to first-word detection',
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

      const attributedPlugin = pluginMap.get(field.name);
      const plugin = attributedPlugin ?? detectPlugin(field.name);
      if (!plugin) continue;

      tools.push({
        plugin,
        pluginAttribution: attributedPlugin ? 'subgraph' : 'fallback',
        module: deriveModule(field.name),
        operation: field.name,
        operationType: opType,
        description: field.description?.trim() || field.name,
        graphqlArgs: field.args || [],
        returnType: field.type,
      });
    }
  };

  processFields(schema?.queryType?.fields, 'query');
  processFields(schema?.mutationType?.fields, 'mutation');

  return tools;
}
