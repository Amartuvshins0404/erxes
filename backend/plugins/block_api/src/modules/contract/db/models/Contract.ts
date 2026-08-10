import { Model } from 'mongoose';
import { IContractDocument } from '@/contract/@types/contract';

import { IContract } from '@/contract/@types/contract';
import { IModels } from '~/connectionResolvers';
import { contractSchema } from '@/contract/db/definitions/contract';
import { EventDispatcherReturn } from 'erxes-api-shared/core-modules';
import { generateContractUpdateActivityLogs } from '../../meta/activity-log';
import { handleContractSigned } from '@/contract/utils/signedStatus';
import { syncContractPayments } from '@/contract/utils/paymentsSync';

export interface IContractModel extends Model<IContractDocument> {
  createContract(input: IContract): Promise<IContractDocument>;
  updateContract(_id: string, input: IContract): Promise<IContractDocument>;
  updateContractStatus(
    _id: string,
    status: string,
  ): Promise<IContractDocument | null>;
  getContract(_id: string): Promise<IContractDocument | null>;
  getContracts(): Promise<IContractDocument[]>;
  deleteContract(_id: string): Promise<IContractDocument | null>;
}

export const loadContractClass = (
  models: IModels,
  subdomain: string,
  eventHandlers?: EventDispatcherReturn,
) => {
  const createActivityLog = eventHandlers?.createActivityLog;

  class Contract {
    public static async createContract(input: IContract) {
      const created = await models.Contract.create(input);

      if (created) {
        const status = created.status
          ? await models.ContractStatus.findOne({ _id: created.status })
          : null;

        if (status?.type === 'signed') {
          const contractId = created._id.toString();
          const generated = await models.ContractPayment.regenerateForContract(
            contractId,
          );

          if (generated.length) {
            // regenerateForContract's own return value can go stale if its
            // transaction-restore step recomputed statuses afterward.
            const payments = await models.ContractPayment.find({
              contractId,
            });
            syncContractPayments(contractId, payments, subdomain);
          }

          await handleContractSigned(created, models, subdomain);
        }
      }
      return created;
    }

    public static async updateContract(_id: string, input: IContract) {
      const prev = await models.Contract.findOne({ _id });
      if (!prev) {
        throw new Error('Contract not found');
      }

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const withinRevertWindow =
        prev.updatedAt && prev.updatedAt > fiveMinutesAgo;

      const currentStage = prev.status
        ? await models.ContractStatus.findOne({ _id: prev.status })
        : null;
      if (currentStage?.type === 'signed' && !withinRevertWindow) {
        throw new Error('Signed contracts cannot be edited');
      }

      const updated = await models.Contract.findOneAndUpdate({ _id }, input, {
        new: true,
      });

      if (prev && updated && createActivityLog) {
        await generateContractUpdateActivityLogs(
          prev.toObject(),
          updated.toObject(),
          createActivityLog,
        );
      }

      if (updated) {
        const currentStatus = updated.status
          ? await models.ContractStatus.findOne({ _id: updated.status })
          : null;
        const isSigned = currentStatus?.type === 'signed';

        if (isSigned) {
          const generated = await models.ContractPayment.regenerateForContract(
            _id,
          );

          if (generated.length) {
            const payments = await models.ContractPayment.find({
              contractId: _id,
            });
            syncContractPayments(_id, payments, subdomain);
          }

          if (String(updated.status) !== String(prev.status)) {
            await handleContractSigned(updated, models, subdomain);
          }
        }
      }

      return updated;
    }

    public static async updateContractStatus(_id: string, status: string) {
      const contract = await models.Contract.findOne({ _id });
      if (!contract) {
        throw new Error('Contract not found');
      }

      const newStage = await models.ContractStatus.findOne({ _id: status });
      if (!newStage) {
        throw new Error('Contract stage not found');
      }

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const withinRevertWindow =
        contract.updatedAt && contract.updatedAt > fiveMinutesAgo;

      const prevStage = contract.status
        ? await models.ContractStatus.findOne({ _id: contract.status })
        : null;

      if (
        prevStage?.type === 'cancelled' &&
        newStage.type !== 'cancelled' &&
        !withinRevertWindow
      ) {
        throw new Error('Cannot change status of a cancelled contract');
      }

      if (prevStage?.type === 'signed' && !withinRevertWindow) {
        throw new Error('Signed contracts cannot change status');
      }

      const prev = contract.toObject();

      const updated = await models.Contract.findOneAndUpdate(
        { _id },
        { $set: { status } },
        { new: true },
      );

      if (updated && createActivityLog) {
        await generateContractUpdateActivityLogs(
          prev,
          updated.toObject(),
          createActivityLog,
        );
      }

      if (updated && newStage.type === 'cancelled') {
        await models.ContractPayment.updateMany(
          { contractId: _id },
          { $set: { status: 'cancelled' } },
        );

        const cancelledPayments = await models.ContractPayment.find({
          contractId: _id,
        });

        syncContractPayments(_id, cancelledPayments, subdomain);
      }

      if (updated && newStage.type === 'signed') {
        await handleContractSigned(updated, models, subdomain);

        const generated = await models.ContractPayment.regenerateForContract(
          _id,
          true,
        );

        if (generated.length) {
          const payments = await models.ContractPayment.find({
            contractId: _id,
          });
          syncContractPayments(_id, payments, subdomain);
        }

        if (updated.unit) {
          const cancelledStage = await models.ContractStatus.findOne({
            type: 'cancelled',
          });
          if (cancelledStage) {
            await models.Contract.updateMany(
              {
                _id: { $ne: _id },
                unit: updated.unit,
                status: { $ne: cancelledStage._id },
              },
              { $set: { status: cancelledStage._id } },
            );
          }
        }
      }

      return updated;
    }

    public static async getContract(_id: string) {
      return models.Contract.findOne({ _id });
    }

    public static async deleteContract(_id: string) {
      return models.Contract.findOneAndDelete({ _id });
    }
  }

  contractSchema.loadClass(Contract);

  return contractSchema;
};
