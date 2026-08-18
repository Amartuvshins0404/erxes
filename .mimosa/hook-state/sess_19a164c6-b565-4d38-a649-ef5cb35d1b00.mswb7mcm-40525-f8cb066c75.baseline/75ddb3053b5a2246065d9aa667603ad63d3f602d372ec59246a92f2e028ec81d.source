import { useQuery } from '@apollo/client';
import { useCallback } from 'react';
import {
  ONE_FIT_ACTIVITY_CATEGORIES,
  ONE_FIT_ACTIVITY_CATEGORIES_COUNT,
} from '../graphql/categoryQueries';
import { CategoryFilters } from '../types/category';

export const useCategories = (filters?: CategoryFilters) => {
  const { data, loading, error, refetch } = useQuery(
    ONE_FIT_ACTIVITY_CATEGORIES,
    {
      variables: {
        ...filters,
      },
      fetchPolicy: 'cache-and-network',
    },
  );
  const { data: overallCountData } = useQuery(ONE_FIT_ACTIVITY_CATEGORIES_COUNT);

  const categories = data?.oneFitActivityCategories || [];
  const filteredTotalCount = categories.length;
  const overallTotalCount = overallCountData?.oneFitActivityCategoriesCount;

  const handleRefetch = useCallback(() => {
    return refetch({
      ...filters,
    });
  }, [refetch, filters]);

  return {
    categories,
    loading,
    error,
    filteredTotalCount,
    overallTotalCount,
    refetch: handleRefetch,
  };
};
