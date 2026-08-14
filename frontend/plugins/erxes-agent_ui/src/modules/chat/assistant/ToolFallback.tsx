import { useEffect, useRef, useState } from 'react';
import {
  useScrollLock,
  type ToolCallMessagePartProps,
} from '@assistant-ui/react';
import {
  IconAlertTriangle,
  IconCheck,
  IconChevronDown,
  IconX,
} from '@tabler/icons-react';
import { ThinkingOrb, type OrbState } from 'thinking-orbs';
import { Collapsible } from 'erxes-ui';
import {
  isFailureResult,
  ToolArgsView,
  ToolResultView,
} from '~/modules/chat/assistant/toolValue';

// camelCase / plugin-prefixed operation names → plain words ("posOrdersSummary"
// → "pos orders summary").
export const humanizeToolName = (name: string): string =>
  name
    .replace(/^tool[-_]/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase();

const ANIMATION_MS = 200;

const formatDuration = (ms: number): string => {
  if (ms < 1000) return '<1s';
  const seconds = ms / 1000;
  if (seconds < 10) return `${(Math.floor(seconds * 10) / 10).toFixed(1)}s`;
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
};

// Elapsed time for one call — ticks while running, freezes on completion, and
// stays undefined for hydrated history (a call that never ran live shows no
// duration). Mirrors the official component's useToolCallElapsed, which this
// assistant-ui version doesn't ship yet.
const useToolElapsed = (running: boolean): number | undefined => {
  const startRef = useRef(0);
  const [elapsed, setElapsed] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (!running) return;
    if (!startRef.current) startRef.current = Date.now();
    const tick = () => setElapsed(Date.now() - startRef.current);
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [running]);
  return elapsed;
};

const StatusIcon = ({
  isError,
  running,
  runningState = 'working',
  incomplete,
  icon: Icon,
}: {
  isError?: boolean;
  running: boolean;
  runningState?: OrbState;
  incomplete?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) => {
  if (isError) return <IconX className="size-4 shrink-0 text-destructive" />;
  if (running) {
    // Inline thinking orb — the activity signal, state matched to the tool.
    return <ThinkingOrb state={runningState} size={20} />;
  }
  if (incomplete) {
    return (
      <IconAlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-500" />
    );
  }
  if (Icon) return <Icon className="size-4 shrink-0" />;
  return <IconCheck className="size-4 shrink-0" />;
};

// The shared collapsible shell — the official assistant-ui tool-fallback
// chrome (status icon, shimmer-while-running label, elapsed duration, chevron,
// scroll-locked collapsible) on erxes-ui primitives. `label` customizes the
// trigger line ("Searching …"); without `children` the row is not expandable.
export const ToolShell = ({
  toolName,
  label,
  icon,
  runningState,
  isError,
  running,
  incomplete,
  children,
}: {
  toolName: string;
  label?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  runningState?: OrbState;
  isError?: boolean;
  running: boolean;
  incomplete?: boolean;
  children?: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const lockScroll = useScrollLock(rootRef, ANIMATION_MS);
  const elapsed = useToolElapsed(running);

  const labelNode = label ?? (
    <>
      {running ? 'Using ' : 'Used '}
      <b className="font-medium">{humanizeToolName(toolName)}</b>
    </>
  );

  return (
    <Collapsible
      ref={rootRef}
      open={open}
      onOpenChange={(next) => {
        lockScroll();
        setOpen(next);
      }}
    >
      <Collapsible.Trigger className="group/trigger flex w-fit max-w-full items-center gap-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <StatusIcon
          isError={isError}
          running={running}
          runningState={runningState}
          incomplete={incomplete}
          icon={icon}
        />
        <span
          className={`min-w-0 break-words leading-5 ${
            running ? 'ea-shimmer-text' : ''
          }`}
        >
          {labelNode}
        </span>
        {elapsed !== undefined && (
          <span className="ea-text-11 shrink-0 tabular-nums text-muted-foreground">
            · {formatDuration(elapsed)}
          </span>
        )}
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

// Default renderer for tool calls without a dedicated UI — the collapsible
// shell with structured key-value args and a smart result view (tables for
// record lists, notes for empty/error envelopes), never a raw JSON dump.
export const ToolFallback = ({
  toolName,
  args,
  argsText,
  result,
  isError,
  status,
}: ToolCallMessagePartProps) => {
  const running = status?.type === 'running' || result === undefined;
  const failed = isError || isFailureResult(result);
  const cancelled =
    status?.type === 'incomplete' && status.reason === 'cancelled';
  const hasDetail =
    (args && Object.keys(args).length > 0) ||
    (!!argsText && argsText !== '{}') ||
    result !== undefined ||
    failed;

  const label = cancelled ? (
    <span className="line-through">
      Cancelled <b className="font-medium">{humanizeToolName(toolName)}</b>
    </span>
  ) : undefined;

  return (
    <ToolShell
      toolName={toolName}
      label={label}
      isError={failed}
      running={running}
      incomplete={status?.type === 'incomplete' && !cancelled}
    >
      {hasDetail ? (
        <>
          <ToolArgsView value={args} rawText={argsText} />
          {!cancelled && (
            <ToolResultView
              result={result}
              isError={isError}
              statusError={
                status?.type === 'incomplete' ? status.error : undefined
              }
            />
          )}
        </>
      ) : undefined}
    </ToolShell>
  );
};
