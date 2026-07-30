import { IContext } from '~/connectionResolvers';
import { SERVER_STATUSES } from '~/modules/agent/constants';
import { assertIdentifierManageAccess } from '~/modules/assistantOrg/permissions';
import { ensureLegacyIdentifierLinks } from '~/modules/assistantOrg/utils';
import {
  deployOpencodeServer,
  destroyOpencodeServer,
  fixAndRestartOpencodeServer,
  getOpencodeGatewayToken,
  getOpencodeServerPassword,
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
    { models, subdomain, user }: IContext,
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
    await assertIdentifierManageAccess(models, identifierId, user);

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


  transferOpencode: async (
    _root: undefined,
    {
      identifierId,
      input,
    }: {
      identifierId: string;
      input: {
        serverName: string;
        gatewayToken: string;
        provider: string;
        serverUrl: string;
        serverId?: string;
        serverPassword?: string;
        sourceSubdomain?: string;
      };
    },
    { models, user }: IContext,
  ) => {
    const serverName = input?.serverName?.trim();
    const gatewayToken = input?.gatewayToken?.trim();
    const provider = normalizeOpencodeProvider(input?.provider || '');
    const serverUrl = input?.serverUrl?.trim();

    if (!serverName) {
      throw new Error('serverName is required');
    }

    if (!gatewayToken) {
      throw new Error('gatewayToken is required');
    }

    if (!provider) {
      throw new Error('provider is required');
    }

    if (!serverUrl) {
      throw new Error('serverUrl is required');
    }

    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierManageAccess(models, identifierId, user);

    const identifier = await models.Identifier.findById(identifierId).lean();

    if (!identifier) {
      throw new Error('Identifier not found');
    }

    if (identifier.kind && identifier.kind !== 'agent') {
      throw new Error(
        'This identifier belongs to AI Assistant and cannot transfer Opencode.',
      );
    }

    const existing = await models.OpencodeServer.findOne({ identifierId }).lean();

    if (existing) {
      throw new Error('This identifier already has an opencode server');
    }

    return models.OpencodeServer.create({
      identifierId,
      name: serverName,
      url: serverUrl,
      token: gatewayToken,
      provider,
      serverId: input?.serverId?.trim() || '',
      serverPassword: input?.serverPassword?.trim() || undefined,
      status: SERVER_STATUSES.APPROVED,
      transferredFromSubdomain: input?.sourceSubdomain?.trim() || undefined,
      transferredAt: new Date(),
    });
  },

  createOpencodeTransferCredentials: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models, subdomain, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierManageAccess(models, identifierId, user);

    const opencode = await models.OpencodeServer.findOne({ identifierId }).lean();

    if (!opencode) {
      throw new Error('Opencode server not found');
    }

    const gatewayToken =
      opencode.token || (await getOpencodeGatewayToken(opencode.name));
    const credentials = opencode.serverPassword
      ? undefined
      : await getOpencodeServerPassword(opencode.name).catch(() => undefined);
    const serverPassword = opencode.serverPassword || credentials?.password;

    const credentialUpdates = {
      ...(!opencode.token && gatewayToken ? { token: gatewayToken } : {}),
      ...(!opencode.serverPassword && serverPassword ? { serverPassword } : {}),
    };

    if (Object.keys(credentialUpdates).length > 0) {
      await models.OpencodeServer.updateOne(
        { _id: opencode._id },
        { $set: credentialUpdates },
      );
    }

    return {
      kind: 'agent',
      sourceSubdomain: subdomain,
      serverName: opencode.name,
      serverUrl: opencode.url,
      gatewayToken,
      provider: opencode.provider,
      serverId: opencode.serverId,
      serverPassword,
      status: opencode.status,
    };
  },

  destroyOpencode: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierManageAccess(models, identifierId, user);

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
    { models, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierManageAccess(models, identifierId, user);

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
    { models, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierManageAccess(models, identifierId, user);

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
