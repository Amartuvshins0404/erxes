import { markResolvers } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';

const getBlockCustomer = async (
  models: IContext['models'],
  customerId: string | undefined,
) => {
  if (!customerId) {
    return null;
  }

  return models.BlockCustomer.findOne({ customerId }).lean();
};

const getOwnedContract = async (
  models: IContext['models'],
  customerId: string | undefined,
  contractId: string,
) => {
  const blockCustomer = await getBlockCustomer(models, customerId);

  if (!blockCustomer) {
    return null;
  }

  return models.Contract.findOne({
    entityId: contractId,
    customerId: blockCustomer.entityId,
  }).lean();
};

const summarizePayments = (
  payments: { amount?: number; paidAmount?: number; status?: string }[],
) => {
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
      (payment) => payment.status !== 'paid' && payment.status !== 'cancelled',
    ) || null;

  return {
    totalAmount,
    totalPaidAmount,
    totalUnpaidAmount: totalAmount - totalPaidAmount,
    nextPayment,
  };
};

export const cpContractQueries = {
  cpBlockAdminGetContracts: async (
    _parent: undefined,
    _args: undefined,
    { models, cpUser }: IContext,
  ) => {
    const blockCustomer = await getBlockCustomer(
      models,
      cpUser?.erxesCustomerId,
    );

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

    return summarizePayments(payments);
  },

  // User-wide equivalents of the two queries above: aggregate across every
  // contract this customer holds (possibly across multiple orgs), instead of
  // one contractId at a time.
  cpBlockAdminGetPayments: async (
    _parent: undefined,
    _args: undefined,
    { models, cpUser }: IContext,
  ) => {
    const blockCustomer = await getBlockCustomer(
      models,
      cpUser?.erxesCustomerId,
    );

    if (!blockCustomer) {
      return [];
    }

    return models.ContractPayment.find({
      customerId: blockCustomer.entityId,
    })
      .sort({ dueDate: 1 })
      .lean();
  },

  cpBlockAdminGetSummary: async (
    _parent: undefined,
    _args: undefined,
    { models, cpUser }: IContext,
  ) => {
    const blockCustomer = await getBlockCustomer(
      models,
      cpUser?.erxesCustomerId,
    );

    if (!blockCustomer) {
      return null;
    }

    const payments = await models.ContractPayment.find({
      customerId: blockCustomer.entityId,
    })
      .sort({ dueDate: 1 })
      .lean();

    return summarizePayments(payments);
  },
};

markResolvers(cpContractQueries, {
  wrapperConfig: {
    forClientPortal: true,
    cpUserRequired: true,
  },
});
