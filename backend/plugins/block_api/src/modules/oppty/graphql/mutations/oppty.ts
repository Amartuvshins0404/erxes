import { IContext } from '~/connectionResolvers';
import { IBlockOpptyInput } from '@/oppty/@types/oppty';
import { IContractPaymentPlan } from '@/contract/@types/contract';

export const opptyMutations = {
  blockCreateOppty: async (
    _parent: undefined,
    { input }: { input: IBlockOpptyInput },
    { models }: IContext,
  ) => {
    const unitIds = new Set<string>();
    if (input.unit) unitIds.add(input.unit);
    (input.units || []).forEach((u) => u && unitIds.add(u));
    (input.propertyRows || []).forEach(
      (r) => r.unitId && unitIds.add(r.unitId),
    );

    if (unitIds.size) {
      const lockedUnit = await models.Unit.findOne({
        _id: { $in: Array.from(unitIds) },
        locked: true,
      });
      if (lockedUnit) {
        throw new Error('Cannot create opportunity: unit is locked');
      }
    }

    return models.Oppty.createOppty(input);
  },

  blockUpdateOppty: async (
    _parent: undefined,
    { _id, input }: { _id: string; input: IBlockOpptyInput },
    { models }: IContext,
  ) => {
    return models.Oppty.updateOppty(_id, input);
  },

  blockDeleteOppty: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return models.Oppty.deleteOppty(_id);
  },

  blockOpptyConvertToContract: async (
    _parent: undefined,
    {
      _id,
      unit,
      paymentPlan,
    }: { _id: string; unit: string; paymentPlan: IContractPaymentPlan },
    { models }: IContext,
  ) => {
    return 'success';
  },
};
