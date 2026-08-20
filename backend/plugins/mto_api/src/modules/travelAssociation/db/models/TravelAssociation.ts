import {
  ITravelAssociation,
  ITravelAssociationDocument,
} from '@/travelAssociation/@types/travelAssociation';
import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { travelAssociationSchema } from '../definitions/travelAssociation';

export interface ITravelAssociationModel
  extends Model<ITravelAssociationDocument> {
  createTravelAssociation(
    doc: ITravelAssociation,
  ): Promise<ITravelAssociationDocument>;
  updateTravelAssociation(
    _id: string,
    doc: Partial<ITravelAssociation>,
  ): Promise<ITravelAssociationDocument>;
  removeTravelAssociations(ids: string[]): Promise<{ n: number; ok: number }>;
}

const validateFoundDate = (foundDate: Date) => {
  if (!foundDate || Number.isNaN(new Date(foundDate).getTime())) {
    throw new Error('Found date is required');
  }
};

export const loadTravelAssociationClass = (models: IModels) => {
  class TravelAssociation {
    public static async createTravelAssociation(doc: ITravelAssociation) {
      validateFoundDate(doc.foundDate);

      return await models.TravelAssociation.create({
        ...doc,
        foundDate: new Date(doc.foundDate),
        createdAt: new Date(),
      });
    }

    public static async updateTravelAssociation(
      _id: string,
      doc: Partial<ITravelAssociation>,
    ) {
      const existing = await models.TravelAssociation.findOne({ _id });

      if (!existing) {
        throw new Error('Travel association not found');
      }

      const foundDate = doc.foundDate ?? existing.foundDate;

      validateFoundDate(foundDate);

      return await models.TravelAssociation.findOneAndUpdate(
        { _id },
        {
          $set: {
            ...doc,
            foundDate: new Date(foundDate),
            modifiedAt: new Date(),
          },
        },
        { new: true },
      );
    }

    public static async removeTravelAssociations(ids: string[]) {
      return models.TravelAssociation.deleteMany({ _id: { $in: ids } });
    }
  }

  travelAssociationSchema.loadClass(TravelAssociation);

  return travelAssociationSchema;
};
