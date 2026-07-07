import { IUnitDocument } from '@/unit/@types/unit';
import { IContext } from '~/connectionResolvers';

export default {
  unitType: async (
    unit: IUnitDocument,
    _args: undefined,
    { models }: IContext,
  ) => {
    if (!unit.type) return null;

    return await models.UnitType.findOne({ _id: unit.type });
  },

  zoningData: async (
    unit: IUnitDocument,
    _args: undefined,
    { models }: IContext,
  ) => {
    if (!unit.zoning) return null;

    return await models.Zoning.findOne({ _id: unit.zoning });
  },

  buildingData: async (
    unit: IUnitDocument,
    _args: undefined,
    { models }: IContext,
  ) => {
    if (!unit.zoning) return null;

    const zoning = await models.Zoning.findOne({ _id: unit.zoning });

    if (!zoning) {
      return null;
    }

    return await models.Building.findOne({ _id: zoning.building });
  },

  projectData: async (
    unit: IUnitDocument,
    _args: undefined,
    { models }: IContext,
  ) => {
    if (!unit.zoning) return null;

    const zoning = await models.Zoning.findOne({ _id: unit.zoning });

    if (!zoning) {
      return null;
    }

    const building = await models.Building.findOne({ _id: zoning.building });

    if (!building) {
      return null;
    }

    return await models.Project.findOne({ _id: building.project });
  },
};
