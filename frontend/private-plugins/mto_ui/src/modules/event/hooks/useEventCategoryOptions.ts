import {
  getCategoryLabel,
  useCategoryOptions,
} from '@/category/hooks/useCategoryOptions';

export const getAssociationLabel = getCategoryLabel;

export function useEventCategoryOptions() {
  const result = useCategoryOptions();

  return {
    ...result,
    getAssociationLabel: getCategoryLabel,
  };
}
