import { IContractStatus } from '@/contract/@types/status';
import { IContext } from '~/connectionResolvers';

export const contractStatusMutations = {
  createBlockContractStatus: async (
    _root: undefined,
    { input }: { input: IContractStatus },
    { models }: IContext,
  ) => {
    return models.ContractStatus.createContractStatus(input);
  },

  updateBlockContractStatus: async (
    _root: undefined,
    { _id, input }: { _id: string; input: IContractStatus },
    { models }: IContext,
  ) => {
    return models.ContractStatus.updateContractStatus(_id, input);
  },

  updateBlockContractStatusOrder: async (
    _root: undefined,
    { _id, order }: { _id: string; order: number },
    { models }: IContext,
  ) => {
    return models.ContractStatus.updateContractStatusOrder(_id, order);
  },

  removeBlockContractStatus: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return models.ContractStatus.removeContractStatus(_id);
  },
};
