import { markResolvers } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';

export const cpContractQueries = {
  cpBlockAdminGetContracts: async (
    _parent: undefined,
    _args: undefined,
    { models, subdomain, cpUser }: IContext,
  ) => {
    const customerId = cpUser?.erxesCustomerId;

    console.log('cpBlockAdminGetContracts', { customerId, subdomain });

    if (!customerId) {
      return [];
    }

    const blockCustomer = await models.BlockCustomer.findOne({
      customerId,
    }).lean();

    if (!blockCustomer) {
      return [];
    }

    return models.Contract.find({
      customerId: blockCustomer.entityId,
    }).lean();
  },
};

markResolvers(cpContractQueries, {
  wrapperConfig: {
    forClientPortal: true,
    cpUserRequired: true,
  },
});
