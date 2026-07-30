import { ExpectedError } from 'erxes-api-shared/utils';
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

const requireUser = (user: IContext['user']): string => {
  if (!user?._id) throw new ExpectedError('Login required');
  return user._id;
};

// A skills "admin" is anyone who can promote (the Agent Admin group, plus the
// instance owner — canGroup short-circuits true for isOwner). Only admins may
// manage skills they don't author (seeds, other users' promoted globals);
// everyone else is limited to their OWN skills.
const isSkillsAdmin = (
  subdomain: string,
  user: IContext['user'],
): Promise<boolean> => canGroup(subdomain, 'skillsPromote', user);

export const skillMutations = {
  mastraSkillCreate: async (
    _parent: undefined,
    { doc }: { doc: ISkillCreateInput },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('skillsCreate');
    // Creating a public (global) skill directly is a promotion — gate it.
    if (doc.visibility === 'public') await checkPermission('skillsPromote');
    return createSkill(subdomain, requireUser(user), doc);
  },

  mastraSkillUpdate: async (
    _parent: undefined,
    { _id, doc }: { _id: string; doc: ISkillUpdateInput },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('skillsEdit');
    return updateSkill(subdomain, requireUser(user), _id, doc);
  },

  mastraSkillRemove: async (
    _parent: undefined,
    { _id }: { _id: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('skillsRemove');
    const userId = requireUser(user);
    return removeSkill(subdomain, userId, _id, await isSkillsAdmin(subdomain, user));
  },

  mastraSkillPublish: async (
    _parent: undefined,
    { _id }: { _id: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('skillsEdit');
    return publishSkill(subdomain, requireUser(user), _id);
  },

  mastraSkillActivateVersion: async (
    _parent: undefined,
    { _id, versionId }: { _id: string; versionId: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('skillsEdit');
    return activateSkillVersion(subdomain, requireUser(user), _id, versionId);
  },

  mastraSkillPromote: async (
    _parent: undefined,
    { _id }: { _id: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('skillsPromote');
    return promoteSkill(subdomain, requireUser(user), _id);
  },

  mastraSkillDemote: async (
    _parent: undefined,
    { _id }: { _id: string },
    { user, subdomain, checkPermission }: IContext,
  ) => {
    // Demote is the inverse of promote, but it must also be available to the
    // skill's AUTHOR (who has skillsEdit but not skillsPromote). So gate the
    // action with skillsEdit and enforce author-or-admin ownership in the
    // service (admins may demote skills they don't own, e.g. seeds).
    await checkPermission('skillsEdit');
    const userId = requireUser(user);
    return demoteSkill(subdomain, userId, _id, await isSkillsAdmin(subdomain, user));
  },

  mastraSkillFromThread: async (
    _parent: undefined,
    {
      agentId,
      threadId,
      nameHint,
      scopeHint,
    }: { agentId: string; threadId: string; nameHint?: string; scopeHint?: string },
    { models, user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('skillsCreate');
    const userId = requireUser(user);

    const agent = await models.MastraAgent.findOne({ agentId });
    if (!agent) throw new ExpectedError(`Agent "${agentId}" not found`);

    const [providers, settings] = await Promise.all([
      models.MastraProvider.find({ isEnabled: true }),
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

    return createSkill(subdomain, userId, { ...content, visibility: 'private' });
  },

  mastraSkillActivate: async (
    _parent: undefined,
    { agentId, name }: { agentId: string; name: string },
    { models, user, subdomain, checkPermission }: IContext,
  ) => {
    // Activation only READS a skill's instructions, so gate it with the read
    // permission, not skillsEdit.
    await checkPermission('skillsView');
    const agent = await models.MastraAgent.findOne({ agentId });
    const globs = agent?.skills ?? [];
    return activateInvocableSkill(subdomain, requireUser(user), globs, name);
  },
};
