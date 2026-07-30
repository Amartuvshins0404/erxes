import {
  CategoryLevel,
  IAssociation,
  IAssociationDocument,
} from '@/association/@types/association';
import { validateAssociationParent } from '@/association/utils/validateAssociationParent';
import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { associationSchema } from '../definitions/association';

export interface IAssociationModel extends Model<IAssociationDocument> {
  createAssociation(doc: IAssociation): Promise<IAssociationDocument>;
  updateAssociation(
    _id: string,
    doc: Partial<IAssociation>,
  ): Promise<IAssociationDocument>;
  removeAssociations(ids: string[]): Promise<{ n: number; ok: number }>;
}

export const loadAssociationClass = (models: IModels) => {
  class Association {
    public static async createAssociation(doc: IAssociation) {
      const level = doc.level ?? CategoryLevel.MAIN;
      const parentId = level === CategoryLevel.SUB ? undefined : doc.parentId;

      if (parentId) {
        await validateAssociationParent(models, parentId);
      }

      return await models.Association.create({
        ...doc,
        level,
        parentId,
        isActive: doc.isActive ?? true,
        createdAt: new Date(),
      });
    }

    public static async updateAssociation(_id: string, doc: Partial<IAssociation>) {
      const existing = await models.Association.findOne({ _id });

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
        await validateAssociationParent(models, parentId, _id);
      }

      return await models.Association.findOneAndUpdate(
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

    public static async removeAssociations(ids: string[]) {
      return models.Association.deleteMany({ _id: { $in: ids } });
    }
  }

  associationSchema.loadClass(Association);

  return associationSchema;
};
