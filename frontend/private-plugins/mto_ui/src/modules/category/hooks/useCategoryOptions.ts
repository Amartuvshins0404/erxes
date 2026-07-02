import { useQuery } from '@apollo/client';
import { useMemo } from 'react';
import { MTO_ASSOCIATIONS } from '@/association/graphql/associationQueries';
import { MtoCategory } from '@/category/types/category';

export const getCategoryLabel = (category: Pick<MtoCategory, '_id' | 'name'>) =>
  category.name?.en || category.name?.mn || category._id;

export const isSubCategory = (category: Pick<MtoCategory, 'level' | 'parentId'>) =>
  category.level === 'sub' ||
  Boolean(category.parentId && String(category.parentId).trim());

export const isMainCategory = (category: Pick<MtoCategory, 'level' | 'parentId'>) =>
  !isSubCategory(category);

export const useCategoryOptions = () => {
  const { data, loading } = useQuery(MTO_ASSOCIATIONS, {
    variables: { isActive: true },
  });

  const categories = useMemo(
    () => (data?.mtoAssociations ?? []) as MtoCategory[],
    [data?.mtoAssociations],
  );

  const mainCategories = useMemo(
    () => categories.filter(isMainCategory),
    [categories],
  );

  const subCategories = useMemo(
    () => categories.filter(isSubCategory),
    [categories],
  );

  return {
    loading,
    categories,
    mainCategories,
    subCategories,
    getCategoryLabel,
    isMainCategory,
    isSubCategory,
  };
};
