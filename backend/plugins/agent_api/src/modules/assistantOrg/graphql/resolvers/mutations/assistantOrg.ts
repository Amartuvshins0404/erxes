import { IContext } from '~/connectionResolvers';
import {
  assertIdentifierManageAccess,
  requireUser,
} from '~/modules/assistantOrg/permissions';
import {
  assertAssistantLimitAvailable,
  setAssistantPlanSelection,
} from '~/modules/assistantOrg/assistantLimits';
import { buildUniqueSlug, ensureLegacyIdentifierLinks } from '../../../utils';

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
    { models, subdomain, user }: IContext,
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

    if (kind === 'assistant') {
      await assertAssistantLimitAvailable({ models, subdomain });
    }

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
      models.AgentServer.exists({ identifierId }),
      models.OpencodeServer.exists({ identifierId }),
    ]);

    if (agentServer || opencodeServer) {
      throw new Error(
        'Destroy this identifier deployment before deleting it.',
      );
    }

    await models.Identifier.deleteOne({ _id: identifierId });

    return true;
  },

  setAssistantPlanSelection: async (
    _root: undefined,
    { identifierIds }: { identifierIds: string[] },
    { models, subdomain, user }: IContext,
  ) => {
    requireUser(user);

    return setAssistantPlanSelection({
      models,
      subdomain,
      user,
      identifierIds,
    });
  },
};
