import {
  DEFAULT_CONTRACT_STATUS_TYPE_VALUES,
  DEFAULT_CONTRACT_STATUS_TYPES,
} from '@/contract/constants';
import { IContext } from '~/connectionResolvers';

export const contractStatusQueries = {
  getBlockContractStatus: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return models.ContractStatus.getContractStatus(_id);
  },

  getBlockContractStatuses: async (
    _root: undefined,
    { projectId }: { projectId: string },
    { models }: IContext,
  ) => {
    const statuses = await Promise.all(
      Object.values(DEFAULT_CONTRACT_STATUS_TYPES).map((type) =>
        models.ContractStatus.getContractStatuses(projectId, type),
      ),
    );

    return statuses
      .flat()
      .map(({ name, _id, color, type, order, projectId }) => ({
        _id,
        name,
        color,
        type,
        order,
        projectId,
      }));
  },

  getBlockContractStatusTypes: async () => {
    return Object.values(DEFAULT_CONTRACT_STATUS_TYPES).map(
      (type) => DEFAULT_CONTRACT_STATUS_TYPE_VALUES[type],
    );
  },
};
