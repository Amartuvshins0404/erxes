import { IconChevronDown } from '@tabler/icons-react';
import { Select, Spinner } from 'erxes-ui';

import type { IUseAgentsModelsResult } from '../hooks/useAgentsModels';

/** Human label for a provider value (`openai` -> `OpenAI`). */
const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  grok: 'Grok',
  kimi: 'Kimi',
  'kimi-code': 'Kimi Code',
};

export interface IModelPickerProps {
  models: IUseAgentsModelsResult;
  /** Selected `provider|model` value; '' means server default (Auto). */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /**
   * Model the server default (Auto) actually runs — the first configured
   * provider's stored model. Shown in the Auto entry's label so the
   * default is never hidden.
   */
  autoModel?: string;
}

const VALUE_SEPARATOR = '|';
/** Radix Select items reject empty values, so "Auto" uses a sentinel. */
const AUTO_VALUE = '__auto__';

export const modelSelectionValue = (provider: string, model: string) =>
  provider && model ? `${provider}${VALUE_SEPARATOR}${model}` : '';

/**
 * Chat model picker: one grouped list of every configured provider's models
 * (fetched server-side), plus an implicit "Auto" entry that lets the server
 * pick the first configured provider's default.
 */
export const ModelPicker = ({
  models,
  value,
  onChange,
  disabled = false,
  autoModel,
}: IModelPickerProps) => {
  const hasGroups = models.providerModels.length > 0;
  const autoLabel = autoModel ? `Auto (${autoModel})` : 'Auto (server default)';

  return (
    <Select
      value={value || AUTO_VALUE}
      onValueChange={(next) => onChange(next === AUTO_VALUE ? '' : next)}
      disabled={disabled || models.loading || !hasGroups}
    >
      <Select.Trigger
        className="h-8 w-[150px] justify-between rounded-full text-[13px] md:w-[190px]"
        aria-label="Model"
      >
        <div className="flex min-w-0 items-center gap-1.5">
          {models.loading ? (
            <Spinner className="size-3.5" />
          ) : (
            <IconChevronDown className="size-3.5 text-muted-foreground" />
          )}
          <Select.Value placeholder="Model" />
        </div>
      </Select.Trigger>
      <Select.Content className="max-h-72">
        <Select.Item value={AUTO_VALUE}>{autoLabel}</Select.Item>
        {models.providerModels.map((group) => (
          <Select.Group key={group.provider}>
            <Select.Label>
              {PROVIDER_LABELS[group.provider] ?? group.provider}
            </Select.Label>
            {(group.models ?? []).map((model) => (
              <Select.Item
                key={`${group.provider}|${model}`}
                value={`${group.provider}|${model}`}
              >
                {model}
              </Select.Item>
            ))}
          </Select.Group>
        ))}
      </Select.Content>
    </Select>
  );
};
