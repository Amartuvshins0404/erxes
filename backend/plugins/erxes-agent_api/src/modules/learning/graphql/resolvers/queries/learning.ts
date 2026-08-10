import { ExpectedError } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { MastraLearningStatus } from '@/learning/@types/learning';
import { assertThreadOwned } from '@/session/nativeStore';
import { requireUserId } from '@/_shared/auth';
import { getWorkflowAgentAccess } from '@/workflow/authorization';
import { requireScopedLearning } from '@/learning/authorization';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';

// Field resolver: expose only the COUNT of hashed contributors, never the
// hashes themselves.
export const learningCustomResolvers = {
  MastraLearning: {
    sourceCount: (learning: { sourceHashes?: string[] }) =>
      learning.sourceHashes?.length ?? 0,
  },
};

export const learningQueries = {
  mastraLearnings: async (
    _: unknown,
    args: {
      status?: string;
      type?: string;
      agentId?: string;
      searchValue?: string;
      page?: number;
      perPage?: number;
    },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.learning.read);
    requireUserId(user);
    const { scope, agentIds } = await getWorkflowAgentAccess({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.learning.read,
    });
    if (args.agentId && !agentIds.includes(args.agentId)) {
      throw new ExpectedError('Learning not found');
    }

    return models.MastraLearning.listLearnings(
      {
        status:
          scope === 'all'
            ? (args.status as MastraLearningStatus | undefined)
            : 'approved',
        type: args.type,
        agentId: args.agentId,
        agentIds: args.agentId ? undefined : agentIds,
        includeUnassigned: scope !== 'own',
        searchValue: args.searchValue,
      },
      args.page || 1,
      args.perPage || 20,
    );
  },

  mastraLearning: async (
    _: unknown,
    { _id }: { _id: string },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.learning.read);
    requireUserId(user);
    const { learning, access } = await requireScopedLearning({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.learning.read,
      learningId: _id,
    });
    if (access.scope !== 'all' && learning.status !== 'approved') {
      throw new ExpectedError('Learning not found');
    }
    return learning;
  },

  mastraLearningStats: async (
    _: unknown,
    __: unknown,
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.learning.read);
    requireUserId(user);
    const { scope, agentIds } = await getWorkflowAgentAccess({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.learning.read,
    });
    return models.MastraLearning.getStats({
      agentIds,
      includeUnassigned: scope !== 'own',
      approvedOnly: scope !== 'all',
    });
  },

  // The caller's own votes for a thread, keyed by messageId — drives the
  // thumbs state in the chat UI. Ownership-gated like message reads.
  mastraMessageFeedbacks: async (
    _: unknown,
    { threadId }: { threadId: string },
    { models, user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.chat);
    const userId = requireUserId(user);
    await assertThreadOwned(subdomain, userId, threadId);
    const docs = await models.MastraFeedback.find({ threadId, userId });
    const byMessage: Record<string, { rating: number; comment?: string }> = {};
    for (const d of docs) {
      byMessage[d.messageId] = { rating: d.rating, comment: d.comment };
    }
    return byMessage;
  },
};
