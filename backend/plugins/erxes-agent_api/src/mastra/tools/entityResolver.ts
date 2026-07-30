import { createTTLCache } from '~/utils/ttlCache';

export interface EntityDescriptor {
  listOperation: string;
  idField: string;
  labelFields: string[];
  listArgs?: Record<string, unknown>;
  /** Service that owns this entity's list query (matches OperationMeta.plugin). */
  ownerService: string;
  /**
   * Globally-unique core entities (product, company, …) may resolve for ANY
   * operation; non-global ones only for operations owned by ownerService — the
   * same arg name means a different entity elsewhere (a tasks stageId is not a
   * sales stage).
   */
  global?: boolean;
  /**
   * Design intent: the list query returns EVERY row (verified against the
   * resolver, with an explicit high limit where it paginates). Only complete
   * lists may hard-fail on a missed match; incomplete ones fall back to a
   * targeted search and otherwise pass the value through for the server to
   * validate. Overridden DOWNWARD at runtime when a fetch fills its cap.
   */
  complete: boolean;
  searchArg?: string;
  /**
   * True when the list query returns a `{ list, totalCount }` connection rather
   * than a plain `[Type]` array — erxes is inconsistent across entities, and
   * the shape can't be inferred at query-build time.
   */
  connection?: boolean;
}

export const ENTITY_TABLE: Record<string, EntityDescriptor> = {
  stage: {
    listOperation: 'salesStages',
    idField: '_id',
    labelFields: ['name'],
    ownerService: 'sales',
    complete: true,
  },
  pipeline: {
    listOperation: 'salesPipelines',
    idField: '_id',
    labelFields: ['name'],
    listArgs: { limit: 100 },
    ownerService: 'sales',
    complete: true,
    connection: true,
  },
  board: {
    listOperation: 'salesBoards',
    idField: '_id',
    labelFields: ['name'],
    ownerService: 'sales',
    complete: true,
  },
  category: {
    listOperation: 'productCategories',
    idField: '_id',
    labelFields: ['name', 'code'],
    ownerService: 'core',
    complete: true,
  },
  tag: {
    listOperation: 'tags',
    idField: '_id',
    labelFields: ['name'],
    listArgs: { limit: 100 },
    ownerService: 'core',
    complete: false,
    searchArg: 'searchValue',
    connection: true,
  },
  product: {
    listOperation: 'products',
    idField: '_id',
    labelFields: ['name', 'code'],
    listArgs: { perPage: 100 },
    ownerService: 'core',
    global: true,
    complete: false,
    searchArg: 'searchValue',
  },
  company: {
    listOperation: 'companies',
    idField: '_id',
    labelFields: ['primaryName'],
    listArgs: { limit: 100 },
    ownerService: 'core',
    global: true,
    complete: false,
    searchArg: 'searchValue',
    connection: true,
  },
  customer: {
    listOperation: 'customers',
    idField: '_id',
    labelFields: ['firstName', 'lastName', 'primaryEmail'],
    listArgs: { limit: 100 },
    ownerService: 'core',
    global: true,
    complete: false,
    searchArg: 'searchValue',
    connection: true,
  },
  uom: {
    listOperation: 'uoms',
    idField: '_id',
    labelFields: ['name', 'code'],
    ownerService: 'core',
    global: true,
    complete: true,
  },
  brand: {
    listOperation: 'brands',
    idField: '_id',
    labelFields: ['name', 'code'],
    listArgs: { limit: 100 },
    ownerService: 'core',
    global: true,
    complete: true,
    connection: true,
  },
};

export interface EntityCandidate {
  id: string;
  name: string;
}

export interface EntityResolutionFailure {
  success: false;
  error: string;
  entity: string;
  arg: string;
  candidates: EntityCandidate[];
  instruction: string;
}

export type ResolveIdArgsResult =
  | { ok: true; args: Record<string, unknown> }
  | { ok: false; failure: EntityResolutionFailure };

/**
 * Internal subgraph access injected by the executor. Each query names the
 * service that owns it; `scope` partitions candidate caches by tenant+user.
 */
export interface EntityResolverDeps {
  runQuery: (
    query: string,
    ownerService: string,
  ) => Promise<Record<string, unknown> | null>;
  scope: string;
}

interface PreparedRow {
  id: string;
  name: string;
  labels: string[];
}

interface EntityRows {
  rows: PreparedRow[];
  complete: boolean;
}

const CANDIDATE_LIMIT = 20;
const ROWS_TTL_MS = 3 * 60 * 1000;
const PIPELINE_WALK_LIMIT = 100;
const MIN_FUZZY_NEEDLE = 2;

// Candidate lists are per-user data (pipeline/stage/customer visibility is
// user-scoped) — the cache key includes deps.scope (subdomain + userId) so
// rows are never shared across tenants or users.
const rowsCache = createTTLCache<EntityRows>(ROWS_TTL_MS);

const ID_ARG_RE = /^(.+)Id(s)?$/;

const stripQuotes = (value: string): string =>
  value.replace(/^["']|["']$/g, '').trim();

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const dedupeBy = <T>(items: T[], keyFn: (item: T) => string): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const entityForArg = (arg: string, opPlugin: string): string | undefined => {
  const match = ID_ARG_RE.exec(arg);
  if (!match) return undefined;
  const key = match[1].toLowerCase();
  const desc = ENTITY_TABLE[key];
  if (!desc) return undefined;
  return desc.global === true || desc.ownerService === opPlugin
    ? key
    : undefined;
};

const buildArgString = (listArgs?: Record<string, unknown>): string => {
  if (!listArgs) return '';
  const parts = Object.entries(listArgs).map(
    ([key, value]) => `${key}: ${JSON.stringify(value)}`,
  );
  return parts.length ? `(${parts.join(', ')})` : '';
};

const capOf = (desc: EntityDescriptor): number | undefined => {
  const cap = desc.listArgs?.limit ?? desc.listArgs?.perPage;
  return typeof cap === 'number' ? cap : undefined;
};

const prepareRows = (
  rows: Record<string, unknown>[],
  desc: EntityDescriptor,
): PreparedRow[] =>
  rows.map((row) => {
    const labels = desc.labelFields
      .map((field) => row[field])
      .filter(
        (value): value is string =>
          typeof value === 'string' && value.trim().length > 0,
      )
      .map((value) => value.trim());
    return {
      id: String(row[desc.idField] ?? ''),
      name: labels[0] ?? String(row[desc.idField] ?? ''),
      labels: labels.map((label) => label.toLowerCase()),
    };
  });

const extractRows = (
  payload: unknown,
  connection?: boolean,
): Record<string, unknown>[] | null => {
  const raw = connection
    ? isPlainObject(payload)
      ? payload.list
      : null
    : payload;
  if (!Array.isArray(raw)) return null;
  return raw as Record<string, unknown>[];
};

interface FetchedRows {
  rows: Record<string, unknown>[];
  atCap: boolean;
}

// salesStages returns nothing without a pipeline scope, so list every visible
// pipeline first and fetch all their stages in one call. A pipeline list that
// fills its cap may be truncated, which makes the stage set incomplete too.
const fetchStageRows = async (
  deps: EntityResolverDeps,
): Promise<FetchedRows | null> => {
  const pipesData = await deps.runQuery(
    `{ salesPipelines(limit: ${PIPELINE_WALK_LIMIT}) { list { _id } } }`,
    'sales',
  );
  if (!pipesData) return null;
  const pipelineRows = extractRows(pipesData.salesPipelines, true);
  if (pipelineRows === null) return null;
  const atCap = pipelineRows.length >= PIPELINE_WALK_LIMIT;
  const pipelineIds = pipelineRows
    .map((row) => row._id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
  if (!pipelineIds.length) return { rows: [], atCap };
  const stagesData = await deps.runQuery(
    `{ salesStages(pipelineIds: ${JSON.stringify(pipelineIds)}) { _id name } }`,
    'sales',
  );
  if (!stagesData) return null;
  const rows = extractRows(stagesData.salesStages, false);
  return rows ? { rows, atCap } : null;
};

const fetchEntityRows = async (
  entity: string,
  desc: EntityDescriptor,
  deps: EntityResolverDeps,
): Promise<FetchedRows | null> => {
  if (entity === 'stage') return fetchStageRows(deps);
  const selection = [desc.idField, ...desc.labelFields].join(' ');
  const inner = desc.connection ? `list { ${selection} }` : selection;
  const data = await deps.runQuery(
    `{ ${desc.listOperation}${buildArgString(desc.listArgs)} { ${inner} } }`,
    desc.ownerService,
  );
  if (!data) return null;
  const rows = extractRows(data[desc.listOperation], desc.connection);
  if (rows === null) return null;
  const cap = capOf(desc);
  return { rows, atCap: cap !== undefined && rows.length >= cap };
};

// Null means the fetch failed (transient gateway blip) — callers fail OPEN and
// pass values through untouched, so a blip never wrongly rejects a valid id.
// An authoritative empty list is [], not null. A fetch that fills its cap may
// be truncated, so completeness is downgraded for that result.
const loadRows = async (
  entity: string,
  deps: EntityResolverDeps,
): Promise<EntityRows | null> => {
  const cacheKey = `${entity}::${deps.scope}`;
  const cached = rowsCache.get(cacheKey);
  if (cached) return cached;
  const desc = ENTITY_TABLE[entity];
  const fetched = await fetchEntityRows(entity, desc, deps);
  if (fetched === null) return null;
  const entry: EntityRows = {
    rows: prepareRows(fetched.rows, desc),
    complete: desc.complete && !fetched.atCap,
  };
  rowsCache.set(cacheKey, entry);
  return entry;
};

const searchEntityRows = async (
  entity: string,
  value: string,
  deps: EntityResolverDeps,
): Promise<PreparedRow[] | null> => {
  const desc = ENTITY_TABLE[entity];
  if (!desc.searchArg) return null;
  const selection = [desc.idField, ...desc.labelFields].join(' ');
  const inner = desc.connection ? `list { ${selection} }` : selection;
  const data = await deps.runQuery(
    `{ ${desc.listOperation}(${desc.searchArg}: ${JSON.stringify(
      value,
    )}) { ${inner} } }`,
    desc.ownerService,
  );
  if (!data) return null;
  const rows = extractRows(data[desc.listOperation], desc.connection);
  return rows ? prepareRows(rows, desc) : null;
};

const toCandidates = (rows: PreparedRow[]): EntityCandidate[] =>
  dedupeBy(rows, (row) => row.id)
    .slice(0, CANDIDATE_LIMIT)
    .map((row) => ({ id: row.id, name: row.name }));

type PageMatch =
  | { kind: 'id'; id: string }
  | { kind: 'ambiguous'; candidates: EntityCandidate[] }
  | { kind: 'miss'; candidates: EntityCandidate[] };

const matchOnPage = (rows: PreparedRow[], rawValue: unknown): PageMatch => {
  const value = stripQuotes(String(rawValue));
  if (rows.some((row) => row.id === value)) return { kind: 'id', id: value };

  const needle = value.toLowerCase();
  const exact = dedupeBy(
    rows.filter((row) => row.labels.includes(needle)),
    (row) => row.id,
  );
  if (exact.length === 1) return { kind: 'id', id: exact[0].id };
  if (exact.length > 1)
    return { kind: 'ambiguous', candidates: toCandidates(exact) };

  if (needle.length >= MIN_FUZZY_NEEDLE) {
    const fuzzy = dedupeBy(
      rows.filter((row) => row.labels.some((label) => label.includes(needle))),
      (row) => row.id,
    );
    if (fuzzy.length === 1) return { kind: 'id', id: fuzzy[0].id };
    if (fuzzy.length > 1)
      return { kind: 'ambiguous', candidates: toCandidates(fuzzy) };
  }
  return { kind: 'miss', candidates: toCandidates(rows) };
};

type ScalarOutcome =
  | { kind: 'id'; id: string }
  | { kind: 'fail'; candidates: EntityCandidate[] }
  | { kind: 'pass' };

// Only a complete list may hard-fail a miss; an incomplete one falls back to a
// targeted search, and on zero hits passes the value through unchanged for the
// server to validate — never block a value we can't prove is wrong. Explicit
// ambiguity always fails. A unique search hit substitutes even when the needle
// isn't in its labels (the server matched a non-label field).
const resolveScalar = async (
  entity: string,
  entry: EntityRows,
  rawValue: unknown,
  deps: EntityResolverDeps,
): Promise<ScalarOutcome> => {
  const pageMatch = matchOnPage(entry.rows, rawValue);
  if (pageMatch.kind === 'id') return pageMatch;
  if (pageMatch.kind === 'ambiguous')
    return { kind: 'fail', candidates: pageMatch.candidates };
  if (entry.complete) return { kind: 'fail', candidates: pageMatch.candidates };

  const value = stripQuotes(String(rawValue));
  if (!value) return { kind: 'pass' };
  const found = await searchEntityRows(entity, value, deps);
  if (!found) return { kind: 'pass' };
  const unique = dedupeBy(found, (row) => row.id);
  if (unique.length === 1) return { kind: 'id', id: unique[0].id };
  if (unique.length > 1)
    return { kind: 'fail', candidates: toCandidates(unique) };
  return { kind: 'pass' };
};

const instructionFor = (
  entity: string,
  arg: string,
  isArray: boolean,
): string =>
  isArray
    ? `Set each element of "${arg}" to the exact "id" value of the intended ${entity} from the candidates list — never a name.`
    : `Call this operation again with "${arg}" set to the exact "id" value of the intended ${entity} from the candidates list — never a name.`;

const failure = (
  entity: string,
  arg: string,
  error: string,
  candidates: EntityCandidate[],
  isArray: boolean,
): { ok: false; failure: EntityResolutionFailure } => ({
  ok: false,
  failure: {
    success: false,
    error,
    entity,
    arg,
    candidates,
    instruction: instructionFor(entity, arg, isArray),
  },
});

type ValueResult =
  | { ok: true; value: unknown }
  | { ok: false; failure: EntityResolutionFailure };

const resolveArgValue = async (
  entity: string,
  arg: string,
  value: unknown,
  deps: EntityResolverDeps,
): Promise<ValueResult> => {
  const entry = await loadRows(entity, deps);
  if (entry === null) return { ok: true, value };

  if (Array.isArray(value)) {
    const resolved: unknown[] = [];
    const failed: string[] = [];
    const candidates: EntityCandidate[] = [];
    for (const element of value) {
      const outcome = await resolveScalar(entity, entry, element, deps);
      if (outcome.kind === 'id') resolved.push(outcome.id);
      else if (outcome.kind === 'pass') resolved.push(element);
      else {
        failed.push(stripQuotes(String(element)));
        candidates.push(...outcome.candidates);
      }
    }
    if (failed.length)
      return failure(
        entity,
        arg,
        `No unique ${entity} matches ${failed
          .map((element) => `"${element}"`)
          .join(', ')} for "${arg}".`,
        dedupeBy(candidates, (candidate) => candidate.id).slice(
          0,
          CANDIDATE_LIMIT,
        ),
        true,
      );
    return { ok: true, value: resolved };
  }

  if (typeof value !== 'string') return { ok: true, value };
  const outcome = await resolveScalar(entity, entry, value, deps);
  if (outcome.kind === 'id') return { ok: true, value: outcome.id };
  if (outcome.kind === 'pass') return { ok: true, value };
  return failure(
    entity,
    arg,
    `No unique ${entity} matches "${stripQuotes(value)}" for "${arg}".`,
    outcome.candidates,
    false,
  );
};

const resolveRecord = async (
  record: Record<string, unknown>,
  deps: EntityResolverDeps,
  opPlugin: string,
): Promise<ResolveIdArgsResult> => {
  const out: Record<string, unknown> = { ...record };
  for (const [key, value] of Object.entries(record)) {
    const entity = entityForArg(key, opPlugin);
    if (!entity) continue;
    const resolved = await resolveArgValue(entity, key, value, deps);
    if (!resolved.ok) return resolved;
    out[key] = resolved.value;
  }
  return { ok: true, args: out };
};

type ObjectArrayResult =
  | { ok: true; value: unknown[] }
  | { ok: false; failure: EntityResolutionFailure };

const resolveObjectArray = async (
  elements: unknown[],
  deps: EntityResolverDeps,
  opPlugin: string,
): Promise<ObjectArrayResult> => {
  const out: unknown[] = [];
  for (const element of elements) {
    if (!isPlainObject(element)) {
      out.push(element);
      continue;
    }
    const resolved = await resolveRecord(element, deps, opPlugin);
    if (!resolved.ok) return resolved;
    out.push(resolved.args);
  }
  return { ok: true, value: out };
};

/**
 * Resolve entity names in an operation's `*Id`/`*Ids` arguments into real ids:
 * top-level keys, keys one level deep inside plain-object values, and keys on
 * elements of arrays of objects. Only arguments whose entity is allowed for
 * the executing operation's plugin are touched; everything else passes through.
 */
export const resolveIdArgs = async (
  args: Record<string, unknown>,
  deps: EntityResolverDeps,
  opPlugin: string,
): Promise<ResolveIdArgsResult> => {
  const top = await resolveRecord(args, deps, opPlugin);
  if (!top.ok) return top;
  const out = top.args;
  for (const [key, value] of Object.entries(out)) {
    if (isPlainObject(value)) {
      const nested = await resolveRecord(value, deps, opPlugin);
      if (!nested.ok) return nested;
      out[key] = nested.args;
    } else if (Array.isArray(value) && value.some(isPlainObject)) {
      const nested = await resolveObjectArray(value, deps, opPlugin);
      if (!nested.ok) return nested;
      out[key] = nested.value;
    }
  }
  return { ok: true, args: out };
};

/** Candidates for enriching a server-side "<Entity> not found" error. */
export const lookupCandidates = async (
  entity: string,
  deps: EntityResolverDeps,
): Promise<EntityCandidate[]> => {
  if (!(entity in ENTITY_TABLE)) return [];
  const entry = await loadRows(entity, deps);
  return entry ? toCandidates(entry.rows) : [];
};

const ACTIONABLE_ERROR_RE = /not found|not provided|invalid|required/;

export const findEntityKeyInError = (message: string): string | undefined => {
  const lower = message.toLowerCase();
  if (!ACTIONABLE_ERROR_RE.test(lower)) return undefined;
  return Object.keys(ENTITY_TABLE).find((entity) =>
    new RegExp(`\\b${entity}\\b`).test(lower),
  );
};
