import type { ArgFieldSpec, ArgSpec } from './metaTools';
import {
  HINT_PATTERNS,
  OPERATION_HINTS,
  type OperationHint,
} from './operationHintsData';

export type { OperationHint };

// Marker attached to an arg the static census found required in server code but
// nullable in the schema, so the model reads WHY it's flagged required.
const REQUIRED_NOTE = 'required (server-enforced)';

/** Expands one `patternRules` entry back into the rule string it replaced. */
export function expandPatternRule(p: string, arg: string): string {
  return HINT_PATTERNS[p].replace('{args}', arg).replace('{arg}', arg);
}

/** The static hint entry for an operation, or undefined when none is seeded. */
export function getStaticOperationHints(
  operation: string,
): OperationHint | undefined {
  const hint = OPERATION_HINTS[operation];
  if (!hint?.patternRules?.length) return hint;
  const expanded = hint.patternRules.map(({ p, arg }) =>
    expandPatternRule(p, arg),
  );
  return { ...hint, rules: [...expanded, ...(hint.rules ?? [])] };
}

/**
 * Pagination conventions derived from the arg signature (not an operation list).
 * A bare `limit` arg proves nothing (plugins hand-roll their own defaults and
 * caps), so the cursor hint fires only on the full cursorPaginate shape —
 * `limit` together with `cursor` or `direction` — where the shared helper's
 * contract (throws on limit > 100, defaults to 20) is what actually runs.
 * `perPage` is the shared page-pagination helper's arg; its default is 20.
 */
export function paginationConvention(args: readonly ArgSpec[]): string[] {
  const names = new Set(args.map((arg) => arg.name));
  const rules: string[] = [];
  if (names.has('limit') && (names.has('cursor') || names.has('direction'))) {
    rules.push('cursor-paginated: server rejects limit > 100; default 20');
  }
  if (names.has('perPage')) rules.push('perPage defaults to 20');
  return rules;
}

// Apply a hint's `required` / `enums` to one arg (or nested field) at `path`.
// Schema wins: an enum already carried from the schema is never overwritten by a
// hint enum. Returns the same object when nothing matched, so untouched args are
// referentially unchanged.
function markField<T extends ArgFieldSpec>(
  field: T,
  path: string,
  required: ReadonlySet<string>,
  enums: Record<string, string[]>,
): T {
  const patch: Partial<ArgFieldSpec> = {};
  if (required.has(path)) {
    patch.required = true;
    patch.requiredNote = REQUIRED_NOTE;
  }
  const hintEnum = enums[path];
  if (hintEnum?.length && !field.enumValues?.length) {
    patch.enumValues = hintEnum;
  }
  return Object.keys(patch).length ? { ...field, ...patch } : field;
}

/**
 * Merge a hint's required flags and code-only enums into an arg signature.
 * Matches top-level args by name and one-level INPUT_OBJECT fields by
 * `arg.field`. `rules` are surfaced separately (see the search mapping); this
 * only rewrites the signature. Pure — returns a new array, never mutates.
 */
export function applyStaticHints(
  args: readonly ArgSpec[],
  hint: OperationHint,
): ArgSpec[] {
  const required = new Set(hint.required ?? []);
  const enums = hint.enums ?? {};
  return args.map((arg) => {
    const marked = markField(arg, arg.name, required, enums);
    if (!marked.fields) return marked;
    const fields = marked.fields.map((field) =>
      typeof field === 'string'
        ? field
        : markField(field, `${arg.name}.${field.name}`, required, enums),
    );
    return { ...marked, fields };
  });
}
