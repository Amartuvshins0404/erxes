import { ExpectedError } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import {
  IMastraSkill,
  SkillScope,
  SkillStatus,
} from '@/skills/@types/skills';
import {
  getSkill,
  getSkillVersion,
  listInvocableSkills,
  listSkills,
  listSkillVersions,
} from '@/skills/service/skillsService';
import { getSkillsStore } from '@/skills/store/skillsStore';

const requireUser = (user: IContext['user']): string => {
  if (!user?._id) throw new ExpectedError('Login required');
  return user._id;
};

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
    await checkPermission('skillsView');
    return listSkills(subdomain, requireUser(user), params || {});
  },

  mastraSkill: async (
    _parent: undefined,
    { _id }: { _id: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('skillsView');
    return getSkill(subdomain, requireUser(user), _id);
  },

  mastraSkillVersions: async (
    _parent: undefined,
    { skillId, page, perPage }: { skillId: string; page?: number; perPage?: number },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('skillsView');
    return listSkillVersions(subdomain, requireUser(user), skillId, page, perPage);
  },

  mastraSkillVersion: async (
    _parent: undefined,
    { _id }: { _id: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('skillsView');
    return getSkillVersion(subdomain, requireUser(user), _id);
  },

  mastraInvocableSkills: async (
    _parent: undefined,
    { agentId }: { agentId: string },
    { models, user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('skillsView');
    const agent = await models.MastraAgent.findOne({ agentId });
    const globs = agent?.skills ?? [];
    return listInvocableSkills(subdomain, requireUser(user), globs);
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
