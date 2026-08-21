import { IContext } from '~/connectionResolvers';
import { IContract } from '@/contract/@types/contract';
import { sendMessageAwait, syncCustomerToBlockAdmin } from '@/admin/utils';
import { syncContractPayments } from '@/contract/utils/paymentsSync';
import { buildContractMirrorInput } from '@/contract/utils/mirror';

function stripNulls<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;
}

// block-admin only knows the semantic status type (draft/signed/...), not
// this org's own custom ContractStatus _id, so the mirrored payload must
// carry the resolved type instead of the raw reference.
const resolveStatusTypeForMirror = async (
  models: IContext['models'],
  input: IContract,
) => {
  if (!input.status) {
    return;
  }

  const status = await models.ContractStatus.findOne({ _id: input.status });

  input.status = status?.type as IContract['status'];
};

export const contractMutations = {
  blockCreateContract: async (
    _parent: undefined,
    { input }: { input: IContract },
    { models }: IContext,
  ) => {
    if (input.unit) {
      const unit = await models.Unit.findOne({ _id: input.unit });
      if (unit?.locked) {
        throw new Error('Cannot create contract: unit is locked');
      }
    }
    if (input.paymentPlan) {
      input.paymentPlan = stripNulls(
        input.paymentPlan,
      ) as typeof input.paymentPlan;
    }

    const created = await models.Contract.createContract(input);

    await resolveStatusTypeForMirror(models, input);

    return created;
  },

  blockUpdateContract: async (
    _parent: undefined,
    { _id, input }: { _id: string; input: IContract },
    { models }: IContext,
  ) => {
    if (input.paymentPlan) {
      input.paymentPlan = stripNulls(
        input.paymentPlan,
      ) as typeof input.paymentPlan;
    }

    const updated = await models.Contract.updateContract(_id, input);

    await resolveStatusTypeForMirror(models, input);

    return updated;
  },

  blockUpdateContractStatus: async (
    _parent: undefined,
    args: { _id: string; status: string; input?: IContract },
    { models }: IContext,
  ) => {
    const updated = await models.Contract.updateContractStatus(
      args._id,
      args.status,
    );

    if (updated) {
      const contractStatus = await models.ContractStatus.findOne({
        _id: updated.status,
      });

      // block-admin has no route for blockUpdateContractStatus's original
      // {_id, status} shape, so reshape the mirrored payload to match
      // blockCreateContract/blockUpdateContract's {input: {...}} shape.
      args.input = buildContractMirrorInput(
        updated,
        contractStatus?.type as IContract['status'],
      );
    }

    return updated;
  },

  // Manual re-sync for a single contract: resyncs the customer link, mirrors
  // the contract itself, and regenerates+syncs its full payment/transaction
  // schedule to block-admin. This is the on-demand version of what already
  // happens automatically when a contract is signed.
  blockManualSyncContract: async (
    _parent: undefined,
    { contractId }: { contractId: string },
    { models, subdomain }: IContext & { subdomain: string },
  ) => {
    const contract = await models.Contract.getContract(contractId);

    if (!contract) {
      throw new Error('Contract not found');
    }

    const status = contract.status
      ? await models.ContractStatus.findOne({ _id: contract.status })
      : null;

    if (status?.type !== 'signed') {
      throw new Error('Only signed contracts can be synced to Block Platform');
    }

    if (contract.customerId) {
      await syncCustomerToBlockAdmin(subdomain, contract.customerId, models);
    }

    const response = await sendMessageAwait({
      subdomain,
      path: 'blockUpdateContract',
      payload: {
        entityId: contract._id,
        data: {
          input: buildContractMirrorInput(contract, status.type),
        },
      },
    });

    if (response?.error) {
      throw new Error(response.error);
    }

    await models.ContractPayment.regenerateForContract(contractId, true);

    const payments = await models.ContractPayment.find({ contractId });
    syncContractPayments(contractId, payments, subdomain);

    return contract;
  },
};
