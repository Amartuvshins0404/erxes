import { isUndefinedOrNull, useMultiQueryState } from 'erxes-ui';
import { ListFilterItem } from '~/components/filter';

export const useFilters = (filters: ListFilterItem[]) => {
  const filterKeys = filters.map((filter) => filter.filterKey);
  const [queries] = useMultiQueryState(filterKeys);
  return {
    queries: Object.fromEntries(
      Object.entries(queries).filter(([_, value]) => !isUndefinedOrNull(value)),
    ),
    hasFilters: Object.values(queries || {}).some((value) => value !== null),
  };
};
