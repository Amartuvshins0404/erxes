import { Resolver } from 'erxes-api-shared/core-types';
import { ITravelAssociation } from '@/travelAssociation/@types/travelAssociation';
import { IContext } from '~/connectionResolvers';

export const travelAssociationMutations: Record<string, Resolver> = {
  async mtoTravelAssociationCreate(
    _root: undefined,
    doc: ITravelAssociation,
    { models }: IContext,
  ) {
    return models.TravelAssociation.createTravelAssociation(doc);
  },

  async mtoTravelAssociationUpdate(
    _root: undefined,
    { _id, ...doc }: { _id: string } & Partial<ITravelAssociation>,
    { models }: IContext,
  ) {
    return models.TravelAssociation.updateTravelAssociation(_id, doc);
  },

  async mtoTravelAssociationsRemove(
    _root: undefined,
    { ids }: { ids: string[] },
    { models }: IContext,
  ) {
    return models.TravelAssociation.removeTravelAssociations(ids);
  },
};
