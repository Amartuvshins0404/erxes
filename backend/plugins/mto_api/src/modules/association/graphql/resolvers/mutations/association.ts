import { Resolver } from 'erxes-api-shared/core-types';
import { IAssociation } from '@/association/@types/association';
import { IContext } from '~/connectionResolvers';

export const associationMutations: Record<string, Resolver> = {
  async mtoAssociationCreate(
    _root: undefined,
    doc: IAssociation,
    { models }: IContext,
  ) {
    return models.Association.createAssociation(doc);
  },

  async mtoAssociationUpdate(
    _root: undefined,
    { _id, ...doc }: { _id: string } & Partial<IAssociation>,
    { models }: IContext,
  ) {
    return models.Association.updateAssociation(_id, doc);
  },

  async mtoAssociationsRemove(
    _root: undefined,
    { ids }: { ids: string[] },
    { models }: IContext,
  ) {
    return models.Association.removeAssociations(ids);
  },
};
