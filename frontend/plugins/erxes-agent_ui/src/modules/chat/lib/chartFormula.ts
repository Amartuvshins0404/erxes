// Tiny safe arithmetic evaluator for `spec.formulas` — the expressions that
// recompute a series when a "param" control slider moves. Parsed once into a
// closure (module-level cache keyed by source), evaluated per data row with a
// variable scope. Deliberately NOT eval/Function: only numbers, identifiers,
// + - * / % ^ (right-assoc), comparisons (< <= > >= == !=, yielding 1/0),
// parentheses, unary minus, and a whitelist of Math functions (plus
// if(cond, a, b)) can appear. Anything else fails to compile and the formula
// is ignored (the delivered values stay untouched). A formula may return NaN
// on purpose (e.g. "if(label > years, 0/0, …)") — the caller drops rows where
// every formula-driven series comes back NaN, which is how a duration param
// genuinely shortens the visible window.

export type FormulaScope = Record<string, number>;
export type CompiledFormula = (scope: FormulaScope) => number;

const FUNCS: Record<string, (...args: number[]) => number> = {
  min: Math.min,
  max: Math.max,
  pow: Math.pow,
  sqrt: Math.sqrt,
  abs: Math.abs,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  log: Math.log,
  exp: Math.exp,
  // Both branches are pre-evaluated (no laziness) — fine, since a branch can
  // only be a number (possibly NaN), never a side effect.
  if: (cond, a, b) => (cond !== 0 && !Number.isNaN(cond) ? a : b),
};

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*/;
const NUMBER = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;

function compile(source: string): CompiledFormula {
  let pos = 0;
  const src = source;

  const skipWs = () => {
    while (pos < src.length && /\s/.test(src[pos])) pos++;
  };
  const fail = (msg: string): never => {
    throw new Error(`${msg} at ${pos} in "${src}"`);
  };

  // Recursive descent: addSub → mulDiv → power (right-assoc) → unary → primary.
  function parsePrimary(): CompiledFormula {
    skipWs();
    const ch = src[pos];
    if (ch === '(') {
      pos++;
      const inner = parseCompare();
      skipWs();
      if (src[pos] !== ')') fail('Expected ")"');
      pos++;
      return inner;
    }
    const num = NUMBER.exec(src.slice(pos));
    if (num) {
      pos += num[0].length;
      const value = Number(num[0]);
      return () => value;
    }
    const ident = IDENT.exec(src.slice(pos));
    if (ident) {
      const name = ident[0];
      pos += name.length;
      skipWs();
      if (src[pos] === '(') {
        const fn = FUNCS[name] ?? fail(`Unknown function "${name}"`);
        pos++;
        const args: CompiledFormula[] = [];
        skipWs();
        if (src[pos] !== ')') {
          for (;;) {
            args.push(parseCompare());
            skipWs();
            if (src[pos] === ',') {
              pos++;
              continue;
            }
            break;
          }
        }
        if (src[pos] !== ')') fail('Expected ")" after arguments');
        pos++;
        return (scope) => fn(...args.map((a) => a(scope)));
      }
      // Own numeric properties only — a bare `{}` scope must NaN identifiers
      // like "constructor" instead of leaking Object.prototype members.
      return (scope) =>
        Object.prototype.hasOwnProperty.call(scope, name) &&
        typeof scope[name] === 'number'
          ? scope[name]
          : NaN;
    }
    return fail('Unexpected character');
  }

  function parseUnary(): CompiledFormula {
    skipWs();
    if (src[pos] === '-') {
      pos++;
      const operand = parseUnary();
      return (scope) => -operand(scope);
    }
    if (src[pos] === '+') {
      pos++;
      return parseUnary();
    }
    return parsePower();
  }

  function parsePower(): CompiledFormula {
    const base = parsePrimary();
    skipWs();
    if (src[pos] === '^') {
      pos++;
      // Right-associative; the exponent may itself be unary ("2^-x").
      const exponent = parseUnary();
      return (scope) => Math.pow(base(scope), exponent(scope));
    }
    return base;
  }

  function parseMulDiv(): CompiledFormula {
    let acc = parseUnary();
    for (;;) {
      skipWs();
      const ch = src[pos];
      if (ch === '*' || ch === '/' || ch === '%') {
        pos++;
        const rhs = parseUnary();
        const lhs = acc;
        acc =
          ch === '*'
            ? (s) => lhs(s) * rhs(s)
            : ch === '/'
              ? (s) => lhs(s) / rhs(s)
              : (s) => lhs(s) % rhs(s);
      } else {
        return acc;
      }
    }
  }

  function parseAddSub(): CompiledFormula {
    let acc = parseMulDiv();
    for (;;) {
      skipWs();
      const ch = src[pos];
      if (ch === '+' || ch === '-') {
        pos++;
        const rhs = parseMulDiv();
        const lhs = acc;
        acc = ch === '+' ? (s) => lhs(s) + rhs(s) : (s) => lhs(s) - rhs(s);
      } else {
        return acc;
      }
    }
  }

  // Lowest precedence: comparisons, yielding 1/0 for use inside if(...).
  function parseCompare(): CompiledFormula {
    let acc = parseAddSub();
    for (;;) {
      skipWs();
      const two = src.slice(pos, pos + 2);
      const op =
        two === '<=' || two === '>=' || two === '==' || two === '!='
          ? two
          : src[pos] === '<' || src[pos] === '>'
            ? src[pos]
            : null;
      if (!op) return acc;
      pos += op.length;
      const rhs = parseAddSub();
      const lhs = acc;
      const cmp: Record<string, (a: number, b: number) => boolean> = {
        '<': (a, b) => a < b,
        '<=': (a, b) => a <= b,
        '>': (a, b) => a > b,
        '>=': (a, b) => a >= b,
        '==': (a, b) => a === b,
        '!=': (a, b) => a !== b,
      };
      const test = cmp[op];
      acc = (s) => (test(lhs(s), rhs(s)) ? 1 : 0);
    }
  }

  const root = parseCompare();
  skipWs();
  if (pos < src.length) fail('Unexpected trailing input');
  return root;
}

// null marks "known bad" so a broken formula isn't re-parsed on every render.
const cache = new Map<string, CompiledFormula | null>();

/** Compile (with caching) — returns null when the expression is invalid. */
export const compileFormula = (source: string): CompiledFormula | null => {
  if (cache.has(source)) return cache.get(source) ?? null;
  let compiled: CompiledFormula | null = null;
  try {
    compiled = compile(source);
    compiled({}); // smoke-test: must evaluate (to anything, incl. NaN) without throwing
  } catch {
    compiled = null;
  }
  cache.set(source, compiled);
  return compiled;
};
