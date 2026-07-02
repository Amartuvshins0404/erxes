import { IContext } from '~/connectionResolvers';
import { IContract } from '@/contract/@types/contract';

function stripNulls<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;
}

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
      input.paymentPlan = stripNulls(input.paymentPlan) as typeof input.paymentPlan;
    }
    return models.Contract.createContract(input);
  },
  blockUpdateContract: async (
    _parent: undefined,
    { _id, input }: { _id: string; input: IContract },
    { models }: IContext,
  ) => {
    if (input.paymentPlan) {
      input.paymentPlan = stripNulls(input.paymentPlan) as typeof input.paymentPlan;
    }
    return models.Contract.updateContract(_id, input);
  },
  blockUpdateContractStatus: async (
    _parent: undefined,
    { _id, status }: { _id: string; status: string },
    { models }: IContext,
  ) => {
    return models.Contract.updateContractStatus(_id, status);
  },
};
