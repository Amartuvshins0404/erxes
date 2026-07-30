import { IContext } from '~/connectionResolvers';
import {
  assertIdentifierManageAccess,
  requireUser,
} from '~/modules/assistantOrg/permissions';
import { buildUniqueSlug, ensureLegacyIdentifierLinks } from '../../../utils';
import { destroyServer } from '~/modules/agent/utils';
import { destroyOpencodeServer } from '~/modules/opencode/utils';

// Best-effort teardown of a deployed server. When the deployment failed (or
// never finished) there is no k8s namespace to remove, so the deployer answers
// with a "not found" error — in that case we swallow it and continue deleting
// the identifier. Any other failure is surfaced so we don't orphan a live
// namespace.
const destroyDeployedServer = async (destroy: () => Promise<unknown>) => {
  try {
    await destroy();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.toLowerCase().includes('not found')) {
      throw error;
    }
  }
};

export const identifierMutations = {
  createIdentifier: async (
    _root: undefined,
    {
      input,
    }: {
      input: {
        name: string;
        kind: 'assistant' | 'agent';
        description?: string | null;
      };
    },
    { models, user }: IContext,
  ) => {
    const currentUser = requireUser(user);
    const name = input?.name?.trim();
    const kind = input?.kind;
    const description = input?.description?.trim() || undefined;

    if (!name) {
      throw new Error('name is required');
    }

    if (kind !== 'assistant' && kind !== 'agent') {
      throw new Error('kind must be assistant or agent');
    }

    await ensureLegacyIdentifierLinks(models);

    const slug = await buildUniqueSlug(name, (nextSlug) =>
      models.Identifier.findOne({ slug: nextSlug }).lean(),
    );

    const identifier = await models.Identifier.create({
      name,
      slug,
      kind,
      description,
      createdUserId: currentUser._id,
      memberIds: [],
    });

    return identifier;
  },

  updateIdentifier: async (
    _root: undefined,
    {
      identifierId,
      input,
    }: {
      identifierId: string;
      input: { name: string; description?: string | null };
    },
    { models, user }: IContext,
  ) => {
    const name = input?.name?.trim();

    if (!name) {
      throw new Error('name is required');
    }

    await assertIdentifierManageAccess(models, identifierId, user);

    return models.Identifier.findByIdAndUpdate(
      identifierId,
      {
        $set: {
          name,
          description: input?.description?.trim() || '',
        },
      },
      { new: true },
    ).lean();
  },

  inviteIdentifierMembers: async (
    _root: undefined,
    {
      identifierId,
      input,
    }: {
      identifierId: string;
      input: { memberIds: string[] };
    },
    { models, user }: IContext,
  ) => {
    const identifier = await assertIdentifierManageAccess(
      models,
      identifierId,
      user,
    );
    const memberIds = Array.from(
      new Set((input?.memberIds || []).map((id) => id?.trim()).filter(Boolean)),
    ).filter((memberId) => memberId !== identifier.createdUserId);

    return models.Identifier.findByIdAndUpdate(
      identifierId,
      { $set: { memberIds } },
      { new: true },
    ).lean();
  },

  deleteIdentifier: async (
    _root: undefined,
    { identifierId }: { identifierId: string },
    { models, user }: IContext,
  ) => {
    await ensureLegacyIdentifierLinks(models);

    await assertIdentifierManageAccess(models, identifierId, user);

    const [agentServer, opencodeServer] = await Promise.all([
      models.AgentServer.findOne({ identifierId }).lean(),
      models.OpencodeServer.findOne({ identifierId }).lean(),
    ]);

    // Tear down any deployed OpenClaw/Opencode namespace alongside the
    // identifier. If the deployment got stuck/failed there is no namespace and
    // the teardown is a no-op, so the identifier still gets deleted.
    if (agentServer) {
      await destroyDeployedServer(() => destroyServer(agentServer));
      await models.AgentServer.deleteOne({ _id: agentServer._id });
    }

    if (opencodeServer) {
      await destroyDeployedServer(() => destroyOpencodeServer(opencodeServer));
      await models.OpencodeServer.deleteOne({ _id: opencodeServer._id });
    }

    await models.Identifier.deleteOne({ _id: identifierId });

    return true;
  },
};
