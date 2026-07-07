/**
 * Static operation-hints read path: seed lookup, pagination-convention rules
 * derived from the arg signature, and merging a hint into an arg signature
 * (required marking, code-only enum tokens, and schema-enum-wins). Pure
 * functions, no mocks — exercised against small hand-built arg signatures.
 */
import {
  getStaticOperationHints,
  paginationConvention,
  applyStaticHints,
  type OperationHint,
} from '../operationHints';
import type { ArgSpec } from '../metaTools';

const arg = (name: string, over: Partial<ArgSpec> = {}): ArgSpec => ({
  name,
  type: 'String',
  required: false,
  ...over,
});

describe('getStaticOperationHints', () => {
  it('returns the seeded entry for a known operation', () => {
    const hint = getStaticOperationHints('carsAdd');
    expect(hint?.enums?.bodyType).toContain('Sedan');
  });

  it('returns undefined for an unseeded operation', () => {
    expect(getStaticOperationHints('definitelyNotAnOp')).toBeUndefined();
  });

  it('expands a patternRules entry to the exact seeded sentence', () => {
    const hint = getStaticOperationHints('unitsRemove');
    expect(hint?.rules).toEqual(['ids must be non-empty']);
  });

  it('expands patternRules ahead of any free-text rules, in seed order', () => {
    const hint = getStaticOperationHints('customersChangeStateBulk');
    expect(hint?.rules).toEqual([
      '_ids must be non-empty',
      'value must be a valid lifecycle state (COC_LIFECYCLE_STATE_TYPES)',
    ]);
  });
});

describe('paginationConvention', () => {
  it('flags the full cursor shape (limit + cursor or direction)', () => {
    const expected = ['cursor-paginated: server rejects limit > 100; default 20'];
    expect(paginationConvention([arg('limit'), arg('cursor')])).toEqual(
      expected,
    );
    expect(paginationConvention([arg('limit'), arg('direction')])).toEqual(
      expected,
    );
  });

  it('stays silent for a bare limit arg (plugin-specific defaults)', () => {
    expect(paginationConvention([arg('limit'), arg('searchValue')])).toEqual(
      [],
    );
  });

  it('defaults perPage-style pagination', () => {
    expect(paginationConvention([arg('perPage'), arg('page')])).toEqual([
      'perPage defaults to 20',
    ]);
  });

  it('attaches both when both shapes exist, and nothing otherwise', () => {
    expect(
      paginationConvention([arg('limit'), arg('cursor'), arg('perPage')]),
    ).toEqual([
      'cursor-paginated: server rejects limit > 100; default 20',
      'perPage defaults to 20',
    ]);
    expect(paginationConvention([arg('ids')])).toEqual([]);
  });
});

describe('applyStaticHints', () => {
  it('marks a top-level arg required with a server-enforced note', () => {
    const hint: OperationHint = { required: ['startDate'] };
    const [startDate, endDate] = applyStaticHints(
      [arg('startDate'), arg('endDate')],
      hint,
    );
    expect(startDate.required).toBe(true);
    expect(startDate.requiredNote).toBe('required (server-enforced)');
    expect(endDate.required).toBe(false);
    expect(endDate.requiredNote).toBeUndefined();
  });

  it('marks a nested input.field required by dotted path', () => {
    const input = arg('input', {
      type: 'CVClientInput',
      fields: [
        { name: 'client_type', type: 'String', required: false },
        { name: 'note', type: 'String', required: false },
      ],
    });
    const hint: OperationHint = { required: ['input.client_type'] };
    const [merged] = applyStaticHints([input], hint);
    const fields = merged.fields as ArgSpec[];
    expect(fields[0].required).toBe(true);
    expect(fields[0].requiredNote).toBe('required (server-enforced)');
    expect(fields[1].required).toBe(false);
  });

  it('adds code-only enum tokens when the arg has no schema enum', () => {
    const hint: OperationHint = { enums: { role: ['user', 'admin'] } };
    const [role] = applyStaticHints([arg('role')], hint);
    expect(role.enumValues).toEqual(['user', 'admin']);
  });

  it('keeps the schema enum when both schema and hint define one', () => {
    const schemaEnum = arg('status', { enumValues: ['OPEN', 'CLOSED'] });
    const hint: OperationHint = { enums: { status: ['open', 'closed'] } };
    const [status] = applyStaticHints([schemaEnum], hint);
    expect(status.enumValues).toEqual(['OPEN', 'CLOSED']);
  });

  it('leaves unmatched args referentially unchanged', () => {
    const untouched = arg('name');
    const hint: OperationHint = { required: ['other'] };
    const [result] = applyStaticHints([untouched], hint);
    expect(result).toBe(untouched);
  });

  it('is a silent no-op when no hint path matches any arg', () => {
    const args = [arg('name'), arg('status')];
    const hint: OperationHint = {
      required: ['missing'],
      enums: { alsoMissing: ['a', 'b'] },
    };
    const [name, status] = applyStaticHints(args, hint);
    expect(name).toBe(args[0]);
    expect(status).toBe(args[1]);
  });

  it('keeps a truncation-marker string entry in fields untouched', () => {
    const input = arg('input', {
      type: 'BigInput',
      fields: [
        { name: 'title', type: 'String', required: false },
        '…and 30 more',
      ],
    });
    const hint: OperationHint = { required: ['input.title'] };
    const [merged] = applyStaticHints([input], hint);
    expect(merged.fields?.[1]).toBe('…and 30 more');
    expect((merged.fields?.[0] as ArgSpec).required).toBe(true);
  });
});
