import { IContext } from '~/connectionResolvers';
import { ensureLegacyIdentifierLinks } from '~/modules/assistantOrg/utils';
import {
  checkKimiKeySet,
  getAgentDetails,
  getGatewayToken,
  listAgents,
  listDiscordGuilds,
} from '~/modules/agent/utils';

export const agentQueries = {
  getAgent: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);

    const agent = await models.AgentServer.findOne({ identifierId }).lean();

    if (!agent) {
      return null;
    }

    if (agent.token) {
      return { ...agent, identifierId: agent.identifierId };
    }

    try {
      const token = await getGatewayToken(agent.name);
      return { ...agent, token, identifierId: agent.identifierId };
    } catch {
      return { ...agent, identifierId: agent.identifierId };
    }
  },

  getAgentsList: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);

    const server = await models.AgentServer.findOne({ identifierId }).lean();

    if (!server) {
      throw new Error('Agent server not found');
    }

    return listAgents(server.name);
  },

  getAgentDetails: async (
    _root: undefined,
    { identifierId, agentId }: { identifierId: string; agentId?: string },
    { models }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);

    const server = await models.AgentServer.findOne({ identifierId }).lean();

    if (!server) {
      throw new Error('Agent server not found');
    }

    return getAgentDetails(server.name, agentId);
  },

  getDiscordGuilds: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);

    const server = await models.AgentServer.findOne({ identifierId }).lean();

    if (!server) {
      throw new Error('Agent server not found');
    }

    return listDiscordGuilds(server.name);
  },

  checkKimiKeySet: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);

    const server = await models.AgentServer.findOne({ identifierId }).lean();

    if (!server) {
      throw new Error('Agent server not found');
    }

    return checkKimiKeySet(server.name);
  },
};
