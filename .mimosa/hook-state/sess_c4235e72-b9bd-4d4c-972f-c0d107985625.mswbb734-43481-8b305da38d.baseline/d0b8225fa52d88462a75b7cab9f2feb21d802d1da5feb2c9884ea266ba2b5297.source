import {
  AvatarProps,
  Button,
  Combobox,
  Command,
  Filter,
  Form,
  Popover,
  PopoverScoped,
  RecordTableInlineCell,
  cn,
  useFilterContext,
  useQueryState,
} from 'erxes-ui';
import { IconBuilding, IconPlus, IconUserCancel } from '@tabler/icons-react';
import {
  SelectClientContext,
  useSelectClientContext,
} from '../contexts/SelectClientContext';
import { ICVClient } from '../clientsTypes';
import { ClientsInline } from './ClientsInline';
import React from 'react';
import { useDebounce } from 'use-debounce';
import { useState } from 'react';
import { useClients } from '../hooks/useClients';
import { EnumCursorDirection } from 'erxes-ui';

const SelectClientProvider = ({
  children,
  mode = 'single',
  value,
  onValueChange,
  clients,
  setOpen,
  allowUnassigned,
}: {
  children: React.ReactNode;
  mode?: 'single' | 'multiple';
  value?: string[] | string;
  onValueChange?: (value: string[] | string | null) => void;
  clients?: ICVClient[];
  setOpen?: (open: boolean) => void;
  allowUnassigned?: boolean;
}) => {
  const [_clients, setClients] = useState<ICVClient[]>(clients || []);
  const isSingleMode = mode === 'single';

  const onSelect = (client: ICVClient | null) => {
    if (!client) {
      setClients([]);
      onValueChange?.(mode === 'single' ? null : []);
      setOpen?.(false);
      return;
    }
    if (isSingleMode) {
      setClients([client]);
      setOpen?.(false);
      return onValueChange?.(client._id);
    }
    const arrayValue = Array.isArray(value) ? value : [];

    const isClientSelected = arrayValue.includes(client._id);
    const newSelectedClientIds = isClientSelected
      ? arrayValue.filter((id) => id !== client._id)
      : [...arrayValue, client._id];

    setClients((prev) =>
      [...prev, client].filter((c) => newSelectedClientIds.includes(c._id)),
    );
    onValueChange?.(newSelectedClientIds);
  };

  return (
    <SelectClientContext.Provider
      value={{
        clientIds: !value ? [] : Array.isArray(value) ? value : [value],
        onSelect,
        clients: _clients,
        setClients,
        loading: _clients.length !== value?.length,
        allowUnassigned: allowUnassigned || false,
      }}
    >
      {children}
    </SelectClientContext.Provider>
  );
};

const SelectClientValue = ({
  placeholder,
  size,
}: {
  placeholder?: string;
  size?: AvatarProps['size'];
}) => {
  const { clientIds, clients, setClients, allowUnassigned } =
    useSelectClientContext();
  return (
    <ClientsInline
      clientIds={clientIds}
      clients={clients}
      updateClients={setClients}
      placeholder={placeholder}
      size={size}
      allowUnassigned={allowUnassigned}
    />
  );
};

const SelectClientCommandItem = ({ client }: { client: ICVClient }) => {
  const { onSelect, clientIds } = useSelectClientContext();

  return (
    <Command.Item
      value={client._id}
      onSelect={() => {
        onSelect(client);
      }}
    >
      <ClientsInline
        clients={[
          {
            ...client,
          },
        ]}
        placeholder="Unnamed client"
      />
      <Combobox.Check checked={clientIds.includes(client._id)} />
    </Command.Item>
  );
};

const SelectClientNoAssigneeItem = () => {
  const { onSelect, clientIds } = useSelectClientContext();
  const isNoAssigneeSelected =
    clientIds?.length === 1 && clientIds[0] === 'no-assignee';
  return (
    <Command.Item value="no-assignee" onSelect={() => onSelect(null)}>
      <ClientsInline
        clientIds={[]}
        placeholder="Unnamed client"
        allowUnassigned
      />
      <Combobox.Check checked={isNoAssigneeSelected} />
    </Command.Item>
  );
};

const SelectClientContent = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const { clientIds, clients, allowUnassigned } = useSelectClientContext();
  const { clients: fetchedClients, loading, handleFetchMore, totalCount } =
    useClients({
      variables: {
        filter: {
          name: debouncedSearch || undefined,
        },
      },
    });

  const allClients = fetchedClients || [];

  return (
    <Command shouldFilter={false}>
      <Command.Input
        value={search}
        onValueChange={setSearch}
        variant="secondary"
        wrapperClassName="flex-auto"
        focusOnMount
      />
      <Command.List className="max-h-[300px] overflow-y-auto">
        <Combobox.Empty loading={loading} />
        {clients.length > 0 && (
          <>
            {clients.map((client) => (
              <SelectClientCommandItem key={client._id} client={client} />
            ))}
            <Command.Separator className="my-1" />
          </>
        )}
        {!loading && allowUnassigned && <SelectClientNoAssigneeItem />}

        {!loading &&
          allClients
            .filter((client) => !clientIds.find((id) => id === client._id))
            .map((client) => (
              <SelectClientCommandItem key={client._id} client={client} />
            ))}

        <Combobox.FetchMore
          fetchMore={() => {
            handleFetchMore({
              direction: EnumCursorDirection.FORWARD,
            });
          }}
          currentLength={allClients.length}
          totalCount={totalCount || 0}
        />
      </Command.List>
    </Command>
  );
};

export const SelectClientFilterItem = ({
  value,
  label,
}: {
  value?: string;
  label?: string;
}) => {
  return (
    <Filter.Item value={value || 'client'}>
      <IconBuilding />
      {label || 'Client'}
    </Filter.Item>
  );
};

export const SelectClientFilterView = ({
  onValueChange,
  queryKey,
  mode = 'single',
}: {
  onValueChange?: (value: string[] | string | null) => void;
  queryKey?: string;
  mode?: 'single' | 'multiple';
}) => {
  const [client, setClient] = useQueryState<string[] | string>(
    queryKey || 'client',
  );
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey={queryKey || 'client'}>
      <SelectClientProvider
        mode={mode}
        value={client || (mode === 'single' ? '' : [])}
        onValueChange={(value) => {
          setClient(value as string[] | string);
          resetFilterState();
          onValueChange?.(value);
        }}
      >
        <SelectClientContent />
      </SelectClientProvider>
    </Filter.View>
  );
};

export const SelectClientFilterBar = ({
  iconOnly,
  onValueChange,
  queryKey,
  mode = 'single',
  label,
}: {
  iconOnly?: boolean;
  onValueChange?: (value: string[] | string | null) => void;
  queryKey?: string;
  mode?: 'single' | 'multiple';
  label?: string;
}) => {
  const [client, setClient] = useQueryState<string[] | string>(
    queryKey || 'client',
  );
  const [open, setOpen] = useState(false);

  if (!client) {
    return null;
  }

  return (
    <Filter.BarItem queryKey={queryKey || 'client'}>
      <Filter.BarName>
        <IconBuilding />
        {label ? label : !iconOnly && 'Client'}
      </Filter.BarName>
      <SelectClientProvider
        mode={mode}
        value={client || (mode === 'single' ? '' : [])}
        onValueChange={(value) => {
          if (value && value.length > 0) {
            setClient(value as string[] | string);
          } else {
            setClient(null);
          }
          onValueChange?.(value);
          setOpen(false);
        }}
      >
        <Popover open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <Filter.BarButton filterKey={queryKey || 'client'}>
              <SelectClientValue />
            </Filter.BarButton>
          </Popover.Trigger>
          <Combobox.Content>
            <SelectClientContent />
          </Combobox.Content>
        </Popover>
      </SelectClientProvider>
    </Filter.BarItem>
  );
};

export const SelectClientInlineCell = React.forwardRef<
  React.ComponentRef<typeof RecordTableInlineCell.Trigger>,
  Omit<React.ComponentProps<typeof SelectClientProvider>, 'children'> &
    React.ComponentProps<typeof RecordTableInlineCell.Trigger> & {
      scope?: string;
      placeholder?: string;
      size?: AvatarProps['size'];
    }
>(
  (
    {
      mode,
      value,
      onValueChange,
      clients,
      size = 'lg',
      scope,
      placeholder,
      className,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false);
    return (
      <SelectClientProvider
        mode={mode}
        value={value}
        onValueChange={onValueChange}
        clients={clients}
        setOpen={setOpen}
      >
        <PopoverScoped scope={scope} open={open} onOpenChange={setOpen}>
          <RecordTableInlineCell.Trigger
            ref={ref}
            {...props}
            className={cn(className, 'text-xs')}
          >
            <SelectClientValue placeholder={placeholder ?? ''} size={size} />
          </RecordTableInlineCell.Trigger>
          <RecordTableInlineCell.Content>
            <SelectClientContent />
          </RecordTableInlineCell.Content>
        </PopoverScoped>
      </SelectClientProvider>
    );
  },
);

SelectClientInlineCell.displayName = 'SelectClientInlineCell';

export const SelectClientFormItem = ({
  onValueChange,
  className,
  placeholder,
  ...props
}: Omit<React.ComponentProps<typeof SelectClientProvider>, 'children'> & {
  className?: string;
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <SelectClientProvider
      onValueChange={(value) => {
        onValueChange?.(value);
        props.mode !== 'multiple' && setOpen(false);
      }}
      {...props}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <Form.Control>
          <Combobox.Trigger className={cn('w-full shadow-xs', className)}>
            <SelectClientValue placeholder={placeholder} />
          </Combobox.Trigger>
        </Form.Control>

        <Combobox.Content>
          <SelectClientContent />
        </Combobox.Content>
      </Popover>
    </SelectClientProvider>
  );
};

export const SelectClientDetail = ({
  onValueChange,
  className,
  size = 'xl',
  placeholder,
  value,
  ...props
}: Omit<React.ComponentProps<typeof SelectClientProvider>, 'children'> & {
  className?: string;
  size?: 'lg' | 'sm' | 'xl' | 'default' | 'xs';
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <SelectClientProvider
      value={value}
      onValueChange={(value) => {
        onValueChange?.(value);
        setOpen(false);
      }}
      {...props}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          {!value ? (
            <Combobox.TriggerBase className="font-medium">
              Add Client <IconPlus />
            </Combobox.TriggerBase>
          ) : (
            <Button variant="ghost" className="w-full inline-flex">
              <SelectClientValue size={size} />
            </Button>
          )}
        </Popover.Trigger>
        <Combobox.Content>
          <SelectClientContent />
        </Combobox.Content>
      </Popover>
    </SelectClientProvider>
  );
};

export const SelectClientRoot = ({
  onValueChange,
  className,
  size,
  placeholder,
  scope,
  ...props
}: Omit<React.ComponentProps<typeof SelectClientProvider>, 'children'> & {
  className?: string;
  size?: 'lg' | 'sm' | 'xl' | 'default' | 'xs';
  placeholder?: string;
  scope?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <SelectClientProvider
      onValueChange={(value) => {
        onValueChange?.(value);
        setOpen(false);
      }}
      {...props}
    >
      <PopoverScoped open={open} onOpenChange={setOpen} scope={scope}>
        <Combobox.Trigger
          className={cn('w-full inline-flex', className)}
          variant="outline"
        >
          <SelectClientValue size={size} placeholder={placeholder} />
        </Combobox.Trigger>
        <Combobox.Content>
          <SelectClientContent />
        </Combobox.Content>
      </PopoverScoped>
    </SelectClientProvider>
  );
};

export const SelectClient = Object.assign(SelectClientRoot, {
  Provider: SelectClientProvider,
  Value: SelectClientValue,
  Content: SelectClientContent,
  CommandItem: SelectClientCommandItem,
  NoAssigneeItem: SelectClientNoAssigneeItem,
  FilterItem: SelectClientFilterItem,
  FilterView: SelectClientFilterView,
  FilterBar: SelectClientFilterBar,
  InlineCell: SelectClientInlineCell,
  FormItem: SelectClientFormItem,
  Detail: SelectClientDetail,
});

