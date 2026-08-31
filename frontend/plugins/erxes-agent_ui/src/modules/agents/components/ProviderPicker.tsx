export interface IProviderOption {
  value: string;
  label: string;
  description: string;
  /** Model stored for a fresh entry; mirrors backend PROVIDER_DEFAULTS. */
  defaultModel: string;
}

/** Provider whitelist used by the settings connection form. */
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

/**
 * 2x2 grid of selectable provider cards, used by the settings connection
 * form. Each card shows the default model in parentheses next to the label
 * so it is never hidden which model a fresh entry will run.
 */
export const ProviderPicker = ({ value, onChange }: IProviderPickerProps) => (
  <div className="grid grid-cols-2 gap-2">
    {PROVIDER_OPTIONS.map((option) => {
      const selected = option.value === value;

      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={selected}
          className={`flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left text-[13px] transition-colors ${
            selected ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
          }`}
        >
          <span className="font-medium">
            {option.label}{' '}
            <span className="font-normal text-muted-foreground">
              ({option.defaultModel})
            </span>
          </span>
          <span className="text-xs text-muted-foreground">
            {option.description}
          </span>
        </button>
      );
    })}
  </div>
);
