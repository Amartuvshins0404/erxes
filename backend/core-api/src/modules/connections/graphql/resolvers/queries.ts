import { getAvailablePlugins } from 'erxes-api-shared/utils';
import type { IContext } from '~/connectionResolvers';
import { getSecretStatus } from '@/connections/access';
import type { IConnectionDocument } from '@/connections/@types/connection';
import { listConnectionTypes } from '@/connections/types';

export const toPublicConnection = (document: IConnectionDocument) => {
  const { set, unreadable } = getSecretStatus(document);

  return {
    _id: document._id,
    type: document.type,
    name: document.name,
    scope: document.scope,
    ownerId: document.ownerId,
    config: document.config || {},
    services: document.services || [],
    createdBy: document.createdBy,
    updatedBy: document.updatedBy,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    secretsSet: set,
    secretsUnreadable: unreadable,
  };
};

const GRANTABLE_CORE_SERVICES = ['automations'];

export const connectionsQueries = {
  connectionsTypes: async (
    _parent: undefined,
    { category }: { category?: string },
  ) =>
    listConnectionTypes(category).map(
      ({
        type,
        label,
        description,
        category: typeCategory,
        fields,
        defaultServices,
      }) => ({
        type,
        label,
        description,
        category: typeCategory,
        fields,
        defaultServices,
      }),
    ),

  connections: async (
    _parent: undefined,
    args: { type?: string; category?: string; scope?: string },
    { models, user }: IContext,
  ) => {
    const connections = await models.Connections.listForUser(user._id, args);

    return connections.map(toPublicConnection);
  },

  connectionsDetail: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, user }: IContext,
  ) => {
    const connection = await models.Connections.getForUser(_id, user._id);

    return connection ? toPublicConnection(connection) : null;
  },

  connectionsServices: async (
    _parent: undefined,
    _args: undefined,
    { subdomain }: IContext,
  ) => {
    const plugins = await getAvailablePlugins(subdomain);

    return [
      ...new Set([
        ...GRANTABLE_CORE_SERVICES,
        ...plugins.filter((plugin) => plugin && plugin !== 'core'),
      ]),
    ].sort();
  },
};
