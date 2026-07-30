import { IAssociationDocument } from '@/association/@types/association';
import { IContext } from '~/connectionResolvers';

const associationCustomResolvers = {
  MtoActivityAssociation: {
    parent: async (
      association: IAssociationDocument,
      _params: undefined,
      { models }: IContext,
    ) => {
      if (!association.parentId) {
        return null;
      }

      return models.Association.findOne({ _id: association.parentId });
    },
  },
};

export default associationCustomResolvers;
