// ---------------------------------------------------------------------------
// Subgraph SDL schema source — the discovery fallback used when the gateway's
// public `/graphql` endpoint is blocked, hidden or has introspection disabled
// (e.g. a reverse proxy refusing POST on /graphql).
//
// Every registered subgraph answers `{ _service { sdl } }` on its INTERNAL
// address (the same path plugin attribution and operation execution already
// rely on), and that SDL carries everything the registry needs: Query/Mutation
// fields with args and return types, input objects, enums and object fields.
// This module parses those SDLs into the exact shapes the gateway
// introspection fetchers produce, so getOperationRegistry can swap sources
// without changing any consumer.
// ---------------------------------------------------------------------------

import {
  getActivePlugins,
  getPluginAddress,
  getPlugins,
} from 'erxes-api-shared/utils';
import { gql } from 'graphql-tag';
import { deriveModule } from './humanize';
import type { OperationMeta } from './operationRegistry';
import type { GqlArgDef, GqlFieldDef, GqlTypeRef } from './schemaIntrospect';

/** Everything the registry build consumes from one schema source. */
export interface SubgraphSchemaBundle {
  operations: OperationMeta[];
  inputTypesMap: Record<string, GqlArgDef[]>;
  enumValuesMap: Record<string, string[]>;
  objectFieldsMap: Record<string, GqlFieldDef[]>;
}

const EMPTY_BUNDLE: SubgraphSchemaBundle = {
  operations: [],
  inputTypesMap: {},
  enumValuesMap: {},
  objectFieldsMap: {},
};

// Structural shapes of the graphql-tag AST nodes this module walks. Kept local
// so the plugin does not need the `graphql` package as a direct dependency.
interface SdlTypeNode {
  kind: string;
  name?: { value: string };
  type?: SdlTypeNode;
}
interface SdlInputValueNode {
  name: { value: string };
  description?: { value: string } | null;
  type: SdlTypeNode;
}
interface SdlFieldNode {
  name: { value: string };
  description?: { value: string } | null;
  type: SdlTypeNode;
  arguments?: readonly SdlInputValueNode[];
}
interface SdlEnumValueNode {
  name: { value: string };
  deprecationReason?: string | null;
}
interface SdlDefinitionNode {
  kind: string;
  name?: { value: string };
  fields?: readonly SdlFieldNode[];
  arguments?: readonly SdlInputValueNode[];
  values?: readonly SdlEnumValueNode[];
}

const ROOT_TYPE_NAMES = new Set(['Query', 'Mutation', 'Subscription']);
// Same internal / client-portal skip rule the gateway discovery path applies.
const SKIP_OPERATION_RE = /^(_|cp[A-Z])/;

const SDL_KIND_TO_TYPE_KIND: Record<string, string> = {
  ObjectTypeDefinition: 'OBJECT',
  ObjectTypeExtension: 'OBJECT',
  ScalarTypeDefinition: 'SCALAR',
  ScalarTypeExtension: 'SCALAR',
  EnumTypeDefinition: 'ENUM',
  EnumTypeExtension: 'ENUM',
  InputObjectTypeDefinition: 'INPUT_OBJECT',
  InputObjectTypeExtension: 'INPUT_OBJECT',
  InterfaceTypeDefinition: 'INTERFACE',
  InterfaceTypeExtension: 'INTERFACE',
  UnionTypeDefinition: 'UNION',
  UnionTypeExtension: 'UNION',
};

/**
 * Fetch the federation SDL of every configured-or-active plugin from its
 * internal subgraph address. Unreachable plugins and non-SDL responses are
 * skipped silently — a partial picture still beats an empty registry.
 */
export async function fetchSubgraphSdls(): Promise<Map<string, string>> {
  const sdls = new Map<string, string>();

  let plugins: string[] = [];
  try {
    const [configuredPlugins, activePlugins] = await Promise.all([
      getPlugins(),
      getActivePlugins().catch(() => []),
    ]);
    // Plugin workloads can have a narrower ENABLED_PLUGINS value than the
    // gateway; include the gateway's Redis-backed active list as well.
    plugins = [...new Set([...configuredPlugins, ...activePlugins])];
  } catch {
    return sdls;
  }

  await Promise.all(
    plugins.map(async (name) => {
      try {
        const address = (await getPluginAddress(name))?.trim();
        if (!address) return;
        const res = await fetch(`${address}/graphql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: '{ _service { sdl } }' }),
        });
        const json = (await res.json()) as {
          data?: { _service?: { sdl?: string | null } | null };
        };
        const sdl = json?.data?._service?.sdl;
        if (typeof sdl === 'string' && sdl.trim()) sdls.set(name, sdl);
      } catch {
        // Plugin unreachable — its schema just won't be part of the bundle.
      }
    }),
  );

  return sdls;
}

/** Convert an SDL type node into the introspection `{kind, name, ofType}` shape. */
function typeNodeToRef(
  node: SdlTypeNode,
  namedTypeKinds: Map<string, string>,
): GqlTypeRef {
  if (node.kind === 'NonNullType' && node.type) {
    return { kind: 'NON_NULL', ofType: typeNodeToRef(node.type, namedTypeKinds) };
  }
  if (node.kind === 'ListType' && node.type) {
    return { kind: 'LIST', ofType: typeNodeToRef(node.type, namedTypeKinds) };
  }
  const name = node.name?.value || '';
  // Unknown named types default to OBJECT: the safe choice for both the Zod
  // builder (z.unknown()) and the selection builder (falls back to __typename).
  return { kind: namedTypeKinds.get(name) ?? 'OBJECT', name };
}

function toArgDef(
  input: SdlInputValueNode,
  namedTypeKinds: Map<string, string>,
): GqlArgDef {
  return {
    name: input.name.value,
    description: input.description?.value?.trim() || null,
    type: typeNodeToRef(input.type, namedTypeKinds),
  };
}

function toFieldDef(
  field: SdlFieldNode,
  namedTypeKinds: Map<string, string>,
): GqlFieldDef {
  return {
    name: field.name.value,
    description: field.description?.value?.trim() || null,
    type: typeNodeToRef(field.type, namedTypeKinds),
    args: (field.arguments || []).map((arg) => toArgDef(arg, namedTypeKinds)),
  };
}

/** Parse a field list into a name-deduped map (first declaration wins). */
function mergeFields(
  target: Map<string, GqlFieldDef>,
  fields: readonly SdlFieldNode[] | undefined,
  namedTypeKinds: Map<string, string>,
): void {
  for (const field of fields || []) {
    const name = field.name.value;
    if (!target.has(name)) target.set(name, toFieldDef(field, namedTypeKinds));
  }
}

/**
 * Build the full registry input (operations + the three schema maps) from
 * subgraph SDLs. Two passes: the first records every named type's kind so
 * type refs carry real OBJECT/SCALAR/ENUM kinds across subgraph boundaries,
 * the second emits operations and maps.
 */
export function buildSubgraphSchemaBundle(
  sdls: Map<string, string>,
): SubgraphSchemaBundle {
  const parsed: Array<{
    plugin: string;
    definitions: readonly SdlDefinitionNode[];
  }> = [];
  const namedTypeKinds = new Map<string, string>([
    ['String', 'SCALAR'],
    ['Int', 'SCALAR'],
    ['Float', 'SCALAR'],
    ['Boolean', 'SCALAR'],
    ['ID', 'SCALAR'],
  ]);

  for (const [plugin, sdl] of sdls) {
    let definitions: readonly SdlDefinitionNode[];
    try {
      definitions = (
        gql(sdl) as unknown as { definitions: readonly SdlDefinitionNode[] }
      ).definitions;
    } catch {
      continue;
    }
    parsed.push({ plugin, definitions });
    for (const definition of definitions) {
      const typeName = definition.name?.value;
      if (!typeName || typeName.startsWith('__')) continue;
      const kind = SDL_KIND_TO_TYPE_KIND[definition.kind];
      if (kind && !namedTypeKinds.has(typeName)) {
        namedTypeKinds.set(typeName, kind);
      }
    }
  }

  if (!parsed.length) return EMPTY_BUNDLE;

  const operationsByName = new Map<string, OperationMeta>();
  const inputTypesMap: Record<string, GqlArgDef[]> = {};
  const enumValuesMap: Record<string, string[]> = {};
  const objectFields = new Map<string, Map<string, GqlFieldDef>>();

  for (const { plugin, definitions } of parsed) {
    for (const definition of definitions) {
      const typeName = definition.name?.value;
      if (!typeName || typeName.startsWith('__') || typeName.startsWith('_')) {
        continue;
      }

      if (
        (definition.kind === 'ObjectTypeDefinition' ||
          definition.kind === 'ObjectTypeExtension') &&
        ROOT_TYPE_NAMES.has(typeName)
      ) {
        if (typeName === 'Subscription') continue;
        const operationType = typeName === 'Query' ? 'query' : 'mutation';
        for (const field of definition.fields || []) {
          const operation = field.name.value;
          if (SKIP_OPERATION_RE.test(operation)) continue;
          if (operationsByName.has(operation)) continue;
          operationsByName.set(operation, {
            operation,
            operationType,
            plugin,
            module: deriveModule(operation),
            description: field.description?.value?.trim() || operation,
            graphqlArgs: (field.arguments || []).map((arg) =>
              toArgDef(arg, namedTypeKinds),
            ),
            pluginAttribution: 'subgraph',
            returnType: typeNodeToRef(field.type, namedTypeKinds),
          });
        }
        continue;
      }

      if (
        definition.kind === 'InputObjectTypeDefinition' ||
        definition.kind === 'InputObjectTypeExtension'
      ) {
        // Input object fields are `fields` (each an InputValueDefinitionNode),
        // not `arguments` — that key only exists on field definitions.
        if (!inputTypesMap[typeName]) inputTypesMap[typeName] = [];
        const known = new Set(
          inputTypesMap[typeName].map((field) => field.name),
        );
        for (const input of definition.fields || []) {
          if (known.has(input.name.value)) continue;
          inputTypesMap[typeName].push(toArgDef(input, namedTypeKinds));
        }
        continue;
      }

      if (
        definition.kind === 'EnumTypeDefinition' ||
        definition.kind === 'EnumTypeExtension'
      ) {
        const values = (definition.values || [])
          .filter((value) => !value.deprecationReason)
          .map((value) => value.name.value);
        if (values.length) {
          enumValuesMap[typeName] = [
            ...new Set([...(enumValuesMap[typeName] || []), ...values]),
          ];
        }
        continue;
      }

      if (
        definition.kind === 'ObjectTypeDefinition' ||
        definition.kind === 'ObjectTypeExtension'
      ) {
        if (!objectFields.has(typeName)) objectFields.set(typeName, new Map());
        mergeFields(
          objectFields.get(typeName) as Map<string, GqlFieldDef>,
          definition.fields,
          namedTypeKinds,
        );
      }
    }
  }

  const objectFieldsMap: Record<string, GqlFieldDef[]> = {};
  for (const [typeName, fields] of objectFields) {
    if (ROOT_TYPE_NAMES.has(typeName)) continue;
    objectFieldsMap[typeName] = [...fields.values()];
  }

  return {
    operations: [...operationsByName.values()],
    inputTypesMap,
    enumValuesMap,
    objectFieldsMap,
  };
}

/**
 * Fetch + parse in one call: the complete registry input derived from live
 * subgraph SDLs. Returns an empty bundle when no subgraph is reachable.
 */
export async function fetchSubgraphSchemaBundle(): Promise<SubgraphSchemaBundle> {
  const sdls = await fetchSubgraphSdls();
  if (!sdls.size) return EMPTY_BUNDLE;
  return buildSubgraphSchemaBundle(sdls);
}
