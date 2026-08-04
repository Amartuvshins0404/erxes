import { IContext } from '~/connectionResolvers';
import {
  removeOwnedMessagePair,
  removeOwnedThread,
  renameOwnedThread,
} from '@/session/nativeStore';
import { cancelActiveRun } from '~/mastra/runRegistry';
import { requireUserId } from '@/_shared/auth';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';
import { deleteWebsiteFiles } from '~/mastra/files/websiteFileStore';

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
    { user, subdomain, models, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.chat);
    const result = await removeOwnedThread(
      subdomain,
      requireUserId(user),
      threadId,
    );
    const artifacts = await models.MastraArtifact.find({ threadId })
      .select({ websiteFiles: 1 })
      .lean()
      .catch(() => []);
    const websiteFileKeys = artifacts.flatMap(
      (artifact) => artifact.websiteFiles?.map((file) => file.fileKey) ?? [],
    );
    // The native delete is authoritative; auxiliary cleanup must not turn an
    // already-completed deletion into a client-visible failure.
    await Promise.allSettled([
      deleteWebsiteFiles(models, websiteFileKeys),
      models.MastraFeedback.deleteMany({ threadId }),
      models.MastraArtifact.deleteMany({ threadId }),
    ]);
    return result;
  },

  mastraMessagePairRemove: async (
    _parent: undefined,
    { threadId, messageId }: { threadId: string; messageId: string },
    { user, subdomain, models, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.agent.chat);
    const result = await removeOwnedMessagePair(
      subdomain,
      requireUserId(user),
      threadId,
      messageId,
    );
    const artifacts = await models.MastraArtifact.find({
      messageId: { $in: result.deletedIds },
    })
      .select({ websiteFiles: 1 })
      .lean()
      .catch(() => []);
    const websiteFileKeys = artifacts.flatMap(
      (artifact) => artifact.websiteFiles?.map((file) => file.fileKey) ?? [],
    );
    // Keep the same authoritative-delete behavior for linked auxiliary rows.
    await Promise.allSettled([
      deleteWebsiteFiles(models, websiteFileKeys),
      models.MastraFeedback.deleteMany({
        messageId: { $in: result.deletedIds },
      }),
      models.MastraArtifact.deleteMany({
        messageId: { $in: result.deletedIds },
      }),
    ]);
    return result;
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
