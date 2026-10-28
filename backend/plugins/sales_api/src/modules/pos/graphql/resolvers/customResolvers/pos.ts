import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { IStructureEntity } from 'erxes-api-shared/core-types';
import { IContext } from '~/connectionResolvers';

const getStructureEntityTitle = async (
  subdomain: string,
  entityId?: string,
): Promise<string> => {
  if (!entityId) {
    return '';
  }

  const entity: IStructureEntity | null = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    module: 'structureEntities',
    action: 'findOne',
    input: { query: { _id: entityId } },
    defaultValue: null,
  });

  return entity?.title || '';
};

const resolvers = {
  user: async (pos, _, { subdomain }: IContext) => {
    if (!pos.userId) {
      return null;
    }
    return sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      module: 'users',
      action: 'findOne',
      input: { _id: pos.userId },
    });
  },

  placeEntityTitle: (pos, _, { subdomain }: IContext) =>
    getStructureEntityTitle(subdomain, pos.placeEntityId),

  responsibleEntityTitle: (pos, _, { subdomain }: IContext) =>
    getStructureEntityTitle(subdomain, pos.responsibleEntityId),
};

export default resolvers;
