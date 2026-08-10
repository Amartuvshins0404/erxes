import { IContext } from '~/connectionResolvers';
import { IContractDocument } from '@/contract/@types/contract';

export default {
  // `unit` is already a raw unit-id string on CpBlockContract, so the full
  // record is exposed here under a different field name.
  unitDetail: async (
    { unit }: IContractDocument,
    _args: any,
    { models }: IContext,
  ) => {
    return models.Unit.findOne({ _id: unit });
  },
  project: async (
    { unit }: IContractDocument,
    _args: any,
    { models }: IContext,
  ) => {
    const contractUnit = await models.Unit.findOne({ _id: unit });

    if (!contractUnit) {
      return null;
    }

    const zoning = await models.Zoning.findOne({ _id: contractUnit.zoning });

    if (!zoning) {
      return null;
    }

    const building = await models.Building.findOne({ _id: zoning.building });

    if (!building) {
      return null;
    }

    return models.Project.findOne({ _id: building.project });
  },
  unitType: async (
    { unit }: IContractDocument,
    _args: any,
    { models }: IContext,
  ) => {
    const contractUnit = await models.Unit.findOne({ _id: unit });

    if (!contractUnit) {
      return null;
    }

    return models.UnitType.findOne({ _id: contractUnit.type });
  },
};
