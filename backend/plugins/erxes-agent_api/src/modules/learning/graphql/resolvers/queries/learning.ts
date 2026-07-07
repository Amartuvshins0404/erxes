import { IContext } from '~/connectionResolvers';
import { MastraLearningStatus } from '@/learning/@types/learning';
import { assertThreadOwned } from '@/session/nativeStore';
import { requireUserId } from '@/_shared/auth';

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
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('learningView');
    requireUserId(user);
    return models.MastraLearning.listLearnings(
      {
        status: args.status as MastraLearningStatus | undefined,
        type: args.type,
        agentId: args.agentId,
        searchValue: args.searchValue,
      },
      args.page || 1,
      args.perPage || 20,
    );
  },

  mastraLearning: async (
    _: unknown,
    { _id }: { _id: string },
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('learningView');
    requireUserId(user);
    return models.MastraLearning.findOne({ _id });
  },

  mastraLearningStats: async (
    _: unknown,
    __: unknown,
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('learningView');
    requireUserId(user);
    return models.MastraLearning.getStats();
  },

  // The caller's own votes for a thread, keyed by messageId — drives the
  // thumbs state in the chat UI. Ownership-gated like message reads.
  mastraMessageFeedbacks: async (
    _: unknown,
    { threadId }: { threadId: string },
    { models, user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('agentsChat');
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
