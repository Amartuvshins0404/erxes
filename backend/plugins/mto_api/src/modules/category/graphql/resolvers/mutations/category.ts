import { Resolver } from 'erxes-api-shared/core-types';
import { ICategory } from '@/category/@types/category';
import { IContext } from '~/connectionResolvers';

export const categoryMutations: Record<string, Resolver> = {
  async mtoCategoryCreate(
    _root: undefined,
    doc: ICategory,
    { models }: IContext,
  ) {
    return models.Category.createCategory(doc);
  },

  async mtoCategoryUpdate(
    _root: undefined,
    { _id, ...doc }: { _id: string } & Partial<ICategory>,
    { models }: IContext,
  ) {
    return models.Category.updateCategory(_id, doc);
  },

  async mtoCategoriesRemove(
    _root: undefined,
    { ids }: { ids: string[] },
    { models }: IContext,
  ) {
    return models.Category.removeCategories(ids);
  },
};
