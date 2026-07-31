import { canGroup } from 'erxes-api-shared/core-modules';
import { IContext } from '~/connectionResolvers';
import { ISkillCreateInput, ISkillUpdateInput } from '@/skills/@types/skills';
import {
  activateInvocableSkill,
  activateSkillVersion,
  createSkill,
  demoteSkill,
  promoteSkill,
  publishSkill,
  removeSkill,
  updateSkill,
} from '@/skills/service/skillsService';
import { distillThreadToSkill } from '@/skills/service/distill';
import { requireUserId } from '@/_shared/auth';
import { requireScopedWorkflowAgent } from '@/workflow/authorization';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';

// Moderators may manage global or seed skills they do not author.
const isSkillsAdmin = (
  subdomain: string,
  user: IContext['user'],
): Promise<boolean> =>
  canGroup(subdomain, ERXES_AGENT_ACTIONS.skills.moderate, user);

export const skillMutations = {
  mastraSkillCreate: async (
    _parent: undefined,
    { doc }: { doc: ISkillCreateInput },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.skills.create);
    if (doc.visibility === 'public') {
      await checkPermission(ERXES_AGENT_ACTIONS.skills.promote);
    }
    return createSkill(subdomain, requireUserId(user), doc);
  },

  mastraSkillUpdate: async (
    _parent: undefined,
    { _id, doc }: { _id: string; doc: ISkillUpdateInput },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.skills.update);
    return updateSkill(subdomain, requireUserId(user), _id, doc);
  },

  mastraSkillRemove: async (
    _parent: undefined,
    { _id }: { _id: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.skills.remove);
    const userId = requireUserId(user);
    return removeSkill(
      subdomain,
      userId,
      _id,
      await isSkillsAdmin(subdomain, user),
    );
  },

  mastraSkillPublish: async (
    _parent: undefined,
    { _id }: { _id: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.skills.publish);
    return publishSkill(subdomain, requireUserId(user), _id);
  },

  mastraSkillActivateVersion: async (
    _parent: undefined,
    { _id, versionId }: { _id: string; versionId: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.skills.publish);
    return activateSkillVersion(subdomain, requireUserId(user), _id, versionId);
  },

  mastraSkillPromote: async (
    _parent: undefined,
    { _id }: { _id: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.skills.promote);
    return promoteSkill(subdomain, requireUserId(user), _id);
  },

  mastraSkillDemote: async (
    _parent: undefined,
    { _id }: { _id: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.skills.update);
    const userId = requireUserId(user);
    return demoteSkill(
      subdomain,
      userId,
      _id,
      await isSkillsAdmin(subdomain, user),
    );
  },

  mastraSkillFromThread: async (
    _parent: undefined,
    {
      agentId,
      threadId,
      nameHint,
      scopeHint,
    }: {
      agentId: string;
      threadId: string;
      nameHint?: string;
      scopeHint?: string;
    },
    { models, user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.skills.create);
    await checkPermission(ERXES_AGENT_ACTIONS.agent.chat);
    const userId = requireUserId(user);

    const { agent } = await requireScopedWorkflowAgent({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.agent.chat,
      agentId,
    });

    const [providers, settings] = await Promise.all([
      models.MastraProvider.getRuntimeProviders(userId),
      models.MastraSettings.findOne({}),
    ]);

    const content = await distillThreadToSkill({
      subdomain,
      agentId,
      threadId,
      userId,
      userHeader: Buffer.from(JSON.stringify(user)).toString('base64'),
      token: settings?.erxesApiToken,
      provider: agent.provider,
      model: agent.model,
      providers,
      nameHint,
      scopeHint,
    });

    return createSkill(subdomain, userId, {
      ...content,
      visibility: 'private',
    });
  },

  mastraSkillActivate: async (
    _parent: undefined,
    { agentId, name }: { agentId: string; name: string },
    { models, user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.skills.read);
    await checkPermission(ERXES_AGENT_ACTIONS.agent.chat);
    const userId = requireUserId(user);
    const { agent } = await requireScopedWorkflowAgent({
      models,
      subdomain,
      user,
      action: ERXES_AGENT_ACTIONS.agent.chat,
      agentId,
    });
    const globs = agent.skills ?? [];
    return activateInvocableSkill(subdomain, userId, globs, name);
  },
};
