import {
  ApolloCache,
  ApolloClient,
  ApolloLink,
  FetchResult,
  NormalizedCacheObject,
  ObservableQuery,
} from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { DocumentNode, Kind, OperationDefinitionNode } from 'graphql';

type LiveMutationKind = 'remove' | 'structural' | 'edit';

type LiveDataContext = {
  live?: boolean;
};

const REMOVE_VERBS = ['remove', 'delete', 'destroy', 'erase', 'purge'];

const STRUCTURAL_VERBS = [
  'add',
  'create',
  'insert',
  'merge',
  'duplicate',
  'copy',
  'clone',
  'import',
  'convert',
  'move',
  'restore',
  'archive',
  'unarchive',
  'sort',
  'reorder',
  'assign',
  'connect',
  'disconnect',
  'publish',
  'unpublish',
  'save',
];

const MIN_STEM_LENGTH = 3;
const MAX_SCAN_DEPTH = 4;

const splitWords = (fieldName: string) =>
  fieldName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[\s_]+/)
    .filter(Boolean);

const singularize = (word: string) => {
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.endsWith('ses') || word.endsWith('xes')) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
};

export const classifyMutationField = (fieldName: string) => {
  const words = splitWords(fieldName);
  const verbIndex = words.findIndex(
    (word) => REMOVE_VERBS.includes(word) || STRUCTURAL_VERBS.includes(word),
  );
  const verb = verbIndex === -1 ? undefined : words[verbIndex];

  let kind: LiveMutationKind = 'edit';

  if (verb && REMOVE_VERBS.includes(verb)) {
    kind = 'remove';
  } else if (verb) {
    kind = 'structural';
  }

  let nounWords = words.slice(0, verbIndex);

  if (verbIndex === -1) {
    nounWords = words.slice(0, 1);
  } else if (verbIndex === 0) {
    nounWords = words.slice(1);
  }

  return { kind, stem: nounWords.map(singularize).join('') };
};

const getRootFieldNames = (document: DocumentNode) => {
  const definition = getMainDefinition(document);

  if (definition.kind !== Kind.OPERATION_DEFINITION) {
    return [];
  }

  return (definition as OperationDefinitionNode).selectionSet.selections
    .filter((selection) => selection.kind === Kind.FIELD)
    .map((selection) =>
      selection.kind === Kind.FIELD ? selection.name.value : '',
    );
};

const normalizeName = (name: string) =>
  splitWords(name).map(singularize).join('');

const collectTypenames = (
  value: unknown,
  typenames: Set<string>,
  depth = 0,
) => {
  if (!value || typeof value !== 'object' || depth > MAX_SCAN_DEPTH) return;

  if (Array.isArray(value)) {
    for (const item of value.slice(0, 5)) {
      collectTypenames(item, typenames, depth + 1);
    }
    return;
  }

  const record = value as Record<string, unknown>;

  if (typeof record.__typename === 'string') {
    typenames.add(record.__typename);
  }

  for (const key of Object.keys(record)) {
    if (key !== '__typename') {
      collectTypenames(record[key], typenames, depth + 1);
    }
  }
};

const isEntity = (value: unknown) =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as Record<string, unknown>).__typename === 'string' &&
  ('_id' in (value as Record<string, unknown>) ||
    'id' in (value as Record<string, unknown>));

const returnsEntities = (value: unknown) =>
  Array.isArray(value)
    ? value.length > 0 && value.every(isEntity)
    : isEntity(value);

const ID_KEY_PATTERN = /(^_?ids?$|Ids?$)/;

const collectIds = (value: unknown, ids: Set<string>, depth = 0) => {
  if (!value || typeof value !== 'object' || depth > 2) return;

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (ID_KEY_PATTERN.test(key)) {
      const list = Array.isArray(entry) ? entry : [entry];
      for (const id of list) {
        if (typeof id === 'string' && id) ids.add(id);
      }
    } else if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      collectIds(entry, ids, depth + 1);
    }
  }
};

const evictIds = (
  cache: ApolloCache<NormalizedCacheObject>,
  ids: Set<string>,
) => {
  if (!ids.size) return;

  const keys = Object.keys(cache.extract() as Record<string, unknown>);
  let evicted = false;

  for (const key of keys) {
    const separator = key.indexOf(':');
    if (separator === -1) continue;

    const rest = key.slice(separator + 1);
    const id = rest.startsWith('{')
      ? /"_?id":"([^"]+)"/.exec(rest)?.[1] ?? ''
      : rest;

    if (ids.has(id)) {
      evicted = cache.evict({ id: key }) || evicted;
    }
  }

  if (evicted) cache.gc();
};

const containsAnyId = (
  value: unknown,
  ids: Set<string>,
  depth = 0,
): boolean => {
  if (!value || typeof value !== 'object' || depth > MAX_SCAN_DEPTH + 1) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsAnyId(item, ids, depth + 1));
  }

  const record = value as Record<string, unknown>;

  if (
    (typeof record._id === 'string' && ids.has(record._id)) ||
    (typeof record.id === 'string' && ids.has(record.id))
  ) {
    return true;
  }

  return Object.values(record).some(
    (entry) =>
      !!entry &&
      typeof entry === 'object' &&
      containsAnyId(entry, ids, depth + 1),
  );
};

const markRootFieldsStale = (
  cache: ApolloCache<NormalizedCacheObject>,
  stems: string[],
) => {
  if (!stems.length) return;

  cache.modify({
    id: 'ROOT_QUERY',
    broadcast: false,
    fields: (value, { fieldName, DELETE }) => {
      const name = normalizeName(fieldName);
      return stems.some((stem) => name.includes(stem)) ? DELETE : value;
    },
  });
};

type LiveTarget = {
  stems: string[];
  typenames: Set<string>;
  ids: Set<string>;
};

const isRelatedQuery = (query: ObservableQuery, target: LiveTarget) => {
  if (query.options.fetchPolicy === 'cache-only') return false;
  if (query.options.fetchPolicy === 'standby') return false;

  const fields = getRootFieldNames(query.query).map(normalizeName);

  if (
    target.stems.some((stem) => fields.some((field) => field.includes(stem)))
  ) {
    return true;
  }

  const data = query.getCurrentResult(false).data;

  if (target.typenames.size) {
    const present = new Set<string>();
    collectTypenames(data, present);

    for (const typename of target.typenames) {
      if (present.has(typename)) return true;
    }
  }

  return target.ids.size > 0 && containsAnyId(data, target.ids);
};

export const createLiveDataLink = (
  getClient: () => ApolloClient<NormalizedCacheObject> | undefined,
) =>
  new ApolloLink((operation, forward) => {
    const definition = getMainDefinition(operation.query);
    const isMutation =
      definition.kind === Kind.OPERATION_DEFINITION &&
      (definition as OperationDefinitionNode).operation === 'mutation';
    const context = operation.getContext() as LiveDataContext;

    if (!isMutation || context.live === false) {
      return forward(operation);
    }

    return forward(operation).map((result: FetchResult) => {
      if (result.errors?.length || !result.data) return result;

      const client = getClient();
      if (!client) return result;

      const stems: string[] = [];
      const typenames = new Set<string>();
      const removedIds = new Set<string>();
      const touchedIds = new Set<string>();
      let shouldRefetch = false;

      for (const [fieldName, value] of Object.entries(result.data)) {
        const { kind, stem } = classifyMutationField(fieldName);

        if (kind === 'remove') {
          collectIds(operation.variables, removedIds);
        }

        if (kind !== 'edit' || !returnsEntities(value)) {
          shouldRefetch = true;
          if (stem.length >= MIN_STEM_LENGTH) stems.push(stem);
          collectTypenames(value, typenames);
          if (kind !== 'remove') collectIds(operation.variables, touchedIds);
        }
      }

      if (!shouldRefetch && !removedIds.size) return result;

      setTimeout(() => {
        evictIds(client.cache, removedIds);
        markRootFieldsStale(client.cache, stems);

        if (!stems.length && !typenames.size && !touchedIds.size) return;

        client
          .refetchQueries({
            include: 'active',
            onQueryUpdated: (query) =>
              isRelatedQuery(query, { stems, typenames, ids: touchedIds }) &&
              query.refetch(),
          })
          .catch(() => undefined);
      }, 0);

      return result;
    });
  });
