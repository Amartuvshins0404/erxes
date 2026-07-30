import { IContext } from '~/connectionResolvers';
import { renameOwnedThread, removeOwnedThread } from '@/session/nativeStore';
import { cancelActiveRun } from '~/mastra/runRegistry';
import { requireUserId } from '@/_shared/auth';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';

/** Mutations on a user's own chat threads (rename / delete), Mastra-native. */
export const sessionMutations = {
  mastraThreadRename: async (
    _parent: undefined,
    { threadId, title }: { threadId: string; title: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.chat);
    return renameOwnedThread(subdomain, requireUserId(user), threadId, title);
  },

  mastraThreadRemove: async (
    _parent: undefined,
    { threadId }: { threadId: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.chat);
    return removeOwnedThread(subdomain, requireUserId(user), threadId);
  },

  // Explicit cancel for an in-flight streaming turn on one of the user's own
  // threads. Aborts the tracked run's AbortController server-side — the reliable
  // stop path, since the gateway proxy never forwards the client disconnect.
  // Returns true when a live run was found and signalled.
  mastraChatCancel: async (
    _parent: undefined,
    { threadId }: { threadId: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.chat);
    return cancelActiveRun(subdomain, requireUserId(user), threadId);
  },
};
