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
    console.log(input);
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
    { _id, status }: { _id: string; status: string },
    { models }: IContext,
  ) => {
    return models.Contract.updateContractStatus(_id, status);
  },
};
