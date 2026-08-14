import { useRef, useState, type PropsWithChildren } from 'react';
import { useMessageRuntime, useScrollLock } from '@assistant-ui/react';
import type { ToolCallMessagePart } from '@assistant-ui/react';
import {
  IconChevronDown,
  IconLoader2,
  IconTools,
} from '@tabler/icons-react';
import { Collapsible } from 'erxes-ui';
import { humanizeToolName } from '~/modules/chat/assistant/ToolFallback';

// Consecutive tool calls collapse into one summary row — "Ran 3 searches",
// "Fetched 4 pages", "Used 5 tools" — expanding to the individual rows. A run
// of identical calls no longer floods the conversation. The chrome follows the
// official assistant-ui tool-group (ghost variant): shimmer while any call
// runs, scroll-locked expand/collapse.
export const ToolGroupBlock = ({
  startIndex,
  endIndex,
  children,
}: PropsWithChildren<{ startIndex: number; endIndex: number }>) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const lockScroll = useScrollLock(rootRef, 200);
  const runtime = useMessageRuntime();

  const parts = runtime
    .getState()
    .content.slice(startIndex, endIndex + 1)
    .filter(
      (p): p is ToolCallMessagePart => p.type === 'tool-call',
    );
  const count = endIndex - startIndex + 1;
  const running = parts.some((p) => p.result === undefined);
  // A call "failed" when the part errored OR returned a structured failure
  // envelope ({success:false} from erxes operations, {error:true} soft errors).
  const failed = parts.some((p) => {
    if (p.isError) return true;
    const result = p.result as
      | { success?: unknown; error?: unknown }
      | undefined;
    return (
      !!result &&
      typeof result === 'object' &&
      (result.success === false || result.error === true)
    );
  });
  const names = new Set(parts.map((p) => p.toolName));

  const label = (() => {
    if (names.size === 1) {
      const [name] = names;
      const verb =
        name === 'webSearch'
          ? count === 1
            ? running
              ? 'Searching the web'
              : 'Ran 1 search'
            : running
            ? 'Running searches'
            : `Ran ${count} searches`
          : name === 'fetchUrl'
          ? count === 1
            ? running
              ? 'Fetching a page'
              : 'Fetched 1 page'
            : running
            ? 'Fetching pages'
            : `Fetched ${count} pages`
          : `${running ? 'Using' : 'Used'} ${humanizeToolName(
              name ?? 'tool',
            )} ×${count}`;
      return verb;
    }
    return `${running ? 'Using' : 'Used'} ${count} tools`;
  })();

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
        {running ? (
          <IconLoader2 className="size-4 shrink-0 animate-spin [animation-duration:0.6s]" />
        ) : failed ? (
          <IconTools className="size-4 shrink-0 text-amber-600 dark:text-amber-500" />
        ) : (
          <IconTools className="size-4 shrink-0" />
        )}
        <span className={`leading-5 ${running ? 'ea-shimmer-text' : ''}`}>
          {label}
        </span>
        <IconChevronDown
          className={`size-4 shrink-0 transition-transform duration-200 ${
            open ? '' : '-rotate-90'
          }`}
        />
      </Collapsible.Trigger>
      <Collapsible.Content>
        <div className="flex flex-col ps-4 pt-1 pb-1">{children}</div>
      </Collapsible.Content>
    </Collapsible>
  );
};
