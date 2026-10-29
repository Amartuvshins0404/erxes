import { IconCheck } from '@tabler/icons-react';
import { Button, cn } from 'erxes-ui';

import { ProviderIcon } from './ProviderIcon';

export interface IProviderOption {
  value: string;
  label: string;
  description: string;
  defaultModel: string;
}

export const PROVIDER_OPTIONS: IProviderOption[] = [
  {
    value: 'openai',
    label: 'OpenAI',
    description: 'GPT models',
    defaultModel: 'gpt-5.6-luna',
  },
  {
    value: 'grok',
    label: 'Grok',
    description: 'xAI models',
    defaultModel: 'grok-4.5',
  },
  {
    value: 'kimi',
    label: 'Kimi',
    description: 'Moonshot Kimi',
    defaultModel: 'kimi-k3',
  },
  {
    value: 'kimi-code',
    label: 'Kimi Code',
    description: 'Coding-focused Kimi',
    defaultModel: 'kimi-for-coding',
  },
];

export interface IProviderPickerProps {
  value: string;
  onChange: (provider: string) => void;
}

export const getProviderOption = (
  value: string,
): IProviderOption | undefined =>
  PROVIDER_OPTIONS.find((option) => option.value === value);

export const getProviderLabel = (value: string): string =>
  getProviderOption(value)?.label ?? value;

export const ProviderPicker = ({ value, onChange }: IProviderPickerProps) => (
  <div
    className="grid grid-cols-2 gap-2"
    role="group"
    aria-label="Provider"
  >
    {PROVIDER_OPTIONS.map((option) => {
      const selected = option.value === value;

      return (
        <Button
          key={option.value}
          variant="outline"
          onClick={() => onChange(option.value)}
          aria-pressed={selected}
          className={cn(
            'relative h-auto justify-start gap-3 whitespace-normal rounded-2xl border p-3 text-left font-normal',
            selected && 'border-primary bg-primary/5 hover:bg-primary/10',
          )}
        >
          <ProviderIcon provider={option.value} className="size-9" />
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium">
              {option.label}{' '}
              <span className="font-normal text-muted-foreground">
                ({option.defaultModel})
              </span>
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {option.description}
            </span>
          </span>
          {selected && (
            <IconCheck
              className="absolute right-2.5 top-2.5 size-4 text-primary"
              aria-hidden="true"
            />
          )}
        </Button>
      );
    })}
  </div>
);
