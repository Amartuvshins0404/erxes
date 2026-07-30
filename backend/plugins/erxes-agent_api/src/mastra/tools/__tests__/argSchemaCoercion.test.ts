/**
 * Arg-schema building + per-field coercion: real z.enum generation with
 * case-insensitive normalization, strict required derivation (outermost
 * NON_NULL), and coercePerArg keeping good fields when a sibling is
 * unparseable. Pure functions, no mocks.
 */
import {
  buildZodSchemaFromArgs,
  coercePerArg,
  isRequiredType,
  underlyingNamedType,
  type GqlTypeRef,
} from '../schemaIntrospect';

const scalar = (name = 'String'): GqlTypeRef => ({ kind: 'SCALAR', name });
const nonNull = (ofType: GqlTypeRef): GqlTypeRef => ({
  kind: 'NON_NULL',
  ofType,
});
const listOf = (ofType: GqlTypeRef): GqlTypeRef => ({ kind: 'LIST', ofType });
const enumType = (name: string): GqlTypeRef => ({ kind: 'ENUM', name });

const enumValuesMap = { SortDirection: ['ASC', 'DESC'] };

describe('isRequiredType', () => {
  it('is true when the outermost kind is NON_NULL (X!, [X]!, [X!]!)', () => {
    expect(isRequiredType(nonNull(scalar()))).toBe(true);
    expect(isRequiredType(nonNull(listOf(scalar())))).toBe(true);
    expect(isRequiredType(nonNull(listOf(nonNull(scalar()))))).toBe(true);
  });

  it('is false for nullable outer types, including [X!]', () => {
    expect(isRequiredType(scalar())).toBe(false);
    expect(isRequiredType(listOf(scalar()))).toBe(false);
    expect(isRequiredType(listOf(nonNull(scalar())))).toBe(false);
    expect(isRequiredType(null)).toBe(false);
  });
});

describe('underlyingNamedType', () => {
  it('unwraps NON_NULL/LIST to the innermost named type', () => {
    expect(underlyingNamedType(nonNull(listOf(enumType('SortDirection'))))).toEqual(
      { kind: 'ENUM', name: 'SortDirection' },
    );
  });
});

describe('enum zod generation + case-insensitive normalization', () => {
  const schema = buildZodSchemaFromArgs(
    [{ name: 'direction', type: enumType('SortDirection') }],
    {},
    enumValuesMap,
  );

  it('normalizes a case-insensitive match to the canonical value', () => {
    const parsed = schema.shape.direction.safeParse('desc');
    expect(parsed.success && parsed.data).toBe('DESC');
  });

  it('accepts the canonical value unchanged', () => {
    const parsed = schema.shape.direction.safeParse('ASC');
    expect(parsed.success && parsed.data).toBe('ASC');
  });

  it('rejects a value that is not an enum member', () => {
    expect(schema.shape.direction.safeParse('SIDEWAYS').success).toBe(false);
  });
});

describe('coercePerArg — per-field, one bad sibling does not poison the rest', () => {
  const schema = buildZodSchemaFromArgs(
    [
      { name: 'ids', type: listOf(nonNull(scalar())) },
      { name: 'limit', type: scalar('Int') },
      { name: 'direction', type: enumType('SortDirection') },
    ],
    {},
    enumValuesMap,
  );

  it('coerces a JSON-string array and a numeric string while passing a bad enum through raw', () => {
    const out = coercePerArg(schema, {
      ids: '["a","b"]',
      limit: '5',
      direction: 'bogus',
    });
    expect(out.ids).toEqual(['a', 'b']);
    expect(out.limit).toBe(5);
    expect(out.direction).toBe('bogus');
  });

  it('passes through args with no matching schema entry unchanged', () => {
    const out = coercePerArg(schema, { unknownArg: { nested: 1 } });
    expect(out.unknownArg).toEqual({ nested: 1 });
  });

  it('normalizes a good enum sibling alongside a coerced list', () => {
    const out = coercePerArg(schema, { ids: '["x"]', direction: 'asc' });
    expect(out.ids).toEqual(['x']);
    expect(out.direction).toBe('ASC');
  });
});
