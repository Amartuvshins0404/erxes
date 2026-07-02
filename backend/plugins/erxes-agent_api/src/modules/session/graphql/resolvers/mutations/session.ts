import { IUserDocument } from 'erxes-api-shared/core-types';
import { ExpectedError } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { renameOwnedThread, removeOwnedThread } from '@/session/nativeStore';
import { cancelActiveRun } from '~/mastra/runRegistry';

/** Resolve the logged-in user's _id, rejecting unauthenticated calls. */
function requireUserId(user: IUserDocument | null | undefined): string {
  if (!user?._id) throw new ExpectedError('Login required');
  return user._id;
}

/** Mutations on a user's own chat threads (rename / delete), Mastra-native. */
export const sessionMutations = {
  mastraThreadRename: async (
    _parent: undefined,
    { threadId, title }: { threadId: string; title: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('agentsChat');
    return renameOwnedThread(subdomain, requireUserId(user), threadId, title);
  },

  mastraThreadRemove: async (
    _parent: undefined,
    { threadId }: { threadId: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('agentsChat');
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
    await checkPermission('agentsChat');
    return cancelActiveRun(subdomain, requireUserId(user), threadId);
  },
};
