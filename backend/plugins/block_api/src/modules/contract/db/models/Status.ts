import { IContractStatus, IContractStatusDocument } from '@/contract/@types/status';
import {
  DEFAULT_CONTRACT_STATUS_TYPE_VALUES,
  DEFAULT_CONTRACT_STATUS_TYPES,
  DEFAULT_CONTRACT_STATUSES,
  TERMINAL_CONTRACT_STATUS_TYPES,
} from '@/contract/constants';
import { contractStatusSchema } from '@/contract/db/definitions/status';
import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';

export interface IContractStatusModel extends Model<any> {
  getContractStatus(_id: string): Promise<IContractStatusDocument>;
  getContractStatuses(projectId: string, type: string): Promise<IContractStatusDocument[]>;

  createContractStatus(input: IContractStatus): Promise<IContractStatusDocument>;
  updateContractStatus(_id: string, input: IContractStatus): Promise<IContractStatusDocument>;
  updateContractStatusOrder(_id: string, order: number): Promise<IContractStatusDocument>;
  removeContractStatus(_id: string): Promise<IContractStatusDocument>;

  validateContractStatus(status: IContractStatus): Promise<void>;
  generateDefaultContractStatus(projectId: string): Promise<void>;
}

export const loadContractStatusClass = (models: IModels) => {
  class ContractStatus {
    public static async getContractStatus(_id: string) {
      const status = await models.ContractStatus.findOne({ _id });

      if (!status) {
        throw new Error('Contract status not found');
      }

      return status;
    }

    public static async getContractStatuses(projectId: string, type: string) {
      const project = await models.Project.getProject(projectId);

      return models.ContractStatus.find({ projectId: project._id, type })
        .sort({ order: 1 })
        .lean();
    }

    public static async createContractStatus(input: IContractStatus) {
      await models.ContractStatus.validateContractStatus(input);

      const { projectId, type } = input;

      const project = await models.Project.getProject(projectId);

      const lastStatus = await models.ContractStatus.findOne({
        projectId: project._id,
        type,
      }).sort({ order: -1 });

      const order = lastStatus ? lastStatus.order + 1 : 0;

      const status = await models.ContractStatus.create({
        ...input,
        order,
        projectId: project._id,
      });

      return status;
    }

    public static async updateContractStatus(_id: string, input: IContractStatus) {
      await models.ContractStatus.validateContractStatus(input);

      const project = await models.Project.getProject(input.projectId);

      const status = await models.ContractStatus.findOneAndUpdate(
        { _id },
        {
          ...input,
          projectId: project._id,
        },
        { new: true },
      );

      return status;
    }

    public static async updateContractStatusOrder(_id: string, order: number) {
      const status = await models.ContractStatus.findOneAndUpdate(
        { _id },
        { $set: { order } },
        { new: true },
      );

      if (!status) {
        throw new Error('Contract status not found');
      }

      return status;
    }

    public static async removeContractStatus(_id: string) {
      const status = await models.ContractStatus.findOneAndDelete({ _id });

      if (!status) {
        throw new Error('Contract status not found');
      }

      return status;
    }

    public static async generateDefaultContractStatus(projectId: string) {
      const existing = await models.ContractStatus.exists({ projectId });

      if (existing) {
        return;
      }

      const statuses: IContractStatus[] = [];

      for (const STATUS_TYPE_KEY in DEFAULT_CONTRACT_STATUS_TYPES) {
        const STATUS_TYPE = DEFAULT_CONTRACT_STATUS_TYPES[STATUS_TYPE_KEY];

        const CHILDREN = DEFAULT_CONTRACT_STATUSES[STATUS_TYPE];
        let order = 0;

        for (const CHILD_KEY in CHILDREN) {
          statuses.push({
            projectId,
            ...CHILDREN[CHILD_KEY],
            order,
          });
          order++;
        }
      }

      if (statuses.length) {
        await models.ContractStatus.insertMany(statuses);
      }
    }

    public static async validateContractStatus(status: IContractStatus) {
      const { type } = status || {};

      if (!type) {
        throw new Error('Type is required');
      }

      if (TERMINAL_CONTRACT_STATUS_TYPES.includes(type)) {
        throw new Error(
          `Cannot set contract status type to terminal type: ${type}`,
        );
      }

      const defaultTypes = Object.values(DEFAULT_CONTRACT_STATUS_TYPES);

      if (!defaultTypes.includes(type)) {
        throw new Error(`Invalid contract status type: ${type}`);
      }

      const statusType = await models.ContractStatus.findOne({ name: type });

      if (statusType) {
        throw new Error(
          `Cannot set contract status name to another type value: ${type}`,
        );
      }
    }
  }

  contractStatusSchema.loadClass(ContractStatus);

  return contractStatusSchema;
};

export { DEFAULT_CONTRACT_STATUS_TYPE_VALUES };
