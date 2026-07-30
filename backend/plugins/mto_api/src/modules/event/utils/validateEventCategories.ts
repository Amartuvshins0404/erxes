import { CategoryLevel } from '@/association/@types/association';
import { IModels } from '~/connectionResolvers';

export const isSubCategory = (level?: string, parentId?: string | null) =>
  level === CategoryLevel.SUB || Boolean(parentId && String(parentId).trim());

export const isMainCategory = (level?: string, parentId?: string | null) =>
  !isSubCategory(level, parentId);

const uniqueIds = (ids?: string[]) =>
  Array.from(new Set((ids ?? []).filter((id) => Boolean(id && String(id).trim()))));

export const validateEventCategories = async (
  models: IModels,
  categoryIds?: string[],
) => {
  const ids = uniqueIds(categoryIds);

  if (!ids.length) {
    throw new Error('At least one category is required');
  }

  for (const id of ids) {
    const category = await models.Association.findOne({ _id: id });

    if (!category) {
      throw new Error('Category not found');
    }

    if (
      !isMainCategory(category.level, category.parentId) &&
      !isSubCategory(category.level, category.parentId)
    ) {
      throw new Error('Selected category must be a main or sub category');
    }
  }

  return { categoryIds: ids };
};
