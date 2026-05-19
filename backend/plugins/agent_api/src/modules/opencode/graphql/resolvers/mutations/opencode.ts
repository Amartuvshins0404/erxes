import { IContext } from '~/connectionResolvers';
import { SERVER_STATUSES } from '~/modules/agent/constants';
import { ensureLegacyIdentifierLinks } from '~/modules/assistantOrg/utils';
import {
  deployOpencodeServer,
  destroyOpencodeServer,
  fixAndRestartOpencodeServer,
  normalizeOpencodeProvider,
  setOpencodeApiKey,
} from '~/modules/opencode/utils';

export const opencodeMutations = {
  deployOpencode: async (
    _root: undefined,
    {
      identifierId,
      input,
    }: {
      identifierId: string;
      input: { provider: string; apiKey: string };
    },
    { models, subdomain }: IContext,
  ) => {
    const { provider, apiKey } = input || {};
    const normalizedProvider = normalizeOpencodeProvider(provider || '');
    const normalizedApiKey = (apiKey || '').trim();

    if (!normalizedProvider) {
      throw new Error('provider is required');
    }

    if (!normalizedApiKey) {
      throw new Error('apiKey is required');
    }

    await ensureLegacyIdentifierLinks(models);

    const identifier = await models.Identifier.findById(identifierId).lean();

    if (!identifier) {
      throw new Error('Identifier not found');
    }

    if (identifier.kind && identifier.kind !== 'agent') {
      throw new Error(
        'This identifier belongs to AI Assistant and cannot deploy Opencode.',
      );
    }

    const existing = await models.OpencodeServer.findOne({ identifierId }).lean();

    if (existing) {
      return { ...existing, identifierId: existing.identifierId };
    }

    try {
      const server = await deployOpencodeServer({
        orgId: subdomain,
        agentId: identifier.slug,
        provider: normalizedProvider,
        apiKey: normalizedApiKey,
      });

      return models.OpencodeServer.create({
        identifierId,
        name: server.serverName,
        url: server.serverUrl,
        token: server.gatewayToken,
        provider: normalizedProvider,
        serverId: String(server.serverId),
        serverPassword: server.serverPassword,
        status: SERVER_STATUSES.DEPLOYING,
      });
    } catch (error) {
      await models.OpencodeServer.deleteOne({ identifierId });

      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message);
    }
  },

  destroyOpencode: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);

    const opencode = await models.OpencodeServer.findOne({ identifierId }).lean();

    if (!opencode) {
      throw new Error('Opencode server not found');
    }

    try {
      await destroyOpencodeServer(opencode);
      await models.OpencodeServer.deleteOne({ _id: opencode._id });

      return { ...opencode, identifierId: opencode.identifierId };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message);
    }
  },

  fixAndRestartOpencode: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);

    const opencode = await models.OpencodeServer.findOne({ identifierId }).lean();

    if (!opencode) {
      throw new Error('Opencode server not found');
    }

    try {
      await fixAndRestartOpencodeServer(opencode.name);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message);
    }
  },

  setOpencodeApiKey: async (
    _root: undefined,
    {
      identifierId,
      input,
    }: {
      identifierId: string;
      input: { provider?: string; apiKey: string };
    },
    { models }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);

    const opencode = await models.OpencodeServer.findOne({ identifierId }).lean();

    if (!opencode) {
      throw new Error('Opencode server not found');
    }

    const normalizedApiKey = (input?.apiKey || '').trim();

    if (!normalizedApiKey) {
      throw new Error('apiKey is required');
    }

    const provider = normalizeOpencodeProvider(
      input.provider || opencode.provider || '',
    );

    if (!provider) {
      throw new Error('provider is required');
    }

    try {
      await setOpencodeApiKey({
        serverName: opencode.name,
        provider,
        apiKey: normalizedApiKey,
      });

      if (provider !== opencode.provider) {
        await models.OpencodeServer.updateOne(
          { _id: opencode._id },
          { $set: { provider } },
        );
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message);
    }
  },
};
