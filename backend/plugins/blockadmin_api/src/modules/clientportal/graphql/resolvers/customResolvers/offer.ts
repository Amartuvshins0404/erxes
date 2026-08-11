import { IContext } from '~/connectionResolvers';
import { IOfferDocument } from '@/contract/@types/offer';

export default {
  // `unit` is already a raw unit-id string on CpBlockOffer, so the full
  // record is exposed here under a different field name.
  unitDetail: async (
    { unit }: IOfferDocument,
    _args: any,
    { models }: IContext,
  ) => {
    return models.Unit.findOne({ _id: unit });
  },
  project: async (
    { unit }: IOfferDocument,
    _args: any,
    { models }: IContext,
  ) => {
    const offerUnit = await models.Unit.findOne({ _id: unit });

    if (!offerUnit) {
      return null;
    }

    const zoning = await models.Zoning.findOne({ _id: offerUnit.zoning });

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
    { unit }: IOfferDocument,
    _args: any,
    { models }: IContext,
  ) => {
    const offerUnit = await models.Unit.findOne({ _id: unit });

    if (!offerUnit) {
      return null;
    }

    return models.UnitType.findOne({ _id: offerUnit.type });
  },
};
