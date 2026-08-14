import { useState } from 'react';
import {
  IconAlertTriangle,
  IconInfoCircle,
} from '@tabler/icons-react';

// Structured rendering for tool args/results — the replacement for raw JSON
// dumps. Pure classification/formatting helpers are exported for unit tests;
// the components stay quiet (key-value rows, a mini table for record lists)
// and only fall back to a capped JSON block for genuinely pathological shapes.

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

// ─── Envelopes ──────────────────────────────────────────────────────────────

// The backend returns { success:false, error } for actionable failures and
// { success:true, resultCount:0 } for zero-match reads — both must render as
// notes, never as JSON payloads.
export const isFailureResult = (value: unknown): boolean =>
  isRecord(value) &&
  value.success === false &&
  typeof value.error === 'string';

export const failureMessage = (value: unknown): string =>
  isFailureResult(value) ? String((value as { error: unknown }).error) : '';

export const isEmptyEnvelope = (value: unknown): boolean =>
  isRecord(value) && value.success === true && value.resultCount === 0;

// ─── Value classification ───────────────────────────────────────────────────

export const isScalar = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean';

const isScalarArray = (value: unknown): value is unknown[] =>
  Array.isArray(value) && value.every(isScalar);

// A table row candidate: an object whose values are all scalar (or scalar
// lists) — anything nested would render as mush in a cell.
export const isFlatRow = (value: unknown): value is Record<string, unknown> =>
  isRecord(value) &&
  Object.values(value).every((v) => isScalar(v) || isScalarArray(v));

export const isFlatRowArray = (value: unknown): value is Record<string, unknown>[] =>
  Array.isArray(value) && value.length > 0 && value.every(isFlatRow);

// Name-ish columns first, ids last — the readable order for a record table.
const FRONT_KEYS = ['name', 'title', 'label', 'firstName', 'lastName', 'email'];
const BACK_KEYS = ['_id', 'id'];

export const tableColumns = (
  rows: Record<string, unknown>[],
  max = 5,
): string[] => {
  const seen: string[] = [];
  for (const row of rows.slice(0, 20)) {
    for (const key of Object.keys(row)) {
      if (!seen.includes(key)) seen.push(key);
    }
  }
  const ordered = [
    ...FRONT_KEYS.filter((k) => seen.includes(k)),
    ...seen.filter((k) => !FRONT_KEYS.includes(k) && !BACK_KEYS.includes(k)),
    ...BACK_KEYS.filter((k) => seen.includes(k)),
  ];
  return ordered.slice(0, max);
};

// A record carrying exactly one record-list plus scalar metadata — the classic
// erxes `{ list: [...], totalCount: n }` envelope. The scalars become the
// caption, the list becomes the table.
export const pickPrimaryArray = (
  record: Record<string, unknown>,
): { key: string; rows: Record<string, unknown>[]; meta: [string, unknown][] } | null => {
  const entries = Object.entries(record);
  const arrayEntries = entries.filter(([, v]) => isFlatRowArray(v));
  if (arrayEntries.length !== 1) return null;
  const [key, rows] = arrayEntries[0] as [string, Record<string, unknown>[]];
  const meta = entries.filter(
    ([k, v]) => k !== key && (isScalar(v) || isScalarArray(v)),
  );
  return { key, rows, meta };
};

// ─── Formatting ─────────────────────────────────────────────────────────────

// camelCase / snake_case / plugin prefixes → sentence label ("totalCount" →
// "Total count").
export const humanizeKey = (key: string): string => {
  const words = key
    .replace(/^tool[-_]/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : key;
};

export const formatScalar = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString('en-US');
  return String(value);
};

// One-line rendering for nested values inside key-value rows.
export const compactInline = (value: unknown, cap = 90): string => {
  let text: string;
  if (isScalar(value)) text = formatScalar(value);
  else if (Array.isArray(value))
    text = `[${value.map((v) => compactInline(v, 30)).join(', ')}]`;
  else {
    try {
      text = JSON.stringify(value);
    } catch {
      text = String(value);
    }
  }
  return text.length > cap ? `${text.slice(0, cap)}…` : text;
};

const URL_RE = /^https?:\/\/\S+$/i;

// ─── Shared blocks ──────────────────────────────────────────────────────────

const TRUNCATE_AT = 600;

// Last-resort payload view — capped, expandable, only for shapes the
// structured renderers genuinely can't read.
export const JsonBlock = ({ value }: { value: string }) => {
  const [expanded, setExpanded] = useState(false);
  const long = value.length > TRUNCATE_AT;
  return (
    <div>
      <pre className="rounded-md ea-bg-muted-50 p-2.5 text-xs whitespace-pre-wrap break-words ea-text-90">
        {expanded || !long ? value : `${value.slice(0, TRUNCATE_AT)}…`}
      </pre>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs text-primary hover:underline"
        >
          {expanded ? 'Show less' : `Show all (${value.length} chars)`}
        </button>
      )}
    </div>
  );
};

const LONG_TEXT_AT = 700;

// Long plain-text results (prose, stdout, …) — wrapped text, not mono JSON.
const TextBlock = ({ value }: { value: string }) => {
  const [expanded, setExpanded] = useState(false);
  const long = value.length > LONG_TEXT_AT;
  return (
    <div>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed ea-text-90">
        {expanded || !long ? value : `${value.slice(0, LONG_TEXT_AT)}…`}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs text-primary hover:underline"
        >
          {expanded ? 'Show less' : 'Show all'}
        </button>
      )}
    </div>
  );
};

export const ToolNote = ({
  tone,
  children,
}: {
  tone: 'muted' | 'error';
  children: React.ReactNode;
}) => (
  <div
    className={`flex items-start gap-2 text-sm ${
      tone === 'error' ? 'text-destructive' : 'text-muted-foreground'
    }`}
  >
    {tone === 'error' ? (
      <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
    ) : (
      <IconInfoCircle className="mt-0.5 size-4 shrink-0" />
    )}
    <span className="min-w-0 break-words">{children}</span>
  </div>
);

// ─── Structured value components ────────────────────────────────────────────

const INLINE_STRING_CAP = 160;
const SCALAR_LIST_CAP = 6;

const ScalarInline = ({ value }: { value: unknown }): React.ReactNode => {
  if (typeof value === 'string' && URL_RE.test(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="text-primary hover:underline break-all"
      >
        {value.length > 60 ? `${value.slice(0, 60)}…` : value}
      </a>
    );
  }
  const text = formatScalar(value);
  if (text.length > INLINE_STRING_CAP) {
    return <span title={text}>{`${text.slice(0, INLINE_STRING_CAP)}…`}</span>;
  }
  return text;
};

const CellValue = ({ value }: { value: unknown }) => {
  if (isScalarArray(value)) {
    const shown = value.slice(0, SCALAR_LIST_CAP);
    const more = value.length - shown.length;
    return (
      <span title={value.map(formatScalar).join(', ')}>
        {shown.map(formatScalar).join(', ')}
        {more > 0 ? ` +${more}` : ''}
      </span>
    );
  }
  return <ScalarInline value={value} />;
};

const RowValue = ({ value, depth }: { value: unknown; depth: number }) => {
  if (isScalar(value)) return <ScalarInline value={value} />;
  if (isScalarArray(value)) return <CellValue value={value} />;
  if (isRecord(value) && depth < 1) {
    return (
      <div className="mt-1">
        <KeyValueRows record={value} depth={depth + 1} />
      </div>
    );
  }
  return (
    <span className="font-mono text-xs ea-muted-80" title={compactInline(value, 400)}>
      {compactInline(value)}
    </span>
  );
};

// Key-value rows for flat-ish objects — args and record results.
export const KeyValueRows = ({
  record,
  depth = 0,
}: {
  record: Record<string, unknown>;
  depth?: number;
}) => (
  <dl className="ea-kv">
    {Object.entries(record).map(([key, value]) => (
      <div className="ea-kv-row" key={key}>
        <dt>{humanizeKey(key)}</dt>
        <dd>
          <RowValue value={value} depth={depth} />
        </dd>
      </div>
    ))}
  </dl>
);

const ROWS_CAP = 6;

// Record lists render as a quiet mini table, capped and expandable.
export const MiniTable = ({ rows }: { rows: Record<string, unknown>[] }) => {
  const [expanded, setExpanded] = useState(false);
  const columns = tableColumns(rows);
  const shown = expanded ? rows : rows.slice(0, ROWS_CAP);
  const hiddenCols = tableColumns(rows, Infinity).length - columns.length;
  return (
    <div>
      <div className="overflow-x-auto rounded-lg border ea-border-70">
        <table className="ea-tool-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{humanizeKey(col)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col}>
                    <CellValue value={row[col]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
        <span>{rows.length} {rows.length === 1 ? 'row' : 'rows'}</span>
        {rows.length > ROWS_CAP && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-primary hover:underline"
          >
            {expanded ? 'Show less' : `Show all`}
          </button>
        )}
        {hiddenCols > 0 && <span>+{hiddenCols} more fields</span>}
      </div>
    </div>
  );
};

// ─── Args / Result views ────────────────────────────────────────────────────

// Args are a parsed object on the live part; argsText covers the still-
// streaming or unparsable case.
export const ToolArgsView = ({
  value,
  rawText,
}: {
  value?: unknown;
  rawText?: string;
}) => {
  if (isRecord(value)) {
    if (Object.keys(value).length === 0) return null;
    return (
      <div>
        <p className="text-xs font-medium text-muted-foreground">Parameters</p>
        <div className="mt-1">
          <KeyValueRows record={value} />
        </div>
      </div>
    );
  }
  if (rawText && rawText !== '{}') return <JsonBlock value={rawText} />;
  return null;
};

export const ToolResultView = ({
  result,
  isError,
  statusError,
}: {
  result?: unknown;
  isError?: boolean;
  statusError?: unknown;
}) => {
  if (result === undefined && !isError && statusError === undefined) {
    return null;
  }

  if (isError) {
    const text =
      typeof result === 'string'
        ? result
        : failureMessage(result) ||
          (statusError
            ? typeof statusError === 'string'
              ? statusError
              : compactInline(statusError, 300)
            : '') ||
          (result !== undefined ? compactInline(result, 300) : '') ||
          'Tool call failed.';
    return <ToolNote tone="error">{text}</ToolNote>;
  }

  if (isFailureResult(result)) {
    return <ToolNote tone="error">{failureMessage(result)}</ToolNote>;
  }

  if (isEmptyEnvelope(result)) {
    return <ToolNote tone="muted">No matching records for these filters.</ToolNote>;
  }

  if (typeof result === 'string') return <TextBlock value={result} />;
  if (isScalar(result)) {
    return <p className="text-sm ea-text-90">{formatScalar(result)}</p>;
  }

  if (Array.isArray(result)) {
    if (result.length === 0) {
      return <ToolNote tone="muted">Empty result.</ToolNote>;
    }
    if (isFlatRowArray(result)) return <MiniTable rows={result} />;
    if (result.every(isScalar)) {
      return (
        <p className="text-sm ea-text-90 break-words">
          {result.map(formatScalar).join(', ')}
        </p>
      );
    }
    return <JsonBlock value={JSON.stringify(result, null, 2)} />;
  }

  if (isRecord(result)) {
    const primary = pickPrimaryArray(result);
    if (primary) {
      return (
        <div className="flex flex-col gap-2">
          {primary.meta.length > 0 && (
            <KeyValueRows record={Object.fromEntries(primary.meta)} />
          )}
          <MiniTable rows={primary.rows} />
        </div>
      );
    }
    if (Object.keys(result).length === 0) {
      return <ToolNote tone="muted">Empty result.</ToolNote>;
    }
    return <KeyValueRows record={result} />;
  }

  return <JsonBlock value={compactInline(result, TRUNCATE_AT)} />;
};
