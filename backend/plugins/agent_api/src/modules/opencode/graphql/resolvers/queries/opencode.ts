import { IContext } from '~/connectionResolvers';
import { ensureLegacyIdentifierLinks } from '~/modules/assistantOrg/utils';
import {
  getOpencodeGatewayToken,
  getOpencodeServerInfo,
  getOpencodeServerPassword,
  isOpencodeServerReady,
} from '~/modules/opencode/utils';
import { SERVER_STATUSES } from '~/modules/agent/constants';

export const opencodeQueries = {
  getOpencode: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);

    const opencode = await models.OpencodeServer.findOne({ identifierId }).lean();

    if (!opencode) {
      return null;
    }

    if (opencode.status !== SERVER_STATUSES.DEPLOYING) {
      if (opencode.token) {
        return { ...opencode, identifierId: opencode.identifierId };
      }

      try {
        const token = await getOpencodeGatewayToken(opencode.name);
        return models.OpencodeServer.findOneAndUpdate(
          { _id: opencode._id },
          { $set: { token } },
          { new: true },
        )
          .lean()
          .then((updated) =>
            updated
              ? { ...updated, identifierId: updated.identifierId }
              : { ...opencode, token, identifierId: opencode.identifierId },
          );
      } catch {
        return { ...opencode, identifierId: opencode.identifierId };
      }
    }

    try {
      const remote = await getOpencodeServerInfo(opencode.name);
      const serverUrl = remote.serverUrl || opencode.url;
      const ready =
        remote.status === 'running' &&
        (await isOpencodeServerReady(serverUrl));
      const nextStatus =
        ready ? SERVER_STATUSES.APPROVED : SERVER_STATUSES.DEPLOYING;
      const token =
        ready && !opencode.token
          ? await getOpencodeGatewayToken(opencode.name).catch(() => undefined)
          : opencode.token;

      return models.OpencodeServer.findOneAndUpdate(
        { _id: opencode._id },
        {
          $set: {
            status: nextStatus,
            url: serverUrl,
            ...(token ? { token } : {}),
            serverId: String(remote.serverId || opencode.serverId),
          },
        },
        { new: true },
      )
        .lean()
        .then((updated) =>
          updated
            ? { ...updated, identifierId: updated.identifierId }
            : updated,
        );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('Server not found')) {
        return models.OpencodeServer.findOneAndUpdate(
          { _id: opencode._id },
          { $set: { status: SERVER_STATUSES.FAILED } },
          { new: true },
        )
          .lean()
          .then((updated) =>
            updated
              ? { ...updated, identifierId: updated.identifierId }
              : updated,
          );
      }

      return { ...opencode, identifierId: opencode.identifierId };
    }
  },

  getOpencodeCredentials: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);

    const opencode = await models.OpencodeServer.findOne({ identifierId }).lean();

    if (!opencode) {
      throw new Error('Opencode server not found');
    }

    if (opencode.serverPassword) {
      return {
        username: 'opencode',
        password: opencode.serverPassword,
      };
    }

    return getOpencodeServerPassword(opencode.name);
  },
};
