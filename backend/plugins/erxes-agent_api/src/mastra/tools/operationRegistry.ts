import { createTTLCache } from '~/utils/ttlCache';
import {
  fetchAvailableErxesTools,
  fetchInputSchemaMaps,
  fetchObjectFieldsMap,
  type ErxesToolSettings,
  type GqlArgDef,
  type GqlTypeRef,
  type SchemaMaps,
} from './erxesTools';
import { isSecurityBlockedOperation } from './securityGuard';

// One discovered erxes GraphQL operation (query or mutation) the agent can run.
export interface OperationMeta {
  operation: string;
  operationType: 'query' | 'mutation';
  plugin: string;
  module: string;
  description: string;
  graphqlArgs: GqlArgDef[];
  pluginAttribution?: 'subgraph' | 'fallback';
  returnType?: GqlTypeRef | null;
}

// The full, live picture of what the agent can do, derived from schema
// introspection. `operations` is a name → meta lookup for O(1) execute resolution;
// `list` is the same set for searching. The two type maps power argument-schema
// building (inputTypesMap) and response-field selection (objectFieldsMap).
export interface OperationRegistry extends SchemaMaps {
  operations: Map<string, OperationMeta>;
  list: OperationMeta[];
}

// Schema introspection is identical for every user (it's the gateway's shape,
// not tenant data), so the registry is cached per API URL + app token with a
// short TTL. Tool factories derive a fresh, policy-scoped searchable surface
// from this registry whenever an agent is built; no manual sync step exists.
const TTL_MS = 15 * 60 * 1000;
const cache = createTTLCache<OperationRegistry>(TTL_MS);

// Resilience tier: the last successfully built registry per key, never expired.
// When a live introspection transiently returns zero operations (or throws) we
// serve this rather than wiping an agent's capabilities mid-conversation.
const lastGood = new Map<string, OperationRegistry>();

/** Cache key for a registry: one entry per API URL + app token pair. */
function cacheKey(settings: ErxesToolSettings | null | undefined): string {
  const apiUrl = settings?.erxesApiUrl || 'http://localhost:4000';
  const token = settings?.erxesApiToken || '';
  return `${apiUrl}::${token}`;
}

/** Assemble the registry struct (name → meta map + search list + type maps). */
function buildRegistry(
  operations: OperationMeta[],
  schemaMaps: SchemaMaps,
): OperationRegistry {
  // Strip security-blocked operations (e.g. `configs`, which dumps the whole
  // secret store) before they ever enter the registry, so NO discovery surface
  // built on it — search, capability inventory, workflow step resolution, the
  // tool-listing UI — can reveal or resolve them. The execute tool independently
  // refuses them by name as a backstop.
  const visible = operations.filter(
    (op) => !isSecurityBlockedOperation(op.operation),
  );
  const map = new Map<string, OperationMeta>();
  for (const op of visible) map.set(op.operation, op);
  return { operations: map, list: visible, ...schemaMaps };
}

const preserveSubgraphAttribution = (
  previous: OperationRegistry,
  refreshed: OperationRegistry,
): OperationRegistry => {
  const list = refreshed.list.map((operation) => {
    const previousOperation = previous.operations.get(operation.operation);
    if (
      operation.pluginAttribution === 'fallback' &&
      previousOperation?.pluginAttribution === 'subgraph'
    ) {
      return {
        ...operation,
        plugin: previousOperation.plugin,
        pluginAttribution: previousOperation.pluginAttribution,
      };
    }
    return operation;
  });
  return {
    ...refreshed,
    list,
    operations: new Map(list.map((operation) => [operation.operation, operation])),
  };
};

/**
 * Returns the cached operation registry for these settings, refreshing it from
 * a live schema introspection when stale (or absent).
 *
 * Resilience: if introspection transiently returns zero operations we keep
 * serving the previous (stale) registry rather than caching an empty one, so a
 * blip in the gateway never wipes an agent's capabilities mid-conversation.
 */
export async function getOperationRegistry(
  settings: ErxesToolSettings | null,
  opts: { force?: boolean } = {},
): Promise<OperationRegistry> {
  const key = cacheKey(settings);
  const fresh = cache.get(key);
  if (fresh && !opts.force) return fresh;

  const previous = lastGood.get(key);

  try {
    const [operations, inputSchemaMaps, objectFieldsMap] = await Promise.all([
      fetchAvailableErxesTools(settings),
      fetchInputSchemaMaps(settings),
      fetchObjectFieldsMap(settings),
    ]);

    if (!operations.length && previous) {
      // Introspection failed/empty — serve the last good registry.
      return previous;
    }

    const builtRegistry = buildRegistry(operations, {
      ...inputSchemaMaps,
      objectFieldsMap,
    });
    // A forced refresh can encounter a transiently unreachable subgraph while
    // the gateway schema still returns its operations. Preserve known subgraph
    // ownership per operation while accepting new operations and fresh schemas.
    const reg =
      opts.force && previous
        ? preserveSubgraphAttribution(previous, builtRegistry)
        : builtRegistry;
    cache.set(key, reg);
    lastGood.set(key, reg);
    return reg;
  } catch {
    if (previous) return previous;
    return buildRegistry([], {
      inputTypesMap: {},
      objectFieldsMap: {},
      enumValuesMap: {},
    });
  }
}

/** Drop the cached registry for these settings (or all registries when omitted). */
export function invalidateOperationRegistry(
  settings?: ErxesToolSettings | null,
) {
  if (settings) {
    const key = cacheKey(settings);
    cache.delete(key);
    lastGood.delete(key);
  } else {
    cache.clear();
    lastGood.clear();
  }
}
