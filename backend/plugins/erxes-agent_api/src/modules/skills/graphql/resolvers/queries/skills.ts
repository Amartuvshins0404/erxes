import { IContext } from '~/connectionResolvers';
import { IMastraSkill, SkillScope, SkillStatus } from '@/skills/@types/skills';
import {
  getSkill,
  getSkillVersion,
  listInvocableSkills,
  listSkills,
  listSkillVersions,
} from '@/skills/service/skillsService';
import { getSkillsStore } from '@/skills/store/skillsStore';
import { requireUserId } from '@/_shared/auth';
import { requireScopedWorkflowAgent } from '@/workflow/authorization';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';

export const skillQueries = {
  mastraSkills: async (
    _parent: undefined,
    params: {
      scope?: SkillScope;
      status?: SkillStatus;
      searchValue?: string;
      page?: number;
      perPage?: number;
    },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.skills.read);
    return listSkills(subdomain, requireUserId(user), params || {});
  },

  mastraSkill: async (
    _parent: undefined,
    { _id }: { _id: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.skills.read);
    return getSkill(subdomain, requireUserId(user), _id);
  },

  mastraSkillVersions: async (
    _parent: undefined,
    {
      skillId,
      page,
      perPage,
    }: { skillId: string; page?: number; perPage?: number },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.skills.read);
    return listSkillVersions(
      subdomain,
      requireUserId(user),
      skillId,
      page,
      perPage,
    );
  },

  mastraSkillVersion: async (
    _parent: undefined,
    { _id }: { _id: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission(ERXES_AGENT_ACTIONS.skills.read);
    return getSkillVersion(subdomain, requireUserId(user), _id);
  },

  mastraInvocableSkills: async (
    _parent: undefined,
    { agentId }: { agentId: string },
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
    return listInvocableSkills(subdomain, userId, globs);
  },
};

// Lazy field resolver — version counts are only fetched when the field is
// selected (avoids a countVersions round-trip per row in list views).
export const skillCustomResolvers = {
  MastraSkill: {
    versionCount: async (
      skill: IMastraSkill,
      _args: undefined,
      { subdomain }: IContext,
    ) => {
      const store = await getSkillsStore(subdomain);
      return store.countVersions(skill._id);
    },
  },
};
