import { useState } from 'react';
import {
  IconAlertCircle,
  IconCheck,
  IconChevronRight,
} from '@tabler/icons-react';
import { ToolPartView, toolHint } from '~/modules/chat/lib/uiParts';
import { formatJson } from '~/modules/chat/lib/markdown';

// One tool invocation as a timeline-step body: a quiet summary row — the tool
// name in mono, a dimmed hint of what it acted on, and the settled ✓ / ✕ — that
// expands to its request and response. The rail node to the left (owned by
// AgentTrace) carries the running/type state; this row carries completion.
export const ToolCallRow = ({
  call,
  streaming,
}: {
  call: ToolPartView;
  streaming?: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const pending = call.pending && streaming;
  const settled =
    call.state === 'output-available' || call.state === 'output-error';
  const result = call.isError ? call.errorText : call.output;
  const hint = toolHint(call.input);

  return (
    <div className="ea-pop">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="ea-trace-row flex w-full items-center gap-2 px-1.5 py-1 text-left text-xs"
      >
        <span className="shrink-0 font-mono text-foreground">
          {call.toolName}
        </span>
        {hint ? (
          <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
            {hint}
          </span>
        ) : (
          <span className="flex-1" />
        )}
        {pending ? null : call.isError ? (
          <IconAlertCircle className="size-3.5 shrink-0 text-destructive" />
        ) : settled ? (
          <IconCheck className="size-3.5 shrink-0 text-success" />
        ) : null}
        <IconChevronRight
          className={`size-3 shrink-0 text-muted-foreground opacity-40 transition-transform duration-200 ${
            expanded ? 'rotate-90' : ''
          }`}
        />
      </button>
      {expanded && (
        <div className="ea-expand space-y-2 px-1.5 pb-1.5 pt-1">
          {call.input !== undefined && (
            <div>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Request
              </p>
              <pre className="ea-trace-pre max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md p-2 font-mono text-[11px]">
                {formatJson(call.input)}
              </pre>
            </div>
          )}
          <div>
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Response
            </p>
            <pre className="ea-trace-pre max-h-60 overflow-auto whitespace-pre-wrap break-all rounded-md p-2 font-mono text-[11px]">
              {pending ? 'Running…' : formatJson(result) || '—'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
