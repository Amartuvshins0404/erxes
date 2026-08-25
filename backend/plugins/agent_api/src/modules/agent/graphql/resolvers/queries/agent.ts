import { IContext } from '~/connectionResolvers';
import {
  assertIdentifierAccess,
  assertIdentifierManageAccess,
} from '~/modules/assistantOrg/permissions';
import { ensureLegacyIdentifierLinks } from '~/modules/assistantOrg/utils';
import {
  checkKimiKeySet,
  getAgentDetails,
  getGatewayToken,
  listAgents,
  listDiscordGuilds,
  probeManagedRuntimeHealth,
} from '~/modules/agent/utils';
import { SERVER_STATUSES } from '~/modules/agent/constants';
import { fetchManagedLlmModels } from '~/modules/agent/managedLlmProviders';
import {
  createDiscordConnectUrl,
  getDiscordInstallation,
  listDiscordBindings,
  listDiscordChannels,
  listDiscordInstallations,
} from '~/modules/agent/discordGatewayClient';
import {
  assertSafeRuntimeIdentifier,
  assertSafeRuntimeQuery,
  callManagedRuntimeOperation,
  mapRuntimePayload,
} from '~/modules/agent/runtimeClient';

const assertAssistantManageAccess = async (
  models: IContext['models'],
  assistantId: string,
  user: IContext['user'],
) => {
  const identifier = await assertIdentifierManageAccess(
    models,
    assistantId,
    user,
  );

  if (identifier.kind && identifier.kind !== 'assistant') {
    throw new Error('This identifier is not an AI Assistant');
  }

  return identifier;
};

export const agentQueries = {
  getAgent: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierAccess(models, identifierId, user);

    const agent = await models.AgentServer.findOne({ identifierId }).lean();

    if (!agent) {
      return null;
    }

    // Always prefer the live token: a stored copy goes stale when the server
    // is re-provisioned, and serving it breaks the Control UI websocket auth.
    // Only approved agents have a server to ask — polling a pending/failed
    // record would hit the deployer with a doomed request on every refetch.
    if (agent.status !== SERVER_STATUSES.APPROVED) {
      return { ...agent, identifierId: agent.identifierId };
    }

    try {
      const token = await getGatewayToken(agent.name);
      if (token && token !== agent.token) {
        await models.AgentServer.updateOne(
          { _id: agent._id },
          { $set: { token } },
        );
      }
      return {
        ...agent,
        token: token || agent.token,
        identifierId: agent.identifierId,
      };
    } catch {
      return { ...agent, identifierId: agent.identifierId };
    }
  },

  getAgentsList: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierAccess(models, identifierId, user);

    const server = await models.AgentServer.findOne({ identifierId }).lean();

    if (!server) {
      throw new Error('Agent server not found');
    }

    return listAgents(server.name);
  },

  getAgentDetails: async (
    _root: undefined,
    { identifierId, agentId }: { identifierId: string; agentId?: string },
    { models, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierAccess(models, identifierId, user);

    const server = await models.AgentServer.findOne({ identifierId }).lean();

    if (!server) {
      throw new Error('Agent server not found');
    }

    return getAgentDetails(server.name, agentId);
  },

  getDiscordGuilds: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierAccess(models, identifierId, user);

    const server = await models.AgentServer.findOne({ identifierId }).lean();

    if (!server) {
      throw new Error('Agent server not found');
    }

    return listDiscordGuilds(server.name);
  },

  checkKimiKeySet: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierAccess(models, identifierId, user);

    const server = await models.AgentServer.findOne({ identifierId }).lean();

    if (!server) {
      throw new Error('Agent server not found');
    }

    return checkKimiKeySet(server.name);
  },

  agentManagedLlmModels: async (
    _root: undefined,
    { provider, apiKey }: { provider: string; apiKey: string },
    { user }: IContext,
  ) => {
    if (!user) {
      throw new Error('Authentication required');
    }

    return fetchManagedLlmModels(provider, apiKey);
  },

  agentDiscordConnectUrl: async (
    _root: undefined,
    { assistantId, returnUrl }: { assistantId: string; returnUrl?: string },
    { models, subdomain, user }: IContext,
  ) => {
    await assertAssistantManageAccess(models, assistantId, user);

    const server = await models.AgentServer.findOne({
      identifierId: assistantId,
    }).lean();

    if (!server) {
      throw new Error('Assistant server not found');
    }

    return createDiscordConnectUrl({
      tenantId: subdomain,
      assistantId,
      erxesUserId: user?._id,
      returnUrl,
    });
  },

  agentDiscordInstallations: async (
    _root: undefined,
    { assistantId }: { assistantId: string },
    { models, subdomain, user }: IContext,
  ) => {
    await assertAssistantManageAccess(models, assistantId, user);

    const { installations } = await listDiscordInstallations({
      tenantId: subdomain,
      assistantId,
      status: 'connected',
    });

    return installations;
  },

  agentDiscordChannels: async (
    _root: undefined,
    {
      assistantId,
      installationId,
    }: { assistantId: string; installationId: string },
    { models, subdomain, user }: IContext,
  ) => {
    await assertAssistantManageAccess(models, assistantId, user);

    const { installation } = await getDiscordInstallation(installationId);

    if (installation.tenantId !== subdomain) {
      throw new Error('Discord installation does not belong to this tenant');
    }

    const { channels } = await listDiscordChannels(installationId);

    return channels;
  },

  agentDiscordBindings: async (
    _root: undefined,
    { assistantId }: { assistantId: string },
    { models, subdomain, user }: IContext,
  ) => {
    await assertAssistantManageAccess(models, assistantId, user);

    const { bindings } = await listDiscordBindings({
      tenantId: subdomain,
      assistantId,
    });

    return bindings;
  },

  agentRuntimeDiagnostics: async (
    _root: undefined,
    { agentId }: { agentId: string },
    { models, subdomain, user }: IContext,
  ) =>
    callManagedRuntimeOperation({
      models,
      user,
      subdomain,
      agentId,
      operation: 'agentRuntimeDiagnostics',
      request: {
        method: 'GET',
        path: '/runtime-diagnostics',
      },
      message: 'Managed runtime diagnostics fetched',
      mapResult: (payload) =>
        mapRuntimePayload('Managed runtime diagnostics fetched', payload, {
          diagnostics: payload,
        }),
    }),

  agentRuntimeSkills: async (
    _root: undefined,
    { agentId }: { agentId: string },
    { models, subdomain, user }: IContext,
  ) =>
    callManagedRuntimeOperation({
      models,
      user,
      subdomain,
      agentId,
      operation: 'agentRuntimeSkills',
      request: {
        method: 'GET',
        path: '/openclaw/skills',
      },
      message: 'Managed runtime skills fetched',
      mapResult: (payload) =>
        mapRuntimePayload('Managed runtime skills fetched', payload, {
          items: Array.isArray(payload.data) ? payload.data : null,
          records: payload,
        }),
    }),

  agentRuntimeSkillSearch: async (
    _root: undefined,
    { agentId, query }: { agentId: string; query: string },
    { models, subdomain, user }: IContext,
  ) =>
    callManagedRuntimeOperation({
      models,
      user,
      subdomain,
      agentId,
      operation: 'agentRuntimeSkillSearch',
      identifier: assertSafeRuntimeQuery(query),
      request: {
        method: 'POST',
        path: '/openclaw/skills/search',
        body: { query: assertSafeRuntimeQuery(query) },
      },
      message: 'Managed runtime skill search completed',
      mapResult: (payload) =>
        mapRuntimePayload('Managed runtime skill search completed', payload, {
          items: Array.isArray(payload.data) ? payload.data : null,
          records: payload,
        }),
    }),

  agentRuntimePlugins: async (
    _root: undefined,
    { agentId }: { agentId: string },
    { models, subdomain, user }: IContext,
  ) =>
    callManagedRuntimeOperation({
      models,
      user,
      subdomain,
      agentId,
      operation: 'agentRuntimePlugins',
      request: {
        method: 'GET',
        path: '/openclaw/plugins',
      },
      message: 'Managed runtime plugins fetched',
      mapResult: (payload) =>
        mapRuntimePayload('Managed runtime plugins fetched', payload, {
          items: Array.isArray(payload.data) ? payload.data : null,
          records: payload,
        }),
    }),

  agentRuntimePluginSearch: async (
    _root: undefined,
    { agentId, query }: { agentId: string; query: string },
    { models, subdomain, user }: IContext,
  ) =>
    callManagedRuntimeOperation({
      models,
      user,
      subdomain,
      agentId,
      operation: 'agentRuntimePluginSearch',
      identifier: assertSafeRuntimeQuery(query),
      request: {
        method: 'POST',
        path: '/openclaw/plugins/search',
        body: { query: assertSafeRuntimeQuery(query) },
      },
      message: 'Managed runtime plugin search completed',
      mapResult: (payload) =>
        mapRuntimePayload('Managed runtime plugin search completed', payload, {
          items: Array.isArray(payload.data) ? payload.data : null,
          records: payload,
        }),
    }),

  agentRuntimePluginInspect: async (
    _root: undefined,
    { agentId, pluginId }: { agentId: string; pluginId: string },
    { models, subdomain, user }: IContext,
  ) =>
    callManagedRuntimeOperation({
      models,
      user,
      subdomain,
      agentId,
      operation: 'agentRuntimePluginInspect',
      identifier: assertSafeRuntimeIdentifier(pluginId, 'pluginId'),
      request: {
        method: 'POST',
        path: '/openclaw/plugins/inspect',
        body: { plugin: assertSafeRuntimeIdentifier(pluginId, 'pluginId') },
      },
      message: 'Managed runtime plugin inspection completed',
      mapResult: (payload) =>
        mapRuntimePayload('Managed runtime plugin inspection completed', payload, {
          records:
            payload.data && typeof payload.data === 'object'
              ? (payload.data as Record<string, unknown>)
              : payload,
        }),
    }),

  agentRuntimePluginDoctor: async (
    _root: undefined,
    { agentId }: { agentId: string },
    { models, subdomain, user }: IContext,
  ) =>
    callManagedRuntimeOperation({
      models,
      user,
      subdomain,
      agentId,
      operation: 'agentRuntimePluginDoctor',
      request: {
        method: 'POST',
        path: '/openclaw/plugins/doctor',
        body: {},
      },
      message: 'Managed runtime plugin doctor completed',
      mapResult: (payload) =>
        mapRuntimePayload('Managed runtime plugin doctor completed', payload, {
          diagnostics:
            payload.pluginDoctor && typeof payload.pluginDoctor === 'object'
              ? (payload.pluginDoctor as Record<string, unknown>)
              : payload,
        }),
    }),

  agentLlmSubscriptionAuthStatus: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models, subdomain, user }: IContext,
  ) => {
    const result = await callManagedRuntimeOperation({
      models,
      user,
      subdomain,
      agentId: identifierId,
      operation: 'agentLlmSubscriptionAuthStatus',
      request: {
        method: 'GET',
        path: '/openclaw/subscription-auth/status',
      },
      message: 'Subscription sign-in status fetched',
      mapResult: (payload) =>
        mapRuntimePayload('Subscription sign-in status fetched', payload, {
          records: payload,
        }),
    });

    if (
      result.status === 'connected' ||
      result.status === 'failed' ||
      result.status === 'expired'
    ) {
      await models.AgentServer.updateOne(
        { identifierId, credentialMode: 'subscription' },
        {
          $set: {
            credentialStatus:
              result.status === 'connected' ? 'connected' : 'failed',
            updatedAt: new Date(),
          },
        },
      );
    }

    return result;
  },

  agentRuntimeHealth: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);
    await assertIdentifierAccess(models, identifierId, user);

    const server = await models.AgentServer.findOne({ identifierId }).lean();

    // Only an approved runtime with a URL can be reachable; anything else is
    // reported unhealthy so the UI keeps showing the connecting/deploy state
    // instead of pointing the chat iframe at a runtime that cannot answer.
    if (
      !server ||
      server.status !== SERVER_STATUSES.APPROVED ||
      !server.url?.trim()
    ) {
      return { healthy: false };
    }

    return { healthy: await probeManagedRuntimeHealth(server.url) };
  },
};
