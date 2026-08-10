import { IContext } from '~/connectionResolvers';
import {
  listOwnedThreads,
  getOwnedThreadMessages,
  assertThreadOwned,
} from '@/session/nativeStore';
import { requireUserId } from '@/_shared/auth';
import { requireScopedAgent } from '@/agent/authorization';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';

// Threads are private: every query requires a logged-in user and is filtered
// to threads that user owns. Ownership + tenant isolation is by the native
// thread's resourceId (scopedResource(subdomain, userId)); bot threads
// (resource "<sub>:bot:*") never match.

/** Queries over a user's own chat threads and their transcripts (Mastra-native). */
export const sessionQueries = {
  mastraThreads: async (
    _parent: undefined,
    {
      agentId,
      page,
      perPage,
    }: { agentId: string; page?: number; perPage?: number },
    { models, user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.chat);
    await requireScopedAgent({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.agent.chat,
      agentId,
    });
    // page/perPage are optional — listOwnedThreads applies its own defaults so a
    // caller omitting them still gets the first (newest) page, not everything.
    return listOwnedThreads(
      subdomain,
      requireUserId(user),
      agentId,
      page ?? undefined,
      perPage ?? undefined,
    );
  },

  mastraThreadMessages: async (
    _parent: undefined,
    { threadId }: { threadId: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.chat);
    // Ownership is enforced inside (resourceId scope) — reading another user's
    // transcript reads back as "Thread not found".
    return getOwnedThreadMessages(subdomain, requireUserId(user), threadId);
  },

  // The thread's generated artifacts (charts + documents) for the Preview
  // panel's file list. Stored in their own collection so they survive reloads.
  mastraThreadArtifacts: async (
    _parent: undefined,
    { threadId }: { threadId: string },
    { models, user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.chat);
    // Same ownership gate as the transcript — non-owners get "Thread not found".
    await assertThreadOwned(subdomain, requireUserId(user), threadId);
    return models.MastraArtifact.listByThread(threadId);
  },
};
