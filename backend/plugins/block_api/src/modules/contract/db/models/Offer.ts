import { Model } from 'mongoose';
import { IOfferDocument, OfferStatus } from '@/contract/@types/offer';

import { IOffer } from '@/contract/@types/offer';
import { IModels } from '~/connectionResolvers';
import { offerSchema } from '@/contract/db/definitions/offer';

export interface IOfferModel extends Model<IOfferDocument> {
  createOffer(input: IOffer): Promise<IOfferDocument>;
  updateOffer(_id: string, input: IOffer): Promise<IOfferDocument>;
  getOffer(_id: string): Promise<IOfferDocument | null>;
  getOffers(): Promise<IOfferDocument[]>;
  deleteOffer(_id: string): Promise<IOfferDocument | null>;
}

export const loadOfferClass = (models: IModels) => {
  class Offer {
    public static async createOffer(input: IOffer) {
      return models.Offer.create(input);
    }

    public static async updateOffer(_id: string, input: IOffer) {
      const prev = await models.Offer.findOne({ _id });

      if (!prev) {
        throw new Error('Offer not found');
      }

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const withinRevertWindow =
        prev.updatedAt && prev.updatedAt > fiveMinutesAgo;

      if (prev.status === OfferStatus.SENT && !withinRevertWindow) {
        throw new Error('Sent offers cannot be edited');
      }

      return models.Offer.findOneAndUpdate({ _id }, input, {
        new: true,
      });
    }

    public static async getOffer(_id: string) {
      return models.Offer.findOne({ _id });
    }

    public static async deleteOffer(_id: string) {
      return models.Offer.findOneAndDelete({ _id });
    }
  }

  offerSchema.loadClass(Offer);

  return offerSchema;
};
