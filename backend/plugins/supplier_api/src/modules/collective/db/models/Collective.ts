import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { collectiveSchema } from '@/collective/db/definitions/collective';
import {
  ICollective,
  ICollectiveDocument,
} from '@/collective/@types/collective';
import { SUPPLIER_VERIFICATION_STATUS } from '~/constants';

const ADMIN_ONLY_FIELDS: (keyof ICollective)[] = [
  'verificationStatus',
  'verificationNote',
  'tierLevel',
];

const normalizeCollectiveAddress = (address: any) => {
  if (!address || typeof address !== 'object') return address;

  const details = address.details ?? address.address;
  const next = { ...address, details };

  if ('address' in next) {
    delete next.address;
  }

  return next;
};

const stripAdminFields = (doc: ICollective): ICollective => {
  const clean: ICollective = { ...doc };
  for (const key of ADMIN_ONLY_FIELDS) {
    delete (clean as any)[key];
  }

  if (clean.address) {
    (clean as any).address = normalizeCollectiveAddress(clean.address as any);
  }

  return clean;
};

export interface ICollectiveModel extends Model<ICollectiveDocument> {
  getCollective(): Promise<ICollectiveDocument>;
  createGetCollective(
    userId: string,
    doc: ICollective,
  ): Promise<ICollectiveDocument>;
  updateCollective(
    userId: string,
    doc: ICollective,
  ): Promise<ICollectiveDocument>;
  updateVerificationStatus(
    _id: string,
    status: string,
    note?: string,
  ): Promise<ICollectiveDocument | null>;
  updateTierLevel(
    _id: string,
    tierLevel: number,
  ): Promise<ICollectiveDocument | null>;
  removeCollective(_id: string): Promise<{ ok?: number }>;
}

export const loadCollectiveClass = (models: IModels) => {
  class Collective {
    public static async getCollective() {
      const collective = await models.Collective.findOne().lean();

      if (!collective) throw new Error('Collective not found');

      return collective;
    }

    public static async createGetCollective(
      userId: string,
      doc: ICollective,
    ) {
      const existing = await models.Collective.findOne({});
      if (existing) {
        throw new Error('Collective profile already exists');
      }
      return models.Collective.create({
        ...stripAdminFields(doc),
        ownerUserId: userId,
        verificationStatus: SUPPLIER_VERIFICATION_STATUS.PENDING,
      });
    }

    public static async updateCollective(userId: string, doc: ICollective) {
      const existing = await models.Collective.findOne({});

      if (!existing) {
        return models.Collective.create({
          ...stripAdminFields(doc),
          ownerUserId: userId,
          verificationStatus: SUPPLIER_VERIFICATION_STATUS.PENDING,
        });
      }
      return models.Collective.findOneAndUpdate(
        { _id: existing._id },
        { $set: stripAdminFields(doc) },
        { new: true },
      );
    }

    public static async updateVerificationStatus(
      _id: string,
      status: string,
      note?: string,
    ) {
      if (!SUPPLIER_VERIFICATION_STATUS.ALL.includes(status)) {
        throw new Error('Invalid verification status');
      }

      return models.Collective.findOneAndUpdate(
        { _id },
        {
          $set: { verificationStatus: status, verificationNote: note ?? null },
        },
        { new: true },
      );
    }

    public static async updateTierLevel(_id: string, tierLevel: number) {
      if (!Number.isInteger(tierLevel) || tierLevel < 0) {
        throw new Error('tierLevel must be a non-negative integer');
      }
      return models.Collective.findOneAndUpdate(
        { _id },
        { $set: { tierLevel } },
        { new: true },
      );
    }

    public static async removeCollective(_id: string) {
      return models.Collective.deleteOne({ _id });
    }
  }

  collectiveSchema.loadClass(Collective);

  return collectiveSchema;
};
