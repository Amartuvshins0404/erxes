import {
  IOppty,
  IOpptyDocument,
  IOpptyFilter,
  IBlockOpptyInput,
} from '@/oppty/@types/oppty';
import { opptySchema } from '@/oppty/db/definitions/oppty';
import { EventDispatcherReturn } from 'erxes-api-shared/core-modules';
import { graphqlPubsub } from 'erxes-api-shared/utils';
import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { generateOpptyUpdateActivityLogs } from '../../meta/activity-log';
import { DEFAULT_STATUS_TYPES } from '@/oppty/constants';
import { ContractPartyType } from '@/contract/@types/contract';
import { BlockProjectPaymentPlanType } from '@/project/@types/payment';

export interface IOpptyModel extends Model<IOpptyDocument> {
  getOppty(_id: string): Promise<IOpptyDocument>;
  getOpptys(projectId: string, filter: IOpptyFilter): Promise<IOpptyDocument[]>;
  createOppty(input: IBlockOpptyInput): Promise<IOpptyDocument>;
  updateOppty(
    _id: string,
    input: Partial<IBlockOpptyInput>,
  ): Promise<IOpptyDocument>;
  deleteOppty(_id: string): Promise<IOpptyDocument | null>;
}

export const loadOpptyClass = (
  models: IModels,
  _subdomain: string,
  { createActivityLog }: EventDispatcherReturn,
) => {
  class Oppty {
    public static async getOppty(_id: string) {
      const oppty = await models.Oppty.findOne({ _id });

      if (!oppty) {
        throw new Error('Oppty not found');
      }

      return oppty;
    }

    public static async getOpptys(projectId: string, filter: IOpptyFilter) {
      return models.Oppty.find({ projectId, ...filter });
    }

    public static async createOppty(input: IOppty) {
      const lastOppty = await models.Oppty.findOne({})
        .sort({ createdAt: -1 })
        .select('number');

      let nextNumber = 1;
      if (lastOppty?.number) {
        const match = lastOppty.number.match(/(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      input.number = `OPP-${String(nextNumber).padStart(5, '0')}`;

      const oppty = await models.Oppty.create(input);

      graphqlPubsub.publish('blockOpptyListChanged', {
        blockOpptyListChanged: { type: 'create', oppty },
      });

      return oppty;
    }

    public static async updateOppty(_id: string, input: IBlockOpptyInput) {
      const prevOppty = await models.Oppty.getOppty(_id);

      const wonStatus = await models.OpptyStatus.findOne({
        projectId: prevOppty.projectId,
        type: DEFAULT_STATUS_TYPES.CLOSED_WON,
      });

      if (
        wonStatus &&
        wonStatus._id.equals(prevOppty.status) &&
        input.status &&
        !wonStatus._id.equals(input.status)
      ) {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        if (prevOppty.updatedAt > oneMinuteAgo) {
          throw new Error('Cannot change status of won opportunity');
        }
      }

      const movingToWon =
        wonStatus &&
        input.status &&
        wonStatus._id.equals(input.status) &&
        !wonStatus._id.equals(prevOppty.status);

      const propertyRows = input.propertyRows ?? prevOppty.propertyRows ?? [];
      const mainRow = propertyRows.find((r) => r.isMain && r.unitId);
      const mainUnitId = mainRow?.unitId;

      if (movingToWon && !mainUnitId) {
        throw new Error(
          'Cannot move opportunity to won stage without a main unit.',
        );
      }

      const updatedOppty = await models.Oppty.findOneAndUpdate(
        { _id },
        { $set: input },
        { new: true },
      );

      if (movingToWon && mainUnitId && updatedOppty) {
        const customerId = updatedOppty.customerId || prevOppty.customerId;

        const lastContract = await models.Contract.findOne({})
          .sort({ createdAt: -1 })
          .select('number');

        let nextNumber = 1;
        if (lastContract?.number) {
          const match = lastContract.number.match(/(\d+)$/);
          if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
          }
        }

        const reservedStage = await models.ContractStatus.findOne({
          projectId: updatedOppty.projectId,
          type: 'reserved',
        }).sort({ order: 1 });

        const createdContract = await models.Contract.create({
          number: `CT-${String(nextNumber).padStart(5, '0')}`,
          unit: mainUnitId,
          currency: 'MNT',
          date: new Date(),
          amount: 0,
          status: reservedStage?._id,
          party: customerId
            ? { type: ContractPartyType.CUSTOMER, id: customerId }
            : undefined,
          paymentPlan: { type: BlockProjectPaymentPlanType.SALE },
          user: updatedOppty.assignedUserId,
        });

        if (createdContract) {
          createActivityLog({
            activityType: 'contract.created_from_oppty',
            target: {
              _id: createdContract._id.toString(),
              moduleName: 'block',
              collectionName: 'block_contracts',
              text:
                createdContract.number || String(createdContract._id),
            },
            action: {
              type: 'contract.created_from_oppty',
              description: 'created from opportunity',
            },
            changes: {
              current: {
                opptyId: updatedOppty._id.toString(),
                opptyNumber: updatedOppty.number,
              },
            },
            metadata: {
              opptyId: updatedOppty._id.toString(),
              opptyNumber: updatedOppty.number,
              projectId: updatedOppty.projectId?.toString(),
            },
          });
        }
      }

      graphqlPubsub.publish(`blockOpptyChanged:${_id}`, {
        blockOpptyChanged: { type: 'update', oppty: updatedOppty },
      });

      graphqlPubsub.publish('blockOpptyListChanged', {
        blockOpptyListChanged: { type: 'update', oppty: updatedOppty },
      });

      if (updatedOppty) {
        await generateOpptyUpdateActivityLogs(
          prevOppty.toObject(),
          updatedOppty.toObject(),
          createActivityLog,
        );
      }

      return updatedOppty;
    }

    public static async deleteOppty(_id: string) {
      return models.Oppty.findOneAndDelete({ _id });
    }
  }

  opptySchema.loadClass(Oppty);

  return opptySchema;
};
