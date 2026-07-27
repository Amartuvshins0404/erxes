import { ICategoryDocument } from '@/category/@types/category';
import { IContext } from '~/connectionResolvers';

export const categoryCustomResolvers = {
  MtoCategory: {
    parent: async (
      category: ICategoryDocument,
      _params: undefined,
      { models }: IContext,
    ) => {
      if (!category.parentId) {
        return null;
      }

      return models.Category.findOne({ _id: category.parentId });
    },
  },
};
