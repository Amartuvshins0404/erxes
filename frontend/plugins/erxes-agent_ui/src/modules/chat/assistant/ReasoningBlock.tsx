import { useState, type PropsWithChildren } from 'react';
import type { ReasoningMessagePartComponent } from '@assistant-ui/react';
import { IconBulb, IconChevronDown } from '@tabler/icons-react';
import { Collapsible } from 'erxes-ui';

// The model's thoughts, Grok-style: a quiet dimmed block with a bulb, grouped
// runs of reasoning collapsing behind one "Thought process" row.
export const ReasoningPart: ReasoningMessagePartComponent = ({ text }) => {
  if (!text?.trim()) return null;
  return (
    <div className="flex items-start gap-2 py-0.5 text-sm text-muted-foreground">
      <IconBulb className="mt-0.5 size-4 shrink-0" />
      <span className="italic whitespace-pre-wrap">{text}</span>
    </div>
  );
};

export const ReasoningGroup = ({
  children,
}: PropsWithChildren<{ startIndex: number; endIndex: number }>) => {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger className="group/trigger flex w-fit items-center gap-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <IconBulb className="size-4 shrink-0" />
        <span className="italic leading-none">Thought process</span>
        <IconChevronDown
          className={`size-4 shrink-0 transition-transform duration-200 ${
            open ? '' : '-rotate-90'
          }`}
        />
      </Collapsible.Trigger>
      <Collapsible.Content>
        <div className="flex flex-col gap-1 ps-6 pt-1 pb-2">{children}</div>
      </Collapsible.Content>
    </Collapsible>
  );
};
