import { IModels } from '~/connectionResolvers';

const isTopLevelCategory = (parentId?: string | null) =>
  !parentId || String(parentId).trim() === '';

export const validateCategoryParent = async (
  models: IModels,
  parentId?: string,
  selfId?: string,
) => {
  if (!parentId) {
    return;
  }

  if (selfId && parentId === selfId) {
    throw new Error('Category cannot be its own parent');
  }

  const parent = await models.Category.findOne({ _id: parentId });

  if (!parent) {
    throw new Error('Parent category not found');
  }

  if (!isTopLevelCategory(parent.parentId)) {
    throw new Error('Parent category must be a main category');
  }
};
