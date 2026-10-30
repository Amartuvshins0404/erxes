import { Combobox, Command, Popover } from 'erxes-ui/components';
import { cn } from 'erxes-ui/lib';
import { useIcons } from 'erxes-ui/modules/icons/hooks/useIcons';
import { forwardRef, useState } from 'react';
import { IconComponent } from './IconComponent';

export const IconPicker = forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Combobox.TriggerBase> & {
    value?: string;
    onValueChange?: (value: string | null) => void;
  }
>(({ value, onValueChange, ...props }, ref) => {
  const { getIcons } = useIcons();
  const [_value, setValue] = useState(value);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Combobox.TriggerBase
        variant="ghost"
        size="icon"
        className="rounded-full px-2"
        ref={ref}
        {...props}
      >
        <IconComponent name={_value} />
      </Combobox.TriggerBase>

      <Combobox.Content className="w-64 min-w-64 rounded-2xl">
        <Command>
          <Command.Input placeholder="Search icon..." />
          <Command.List className="hide-scroll max-h-56 justify-center overflow-y-auto p-1 [&>div]:flex [&>div]:flex-wrap [&>div]:gap-1">
            {Object.entries(getIcons())
              .sort((a, b) => (a[0] === _value ? -1 : 1))
              .map(([key, Icon]) => (
                <Command.Item
                  key={key}
                  onSelect={() => {
                    setValue(key);
                    onValueChange?.(key);
                    setOpen(false);
                  }}
                  value={key}
                  className={cn(
                    'size-8 justify-center rounded-lg p-0',
                    _value === key && 'bg-primary/10 text-primary',
                  )}
                >
                  <Icon />
                </Command.Item>
              ))}
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
});
