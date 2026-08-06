import { IContext } from '~/connectionResolvers';
import { IContract } from '@/contract/@types/contract';

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
      args.input = {
        _id: updated._id,
        unit: String(updated.unit),
        number: updated.number,
        currency: updated.currency,
        date: updated.date,
        amount: updated.amount,
        customerId: updated.customerId,
        paymentPlan: updated.paymentPlan,
        user: updated.user,
        description: updated.description,
        status: contractStatus?.type as IContract['status'],
      };
    }

    return updated;
  },
};
