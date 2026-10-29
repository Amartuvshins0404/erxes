import { IconArrowLeft, IconChevronRight } from '@tabler/icons-react';
import { Button, Combobox, Command, Popover, Spinner } from 'erxes-ui';
import { useAtom } from 'jotai';
import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  IAgentsModelOption,
  IUseAgentsModelsResult,
} from '../hooks/useAgentsModels';
import { agentRecentModelsState } from '../states/agentRecentModelsState';
import { ProviderIcon } from './ProviderIcon';

interface IModelChoice {
  connectionId: string;
  model: string;
}

interface IModelGroup {
  heading: string;
  choices: IModelChoice[];
}

export interface IModelPickerProps {
  models: IUseAgentsModelsResult;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onVerifyModel?: (
    connectionId: string,
    model: string,
  ) => Promise<string | null>;
  onSetDefault?: (connectionId: string) => Promise<void>;
}

const VALUE_SEPARATOR = '|';
const RECENT_LIMIT = 3;
const FALLBACK_RECOMMENDED_LIMIT = 4;
const MODEL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,127}$/;
export const modelSelectionValue = (connectionId: string, model: string) =>
  connectionId && model ? `${connectionId}${VALUE_SEPARATOR}${model}` : '';
export const parseModelSelection = (value: string): IModelChoice | null => {
  const index = value.indexOf(VALUE_SEPARATOR);
  return index === -1
    ? null
    : { connectionId: value.slice(0, index), model: value.slice(index + 1) };
};
const choiceValue = (choice: IModelChoice) =>
  modelSelectionValue(choice.connectionId, choice.model);

const rowClassName =
  'h-9 gap-3 rounded-md px-3 text-[13px] data-[selected=true]:bg-muted';
const groupClassName =
  'p-0 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:text-muted-foreground';

export const ModelPicker = ({
  models,
  value,
  onChange,
  disabled = false,
  onVerifyModel,
  onSetDefault,
}: IModelPickerProps) => {
  const [open, setOpen] = useState(false);
  const [browse, setBrowse] = useState(false);
  const [activeId, setActiveId] = useState('');
  const [search, setSearch] = useState('');
  const [verifying, setVerifying] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState(false);
  const commandRef = useRef<HTMLDivElement>(null);
  const [recentModels, setRecentModels] = useAtom(agentRecentModelsState);
  const recentList: unknown[] = Array.isArray(recentModels) ? recentModels : [];
  const selected = parseModelSelection(value);
  const selectedId = selected?.connectionId ?? '';
  const selectedModel = selected?.model ?? '';
  const searching = search.trim().length > 0;
  const showCatalog = browse || searching;

  const catalogs = useMemo(
    () =>
      new Map(
        models.providerModels.map((group) => [group.connectionId, group]),
      ),
    [models.providerModels],
  );
  const serverDefault =
    models.providerModels.find((group) => group.isDefault) ??
    models.providerModels[0];
  const inUseId = selectedId || serverDefault?.connectionId || '';
  const displayNames = useMemo(
    () =>
      new Map(
        models.providerModels.flatMap((group) =>
          group.models.flatMap((model) =>
            model.name
              ? [
                  [
                    modelSelectionValue(group.connectionId, model.id),
                    model.name,
                  ],
                ]
              : [],
          ),
        ),
      ),
    [models.providerModels],
  );
  const nameOf = (choice: IModelChoice) =>
    displayNames.get(choiceValue(choice)) ?? choice.model;
  const connectionNameOf = (connectionId: string) =>
    catalogs.get(connectionId)?.connectionName ?? connectionId;
  const describeChoice = (choice: IModelChoice) =>
    `${connectionNameOf(choice.connectionId)} · ${nameOf(choice)}`;
  const activeCatalog = catalogs.get(activeId);
  const activeModels: IAgentsModelOption[] = activeCatalog?.models ?? [];
  const toChoice = (model: IAgentsModelOption): IModelChoice => ({
    connectionId: activeId,
    model: model.id,
  });

  const catalogUnavailable =
    !models.loading && (!activeCatalog || Boolean(activeCatalog.error));
  const typedId = search.trim();
  const customId =
    onVerifyModel &&
    activeId &&
    MODEL_ID_PATTERN.test(typedId) &&
    !activeModels.some((model) => model.id === typedId)
      ? typedId
      : '';
  const customKey = modelSelectionValue(activeId, customId);
  const recentForConnection = (keep: (model: string, key: string) => boolean) =>
    Array.from(new Set([value, ...recentList]))
      .flatMap((key) => {
        if (typeof key !== 'string') return [];
        const choice = parseModelSelection(key);
        return choice?.connectionId === activeId &&
          choice.connectionId &&
          keep(choice.model, key)
          ? [choice]
          : [];
      })
      .slice(0, RECENT_LIMIT);

  const groups = ((): IModelGroup[] => {
    if (!activeId) return [];

    if (showCatalog) {
      const terms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
      const matches = activeModels.filter((model) => {
        const searchable = `${model.name ?? ''} ${model.id} ${
          model.family
        }`.toLowerCase();
        return terms.every((term) => searchable.includes(term));
      });
      return [
        {
          heading: 'Recommended',
          choices: matches.filter((model) => model.recommended).map(toChoice),
        },
        {
          heading: 'Others',
          choices: matches.filter((model) => !model.recommended).map(toChoice),
        },
      ];
    }

    if (catalogUnavailable) {
      return [{ heading: 'Recent', choices: recentForConnection(() => true) }];
    }

    const recommended = activeModels.some((model) => model.recommended)
      ? activeModels.filter((model) => model.recommended)
      : activeModels.slice(0, FALLBACK_RECOMMENDED_LIMIT);
    const recommendedIds = new Set(recommended.map((model) => model.id));
    const listedIds = new Set(activeModels.map((model) => model.id));
    const recent = recentForConnection(
      (model, key) =>
        (listedIds.has(model) || key === value) && !recommendedIds.has(model),
    );

    return [
      { heading: 'Recent', choices: recent },
      { heading: 'Recommended', choices: recommended.map(toChoice) },
    ];
  })().filter((group) => group.choices.length > 0);

  const visibleValues = groups.flatMap((group) =>
    group.choices.map(choiceValue),
  );

  const verifyRequest = useRef(0);
  const cancelVerify = () => {
    verifyRequest.current += 1;
    setVerifying('');
  };
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    cancelVerify();
    if (next) {
      setActiveId('');
      setBrowse(false);
      setSearch('');
      setVerifyError(null);
    }
  };
  const select = (next: string) => {
    if (next)
      setRecentModels((previous) =>
        Array.from(
          new Set([
            next,
            ...(Array.isArray(previous)
              ? previous.filter((item) => typeof item === 'string')
              : []),
          ]),
        ).slice(0, 6),
      );
    cancelVerify();
    onChange(next);
    setOpen(false);
  };

  useEffect(() => {
    if (open && !activeId) commandRef.current?.focus();
  }, [open, activeId]);

  const activeLabel = activeCatalog?.connectionName ?? '';
  const navigateConnection = (connectionId: string) => {
    cancelVerify();
    setActiveId(connectionId);
    setBrowse(false);
    setSearch('');
    setVerifyError(null);
  };

  const knownValues = new Set([value, ...recentList]);
  const choose = async (connectionId: string, model: string) => {
    const key = modelSelectionValue(connectionId, model);
    if (!onVerifyModel || knownValues.has(key)) {
      select(key);
      return;
    }
    if (verifying) return;
    const request = ++verifyRequest.current;
    setVerifying(key);
    setVerifyError(null);
    const error = await onVerifyModel(connectionId, model).catch(
      (failure: unknown) =>
        failure instanceof Error
          ? failure.message
          : 'Could not check this model.',
    );
    if (request !== verifyRequest.current) return;
    setVerifying('');
    if (error) {
      setVerifyError(error);
      return;
    }
    select(key);
  };

  const handleSetDefault = async () => {
    if (!onSetDefault || !activeId || settingDefault) return;
    setSettingDefault(true);
    try {
      await onSetDefault(activeId);
    } finally {
      setSettingDefault(false);
    }
  };

  const renderChoice = (choice: IModelChoice) => {
    const key = choiceValue(choice);
    return (
      <Command.Item
        key={key}
        value={key}
        onSelect={() => void choose(choice.connectionId, choice.model)}
        disabled={Boolean(verifying) && verifying !== key}
        className={rowClassName}
      >
        {verifying === key && <Spinner className="size-3.5 shrink-0" />}
        <span className="min-w-0 flex-1 truncate" title={choice.model}>
          {verifying === key ? (
            `Checking ${nameOf(choice)}…`
          ) : nameOf(choice) === choice.model ? (
            choice.model
          ) : (
            <>
              {nameOf(choice)}
              <span className="ml-1.5 text-[11px] text-muted-foreground">
                {choice.model}
              </span>
            </>
          )}
        </span>
        <Combobox.Check
          checked={value === key}
          className="shrink-0 text-foreground"
        />
      </Command.Item>
    );
  };

  const triggerCatalog = catalogs.get(selectedId) ?? serverDefault;
  const triggerChoice = selectedModel
    ? { connectionId: selectedId, model: selectedModel }
    : undefined;
  const triggerLabel = triggerChoice
    ? nameOf(triggerChoice)
    : triggerCatalog?.connectionName ?? 'Default model';
  const triggerTitle = triggerChoice
    ? describeChoice(triggerChoice)
    : triggerCatalog
    ? `${triggerCatalog.connectionName} (saved default)`
    : undefined;
  const statusClassName = 'px-3 py-3 text-xs leading-5 text-muted-foreground';
  const connectionStatus = (() => {
    if (!activeId) return null;
    if (verifyError) {
      return (
        <p role="status" className={`${statusClassName} text-destructive`}>
          {verifyError}
        </p>
      );
    }
    if (models.loading && !activeCatalog) {
      return (
        <div
          role="status"
          className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground"
        >
          <Spinner className="size-3.5" />
          Loading models…
        </div>
      );
    }
    if (!activeCatalog) {
      return (
        <p role="status" className={statusClassName}>
          Model list unavailable
          {onVerifyModel ? '; type a model id to use one.' : '.'}
        </p>
      );
    }
    if (activeCatalog.error) {
      return (
        <p role="status" className={statusClassName}>
          {activeCatalog.error}
        </p>
      );
    }
    if (searching && visibleValues.length === 0 && !customId) {
      return (
        <div
          role="status"
          className="px-3 py-5 text-center text-xs text-muted-foreground"
        >
          No matching models.
        </div>
      );
    }
    if (activeModels.length === 0) {
      return (
        <p role="status" className={statusClassName}>
          No usable chat models are listed for this connection.
        </p>
      );
    }
    return null;
  })();

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <Combobox.Trigger
        variant="ghost"
        className="h-8 min-w-0 max-w-[200px] flex-1 justify-between rounded-md px-2 text-[13px]"
        disabled={disabled}
        aria-label="Model"
        title={triggerTitle}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {triggerCatalog && (
            <ProviderIcon
              provider={triggerCatalog.provider}
              variant="plain"
              className="size-4 shrink-0"
            />
          )}
          <span className="truncate">{triggerLabel}</span>
        </span>
      </Combobox.Trigger>
      <Combobox.Content
        className="w-80 min-w-0 max-w-[calc(100vw-24px)] overflow-hidden rounded-lg"
        collisionPadding={12}
        onOpenAutoFocus={(event) => {
          if (!activeId) {
            event.preventDefault();
            commandRef.current?.focus();
          }
        }}
        aria-label={activeId ? `${activeLabel} models` : 'Choose a connection'}
      >
        <Command
          ref={commandRef}
          key={activeId || 'connections'}
          label={activeId ? 'Search models' : 'Connections'}
          defaultValue={
            activeId
              ? visibleValues.includes(value)
                ? value
                : visibleValues[0] ?? ''
              : inUseId || 'workspace-default'
          }
          shouldFilter={false}
        >
          {activeId ? (
            <>
              <div className="flex h-11 items-center justify-between gap-2 border-b px-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 rounded-md text-muted-foreground"
                    onClick={() => navigateConnection('')}
                    aria-label="Back to connections"
                  >
                    <IconArrowLeft className="size-4" />
                  </Button>
                  <span className="truncate text-[13px] font-medium">
                    {activeLabel}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {browse && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs font-normal text-muted-foreground"
                      onClick={() => {
                        setBrowse(false);
                        setSearch('');
                      }}
                    >
                      Show less
                    </Button>
                  )}
                  {activeCatalog?.isDefault ? (
                    <span className="px-2 text-[11px] text-muted-foreground">
                      Default
                    </span>
                  ) : (
                    onSetDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs font-normal text-muted-foreground"
                        disabled={settingDefault}
                        onClick={() => void handleSetDefault()}
                      >
                        {settingDefault ? (
                          <Spinner className="size-3.5" />
                        ) : (
                          'Make default'
                        )}
                      </Button>
                    )
                  )}
                </div>
              </div>
              <Command.Input
                placeholder="Find a model…"
                aria-label="Search models"
                value={search}
                onValueChange={(next) => {
                  cancelVerify();
                  setSearch(next);
                  setVerifyError(null);
                }}
                variant="primary"
                className="h-10 text-[13px] font-normal placeholder:text-muted-foreground"
                wrapperClassName="px-4"
                focusOnMount
              />
            </>
          ) : (
            <div className="px-4 pb-1 pt-3 text-[11px] font-medium text-muted-foreground">
              Connection
            </div>
          )}
          <Command.List className="m-0 max-h-[min(320px,45vh)] p-1.5">
            {!activeId && (
              <>
                {models.providerModels.map((group) => (
                  <Command.Item
                    key={group.connectionId}
                    value={group.connectionId}
                    onSelect={() => navigateConnection(group.connectionId)}
                    className="h-10 gap-3 rounded-md px-3 text-[13px] data-[selected=true]:bg-muted"
                  >
                    <ProviderIcon
                      provider={group.provider}
                      variant="plain"
                      className="size-4 shrink-0"
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {group.connectionName}
                      {group.scope === 'personal' && (
                        <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                          Personal
                        </span>
                      )}
                    </span>
                    {inUseId === group.connectionId ? (
                      <span className="text-[11px] text-muted-foreground">
                        In use
                      </span>
                    ) : (
                      group.error && (
                        <span className="text-[11px] text-muted-foreground">
                          Unavailable
                        </span>
                      )
                    )}
                    <IconChevronRight
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </Command.Item>
                ))}
                <Command.Separator className="mx-1 my-1.5" />
                <Command.Item
                  value="workspace-default"
                  onSelect={() => select('')}
                  className="h-10 gap-3 rounded-md px-3 text-xs text-muted-foreground data-[selected=true]:bg-muted"
                >
                  <span className="shrink-0">Use saved default</span>
                  {serverDefault && (
                    <span
                      className="ml-auto truncate text-[11px]"
                      title={serverDefault.connectionName}
                    >
                      {serverDefault.connectionName}
                    </span>
                  )}
                  <Combobox.Check
                    checked={!value}
                    className="text-foreground"
                  />
                </Command.Item>
                {models.loading && (
                  <div
                    role="status"
                    className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground"
                  >
                    <Spinner className="size-3.5" />
                    Loading your models…
                  </div>
                )}
                {!models.loading && models.error && (
                  <p role="status" className={statusClassName}>
                    Model list unavailable. Your saved default is still
                    available.
                  </p>
                )}
              </>
            )}
            {groups.map((group) => (
              <Command.Group
                key={group.heading}
                heading={group.heading}
                className={groupClassName}
              >
                {group.choices.map(renderChoice)}
              </Command.Group>
            ))}
            {customId && (
              <Command.Group heading="Custom model" className={groupClassName}>
                <Command.Item
                  value={`verify:${customId}`}
                  onSelect={() => void choose(activeId, customId)}
                  disabled={Boolean(verifying)}
                  className={rowClassName}
                >
                  {verifying === customKey && (
                    <Spinner className="size-3.5 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 truncate" title={customId}>
                    {verifying === customKey
                      ? `Checking "${customId}"…`
                      : `Use "${customId}"`}
                  </span>
                </Command.Item>
              </Command.Group>
            )}
            {connectionStatus}
          </Command.List>
          {activeId && !showCatalog && activeModels.length > 0 && (
            <div className="border-t p-1.5">
              <Button
                variant="ghost"
                className="h-8 w-full justify-between rounded-md px-3 text-xs font-normal text-muted-foreground"
                onClick={() => setBrowse(true)}
              >
                Browse all models <IconChevronRight className="size-3.5" />
              </Button>
            </div>
          )}
        </Command>
      </Combobox.Content>
    </Popover>
  );
};
