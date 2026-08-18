import { Badge, Button, Combobox, Command, Popover } from 'erxes-ui';
import { useState } from 'react';

export const SelectContractLabel = () => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string[]>();

  const LABELS = [
    {
      value: 'vip',
      label: 'VIP',
    },
    {
      value: 'important',
      label: 'Important',
    },
    {
      value: 'normal',
      label: 'Normal',
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Combobox.Trigger>
        {value?.map((v) => (
          <Badge key={v} variant="secondary">
            {v}
          </Badge>
        ))}
      </Combobox.Trigger>
      <Combobox.Content>
        <Command>
          <Command.Input />
          <Command.List>
            {LABELS.map((label) => (
              <Command.Item
                key={label.value}
                value={label.value}
                onSelect={() => {
                  setValue(
                    value?.includes(label.value)
                      ? value?.filter((v) => v !== label.value)
                      : [...(value || []), label.value],
                  );
                }}
              >
                {label.label}
                <Combobox.Check checked={value?.includes(label.value)} />
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
};
