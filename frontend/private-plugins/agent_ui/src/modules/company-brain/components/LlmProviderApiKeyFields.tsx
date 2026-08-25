import { useLazyQuery } from '@apollo/client';
import { IconCheck, IconKey, IconRefresh } from '@tabler/icons-react';
import {
  Button,
  Combobox,
  Command,
  Form,
  Input,
  Popover,
  Spinner,
} from 'erxes-ui';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import { Control, FieldPath, FieldValues, useWatch } from 'react-hook-form';
import { SecretInput } from '~/modules/components/SecretInput';
import { AGENT_MANAGED_LLM_MODELS } from '../graphql/llm';

export interface LlmProviderOption {
  value: string;
  label: string;
  defaultModel?: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  imageUrl?: string;
}

interface LlmModelOption {
  id: string;
  name: string;
}

interface ManagedLlmModelsResponse {
  agentManagedLlmModels: LlmModelOption[];
}

interface LlmProviderApiKeyFieldsProps<TFormValues extends FieldValues> {
  control: Control<TFormValues>;
  providerName: FieldPath<TFormValues>;
  apiKeyName: FieldPath<TFormValues>;
  modelName?: FieldPath<TFormValues>;
  providerOptions: readonly LlmProviderOption[];
  providerLabel?: string;
  modelLabel?: string;
  apiKeyLabel?: string;
  providerPlaceholder?: string;
  modelPlaceholder?: string;
  apiKeyPlaceholder?: string;
  disabled?: boolean;
  showApiKey?: boolean;
  onProviderChange?: (provider: string) => void;
}

interface LlmModelPickerProps {
  provider: string;
  apiKey: string;
  value: string;
  models: LlmModelOption[];
  loading: boolean;
  catalogReady: boolean;
  error: string;
  disabled?: boolean;
  placeholder: string;
  onValueChange: (model: string) => void;
  onRefresh: () => void;
}

const getInitials = (label: string) =>
  label
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const LlmModelPicker = ({
  provider,
  apiKey,
  value,
  models,
  loading,
  catalogReady,
  error,
  disabled,
  placeholder,
  onValueChange,
  onRefresh,
}: LlmModelPickerProps) => {
  const [open, setOpen] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);

  useEffect(() => {
    setManualOverride(false);
  }, [provider]);

  const manual = manualOverride || (catalogReady && models.length === 0);
  const selected = models.find((model) => model.id === value);
  const canLoad = !!provider && apiKey.trim().length >= 8 && !disabled;

  if (manual) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="provider/model-id"
            className="flex-1 font-mono text-sm"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canLoad || loading}
            onClick={() => {
              setManualOverride(false);
              onRefresh();
            }}
          >
            {loading ? (
              <Spinner
                className="size-4"
                containerClassName="w-auto flex-none"
              />
            ) : (
              <IconRefresh className="size-4" />
            )}
            Live models
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        {!error && catalogReady && models.length === 0 && (
          <p className="text-xs text-muted-foreground">
            The provider returned no models. Enter a model ID manually or
            refresh the live catalog.
          </p>
        )}
      </div>
    );
  }

  const triggerPlaceholder = !provider
    ? 'Choose a provider first'
    : apiKey.trim().length < 8
    ? 'Enter the API key to load models'
    : loading
    ? 'Loading live models…'
    : placeholder;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <Combobox.Trigger
            className="h-9 flex-1"
            disabled={
              disabled || loading || !catalogReady || models.length === 0
            }
          >
            <Combobox.Value
              value={selected?.name || value}
              placeholder={triggerPlaceholder}
              loading={loading}
            />
          </Combobox.Trigger>
          <Combobox.Content>
            <Command>
              <Command.Input placeholder="Search live models…" />
              <Command.List>
                <Combobox.Empty />
                {models.map((model) => (
                  <Command.Item
                    key={model.id}
                    value={`${model.name} ${model.id}`}
                    onSelect={() => {
                      onValueChange(model.id);
                      setOpen(false);
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      <span className="block truncate">{model.name}</span>
                      <span className="block truncate font-mono text-xs text-muted-foreground">
                        {model.id}
                      </span>
                    </span>
                    <Combobox.Check checked={model.id === value} />
                  </Command.Item>
                ))}
                <Command.Separator />
                <Command.Item
                  value="__manual_model__"
                  onSelect={() => {
                    setManualOverride(true);
                    setOpen(false);
                  }}
                >
                  Enter a model ID manually…
                </Command.Item>
              </Command.List>
            </Command>
          </Combobox.Content>
        </Popover>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canLoad || loading}
          onClick={onRefresh}
          aria-label="Refresh live models"
        >
          {loading ? (
            <Spinner className="size-4" containerClassName="w-auto flex-none" />
          ) : (
            <IconRefresh className="size-4" />
          )}
          Refresh
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {!error && catalogReady && (
        <p className="text-xs text-muted-foreground">
          Loaded live from the selected provider.
        </p>
      )}
    </div>
  );
};

export const LlmProviderApiKeyFields = <TFormValues extends FieldValues>({
  control,
  providerName,
  apiKeyName,
  modelName,
  providerOptions,
  providerLabel = 'Provider',
  modelLabel = 'Model',
  apiKeyLabel = 'API key',
  providerPlaceholder = 'Choose provider',
  modelPlaceholder = 'Choose a live model',
  apiKeyPlaceholder = 'Paste your API key',
  disabled = false,
  showApiKey = true,
  onProviderChange,
}: LlmProviderApiKeyFieldsProps<TFormValues>) => {
  const selectedValue = String(useWatch({ control, name: providerName }) || '');
  const apiKeyValue = String(useWatch({ control, name: apiKeyName }) || '');
  const selectedProvider = providerOptions.find(
    ({ value }) => value === selectedValue,
  );
  const [models, setModels] = useState<LlmModelOption[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const requestIdRef = useRef(0);
  const [loadModels, { loading: modelsLoading }] =
    useLazyQuery<ManagedLlmModelsResponse>(AGENT_MANAGED_LLM_MODELS, {
      fetchPolicy: 'no-cache',
    });

  const loadLiveModels = useCallback(async () => {
    if (!modelName || !selectedValue || apiKeyValue.trim().length < 8) {
      return;
    }

    const requestId = ++requestIdRef.current;
    setCatalogError('');

    try {
      const result = await loadModels({
        variables: {
          provider: selectedValue,
          apiKey: apiKeyValue.trim(),
        },
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setModels(result.data?.agentManagedLlmModels ?? []);
      setCatalogReady(true);
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setModels([]);
      setCatalogReady(true);
      setCatalogError(
        error instanceof Error
          ? error.message
          : 'Could not load the live model catalog',
      );
    }
  }, [apiKeyValue, loadModels, modelName, selectedValue]);

  useEffect(() => {
    requestIdRef.current += 1;
    setModels([]);
    setCatalogReady(false);
    setCatalogError('');

    if (!modelName || !selectedValue || apiKeyValue.trim().length < 8) {
      return;
    }

    const timer = window.setTimeout(() => {
      loadLiveModels();
    }, 700);

    return () => window.clearTimeout(timer);
  }, [apiKeyValue, loadLiveModels, modelName, selectedValue]);

  return (
    <div className="space-y-5">
      <Form.Field
        control={control}
        name={providerName}
        render={({ field }) => (
          <Form.Item>
            <Form.Label>{providerLabel}</Form.Label>
            <div
              role="listbox"
              aria-label={providerLabel}
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              {providerOptions.map((option) => {
                const selected = option.value === String(field.value || '');
                const ProviderIcon = option.icon;

                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    role="option"
                    aria-selected={selected}
                    disabled={disabled}
                    onClick={() => {
                      if (selected) {
                        return;
                      }

                      field.onChange(option.value);
                      onProviderChange?.(option.value);
                    }}
                    className={`relative h-auto min-h-[76px] justify-start gap-3 whitespace-normal p-3 text-left ${
                      selected
                        ? 'border-primary bg-primary/5 shadow-sm hover:bg-primary/10'
                        : 'bg-background hover:border-primary/50 hover:bg-muted/40'
                    }`}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted text-sm font-semibold text-foreground">
                      {option.imageUrl ? (
                        <img
                          src={option.imageUrl}
                          alt=""
                          className="size-6 object-contain"
                        />
                      ) : ProviderIcon ? (
                        <ProviderIcon className="size-5" />
                      ) : (
                        getInitials(option.label)
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {option.label}
                      </span>
                      <span className="block truncate font-mono text-[11px] text-muted-foreground">
                        {option.defaultModel ||
                          option.description ||
                          providerPlaceholder}
                      </span>
                    </span>
                    {selected && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <IconCheck className="size-3" />
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
            <Form.Message />
          </Form.Item>
        )}
      />

      {showApiKey && (
        <Form.Field
          control={control}
          name={apiKeyName}
          render={({ field }) => (
            <Form.Item>
              <Form.Label>
                {selectedProvider
                  ? `${selectedProvider.label} ${apiKeyLabel}`
                  : apiKeyLabel}
              </Form.Label>
              <Form.Control>
                <div className="relative">
                  <IconKey className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                  <SecretInput
                    {...field}
                    value={String(field.value || '')}
                    placeholder={apiKeyPlaceholder}
                    className="pl-9"
                    autoComplete="off"
                    disabled={disabled}
                  />
                </div>
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
      )}

      {modelName && (
        <Form.Field
          control={control}
          name={modelName}
          render={({ field }) => (
            <Form.Item>
              <Form.Label>{modelLabel}</Form.Label>
              <LlmModelPicker
                provider={selectedValue}
                apiKey={apiKeyValue}
                value={String(field.value || '')}
                models={models}
                loading={modelsLoading}
                catalogReady={catalogReady}
                error={catalogError}
                disabled={disabled}
                placeholder={modelPlaceholder}
                onValueChange={field.onChange}
                onRefresh={loadLiveModels}
              />
              <Form.Message />
            </Form.Item>
          )}
        />
      )}
    </div>
  );
};
