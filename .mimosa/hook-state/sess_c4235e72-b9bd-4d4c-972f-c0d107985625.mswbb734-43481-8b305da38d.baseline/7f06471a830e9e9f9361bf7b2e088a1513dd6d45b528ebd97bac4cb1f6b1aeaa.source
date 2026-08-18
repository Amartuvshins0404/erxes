import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import {
  cn,
  Combobox,
  Command,
  Form,
  Popover,
  EnumCursorDirection,
} from 'erxes-ui';
import { useQuery } from '@apollo/client';
import { useProviders } from '../hooks/useProviders';
import { OneFitProvider } from '../types/provider';
import { ONE_FIT_PROVIDER } from '../graphql/providerQueries';
import { getLocalizedString } from '~/modules/activity-type/utils/localization';

interface SelectProviderProviderProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface SelectProviderContextType {
  providerId: string;
  provider: OneFitProvider | null;
  onSelect: (provider: OneFitProvider) => void;
  setProvider: (provider: OneFitProvider | null) => void;
  loading: boolean;
  error: string | null;
}

const SelectProviderContext = React.createContext<SelectProviderContextType>({
  providerId: '',
  provider: null,
  onSelect: () => {},
  setProvider: () => {},
  loading: false,
  error: null,
});

const useSelectProviderContext = () => {
  return React.useContext(SelectProviderContext);
};

const SelectProviderProvider = ({
  children,
  value,
  onValueChange,
}: SelectProviderProviderProps) => {
  const [provider, setProvider] = useState<OneFitProvider | null>(null);
  const { data: providerData, loading } = useQuery(ONE_FIT_PROVIDER, {
    variables: { _id: value || '' },
    skip: !value,
  });

  useEffect(() => {
    if (providerData?.oneFitProvider) {
      setProvider(providerData.oneFitProvider);
    } else if (!value) {
      setProvider(null);
    }
  }, [providerData, value]);

  const onSelect = (selectedProvider: OneFitProvider) => {
    if (!selectedProvider) return;
    setProvider(selectedProvider);
    onValueChange?.(selectedProvider._id);
  };

  return (
    <SelectProviderContext.Provider
      value={{
        providerId: value || '',
        provider,
        onSelect,
        setProvider,
        loading,
        error: null,
      }}
    >
      {children}
    </SelectProviderContext.Provider>
  );
};

const SelectProviderContent = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const { providerId, provider } = useSelectProviderContext();

  const {
    providers: providersData,
    loading,
    handleFetchMore,
    totalCount,
  } = useProviders({
    searchValue: debouncedSearch,
  });

  return (
    <Command shouldFilter={false}>
      <Command.Input
        value={search}
        onValueChange={setSearch}
        variant="secondary"
        wrapperClassName="flex-auto"
        focusOnMount
        placeholder="Search providers..."
      />
      <Command.List className="max-h-[300px] overflow-y-auto">
        {provider && (
          <>
            <SelectProviderCommandItem provider={provider} />
            <Command.Separator className="my-1" />
          </>
        )}
        <Combobox.Empty loading={loading} />
        {!loading &&
          providersData
            ?.filter((p: OneFitProvider) => p._id !== providerId)
            .map((provider: OneFitProvider) => (
              <SelectProviderCommandItem
                key={provider._id}
                provider={provider}
              />
            ))}

        {!loading && (
          <Combobox.FetchMore
            fetchMore={() =>
              handleFetchMore({ direction: EnumCursorDirection.FORWARD })
            }
            currentLength={providersData?.length || 0}
            totalCount={totalCount || 0}
          />
        )}
      </Command.List>
    </Command>
  );
};

const SelectProviderCommandItem = ({
  provider,
}: {
  provider: OneFitProvider;
}) => {
  const { onSelect, providerId } = useSelectProviderContext();
  return (
    <Command.Item
      value={provider._id}
      onSelect={() => {
        onSelect(provider);
      }}
    >
      <div className="flex flex-col">
        <span className="font-medium">
          {getLocalizedString(provider.businessName, 'en')}
        </span>
        {provider.location?.city && (
          <span className="text-xs text-muted-foreground">
            {getLocalizedString(provider.location.city, 'en')}
          </span>
        )}
      </div>
      <Combobox.Check checked={providerId === provider._id} />
    </Command.Item>
  );
};

const SelectProviderValue = () => {
  const { provider } = useSelectProviderContext();

  if (!provider) {
    return <span className="text-muted-foreground">Select provider</span>;
  }

  return (
    <div className="flex flex-col">
      <span>{getLocalizedString(provider.businessName, 'en')}</span>
      {provider.location?.city && (
        <span className="text-xs text-muted-foreground">
          {getLocalizedString(provider.location.city, 'en')}
        </span>
      )}
    </div>
  );
};

const SelectProviderRoot = ({
  onValueChange,
  className,
  value,
  ...props
}: Omit<React.ComponentProps<typeof SelectProviderProvider>, 'children'> & {
  className?: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <SelectProviderProvider
      value={value}
      onValueChange={(newValue) => {
        onValueChange?.(newValue);
        setOpen(false);
      }}
      {...props}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <Combobox.Trigger
          className={cn('w-full inline-flex', className)}
          variant="outline"
        >
          <SelectProviderSearchable.Value />
        </Combobox.Trigger>
        <Combobox.Content>
          <SelectProviderSearchable.Content />
        </Combobox.Content>
      </Popover>
    </SelectProviderProvider>
  );
};

const SelectProviderFormItem = ({
  onValueChange,
  className,
  value,
  ...props
}: Omit<React.ComponentProps<typeof SelectProviderProvider>, 'children'> & {
  className?: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <SelectProviderProvider
      value={value}
      onValueChange={(newValue) => {
        onValueChange?.(newValue);
        setOpen(false);
      }}
      {...props}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <Form.Control>
          <Combobox.Trigger className={cn('w-full shadow-xs', className)}>
            <SelectProviderSearchable.Value />
          </Combobox.Trigger>
        </Form.Control>

        <Combobox.Content>
          <SelectProviderSearchable.Content />
        </Combobox.Content>
      </Popover>
    </SelectProviderProvider>
  );
};

export const SelectProviderSearchable = Object.assign(SelectProviderRoot, {
  Provider: SelectProviderProvider,
  Content: SelectProviderContent,
  Item: SelectProviderCommandItem,
  Value: SelectProviderValue,
  FormItem: SelectProviderFormItem,
});
