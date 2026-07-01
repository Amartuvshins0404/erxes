import { useQuery } from '@apollo/client';
import {
  Badge,
  Combobox,
  Command,
  EnumCursorDirection,
  mergeCursorData,
  Spinner,
  validateFetchMore,
} from 'erxes-ui';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from 'use-debounce';
import { MUSHOP_SUPPLIERS } from '../../supplier/graphql/queries';
import { ISupplierList } from '../../supplier/types';

export interface ISupplierOption {
  _id: string;
  name?: string;
  verificationStatus?: string;
}

const verificationVariant = (status?: string) => {
  if (status === 'verified') return 'success' as const;
  if (status === 'unverified') return 'destructive' as const;
  return 'secondary' as const;
};

export const SupplierChooser = ({
  selectedIds,
  onToggle,
  disabled,
}: {
  selectedIds: string[];
  onToggle: (id: string, supplier?: ISupplierOption) => void;
  disabled?: boolean;
}) => {
  const { t } = useTranslation('mushop');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [cacheById, setCacheById] = useState<Record<string, ISupplierOption>>(
    {},
  );

  const { data, previousData, loading, fetchMore } = useQuery<{
    mushopSuppliers: ISupplierList;
  }>(MUSHOP_SUPPLIERS, {
    variables: {
      verificationStatus: 'verified',
      searchValue: debouncedSearch || undefined,
      limit: 30,
    },
  });

  const mushopSuppliers =
    data?.mushopSuppliers || previousData?.mushopSuppliers;

  const suppliers = useMemo(
    () => mushopSuppliers?.list || [],
    [mushopSuppliers?.list],
  );
  const pageInfo = mushopSuppliers?.pageInfo;
  const totalCount = mushopSuppliers?.totalCount || 0;

  const handleFetchMore = () => {
    const direction = EnumCursorDirection.FORWARD;
    if (!validateFetchMore({ direction, pageInfo })) return;

    fetchMore({
      variables: {
        verificationStatus: 'verified',
        searchValue: debouncedSearch || undefined,
        limit: 30,
        cursor: pageInfo?.endCursor,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          mushopSuppliers: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.mushopSuppliers,
            prevResult: prev.mushopSuppliers,
          }),
        });
      },
    });
  };

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  useEffect(() => {
    setCacheById((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        if (!selectedSet.has(id)) delete next[id];
      }
      return next;
    });
  }, [selectedSet]);

  useEffect(() => {
    setCacheById((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const supplier of suppliers) {
        if (selectedSet.has(supplier._id)) {
          next[supplier._id] = supplier;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [suppliers, selectedSet]);

  const selectedOptions = useMemo(
    () =>
      selectedIds.map((id) => {
        const supplier =
          suppliers.find((s: ISupplierOption) => s._id === id) || cacheById[id];
        return {
          _id: id,
          name: supplier?.name,
          verificationStatus: supplier?.verificationStatus,
        };
      }),
    [selectedIds, suppliers, cacheById],
  );

  const results = useMemo(
    () => suppliers.filter((s: ISupplierOption) => !selectedSet.has(s._id)),
    [suppliers, selectedSet],
  );

  const handleToggle = (supplier: ISupplierOption) => {
    const { _id } = supplier;
    if (!selectedSet.has(_id)) {
      setCacheById((prev) => ({ ...prev, [_id]: supplier }));
    }
    onToggle(_id, supplier);
  };

  return (
    <Command
      shouldFilter={false}
      className="flex flex-col flex-1 border rounded-md min-h-0"
    >
      <Command.Input
        value={search}
        onValueChange={setSearch}
        placeholder={t('Search...')}
        disabled={disabled}
      />
      <Command.List className="flex-1 max-h-none space-y-5">
        {loading && !suppliers.length && (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        )}
        <Command.Empty>{t('No suppliers found.')}</Command.Empty>

        {selectedOptions.map((supplier) => (
          <Command.Item
            key={supplier._id}
            value={supplier._id}
            onSelect={() => handleToggle(supplier)}
            disabled={disabled}
          >
            <span className="flex-1 truncate">
              {supplier.name || supplier._id}
            </span>
            <Badge variant={verificationVariant(supplier.verificationStatus)}>
              {supplier.verificationStatus || t('unknown')}
            </Badge>
            <Combobox.Check checked />
          </Command.Item>
        ))}

        {selectedOptions.length > 0 && results.length > 0 && (
          <Command.Separator alwaysRender className="my-1" />
        )}

        {results.map((supplier: ISupplierOption) => (
          <Command.Item
            key={supplier._id}
            value={supplier._id}
            onSelect={() => handleToggle(supplier)}
            disabled={disabled}
          >
            <span className="flex-1 truncate">
              {supplier.name || supplier._id}
            </span>
            <Badge variant={verificationVariant(supplier.verificationStatus)}>
              {supplier.verificationStatus || t('unknown')}
            </Badge>
            <Combobox.Check checked={false} />
          </Command.Item>
        ))}

        <Combobox.FetchMore
          fetchMore={() => handleFetchMore()}
          currentLength={suppliers.length}
          totalCount={totalCount || 0}
        />
      </Command.List>
    </Command>
  );
};
