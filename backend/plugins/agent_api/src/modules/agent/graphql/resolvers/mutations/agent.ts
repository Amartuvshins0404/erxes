import { IContext } from '~/connectionResolvers';
import { SERVER_STATUSES } from '~/modules/agent/constants';
import { assertIdentifierManageAccess } from '~/modules/assistantOrg/permissions';
import { ensureLegacyIdentifierLinks } from '~/modules/assistantOrg/utils';
import {
  addAgent,
  addDiscordGuild,
  deployManagedServer,
  approveServer,
  deployServer,
  destroyServer,
  fixAndRestartServer,
  getGatewayToken,
  setKimiApiKey,
  updateAgentFile,
  updateDiscordSettings,
  verifyManagedRuntime,
} from '~/modules/agent/utils';
import {
  buildPluginInstallIdentifier,
  assertSafeRuntimeIdentifier,
  assertSafeRuntimeVersion,
  callManagedRuntimeOperation,
  mapRuntimePayload,
} from '~/modules/agent/runtimeClient';
import {
  createOrUpdateDiscordBinding,
  deleteDiscordBinding,
  getDiscordBinding,
  getDiscordInstallation,
  updateDiscordBinding,
} from '~/modules/agent/discordGatewayClient';

const getRuntimeUrl = (server: { url?: string; name?: string }) => {
  const configuredUrl = server.url?.trim();

  if (configuredUrl) {
    return configuredUrl;
  }

  throw new Error(
    'Assistant runtime URL is not configured. Wait until runtime provisioning finishes before connecting Discord.',
  );
};

const managedDeploymentsInProgress = new Set<string>();

const PROVISIONING_MESSAGES: Record<string, string> = {
  preparing: 'We are preparing your managed OpenClaw runtime.',
  server_lookup: 'A secure runtime server is being created or reused.',
  approved: 'Your assistant runtime is ready.',
  failed:
    'The runtime could not be prepared. You can retry provisioning. If this keeps happening, check the deployer logs.',
};

const sanitizeProvisioningError = (message: string) =>
  message
    .replace(/sk-[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/[A-Fa-f0-9]{32,}/g, '[redacted]')
    .slice(0, 500);

const provisioningUpdate = (stage: string, error?: string) => {
  const now = new Date();

  return {
    stage,
    message: PROVISIONING_MESSAGES[stage] || PROVISIONING_MESSAGES.preparing,
    updatedAt: now,
    ...(error ? { error: sanitizeProvisioningError(error) } : { error: '' }),
  };
};

const provisioningSet = (stage: string, error?: string) => {
  const progress = provisioningUpdate(stage, error);

  return {
    'provisioning.stage': progress.stage,
    'provisioning.message': progress.message,
    'provisioning.updatedAt': progress.updatedAt,
    'provisioning.error': progress.error,
  };
};

const runManagedDeployment = async ({
  models,
  subdomain,
  identifier,
  serverMongoId,
  input,
}: {
  models: IContext['models'];
  subdomain: string;
  identifier: {
    _id: string;
    name?: string;
    slug: string;
    description?: string;
  };
  serverMongoId: string;
  input: {
    kimiApiKey: string;
    provider?: string;
    description?: string;
    systemPrompt?: string;
  };
}) => {
  const identifierId = String(identifier._id);

  if (managedDeploymentsInProgress.has(identifierId)) {
    throw new Error('Managed assistant deployment is already running');
  }

  managedDeploymentsInProgress.add(identifierId);

  const description = input.description?.trim() || identifier.description || '';
  const systemPrompt = input.systemPrompt?.trim() || description || undefined;

  // Pre-compute the K8s namespace name so frontend polls during deployment
  // hit the right endpoint. Format mirrors the deployer's sanitizeId logic.
  const sanitizeId = (v: string) =>
    v.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/^-+|-+$/g, '').slice(0, 20);
  const expectedServerName = `assistant-${sanitizeId(subdomain)}-${sanitizeId(identifier.slug)}`;

  try {
    await models.AgentServer.findOneAndUpdate(
      { _id: serverMongoId },
      {
        $set: {
          status: SERVER_STATUSES.PENDING,
          name: expectedServerName,
          url: `https://${expectedServerName}.assistant.erxes.io`,
          ...provisioningSet('server_lookup'),
          updatedAt: new Date(),
        },
      },
    );

    const server = await deployManagedServer({
      orgId: subdomain,
      assistantId: identifier.slug,
      serverName: expectedServerName,
      provider: input.provider?.trim() || 'kimi',
      kimiApiKey: input.kimiApiKey.trim(),
      description,
      systemPrompt,
    });

    const updated = await models.AgentServer.findOneAndUpdate(
      { _id: serverMongoId },
      {
        $set: {
          agentId: identifier.slug,
          name: server.serverName,
          url: server.url,
          token: server.gatewayToken,
          serverId: String(server.serverId),
          status: SERVER_STATUSES.APPROVED,
          ...provisioningSet('approved'),
          updatedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!updated) {
      throw new Error('Agent server record disappeared during deployment');
    }

    return updated;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Managed assistant deployment failed:', {
      identifierId,
      message,
    });

    await models.AgentServer.findOneAndUpdate(
      { _id: serverMongoId },
      {
        $set: {
          status: SERVER_STATUSES.FAILED,
          ...provisioningSet('failed', message),
          updatedAt: new Date(),
        },
      },
    );

    throw new Error(message);
  } finally {
    managedDeploymentsInProgress.delete(identifierId);
  }
};

export const agentMutations = {
  deployAgent: async (
    _root: undefined,
    {
      identifierId,
      input,
    }: {
      identifierId: string;
      input: { token: string; kimiApiKey: string };
    },
    { models, subdomain, user }: IContext,
  ) => {
    const { token, kimiApiKey } = input || {};

    if (!token?.trim()) {
      throw new Error('Discord bot token is required');
    }

    if (!kimiApiKey?.trim()) {
      throw new Error('kimiApiKey is required');
    }

    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierManageAccess(models, identifierId, user);

    const identifier = await models.Identifier.findById(identifierId).lean();

    if (!identifier) {
      throw new Error('Identifier not found');
    }

    if (identifier.kind && identifier.kind !== 'assistant') {
      throw new Error(
        'This identifier belongs to AI Agents and cannot deploy OpenClaw.',
      );
    }

    const agentServer = await models.AgentServer.findOne({
      identifierId,
    }).lean();

    if (agentServer) {
      return { ...agentServer, identifierId: agentServer.identifierId };
    }

    try {
      const server = await deployServer({
        orgId: subdomain,
        agentId: identifier.slug,
        discordBotToken: token.trim(),
        kimiApiKey,
      });

      if (!server) {
        throw new Error('Failed to deploy server');
      }

      return models.AgentServer.create({
        identifierId,
        agentId: identifier.slug,
        name: server.serverName,
        url: server.serverUrl,
        token: server.gatewayToken,
        serverId: server.serverId,
        status: server.status === 'approved'
          ? SERVER_STATUSES.APPROVED
          : SERVER_STATUSES.DEPLOYING,
      });
    } catch (error) {
      await models.AgentServer.deleteOne({ identifierId });

      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message);
    }
  },

  deployManagedAgent: async (
    _root: undefined,
    {
      identifierId,
      input,
    }: {
      identifierId: string;
      input: {
        kimiApiKey: string;
        provider?: string;
        description?: string;
        systemPrompt?: string;
      };
    },
    { models, subdomain, user }: IContext,
  ) => {
    const { kimiApiKey } = input || {};

    if (!kimiApiKey?.trim()) {
      throw new Error('kimiApiKey is required');
    }

    if (input.provider?.trim() && input.provider.trim() !== 'kimi') {
      throw new Error('Only the Kimi provider is supported for AI Assistants');
    }

    await ensureLegacyIdentifierLinks(models);
    const identifier = await assertIdentifierManageAccess(
      models,
      identifierId,
      user,
    );

    if (identifier.kind && identifier.kind !== 'assistant') {
      throw new Error(
        'This identifier belongs to AI Agents and cannot deploy OpenClaw.',
      );
    }

    const agentServer = await models.AgentServer.findOne({
      identifierId,
    });

    if (agentServer) {
      if (
        agentServer.status === SERVER_STATUSES.PENDING ||
        agentServer.status === SERVER_STATUSES.FAILED
      ) {
        const pendingServer = await models.AgentServer.findOneAndUpdate(
          { _id: agentServer._id },
          {
            $set: {
              agentId: identifier.slug,
              status: SERVER_STATUSES.PENDING,
              provisioning: {
                ...provisioningUpdate('preparing'),
                startedAt: new Date(),
              },
              updatedAt: new Date(),
            },
          },
          { new: true },
        );

        if (!pendingServer) {
          throw new Error('Agent server not found');
        }

        const approvedServer = await runManagedDeployment({
          models,
          subdomain,
          identifier,
          serverMongoId: String(pendingServer._id),
          input,
        });

        return {
          ...approvedServer.toObject(),
          identifierId: approvedServer.identifierId,
        };
      }

      return { ...agentServer.toObject(), identifierId: agentServer.identifierId };
    }

    const serverName = identifier.slug;

    const createdServer = await models.AgentServer.create({
      identifierId,
      agentId: identifier.slug,
      name: serverName,
      url: '',
      token: '',
      serverId: '',
      status: SERVER_STATUSES.PENDING,
      provisioning: {
        ...provisioningUpdate('preparing'),
        startedAt: new Date(),
      },
    });

    const approvedServer = await runManagedDeployment({
      models,
      subdomain,
      identifier,
      serverMongoId: String(createdServer._id),
      input,
    });

    return {
      ...approvedServer.toObject(),
      identifierId: approvedServer.identifierId,
    };
  },

  transferAgent: async (
    _root: undefined,
    {
      identifierId,
      input,
    }: {
      identifierId: string;
      input: {
        serverName: string;
        gatewayToken: string;
        serverUrl?: string;
        agentId?: string;
        serverId?: string;
        sourceSubdomain?: string;
      };
    },
    { models, user }: IContext,
  ) => {
    const serverName = input?.serverName?.trim();
    const gatewayToken = input?.gatewayToken?.trim();

    if (!serverName) {
      throw new Error('serverName is required');
    }

    if (!gatewayToken) {
      throw new Error('gatewayToken is required');
    }

    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierManageAccess(models, identifierId, user);

    const identifier = await models.Identifier.findById(identifierId).lean();

    if (!identifier) {
      throw new Error('Identifier not found');
    }

    if (identifier.kind && identifier.kind !== 'assistant') {
      throw new Error(
        'This identifier belongs to AI Agents and cannot transfer OpenClaw.',
      );
    }

    const existing = await models.AgentServer.findOne({ identifierId }).lean();

    if (existing) {
      throw new Error('This identifier already has an assistant server');
    }

    return models.AgentServer.create({
      identifierId,
      agentId: input?.agentId?.trim() || identifier.slug,
      name: serverName,
      url:
        input?.serverUrl?.trim() || `https://${serverName}.assistant.erxes.io`,
      token: gatewayToken,
      serverId: input?.serverId?.trim() || '',
      status: SERVER_STATUSES.APPROVED,
      transferredFromSubdomain: input?.sourceSubdomain?.trim() || undefined,
      transferredAt: new Date(),
    });
  },

  createAgentTransferCredentials: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models, subdomain, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierManageAccess(models, identifierId, user);

    const agent = await models.AgentServer.findOne({ identifierId }).lean();

    if (!agent) {
      throw new Error('Agent server not found');
    }

    const gatewayToken = agent.token || (await getGatewayToken(agent.name));

    if (!agent.token && gatewayToken) {
      await models.AgentServer.updateOne(
        { _id: agent._id },
        { $set: { token: gatewayToken } },
      );
    }

    return {
      kind: 'assistant',
      sourceSubdomain: subdomain,
      serverName: agent.name,
      serverUrl: agent.url,
      gatewayToken,
      agentId: agent.agentId,
      serverId: agent.serverId,
      status: agent.status,
    };
  },

  approveAgent: async (
    _root: undefined,
    { identifierId, input }: { identifierId: string; input: { code: string } },
    { models, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierManageAccess(models, identifierId, user);

    const { code } = input || {};

    const agent = await models.AgentServer.findOne({ identifierId }).lean();

    if (!agent) {
      throw new Error('Agent not found');
    }

    try {
      await approveServer(agent, code);

      return models.AgentServer.findOneAndUpdate(
        { _id: agent._id },
        { $set: { status: SERVER_STATUSES.APPROVED, approveCode: code } },
        { new: true },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message);
    }
  },

  destroyAgent: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierManageAccess(models, identifierId, user);

    const agent = await models.AgentServer.findOne({ identifierId }).lean();

    if (!agent) {
      throw new Error('Agent not found');
    }

    try {
      await destroyServer(agent);

      await models.AgentServer.deleteOne({ _id: agent._id });

      return { ...agent, identifierId: agent.identifierId };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message);
    }
  },

  addAgent: async (
    _root: undefined,
    {
      identifierId,
      input,
    }: {
      identifierId: string;
      input: {
        agentId: string;
        botName: string;
        emoji?: string;
        theme?: string;
        soulMd?: string;
        mentionPatterns?: string[];
      };
    },
    { models, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierManageAccess(models, identifierId, user);

    const server = await models.AgentServer.findOne({ identifierId }).lean();

    if (!server) {
      throw new Error('Agent server not found');
    }

    // Await registration so the mutation reflects the real outcome — a
    // fire-and-forget here reported success even when the deployer failed,
    // which is why creation looked flaky ("created" but no agent).
    try {
      await addAgent(server.name, input);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('addAgent failed:', message);
      throw new Error(`Failed to create agent: ${message}`);
    }

    return true;
  },

  updateAgentFile: async (
    _root: undefined,
    {
      identifierId,
      input,
    }: {
      identifierId: string;
      input: { filename: string; content: string; agentId?: string };
    },
    { models, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierManageAccess(models, identifierId, user);

    const server = await models.AgentServer.findOne({ identifierId }).lean();

    if (!server) {
      throw new Error('Agent server not found');
    }

    try {
      await updateAgentFile(
        server.name,
        input.filename,
        input.content,
        input.agentId,
      );
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message);
    }
  },

  fixAndRestartAgent: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierManageAccess(models, identifierId, user);

    const server = await models.AgentServer.findOne({ identifierId }).lean();

    if (!server) {
      throw new Error('Agent server not found');
    }

    try {
      await fixAndRestartServer(server.name);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message);
    }
  },

  updateDiscordSettings: async (
    _root: undefined,
    {
      identifierId,
      input,
    }: {
      identifierId: string;
      input: { botToken: string; dmPolicy?: 'pairing' | 'open' };
    },
    { models, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierManageAccess(models, identifierId, user);

    const server = await models.AgentServer.findOne({ identifierId }).lean();

    if (!server) {
      throw new Error('Agent server not found');
    }

    try {
      await updateDiscordSettings(server.name, input.botToken, input.dmPolicy);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message);
    }
  },

  addDiscordGuild: async (
    _root: undefined,
    {
      identifierId,
      input,
    }: { identifierId: string; input: { guildId: string } },
    { models, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierManageAccess(models, identifierId, user);

    const server = await models.AgentServer.findOne({ identifierId }).lean();

    if (!server) {
      throw new Error('Agent server not found');
    }

    try {
      await addDiscordGuild(server.name, input.guildId);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message);
    }
  },

  agentDiscordCreateBinding: async (
    _root: undefined,
    {
      assistantId,
      installationId,
      discordChannelId,
    }: {
      assistantId: string;
      installationId: string;
      discordChannelId: string;
    },
    { models, subdomain, user }: IContext,
  ) => {
    const identifier = await assertIdentifierManageAccess(
      models,
      assistantId,
      user,
    );

    if (identifier.kind && identifier.kind !== 'assistant') {
      throw new Error('This identifier is not an AI Assistant');
    }

    const server = await models.AgentServer.findOne({
      identifierId: assistantId,
    }).lean();

    if (!server) {
      throw new Error('Assistant server not found');
    }

    if (server.status !== SERVER_STATUSES.APPROVED) {
      throw new Error(
        'Assistant runtime is not ready. Wait until provisioning finishes before connecting Discord.',
      );
    }

    await verifyManagedRuntime(getRuntimeUrl(server));

    const { installation } = await getDiscordInstallation(installationId);

    if (installation.tenantId !== subdomain) {
      throw new Error('Discord installation does not belong to this tenant');
    }

    const { binding } = await createOrUpdateDiscordBinding({
      installationId,
      tenantId: subdomain,
      assistantId,
      assistantName: identifier.name,
      discordGuildId: installation.discordGuildId,
      discordChannelId,
      openclawUrl: getRuntimeUrl(server),
      // Default new channel bindings to respond on every message, not just
      // slash commands.
      responseMode: 'all_messages',
    });

    return binding;
  },

  agentDiscordDeleteBinding: async (
    _root: undefined,
    { assistantId, bindingId }: { assistantId: string; bindingId: string },
    { models, subdomain, user }: IContext,
  ) => {
    const identifier = await assertIdentifierManageAccess(
      models,
      assistantId,
      user,
    );

    if (identifier.kind && identifier.kind !== 'assistant') {
      throw new Error('This identifier is not an AI Assistant');
    }

    const { binding } = await getDiscordBinding(bindingId);

    if (binding.tenantId !== subdomain || binding.assistantId !== assistantId) {
      throw new Error('Discord binding does not belong to this assistant');
    }

    return deleteDiscordBinding(bindingId);
  },

  agentDiscordUpdateBinding: async (
    _root: undefined,
    {
      assistantId,
      bindingId,
      input,
    }: {
      assistantId: string;
      bindingId: string;
      input: {
        responseMode?: 'slash_only' | 'all_messages';
        enabled?: boolean;
      };
    },
    { models, subdomain, user }: IContext,
  ) => {
    const identifier = await assertIdentifierManageAccess(
      models,
      assistantId,
      user,
    );

    if (identifier.kind && identifier.kind !== 'assistant') {
      throw new Error('This identifier is not an AI Assistant');
    }

    const { binding } = await getDiscordBinding(bindingId);

    if (binding.tenantId !== subdomain || binding.assistantId !== assistantId) {
      throw new Error('Discord binding does not belong to this assistant');
    }

    const responseMode = input?.responseMode;

    if (
      responseMode &&
      responseMode !== 'slash_only' &&
      responseMode !== 'all_messages'
    ) {
      throw new Error('Unsupported Discord response mode');
    }

    return updateDiscordBinding(bindingId, {
      responseMode,
      enabled: input?.enabled,
    });
  },

  setKimiApiKey: async (
    _root: undefined,
    {
      identifierId,
      input,
    }: { identifierId: string; input: { kimiApiKey: string } },
    { models, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierManageAccess(models, identifierId, user);

    const server = await models.AgentServer.findOne({ identifierId }).lean();

    if (!server) {
      throw new Error('Agent server not found');
    }

    if (!input?.kimiApiKey) {
      throw new Error('kimiApiKey is required');
    }

    try {
      await setKimiApiKey(server.name, input.kimiApiKey);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(message);
    }
  },

  agentRuntimeInstallSkill: async (
    _root: undefined,
    {
      agentId,
      slug,
      version,
    }: { agentId: string; slug: string; version?: string },
    { models, subdomain, user }: IContext,
  ) => {
    const safeSlug = assertSafeRuntimeIdentifier(slug, 'slug');
    const safeVersion = assertSafeRuntimeVersion(version);

    return callManagedRuntimeOperation({
      models,
      user,
      subdomain,
      agentId,
      operation: 'agentRuntimeInstallSkill',
      identifier: safeSlug,
      requireAdmin: true,
      request: {
        method: 'POST',
        path: '/openclaw/skills/install',
        body: {
          slug: safeSlug,
          ...(safeVersion ? { version: safeVersion } : {}),
        },
      },
      message: 'Managed runtime skill install completed',
      mapResult: (payload) =>
        mapRuntimePayload('Managed runtime skill install completed', payload, {
          diagnostics:
            payload.verification && typeof payload.verification === 'object'
              ? (payload.verification as Record<string, unknown>)
              : payload,
          records: payload,
        }),
    });
  },

  agentRuntimeInstallPlugin: async (
    _root: undefined,
    {
      agentId,
      plugin,
      version,
    }: { agentId: string; plugin: string; version?: string },
    { models, subdomain, user }: IContext,
  ) => {
    const installPlugin = buildPluginInstallIdentifier(plugin, version);

    return callManagedRuntimeOperation({
      models,
      user,
      subdomain,
      agentId,
      operation: 'agentRuntimeInstallPlugin',
      identifier: installPlugin,
      requireAdmin: true,
      request: {
        method: 'POST',
        path: '/openclaw/plugins/install',
        body: {
          plugin: installPlugin,
        },
      },
      message: 'Managed runtime plugin install completed',
      mapResult: (payload) =>
        mapRuntimePayload('Managed runtime plugin install completed', payload, {
          diagnostics:
            payload.verification && typeof payload.verification === 'object'
              ? (payload.verification as Record<string, unknown>)
              : payload,
          records: payload,
        }),
    });
  },

  agentRuntimeEnablePlugin: async (
    _root: undefined,
    { agentId, pluginId }: { agentId: string; pluginId: string },
    { models, subdomain, user }: IContext,
  ) => {
    const safePluginId = assertSafeRuntimeIdentifier(pluginId, 'pluginId');

    return callManagedRuntimeOperation({
      models,
      user,
      subdomain,
      agentId,
      operation: 'agentRuntimeEnablePlugin',
      identifier: safePluginId,
      requireAdmin: true,
      request: {
        method: 'POST',
        path: '/openclaw/plugins/enable',
        body: {
          plugin: safePluginId,
        },
      },
      message: 'Managed runtime plugin enable completed',
      mapResult: (payload) =>
        mapRuntimePayload('Managed runtime plugin enable completed', payload, {
          diagnostics:
            payload.verification && typeof payload.verification === 'object'
              ? (payload.verification as Record<string, unknown>)
              : payload,
          records: payload,
        }),
    });
  },
};
