import { useMultiQueryState } from 'erxes-ui';

import { DEFAULT_PAGE, DEFAULT_PER_PAGE } from '~/lib/constants';
import { ICarFilters } from '~/types/car';

const QUERY_KEYS: Array<keyof ICarFilters> = [
  'page',
  'perPage',
  'categoryId',
  'tag',
  'segment',
  'segmentData',
  'searchValue',
  'sortField',
  'sortDirection',
  'ids',
];

type CarFilterQueryState = ICarFilters & Record<string, unknown>;

export const useCarsQueryState = () => {
  const [queries, setQueries] =
    useMultiQueryState<CarFilterQueryState>(QUERY_KEYS);

  const filters: ICarFilters = {
    page: Number(queries.page || DEFAULT_PAGE),
    perPage: Number(queries.perPage || DEFAULT_PER_PAGE),
    categoryId: queries.categoryId || null,
    tag: queries.tag || null,
    segment: queries.segment || null,
    segmentData: queries.segmentData || null,
    searchValue: queries.searchValue || null,
    sortField: queries.sortField || null,
    sortDirection:
      queries.sortDirection !== null && queries.sortDirection !== undefined
        ? Number(queries.sortDirection)
        : null,
    ids: queries.ids || null,
  };

  const resetPage = () => setQueries({ page: DEFAULT_PAGE });

  return {
    filters,
    setQueries,
    resetPage,
    setPage: (page: number) => setQueries({ page }),
    setPerPage: (perPage: number) =>
      setQueries({ perPage, page: DEFAULT_PAGE }),
    setSearchValue: (searchValue: string | null) =>
      setQueries({ searchValue, page: DEFAULT_PAGE }),
    setCategoryId: (categoryId: string | null) =>
      setQueries({ categoryId, page: DEFAULT_PAGE }),
    setTag: (tag: string | null) => setQueries({ tag, page: DEFAULT_PAGE }),
    setSegment: (segment: string | null, segmentData?: string | null) =>
      setQueries({
        segment,
        segmentData: segment ? segmentData || null : null,
        page: DEFAULT_PAGE,
      }),
    setIds: (ids: string[] | null) => setQueries({ ids }),
    setSort: (sortField: string) => {
      const nextDirection =
        filters.sortField === sortField && filters.sortDirection === 1 ? -1 : 1;

      setQueries({
        sortField,
        sortDirection: nextDirection,
        page: DEFAULT_PAGE,
      });
    },
    clearFilters: () =>
      setQueries({
        categoryId: null,
        tag: null,
        segment: null,
        segmentData: null,
        searchValue: null,
        sortField: null,
        sortDirection: null,
        ids: null,
        page: DEFAULT_PAGE,
        perPage: DEFAULT_PER_PAGE,
      }),
  };
};
