import { IconSparkles } from '@tabler/icons-react';
import { Select, Spinner } from 'erxes-ui';

import type { IUseAgentsModelsResult } from '../hooks/useAgentsModels';
import { ProviderIcon } from './ProviderIcon';
import { getProviderLabel } from './ProviderPicker';

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
 * pick the first configured provider's default. Every entry leads with its
 * provider's brand mark — Radix renders the selected item's content in the
 * trigger, so the mark identifies the active choice there too.
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
        className="h-8 w-[160px] justify-between rounded-full text-[13px] md:w-[200px]"
        aria-label="Model"
      >
        {models.loading ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <Spinner className="size-3.5 shrink-0" />
            Model
          </span>
        ) : (
          <Select.Value placeholder="Model" />
        )}
      </Select.Trigger>
      <Select.Content className="max-h-72">
        <Select.Item value={AUTO_VALUE} className="text-[13px]">
          <span className="flex items-center gap-2">
            <IconSparkles
              className="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            {autoLabel}
          </span>
        </Select.Item>
        {models.providerModels.map((group) => (
          <Select.Group key={group.provider}>
            <Select.Separator />
            <Select.Label className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ProviderIcon provider={group.provider} className="size-3.5" />
                {getProviderLabel(group.provider)}
              </span>
            </Select.Label>
            {(group.models ?? []).map((model) => (
              <Select.Item
                key={`${group.provider}|${model}`}
                value={`${group.provider}|${model}`}
                className="text-[13px]"
              >
                <span className="flex items-center gap-2">
                  <ProviderIcon provider={group.provider} className="size-4" />
                  <span className="font-mono">{model}</span>
                </span>
              </Select.Item>
            ))}
          </Select.Group>
        ))}
      </Select.Content>
    </Select>
  );
};
