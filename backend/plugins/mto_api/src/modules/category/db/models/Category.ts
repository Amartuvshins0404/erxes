import {
  CategoryLevel,
  ICategory,
  ICategoryDocument,
} from '@/category/@types/category';
import { validateCategoryParent } from '@/category/utils/validateCategoryParent';
import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { categorySchema } from '../definitions/category';

export interface ICategoryModel extends Model<ICategoryDocument> {
  createCategory(doc: ICategory): Promise<ICategoryDocument>;
  updateCategory(
    _id: string,
    doc: Partial<ICategory>,
  ): Promise<ICategoryDocument>;
  removeCategories(ids: string[]): Promise<{ n: number; ok: number }>;
}

export const loadCategoryClass = (models: IModels) => {
  class Category {
    public static async createCategory(doc: ICategory) {
      const level = doc.level ?? CategoryLevel.MAIN;
      const parentId = level === CategoryLevel.SUB ? undefined : doc.parentId;

      if (parentId) {
        await validateCategoryParent(models, parentId);
      }

      return await models.Category.create({
        ...doc,
        level,
        parentId,
        isActive: doc.isActive ?? true,
        createdAt: new Date(),
      });
    }

    public static async updateCategory(_id: string, doc: Partial<ICategory>) {
      const existing = await models.Category.findOne({ _id });

      if (!existing) {
        throw new Error('Category not found');
      }

      const level = doc.level ?? existing.level ?? CategoryLevel.MAIN;
      const parentId =
        level === CategoryLevel.SUB
          ? undefined
          : doc.parentId === undefined
            ? existing.parentId
            : doc.parentId;

      if (parentId) {
        await validateCategoryParent(models, parentId, _id);
      }

      return await models.Category.findOneAndUpdate(
        { _id },
        {
          $set: {
            ...doc,
            level,
            parentId,
            modifiedAt: new Date(),
          },
        },
        { new: true },
      );
    }

    public static async removeCategories(ids: string[]) {
      return models.Category.deleteMany({ _id: { $in: ids } });
    }
  }

  categorySchema.loadClass(Category);

  return categorySchema;
};
