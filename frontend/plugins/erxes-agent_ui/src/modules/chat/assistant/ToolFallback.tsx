import { useState } from 'react';
import type { ToolCallMessagePartProps } from '@assistant-ui/react';
import {
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconLoader2,
  IconX,
} from '@tabler/icons-react';
import { Collapsible } from 'erxes-ui';

// camelCase / plugin-prefixed operation names → plain words ("posOrdersSummary"
// → "pos orders summary").
export const humanizeToolName = (name: string): string =>
  name
    .replace(/^tool[-_]/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase();

const TRUNCATE_AT = 600;

// JSON payload with a length cap — a tool result is evidence, not a wall of
// text. Long payloads collapse behind an expand toggle.
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

const toText = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value, null, 2);

// The shared collapsible shell: status icon + "Used tool: name" + chevron.
export const ToolShell = ({
  toolName,
  isError,
  running,
  incomplete,
  children,
}: {
  toolName: string;
  isError?: boolean;
  running: boolean;
  incomplete?: boolean;
  children?: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger className="group/trigger flex w-fit items-center gap-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        {isError ? (
          <IconX className="size-4 shrink-0 text-destructive" />
        ) : running ? (
          <IconLoader2 className="size-4 shrink-0 animate-spin [animation-duration:0.6s]" />
        ) : incomplete ? (
          <IconAlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-500" />
        ) : (
          <IconCheck className="size-4 shrink-0" />
        )}
        <span className="leading-none">
          Used tool: <b className="font-medium">{humanizeToolName(toolName)}</b>
        </span>
        {children !== undefined && (
          <IconChevronDown
            className={`size-4 shrink-0 transition-transform duration-200 ${
              open ? '' : '-rotate-90'
            }`}
          />
        )}
      </Collapsible.Trigger>
      {children !== undefined && (
        <Collapsible.Content>
          <div className="flex flex-col gap-2 ps-6 pt-1 pb-2 text-sm">
            {children}
          </div>
        </Collapsible.Content>
      )}
    </Collapsible>
  );
};

// Default renderer for tool calls without a dedicated UI — collapsible row
// with capped args/result blocks (never a full JSON dump).
export const ToolFallback = ({
  toolName,
  argsText,
  result,
  isError,
  status,
}: ToolCallMessagePartProps) => {
  const running = status?.type === 'running' || result === undefined;
  return (
    <ToolShell
      toolName={toolName}
      isError={isError}
      running={running}
      incomplete={status?.type === 'incomplete'}
    >
      {argsText ? <JsonBlock value={argsText} /> : undefined}
      {result !== undefined ? (
        <div>
          <p className="text-xs font-medium text-muted-foreground">Result:</p>
          <div className="mt-1">
            <JsonBlock value={toText(result)} />
          </div>
        </div>
      ) : undefined}
    </ToolShell>
  );
};
