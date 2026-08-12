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
const humanizeToolName = (name: string): string =>
  name
    .replace(/^tool[-_]/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase();

// Default renderer for tool calls — the collapsible "Used tool" row from the
// assistant-ui ChatGPT clone: status icon + name + chevron, expanding to args
// and result. Each call is its own row, so a research-heavy turn reads as a
// tidy list instead of the old summarized activity line.
export const ToolFallback = ({
  toolName,
  argsText,
  result,
  isError,
  status,
}: ToolCallMessagePartProps) => {
  const [open, setOpen] = useState(false);
  const running = status?.type === 'running' || result === undefined;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger className="group/trigger flex w-fit items-center gap-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        {isError ? (
          <IconX className="size-4 shrink-0 text-destructive" />
        ) : running ? (
          <IconLoader2 className="size-4 shrink-0 animate-spin [animation-duration:0.6s]" />
        ) : status?.type === 'incomplete' ? (
          <IconAlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-500" />
        ) : (
          <IconCheck className="size-4 shrink-0" />
        )}
        <span className="leading-none">
          Used tool: <b className="font-medium">{humanizeToolName(toolName)}</b>
        </span>
        <IconChevronDown
          className={`size-4 shrink-0 transition-transform duration-200 ${
            open ? '' : '-rotate-90'
          }`}
        />
      </Collapsible.Trigger>
      <Collapsible.Content>
        <div className="flex flex-col gap-2 ps-6 pt-1 pb-2 text-sm">
          {argsText && (
            <pre className="rounded-md bg-muted/50 p-2.5 text-xs whitespace-pre-wrap text-foreground/90">
              {argsText}
            </pre>
          )}
          {result !== undefined && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Result:
              </p>
              <pre className="mt-1 rounded-md bg-muted/50 p-2.5 text-xs whitespace-pre-wrap text-foreground/90">
                {typeof result === 'string'
                  ? result
                  : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Collapsible.Content>
    </Collapsible>
  );
};
