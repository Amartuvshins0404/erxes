import type { IResolvedConnection } from 'erxes-api-shared/core-modules';
import { ExpectedError } from 'erxes-api-shared/utils';
import type { IContext } from '~/connectionResolvers';
import { canOpenSecret, openSecret } from './crypto';
import type { IConnection } from './@types/connection';

type TAccessSubject = Pick<IConnection, 'scope' | 'ownerId' | 'services'>;

export const canServiceResolve = (
  connection: TAccessSubject,
  serviceName: string,
): boolean =>
  connection.scope === 'workspace' && connection.services.includes(serviceName);

export const canUserUse = (
  connection: TAccessSubject,
  userId: string,
): boolean =>
  connection.scope === 'workspace' ||
  (connection.scope === 'personal' && connection.ownerId === userId);

export const assertCanManage = async (
  ctx: Pick<IContext, 'user' | 'checkPermission'>,
  connection: TAccessSubject,
): Promise<void> => {
  if (connection.scope === 'personal') {
    if (connection.ownerId !== ctx.user._id) {
      throw new ExpectedError('Connection not found', 'NOT_FOUND');
    }

    return;
  }

  await ctx.checkPermission('connectionsManage');
};

type TSecretSubject = Pick<IConnection, 'secrets'> & { _id: string };

export const getSecretStatus = (
  connection: TSecretSubject,
): { set: string[]; unreadable: string[] } => {
  const set: string[] = [];
  const unreadable: string[] = [];

  for (const [field, stored] of Object.entries(connection.secrets || {})) {
    (canOpenSecret({ connectionId: connection._id, field, stored })
      ? set
      : unreadable
    ).push(field);
  }

  return { set, unreadable };
};

export const toResolvedConnection = (
  connection: TSecretSubject & Pick<IConnection, 'type' | 'name' | 'config'>,
): { resolved: IResolvedConnection; unreadable: string[] } => {
  const secrets: Record<string, string> = {};
  const unreadable: string[] = [];

  for (const [field, stored] of Object.entries(connection.secrets || {})) {
    const value = openSecret({ connectionId: connection._id, field, stored });

    if (value === null) {
      unreadable.push(field);
    } else {
      secrets[field] = value;
    }
  }

  return {
    resolved: {
      _id: connection._id,
      type: connection.type,
      name: connection.name,
      config: connection.config || {},
      secrets,
    },
    unreadable,
  };
};
