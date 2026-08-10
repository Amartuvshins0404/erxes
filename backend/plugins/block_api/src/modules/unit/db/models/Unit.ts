import { IUnit, IUnitDocument, ITransferUnit } from '@/unit/@types/unit';
import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { unitSchema } from '@/unit/db/definitions/unit';
import { blockAgencyTRPCClient } from '~/trpc/blockAgencyTRPCClient';

export interface IUnitModel extends Model<IUnitDocument> {
  getUnit(_id: string): Promise<IUnitDocument>;
  createUnit(input: IUnit): Promise<IUnitDocument>;
  updateUnit(
    _id: string,
    input: IUnit,
    userId?: string,
  ): Promise<IUnitDocument>;
  removeUnit(id: string): Promise<IUnitDocument>;
  getUnitsByZoning(zoning: string): Promise<IUnitDocument[]>;
  transferUnit(payload: ITransferUnit): Promise<IUnitDocument>;
  toggleUnitLock(_id: string, locked: boolean): Promise<IUnitDocument>;
}

export const loadUnitClass = (models: IModels, subdomain: string) => {
  class Unit {
    public static async getUnit(_id: string) {
      return models.Unit.findOne({ _id });
    }

    public static async createUnit(input: IUnit) {
      const unit = await models.Unit.create(input);
      return unit;
    }

    public static async updateUnit(_id: string, input: IUnit, userId?: string) {
      const updatedUnit = await models.Unit.findOneAndUpdate({ _id }, input, {
        new: true,
      });
      return updatedUnit;
    }

    public static async removeUnit(id: string) {
      const unit = await models.Unit.findOneAndDelete({ _id: id });
      return unit;
    }

    public static async getUnitsByZoning(zoning: string) {
      return models.Unit.find({ zoning }).sort({ unitNumber: 1 });
    }

    public static async toggleUnitLock(_id: string, locked: boolean) {
      return models.Unit.findOneAndUpdate(
        { _id },
        { $set: { locked } },
        { new: true },
      );
    }

    public static async transferUnit(payload: ITransferUnit) {
      const { unitId, agencySubdomain, agencyId } = payload;

      const unit = await models.Unit.findOne({ _id: unitId }).lean();
      if (!unit) {
        throw new Error(`Unit "${unitId}" not found`);
      }

      if (unit.agencyEntityId) {
        throw new Error(`Unit "${unitId}" is already assigned to an agency`);
      }

      if (unit.status && unit.status !== 'available') {
        throw new Error(
          `Unit "${unitId}" is not available for transfer (status: ${unit.status})`,
        );
      }

      const agencyClient = await blockAgencyTRPCClient();
      if (agencyClient) {
        const agency = await agencyClient.query('agency.getAgencyById', {
          agencyId,
        });
        if (!agency) {
          throw new Error(
            `Agency "${agencyId}" not found in subdomain "${agencySubdomain}"`,
          );
        }
      }

      const updated = await models.Unit.findOneAndUpdate(
        { _id: unitId },
        {
          $set: {
            blockSubdomain: subdomain,
            blockEntityId: unitId,
            agencySubdomain,
            agencyEntityId: agencyId,
          },
        },
        { new: true },
      );

      if (agencyClient) {
        const developer = await models.Developer.findOne({})
          .select('name')
          .lean();
        agencyClient
          .mutation('unit.assign', {
            blockUnitId: unitId,
            agencyId,
            blockSubdomain: subdomain,
            agencySubdomain,
            blockDeveloperName: developer?.name ?? undefined,
            unitNumber: unit.number,
          })
          .catch((err: Error) =>
            console.error(
              '[transferUnit] Agency assignment failed:',
              err.message,
            ),
          );
      }

      return updated;
    }
  }

  unitSchema.loadClass(Unit);

  return unitSchema;
};
