import {
  findEntityKeyInError,
  resolveIdArgs,
  type EntityResolverDeps,
} from '../entityResolver';

type QueryData = Record<string, unknown> | null;

// Each test uses a unique `scope` so the module-level candidate cache never
// bleeds one case's rows into another.
let scopeCounter = 0;
const nextScope = () => `tenant-${scopeCounter++}`;

const depsFrom = (
  responder: (query: string) => QueryData,
): EntityResolverDeps => ({
  scope: nextScope(),
  runQuery: (query) => Promise.resolve(responder(query)),
});

const productDeps = (
  pageRows: Array<Record<string, unknown>>,
  searchRows: Array<Record<string, unknown>> = [],
): EntityResolverDeps =>
  depsFrom((query) =>
    query.includes('searchValue')
      ? { products: searchRows }
      : { products: pageRows },
  );

const uomDeps = (rows: Array<Record<string, unknown>>): EntityResolverDeps =>
  depsFrom(() => ({ uoms: rows }));

const companyDeps = (
  rows: Array<Record<string, unknown>>,
): EntityResolverDeps => depsFrom(() => ({ companies: { list: rows } }));

const stageDeps = (
  stages: Array<Record<string, unknown>>,
): EntityResolverDeps =>
  depsFrom((query) =>
    query.includes('salesPipelines')
      ? { salesPipelines: { list: [{ _id: 'p1' }] } }
      : { salesStages: stages },
  );

describe('resolveIdArgs — argument-key detection and gating', () => {
  it('resolves *Id keys whose prefix maps to a global entity for any plugin', async () => {
    const deps = productDeps([{ _id: 'prod1', name: 'Widget' }]);
    const result = await resolveIdArgs({ productId: 'Widget' }, deps, 'sales');
    expect(result).toEqual({ ok: true, args: { productId: 'prod1' } });
  });

  it('leaves keys without a table entry untouched', async () => {
    const deps = productDeps([{ _id: 'prod1', name: 'Widget' }]);
    const result = await resolveIdArgs(
      { parentId: 'anything', _id: 'x' },
      deps,
      'core',
    );
    expect(result).toEqual({
      ok: true,
      args: { parentId: 'anything', _id: 'x' },
    });
  });

  it('passes a non-global entity arg through untouched for a foreign plugin', async () => {
    const runQuery = jest.fn(() => Promise.resolve(null));
    const deps: EntityResolverDeps = { scope: nextScope(), runQuery };
    const result = await resolveIdArgs(
      { stageId: 'In progress' },
      deps,
      'tasks',
    );
    expect(result).toEqual({ ok: true, args: { stageId: 'In progress' } });
    expect(runQuery).not.toHaveBeenCalled();
  });

  it('resolves keys one level deep inside plain-object values', async () => {
    const deps = depsFrom(() => ({
      productCategories: [{ _id: 'cat1', name: 'Books' }],
    }));
    const result = await resolveIdArgs(
      { doc: { categoryId: 'Books', title: 'keep' } },
      deps,
      'core',
    );
    expect(result).toEqual({
      ok: true,
      args: { doc: { categoryId: 'cat1', title: 'keep' } },
    });
  });

  it('resolves keys on elements of arrays of objects', async () => {
    const deps = productDeps([{ _id: 'prod1', name: 'Widget' }]);
    const result = await resolveIdArgs(
      { productsData: [{ productId: 'Widget', amount: 3 }, 'scalar'] },
      deps,
      'sales',
    );
    expect(result).toEqual({
      ok: true,
      args: { productsData: [{ productId: 'prod1', amount: 3 }, 'scalar'] },
    });
  });
});

describe('resolveIdArgs — resolution paths', () => {
  it('membership: keeps a value already present as an id', async () => {
    const deps = productDeps([{ _id: 'prod1', name: 'Widget' }]);
    const result = await resolveIdArgs({ productId: 'prod1' }, deps, 'core');
    expect(result).toEqual({ ok: true, args: { productId: 'prod1' } });
  });

  it('exact case-insensitive label match substitutes the id', async () => {
    const deps = uomDeps([{ _id: 'uom1', name: 'Piece' }]);
    const result = await resolveIdArgs({ uomId: 'piece' }, deps, 'core');
    expect(result).toEqual({ ok: true, args: { uomId: 'uom1' } });
  });

  it('unique fuzzy (substring) match substitutes the id', async () => {
    const deps = uomDeps([
      { _id: 'uom1', name: 'Kilogram' },
      { _id: 'uom2', name: 'Litre' },
    ]);
    const result = await resolveIdArgs({ uomId: 'kilo' }, deps, 'core');
    expect(result).toEqual({ ok: true, args: { uomId: 'uom1' } });
  });

  it('ambiguous match fails with candidates, never auto-picks', async () => {
    const deps = uomDeps([
      { _id: 'uom1', name: 'Box' },
      { _id: 'uom2', name: 'Box' },
    ]);
    const result = await resolveIdArgs({ uomId: 'Box' }, deps, 'core');
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected failure');
    expect(result.failure.entity).toBe('uom');
    expect(result.failure.arg).toBe('uomId');
    expect(result.failure.candidates).toEqual([
      { id: 'uom1', name: 'Box' },
      { id: 'uom2', name: 'Box' },
    ]);
  });

  it('miss on a COMPLETE entity hard-fails with the full candidate list', async () => {
    const deps = uomDeps([
      { _id: 'uom1', name: 'Piece' },
      { _id: 'uom2', name: 'Box' },
    ]);
    const result = await resolveIdArgs({ uomId: 'nothing' }, deps, 'core');
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected failure');
    expect(result.failure.candidates).toHaveLength(2);
    expect(result.failure.instruction).toContain('id');
  });

  it('matches a company by its primaryName label field', async () => {
    const deps = companyDeps([{ _id: 'co1', primaryName: 'Acme Inc' }]);
    const result = await resolveIdArgs(
      { companyId: 'acme inc' },
      deps,
      'sales',
    );
    expect(result).toEqual({ ok: true, args: { companyId: 'co1' } });
  });

  it('resolves stages via the pipeline-scoped walk for sales operations', async () => {
    const deps = stageDeps([{ _id: 's1', name: 'Backlog' }]);
    const result = await resolveIdArgs({ stageId: 'Backlog' }, deps, 'sales');
    expect(result).toEqual({ ok: true, args: { stageId: 's1' } });
  });
});

describe('resolveIdArgs — completeness downgraded at the fetch cap', () => {
  const manyBrands = Array.from({ length: 100 }, (_, index) => ({
    _id: `brand${index}`,
    name: `Brand ${index}`,
  }));

  it('a complete entity fetched at its cap passes a miss through unchanged', async () => {
    const deps = depsFrom(() => ({ brands: { list: manyBrands } }));
    const result = await resolveIdArgs(
      { brandId: 'zzz-unknown' },
      deps,
      'core',
    );
    expect(result).toEqual({ ok: true, args: { brandId: 'zzz-unknown' } });
  });

  it('the same entity under its cap still hard-fails a miss', async () => {
    const deps = depsFrom(() => ({
      brands: { list: manyBrands.slice(0, 2) },
    }));
    const result = await resolveIdArgs(
      { brandId: 'zzz-unknown' },
      deps,
      'core',
    );
    expect(result.ok).toBe(false);
  });

  it('a capped pipeline walk degrades stage resolution to pass-through', async () => {
    const pipelines = Array.from({ length: 100 }, (_, index) => ({
      _id: `p${index}`,
    }));
    const deps = depsFrom((query) =>
      query.includes('salesPipelines')
        ? { salesPipelines: { list: pipelines } }
        : { salesStages: [{ _id: 's1', name: 'Backlog' }] },
    );
    const result = await resolveIdArgs({ stageId: 'unknown' }, deps, 'sales');
    expect(result).toEqual({ ok: true, args: { stageId: 'unknown' } });
  });
});

describe('resolveIdArgs — needle guard', () => {
  it('an empty stageId on a single-stage tenant hard-fails instead of silently resolving', async () => {
    const deps = stageDeps([{ _id: 's1', name: 'Backlog' }]);
    const result = await resolveIdArgs({ stageId: '' }, deps, 'sales');
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected failure');
    expect(result.failure.candidates).toEqual([{ id: 's1', name: 'Backlog' }]);
  });

  it('a one-character value never fuzzy-matches', async () => {
    const deps = uomDeps([{ _id: 'uom1', name: 'Kilogram' }]);
    const result = await resolveIdArgs({ uomId: 'k' }, deps, 'core');
    expect(result.ok).toBe(false);
  });

  it('an empty value on an incomplete entity passes through without searching', async () => {
    const runQuery = jest.fn((query: string) =>
      Promise.resolve(
        query.includes('searchValue')
          ? { products: [{ _id: 'x', name: 'X' }] }
          : { products: [{ _id: 'prod1', name: 'Widget' }] },
      ),
    );
    const deps: EntityResolverDeps = { scope: nextScope(), runQuery };
    const result = await resolveIdArgs({ productId: '  ' }, deps, 'core');
    expect(result).toEqual({ ok: true, args: { productId: '  ' } });
    expect(
      runQuery.mock.calls.filter(([query]) => query.includes('searchValue')),
    ).toHaveLength(0);
  });
});

describe('resolveIdArgs — incomplete entities (targeted search fallback)', () => {
  it('page miss + unique search hit substitutes the id', async () => {
    const deps = productDeps(
      [{ _id: 'prod1', name: 'Widget' }],
      [{ _id: 'prod2', name: 'Gizmo Deluxe' }],
    );
    const result = await resolveIdArgs(
      { productId: 'Gizmo Deluxe' },
      deps,
      'core',
    );
    expect(result).toEqual({ ok: true, args: { productId: 'prod2' } });
  });

  it('page miss + multiple search hits fails with those candidates', async () => {
    const deps = productDeps(
      [{ _id: 'prod1', name: 'Widget' }],
      [
        { _id: 'prod2', name: 'Gizmo' },
        { _id: 'prod3', name: 'Gizmo' },
      ],
    );
    const result = await resolveIdArgs({ productId: 'Gizmo' }, deps, 'core');
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected failure');
    expect(result.failure.candidates).toEqual([
      { id: 'prod2', name: 'Gizmo' },
      { id: 'prod3', name: 'Gizmo' },
    ]);
  });

  it('a unique search hit substitutes even when the needle is not in its labels', async () => {
    const deps = productDeps(
      [{ _id: 'prod1', name: 'Widget' }],
      [{ _id: 'prod2', name: 'Gizmo' }],
    );
    const result = await resolveIdArgs({ productId: 'BR-123' }, deps, 'core');
    expect(result).toEqual({ ok: true, args: { productId: 'prod2' } });
  });

  it('page miss + zero search hits passes the value through unchanged', async () => {
    const deps = productDeps([{ _id: 'prod1', name: 'Widget' }], []);
    const result = await resolveIdArgs(
      { productId: 'page2-valid-id' },
      deps,
      'core',
    );
    expect(result).toEqual({
      ok: true,
      args: { productId: 'page2-valid-id' },
    });
  });
});

describe('resolveIdArgs — *Ids arrays', () => {
  it('resolves every element of an array arg', async () => {
    const deps = productDeps([
      { _id: 'prod1', name: 'Widget' },
      { _id: 'prod2', name: 'Gadget' },
    ]);
    const result = await resolveIdArgs(
      { productIds: ['Widget', 'prod2'] },
      deps,
      'core',
    );
    expect(result).toEqual({
      ok: true,
      args: { productIds: ['prod1', 'prod2'] },
    });
  });

  it('passes a zero-hit element through unchanged for incomplete entities', async () => {
    const deps = productDeps([{ _id: 'prod1', name: 'Widget' }], []);
    const result = await resolveIdArgs(
      { productIds: ['Widget', 'page2-id'] },
      deps,
      'core',
    );
    expect(result).toEqual({
      ok: true,
      args: { productIds: ['prod1', 'page2-id'] },
    });
  });

  it('fails the whole arg when any element is ambiguous', async () => {
    const deps = productDeps([
      { _id: 'prod1', name: 'Widget' },
      { _id: 'prod2', name: 'Widget' },
    ]);
    const result = await resolveIdArgs(
      { productIds: ['Widget'] },
      deps,
      'core',
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected failure');
    expect(result.failure.error).toContain('Widget');
    expect(result.failure.candidates).toHaveLength(2);
  });
});

describe('resolveIdArgs — fail-open', () => {
  it('passes the value through unchanged when the fetch fails', async () => {
    const deps = depsFrom(() => null);
    const result = await resolveIdArgs({ productId: 'Widget' }, deps, 'core');
    expect(result).toEqual({ ok: true, args: { productId: 'Widget' } });
  });
});

describe('findEntityKeyInError', () => {
  it('maps "<Entity> not found" to a table key', () => {
    expect(findEntityKeyInError('Stage not found')).toBe('stage');
    expect(findEntityKeyInError('Company not found')).toBe('company');
  });

  it('matches entity keys on word boundaries, not substrings', () => {
    expect(findEntityKeyInError('Tag not found')).toBe('tag');
    expect(findEntityKeyInError('Stage not found')).not.toBe('tag');
    expect(findEntityKeyInError('vintage item not found')).toBeUndefined();
  });

  it('triggers on validation errors, not only "not found"', () => {
    expect(findEntityKeyInError('Category is required')).toBe('category');
    expect(findEntityKeyInError('Invalid pipeline')).toBe('pipeline');
    expect(findEntityKeyInError('stageId not provided for stage')).toBe(
      'stage',
    );
  });

  it('returns undefined without an actionable trigger or a known entity', () => {
    expect(findEntityKeyInError('Login required')).toBeUndefined();
    expect(findEntityKeyInError('stage moved successfully')).toBeUndefined();
    expect(
      findEntityKeyInError('something unmapped not found'),
    ).toBeUndefined();
  });
});
