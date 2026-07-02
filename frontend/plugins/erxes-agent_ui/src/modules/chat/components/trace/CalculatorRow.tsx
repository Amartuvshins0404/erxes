import { ToolPartView } from '~/modules/chat/lib/uiParts';

// The `calculator` tool I/O (read defensively).
const readExpr = (input: unknown): string => {
  if (!input || typeof input !== 'object') return '';
  const v = (input as { expression?: unknown }).expression;
  return typeof v === 'string' ? v : '';
};
const readResult = (output: unknown): string | null => {
  if (!output || typeof output !== 'object') return null;
  const v = (output as { result?: unknown }).result;
  return typeof v === 'number' || typeof v === 'string' ? String(v) : null;
};

// A calculation as a single inline line — "Calculated 2 + 2 = 4".
export const CalculatorRow = ({
  call,
  streaming,
}: {
  call: ToolPartView;
  streaming?: boolean;
}) => {
  const expr = readExpr(call.input);
  const result = readResult(call.output);
  const pending = call.pending && streaming;

  return (
    <div className="ea-pop ea-trace-row flex items-center gap-1.5 px-1.5 py-1 text-xs">
      {pending ? (
        <span className="ea-shimmer-text font-medium">Calculating…</span>
      ) : call.isError ? (
        <span className="text-destructive">Calculation failed</span>
      ) : (
        <span className="truncate">
          <span className="text-muted-foreground">Calculated</span>{' '}
          <span className="font-mono">{expr}</span>
          {result !== null && (
            <>
              {' '}
              <span className="text-muted-foreground">=</span>{' '}
              <span className="font-mono font-medium text-foreground">
                {result}
              </span>
            </>
          )}
        </span>
      )}
    </div>
  );
};
