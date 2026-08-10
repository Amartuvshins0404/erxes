import { ExpectedError } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import {
  MastraLearningStatus,
  MastraLearningType,
} from '@/learning/@types/learning';
import { resolveLearningTuning } from '~/mastra/learning/config';
import { findOwnedAssistantMessage } from '@/session/nativeStore';
import { pushUserScore } from '~/mastra/scoring/langfuseClient';
import { requireUserId } from '@/_shared/auth';
import { getWorkflowAgentAccess } from '@/workflow/authorization';
import { requireScopedLearning } from '@/learning/authorization';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';

// Shape of the MastraLearningInput GraphQL input.
export interface IMastraLearningInput {
  statement: string;
  type: MastraLearningType;
  contextTags?: string[];
  agentId?: string;
}

const STATUSES: MastraLearningStatus[] = [
  'candidate',
  'approved',
  'rejected',
  'conflict',
  'archived',
];

export const learningMutations = {
  // Manual entry from the curation UI — trusted, so it lands approved.
  mastraLearningAdd: async (
    _: unknown,
    { doc }: { doc: IMastraLearningInput },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.learning.curate);
    const userId = requireUserId(user);
    const access = await getWorkflowAgentAccess({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.learning.curate,
    });
    if (
      (doc.agentId && !access.agentIds.includes(doc.agentId)) ||
      (!doc.agentId && access.scope !== 'all')
    ) {
      throw new ExpectedError('Agent not found');
    }
    return models.MastraLearning.createLearning({
      ...doc,
      status: 'approved',
      confidence: 0.9,
      createdBy: userId,
      reviewedByUserId: userId,
    });
  },

  mastraLearningEdit: async (
    _: unknown,
    { _id, doc }: { _id: string; doc: IMastraLearningInput },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.learning.curate);
    requireUserId(user);
    await requireScopedLearning({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.learning.curate,
      learningId: _id,
    });
    if (doc.agentId) {
      const { agentIds } = await getWorkflowAgentAccess({
        models,
        subdomain,
        user,
        action: ERXES_AGENT_ACTIONS.learning.curate,
      });
      if (!agentIds.includes(doc.agentId)) {
        throw new ExpectedError('Agent not found');
      }
    }
    return models.MastraLearning.updateLearning(_id, doc);
  },

  mastraLearningSetStatus: async (
    _: unknown,
    { _id, status }: { _id: string; status: string },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.learning.curate);
    const userId = requireUserId(user);
    await requireScopedLearning({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.learning.curate,
      learningId: _id,
    });
    const next = STATUSES.find((candidate) => candidate === status);
    if (!next) throw new ExpectedError(`Invalid status "${status}"`);
    return models.MastraLearning.setStatus(_id, next, userId);
  },

  mastraLearningPin: async (
    _: unknown,
    { _id, pinned }: { _id: string; pinned: boolean },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.learning.curate);
    requireUserId(user);
    await requireScopedLearning({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.learning.curate,
      learningId: _id,
    });
    return models.MastraLearning.setPinned(_id, pinned);
  },

  mastraLearningRemove: async (
    _: unknown,
    { _id }: { _id: string },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.learning.remove);
    requireUserId(user);
    await requireScopedLearning({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.learning.remove,
      learningId: _id,
    });
    await models.MastraLearning.deleteOne({ _id });
    return { ok: true };
  },

  // Thumbs up/down on one assistant message. The rating reinforces (or
  // penalizes) whichever learnings were injected into that turn's context.
  mastraMessageFeedback: async (
    _: unknown,
    args: { messageId: string; rating: number; comment?: string },
    { models, user, subdomain, checkPermission }: IContext,
  ) => {
    // Rating a chat message is part of using the agent, not learning curation.
    await checkPermission(ERXES_AGENT_ACTIONS.agent.chat);
    const userId = requireUserId(user);
    if (args.rating !== 1 && args.rating !== -1) {
      throw new ExpectedError('rating must be 1 or -1');
    }

    // Resolve the assistant message from the native store by its id: verifies
    // it is the caller's own assistant reply (resource-scope ownership) and
    // returns the learnings that were in that turn's context.
    const {
      threadId,
      learningIdsInContext: learningIds,
      langfuseTraceId,
    } = await findOwnedAssistantMessage(subdomain, userId, args.messageId);

    const { previousRating } = await models.MastraFeedback.saveFeedback({
      threadId,
      messageId: args.messageId,
      userId,
      rating: args.rating as 1 | -1,
      comment: args.comment,
      learningIdsInContext: learningIds,
    });

    // Plan B: mirror the human thumbs into Langfuse as a score on this turn's
    // trace (the SDK, never the CLI). Only AFTER the feedback is persisted, so a
    // failed save never emits a phantom score. Fire-and-forget + self-guarding:
    // no trace id or no Langfuse configured → no-op, feedback still succeeds.
    void pushUserScore({
      traceId: langfuseTraceId,
      name: 'user-feedback',
      value: args.rating,
      comment: args.comment,
    });

    // Net reinforcement: undo the previous vote's delta when re-voting.
    if (learningIds.length) {
      const tuning = resolveLearningTuning();
      const deltaFor = (r: number) =>
        r > 0 ? tuning.feedbackUpDelta : tuning.feedbackDownDelta;
      const net =
        deltaFor(args.rating) - (previousRating ? deltaFor(previousRating) : 0);
      await models.MastraLearning.reinforce(learningIds, net);
    }

    return { ok: true, rating: args.rating };
  },
};
