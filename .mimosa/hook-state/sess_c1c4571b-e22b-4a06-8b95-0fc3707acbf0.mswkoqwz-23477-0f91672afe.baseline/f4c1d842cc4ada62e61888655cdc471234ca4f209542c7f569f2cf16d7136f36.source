import {
  NetworkStatus,
  QueryHookOptions,
  useQuery,
} from '@apollo/client';
import { useCallback } from 'react';

import {
  GET_CAR_CATEGORIES,
  GET_CAR_CATEGORY_DETAIL,
  GET_CAR_COUNT_BY_TAGS,
  GET_CAR_COUNTS,
  GET_CAR_DETAIL,
  GET_CARS,
  GET_CARS_MAIN,
} from '~/graphql/documents';
import {
  ICar,
  ICarCategory,
  ICarCounts,
  ICarsMainResponse,
} from '~/types/car';

export const useCarsMain = (
  variables: Record<string, unknown>,
  options?: QueryHookOptions<{
    carsMain: ICarsMainResponse;
  }>,
) => {
  const { data, loading, error, refetch, fetchMore, networkStatus } = useQuery<{
    carsMain: ICarsMainResponse;
  }>(GET_CARS_MAIN, {
    variables,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    ...options,
  });

  const cars = data?.carsMain?.list || [];
  const totalCount = data?.carsMain?.totalCount || 0;
  const perPage =
    typeof variables.perPage === 'number' && variables.perPage > 0
      ? variables.perPage
      : 20;
  const hasMore = cars.length < totalCount;
  const fetchingMore = networkStatus === NetworkStatus.fetchMore;
  const initialLoading = loading && !fetchingMore;

  const fetchMoreCars = useCallback(() => {
    if (!hasMore || fetchingMore || loading) {
      return;
    }

    return fetchMore({
      variables: {
        ...variables,
        page: Math.floor(cars.length / perPage) + 1,
        perPage,
      },
      updateQuery: (previous, { fetchMoreResult }) => {
        if (!fetchMoreResult?.carsMain) {
          return previous;
        }

        const mergedById = new Map<string, ICar>();

        [...(previous.carsMain?.list || []), ...fetchMoreResult.carsMain.list]
          .filter(Boolean)
          .forEach((car) => {
            mergedById.set(car._id, car);
          });

        return {
          ...previous,
          carsMain: {
            ...fetchMoreResult.carsMain,
            list: Array.from(mergedById.values()),
            totalCount:
              fetchMoreResult.carsMain.totalCount ||
              previous.carsMain?.totalCount ||
              0,
          },
        };
      },
    });
  }, [
    cars.length,
    fetchMore,
    fetchingMore,
    hasMore,
    loading,
    perPage,
    variables,
  ]);

  return {
    cars,
    totalCount,
    loading: initialLoading,
    error,
    refetch,
    fetchMoreCars,
    fetchingMore,
    hasMore,
  };
};

export const useCars = (
  variables: Record<string, unknown>,
  options?: QueryHookOptions<{ cars: ICar[] }>,
) => {
  const { data, loading, error, refetch } = useQuery<{ cars: ICar[] }>(
    GET_CARS,
    {
      variables,
      ...options,
    },
  );

  return {
    cars: data?.cars || [],
    loading,
    error,
    refetch,
  };
};

export const useCarDetail = (
  _id?: string,
  options?: QueryHookOptions<{ carDetail: ICar }>,
) => {
  const { data, loading, error, refetch } = useQuery<{ carDetail: ICar }>(
    GET_CAR_DETAIL,
    {
      variables: { _id },
      skip: !_id,
      ...options,
    },
  );

  return {
    car: data?.carDetail,
    loading,
    error,
    refetch,
  };
};

export const useCarCategories = (
  options?: QueryHookOptions<{ carCategories: ICarCategory[] }>,
) => {
  const { data, loading, error, refetch } = useQuery<{
    carCategories: ICarCategory[];
  }>(GET_CAR_CATEGORIES, {
    ...options,
  });

  return {
    carCategories: data?.carCategories || [],
    loading,
    error,
    refetch,
  };
};

export const useCarCategoryDetail = (
  _id?: string,
  options?: QueryHookOptions<{ carCategoryDetail: ICarCategory }>,
) => {
  const { data, loading, error, refetch } = useQuery<{
    carCategoryDetail: ICarCategory;
  }>(GET_CAR_CATEGORY_DETAIL, {
    variables: { _id },
    skip: !_id,
    ...options,
  });

  return {
    carCategory: data?.carCategoryDetail,
    loading,
    error,
    refetch,
  };
};

export const useCarCounts = (
  variables?: Record<string, unknown>,
  options?: QueryHookOptions<{ carCounts: ICarCounts }>,
) => {
  const { data, loading, error } = useQuery<{ carCounts: ICarCounts }>(
    GET_CAR_COUNTS,
    {
      variables,
      ...options,
    },
  );

  return {
    counts: data?.carCounts || {},
    loading,
    error,
  };
};

export const useCarCountByTags = (
  options?: QueryHookOptions<{ carCountByTags: Record<string, number> }>,
) => {
  const { data, loading, error } = useQuery<{
    carCountByTags: Record<string, number>;
  }>(GET_CAR_COUNT_BY_TAGS, options);

  return {
    counts: data?.carCountByTags || {},
    loading,
    error,
  };
};
