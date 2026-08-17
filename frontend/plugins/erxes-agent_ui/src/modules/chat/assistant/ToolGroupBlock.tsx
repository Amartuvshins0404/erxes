import { useState, type PropsWithChildren } from 'react';
import { useMessageRuntime } from '@assistant-ui/react';
import type { ToolCallMessagePart } from '@assistant-ui/react';
import {
  IconChevronDown,
  IconLoader2,
  IconTools,
} from '@tabler/icons-react';
import { Collapsible } from 'erxes-ui';
import { humanizeToolName } from '~/modules/chat/assistant/ToolFallback';

// Consecutive tool calls collapse into one summary row — "Ran 3 searches",
// "Fetched 4 pages", "Used 5 tools" — expanding to the individual fallback
// rows. A run of identical calls no longer floods the conversation.
export const ToolGroupBlock = ({
  startIndex,
  endIndex,
  children,
}: PropsWithChildren<{ startIndex: number; endIndex: number }>) => {
  const [open, setOpen] = useState(false);
  const runtime = useMessageRuntime();

  const parts = runtime
    .getState()
    .content.slice(startIndex, endIndex + 1)
    .filter(
      (p): p is ToolCallMessagePart => p.type === 'tool-call',
    );
  const count = endIndex - startIndex + 1;
  const running = parts.some((p) => p.result === undefined);
  const names = new Set(parts.map((p) => p.toolName));

  const label = (() => {
    if (names.size === 1) {
      const [name] = names;
      const verb =
        name === 'webSearch'
          ? count === 1
            ? 'Ran 1 search'
            : `Ran ${count} searches`
          : name === 'fetchUrl'
          ? count === 1
            ? 'Fetched 1 page'
            : `Fetched ${count} pages`
          : `Used ${humanizeToolName(name ?? 'tool')} ×${count}`;
      return verb;
    }
    return `Used ${count} tools`;
  })();

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger className="group/trigger flex w-fit items-center gap-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        {running ? (
          <IconLoader2 className="size-4 shrink-0 animate-spin [animation-duration:0.6s]" />
        ) : (
          <IconTools className="size-4 shrink-0" />
        )}
        <span className="leading-none">{label}</span>
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
