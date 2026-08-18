import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Checkbox, Command, Combobox, EnumCursorDirection } from 'erxes-ui';
import { useProviders } from '../hooks/useProviders';
import { OneFitProvider } from '../types/provider';
import { getLocalizedString } from '~/modules/activity-type/utils/localization';

interface SelectProviderProps {
  selected?: string[];
  onSelect: (providerIds: string[]) => void;
  disabled?: boolean;
}

export const SelectProvider = ({
  selected = [],
  onSelect,
  disabled = false,
}: SelectProviderProps) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [labelById, setLabelById] = useState<Record<string, string>>({});

  const {
    providers: providersData,
    loading,
    handleFetchMore,
    totalCount,
  } = useProviders({
    searchValue: debouncedSearch,
    isActive: true,
  });

  useEffect(() => {
    setLabelById((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        if (!selected.includes(id)) delete next[id];
      }
      return next;
    });
  }, [selected]);

  const handleProviderToggle = (
    providerId: string,
    provider?: OneFitProvider,
  ) => {
    if (disabled) return;

    const isSelected = selected.includes(providerId);
    if (isSelected) {
      onSelect(selected.filter((id) => id !== providerId));
      return;
    }
    if (provider) {
      setLabelById((prev) => ({
        ...prev,
        [providerId]: getLocalizedString(provider.businessName, 'en'),
      }));
    }
    onSelect([...selected, providerId]);
  };

  const listProviders = (providersData || []).filter(
    (p: OneFitProvider) => !selected.includes(p._id),
  );

  if (loading && !providersData?.length && selected.length === 0) {
    return (
      <div className="py-4 text-sm text-muted-foreground">
        Loading providers...
      </div>
    );
  }

  const hasNoResults =
    !loading && (providersData?.length || 0) === 0 && selected.length === 0;

  if (hasNoResults) {
    return (
      <div className="border rounded-md p-4">
        <Command shouldFilter={false}>
          <Command.Input
            value={search}
            onValueChange={setSearch}
            variant="secondary"
            wrapperClassName="flex-auto"
            placeholder="Search providers..."
          />
          <Command.List className="max-h-[200px]">
            <div className="py-4 text-sm text-muted-foreground">
              No providers match your search
            </div>
          </Command.List>
        </Command>
      </div>
    );
  }

  return (
    <div className="border rounded-md p-4 space-y-3">
      <Command shouldFilter={false}>
        <Command.Input
          value={search}
          onValueChange={setSearch}
          variant="secondary"
          wrapperClassName="flex-auto"
          placeholder="Search providers..."
        />

        {selected.length > 0 && (
          <>
            <div className="text-xs font-medium text-muted-foreground px-1 pt-2">
              Selected
            </div>
            <div className="space-y-2 px-1">
              {selected.map((id) => {
                const fromList = providersData?.find(
                  (p: OneFitProvider) => p._id === id,
                );
                const label = fromList
                  ? getLocalizedString(fromList.businessName, 'en')
                  : labelById[id] || id;
                return (
                  <div key={id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`selected-provider-${id}`}
                      checked
                      onCheckedChange={() => handleProviderToggle(id)}
                      disabled={disabled}
                    />
                    <label
                      htmlFor={`selected-provider-${id}`}
                      className="text-sm font-medium leading-none cursor-pointer select-none flex-1"
                    >
                      {label}
                    </label>
                  </div>
                );
              })}
            </div>
            {listProviders.length > 0 && (
              <div className="border-t pt-3 mt-2 text-xs font-medium text-muted-foreground px-1">
                Results
              </div>
            )}
          </>
        )}

        <Command.List className="max-h-[200px] overflow-y-auto">
          {loading && !listProviders.length ? (
            <div className="py-4 px-2 text-sm text-muted-foreground">
              Loading providers...
            </div>
          ) : (
            <>
              {listProviders.map((provider: OneFitProvider) => (
                <div
                  key={provider._id}
                  className="flex items-center space-x-2 py-1 px-2"
                >
                  <Checkbox
                    id={provider._id}
                    checked={false}
                    onCheckedChange={() =>
                      handleProviderToggle(provider._id, provider)
                    }
                    disabled={disabled}
                  />
                  <label
                    htmlFor={provider._id}
                    className="text-sm font-medium leading-none cursor-pointer select-none flex-1"
                  >
                    {getLocalizedString(provider.businessName, 'en')}
                  </label>
                </div>
              ))}

              {listProviders.length > 0 && (
                <Combobox.FetchMore
                  fetchMore={() =>
                    handleFetchMore({ direction: EnumCursorDirection.FORWARD })
                  }
                  currentLength={providersData?.length || 0}
                  totalCount={totalCount || 0}
                />
              )}
            </>
          )}
        </Command.List>
      </Command>

      {selected.length > 0 && (
        <div className="pt-1 border-t text-xs text-muted-foreground">
          {selected.length} provider{selected.length === 1 ? '' : 's'} selected
        </div>
      )}
    </div>
  );
};
