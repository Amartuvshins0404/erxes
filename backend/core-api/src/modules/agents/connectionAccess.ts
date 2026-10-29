import type { IResolvedConnection } from 'erxes-api-shared/core-modules';
import type { IModels } from '~/connectionResolvers';
import type { IConnectionDocument } from '@/connections/@types/connection';
import { toResolvedConnection } from '@/connections/access';

export const AGENTS_CONNECTION_CATEGORY = 'ai';

export const NO_CONNECTION_MESSAGE =
  'Add an AI connection in Settings → Connections to start using Agents.';

export const orderUsableConnections = <
  T extends { scope: string; createdAt?: Date },
>(
  connections: T[],
): T[] => {
  const time = (connection: T) => connection.createdAt?.getTime() ?? 0;

  return [...connections].sort((a, b) => {
    if (a.scope !== b.scope) {
      return a.scope === 'personal' ? -1 : 1;
    }

    return time(a) - time(b);
  });
};

export const pickUsableConnection = <T extends { _id: string }>(
  usable: T[],
  {
    requestedId,
    defaultId,
  }: { requestedId?: string; defaultId?: string | null },
): T | undefined => {
  const wanted = requestedId?.trim();

  if (wanted) {
    return usable.find((connection) => connection._id === wanted);
  }

  return usable.find((connection) => connection._id === defaultId) ?? usable[0];
};

export const listUsableConnections = async (
  models: IModels,
  userId: string,
): Promise<IConnectionDocument[]> =>
  orderUsableConnections(
    await models.Connections.listForUser(userId, {
      category: AGENTS_CONNECTION_CATEGORY,
    }),
  );

export const getDefaultConnectionId = async (
  models: IModels,
  userId: string,
): Promise<string | null> => {
  const preferences = await models.AgentsUserPreferences.findOne({
    userId,
  }).lean();

  return preferences?.defaultConnectionId ?? null;
};

export const resolveUsableConnection = async (
  models: IModels,
  userId: string,
  requestedId?: string,
): Promise<{
  resolved: IResolvedConnection;
  unreadable: string[];
  scope: string;
} | null> => {
  const usable = await listUsableConnections(models, userId);
  const picked = pickUsableConnection(usable, {
    requestedId,
    defaultId: await getDefaultConnectionId(models, userId),
  });

  return picked
    ? { ...toResolvedConnection(picked), scope: picked.scope }
    : null;
};
