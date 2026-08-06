import { markResolvers } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';

const getOwnedContract = async (
  models: IContext['models'],
  customerId: string | undefined,
  contractId: string,
) => {
  if (!customerId) {
    return null;
  }

  const blockCustomer = await models.BlockCustomer.findOne({
    customerId,
  }).lean();

  if (!blockCustomer) {
    return null;
  }

  return models.Contract.findOne({
    entityId: contractId,
    customerId: blockCustomer.entityId,
  }).lean();
};

export const cpContractQueries = {
  cpBlockAdminGetContracts: async (
    _parent: undefined,
    _args: undefined,
    { models, cpUser }: IContext,
  ) => {
    const customerId = cpUser?.erxesCustomerId;

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

  cpBlockAdminGetContractPayments: async (
    _parent: undefined,
    { contractId }: { contractId: string },
    { models, cpUser }: IContext,
  ) => {
    const contract = await getOwnedContract(
      models,
      cpUser?.erxesCustomerId,
      contractId,
    );

    if (!contract) {
      return [];
    }

    return models.ContractPayment.find({ contractId })
      .sort({ dueDate: 1 })
      .lean();
  },

  cpBlockAdminGetContractSummary: async (
    _parent: undefined,
    { contractId }: { contractId: string },
    { models, cpUser }: IContext,
  ) => {
    const contract = await getOwnedContract(
      models,
      cpUser?.erxesCustomerId,
      contractId,
    );

    if (!contract) {
      return null;
    }

    const payments = await models.ContractPayment.find({ contractId })
      .sort({ dueDate: 1 })
      .lean();

    const totalAmount = payments.reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0,
    );
    const totalPaidAmount = payments.reduce(
      (sum, payment) => sum + (payment.paidAmount || 0),
      0,
    );

    const nextPayment =
      payments.find(
        (payment) =>
          payment.status !== 'paid' && payment.status !== 'cancelled',
      ) || null;

    return {
      totalAmount,
      totalPaidAmount,
      totalUnpaidAmount: totalAmount - totalPaidAmount,
      nextPayment,
    };
  },
};

markResolvers(cpContractQueries, {
  wrapperConfig: {
    forClientPortal: true,
    cpUserRequired: true,
  },
});
