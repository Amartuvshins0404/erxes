import { IOfferDocument } from '@/contract/@types/offer';
import { Model } from 'mongoose';

import { IOffer } from '@/contract/@types/offer';
import { offerSchema } from '@/contract/db/definitions/offer';
import { IModels } from '~/connectionResolvers';

export interface IOfferModel extends Model<IOfferDocument> {
  getOffer(subdomain: string, entityId: string): Promise<IOfferDocument>;
  createOffer(input: IOffer): Promise<IOfferDocument>;
  updateOffer(
    subdomain: string,
    entityId: string,
    input: IOffer,
  ): Promise<IOfferDocument>;
  upsertSentOffer(
    subdomain: string,
    entityId: string,
    input: IOffer,
  ): Promise<IOfferDocument>;
  deleteOffer(
    subdomain: string,
    entityId: string,
  ): Promise<IOfferDocument | null>;
}

export const loadOfferClass = (models: IModels) => {
  class Offer {
    public static async getOffer(subdomain: string, entityId: string) {
      const offer = await models.Offer.findOne({ subdomain, entityId }).lean();

      if (!offer) {
        throw new Error('Offer not found');
      }

      return offer;
    }

    public static async createOffer(input: IOffer) {
      return models.Offer.create(input);
    }

    public static async updateOffer(
      subdomain: string,
      entityId: string,
      input: IOffer,
    ) {
      const { _id } = await models.Offer.getOffer(subdomain, entityId);

      return models.Offer.findOneAndUpdate({ _id }, input, {
        new: true,
      });
    }

    public static async deleteOffer(subdomain: string, entityId: string) {
      const { _id } = await models.Offer.getOffer(subdomain, entityId);

      return models.Offer.findOneAndDelete({ _id });
    }

    // An offer may become "sent" via create, edit, or the send-email action —
    // any of which can be block-admin's first encounter with it — so this
    // upserts rather than requiring a prior create (mirrors
    // Contract.upsertSignedContract).
    public static async upsertSentOffer(
      subdomain: string,
      entityId: string,
      input: IOffer,
    ) {
      return models.Offer.findOneAndUpdate(
        { subdomain, entityId },
        { $set: { ...input, subdomain, entityId } },
        { upsert: true, new: true },
      );
    }
  }

  offerSchema.loadClass(Offer);

  return offerSchema;
};
