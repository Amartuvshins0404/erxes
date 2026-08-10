import { IContext } from '~/connectionResolvers';
import { IUnitDocument } from '~/modules/unit/@types/unit';

export default {
  zoning: async (
    { zoning }: IUnitDocument,
    _args: any,
    { models }: IContext,
  ) => {
    const unitZoning = await models.Zoning.findOne({ _id: zoning });

    if (!unitZoning) {
      return null;
    }

    return unitZoning;
  },
  building: async (
    { zoning }: IUnitDocument,
    _args: any,
    { models }: IContext,
  ) => {
    const unitZoning = await models.Zoning.findOne({ _id: zoning });

    if (!unitZoning) {
      return null;
    }

    const building = await models.Building.findOne({
      _id: unitZoning.building,
    });

    if (!building) {
      return null;
    }

    return building;
  },
  type: async ({ type }: IUnitDocument, _args: any, { models }: IContext) => {
    const unitType = await models.UnitType.findOne({ _id: type });

    if (!unitType) {
      return null;
    }

    return unitType;
  },
  project: async (
    { zoning }: IUnitDocument,
    _args: any,
    { models }: IContext,
  ) => {
    const unitZoning = await models.Zoning.findOne({ _id: zoning });

    if (!unitZoning) {
      return null;
    }

    const building = await models.Building.findOne({
      _id: unitZoning.building,
    });

    if (!building) {
      return null;
    }

    return models.Project.findOne({ _id: building.project }).lean();
  },
};
