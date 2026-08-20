import { useQuery } from '@apollo/client';
import { useMemo } from 'react';
import { useNonNullMultiQueryState } from 'erxes-ui';
import { MTO_CATEGORIES } from '@/category/graphql/categoryQueries';
import { isMainCategory } from '@/category/hooks/useCategoryOptions';
import { MtoCategory } from '@/category/types/category';

const parseBooleanQuery = (value?: string): boolean | undefined => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

export function useCategories() {
  const { isActive, level } = useNonNullMultiQueryState<{
    isActive: string;
    level: string;
  }>(['isActive', 'level']);

  const { data, loading, refetch } = useQuery(MTO_CATEGORIES, {
    variables: {
      isActive: parseBooleanQuery(isActive),
      level: level && level !== 'all' ? level : undefined,
      onlyTopLevel: level === 'main' ? true : undefined,
    },
    fetchPolicy: 'cache-and-network',
  });

  const categories = useMemo(() => {
    const rows = (data?.mtoCategories ?? []) as MtoCategory[];

    if (level === 'sub') {
      return rows.filter((category) => !isMainCategory(category));
    }

    return rows;
  }, [data?.mtoCategories, level]);

  return { categories, loading, refetch };
}
