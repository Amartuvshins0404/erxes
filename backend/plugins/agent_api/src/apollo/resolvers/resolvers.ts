import { IContext } from '~/connectionResolvers';
import { SERVER_STATUSES } from '~/modules/agent/constants';

export const customResolvers = {
  Identifier: {
    server: async (
      identifier: { _id: string },
      _args: Record<string, never>,
      { models }: IContext,
    ) => {
      const identifierId = String(identifier._id);

      const [agentServer, opencodeServer] = await Promise.all([
        models.AgentServer.findOne({ identifierId }).lean(),
        models.OpencodeServer.findOne({ identifierId }).lean(),
      ]);

      const server = agentServer || opencodeServer;

      if (!server) {
        return {
          exists: false,
          hasNamespace: false,
          name: null,
          status: null,
        };
      }

      const status = server.status || null;

      // A k8s namespace only exists once the deployer actually provisioned a
      // server. A failed/pending deployment leaves a record behind without any
      // namespace, so we treat those as "no namespace".
      const hasNamespace =
        !!server.serverId ||
        status === SERVER_STATUSES.APPROVED ||
        status === SERVER_STATUSES.DEPLOYING;

      return {
        exists: true,
        hasNamespace,
        name: server.name || null,
        status,
      };
    },
  },
};
