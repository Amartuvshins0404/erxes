import { IconBulb } from '@tabler/icons-react';
import { Select } from 'erxes-ui';

import type { IAgentsThinkingLevel } from '../hooks/useAgentsChat';

const THINKING_OPTIONS: { value: IAgentsThinkingLevel; label: string }[] = [
  { value: 'off', label: 'Thinking: off' },
  { value: 'minimal', label: 'Thinking: minimal' },
  { value: 'low', label: 'Thinking: low' },
  { value: 'medium', label: 'Thinking: medium' },
  { value: 'high', label: 'Thinking: high' },
];

export interface IThinkingPickerProps {
  value: IAgentsThinkingLevel;
  onChange: (level: IAgentsThinkingLevel) => void;
  disabled?: boolean;
}

/** Per-turn thinking depth; mapped to each provider's native option. */
export const ThinkingPicker = ({
  value,
  onChange,
  disabled = false,
}: IThinkingPickerProps) => {
  const label =
    THINKING_OPTIONS.find((option) => option.value === value)?.label ??
    'Thinking';

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger
        className="h-8 w-[124px] justify-between rounded-full text-[13px] md:w-[150px]"
        aria-label="Thinking level"
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <IconBulb className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
        </div>
      </Select.Trigger>
      <Select.Content>
        {THINKING_OPTIONS.map((option) => (
          <Select.Item key={option.value} value={option.value}>
            {option.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
};
