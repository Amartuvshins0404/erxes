import {
  checkLogin,
  checkPermissionGroup,
} from 'erxes-api-shared/core-modules';
import { IContext } from '~/connectionResolvers';
import { ensureTenantAgency } from '~/modules/agency/utils';
import { ensureOwnerMembership } from '~/modules/member/utils';

export const blockMemberQueries = {
  blockAgentGetMember: async (
    _root: undefined,
    { _id }: { _id: string },
    { models, user, subdomain }: IContext,
  ) => {
    checkLogin(user);
    const checkPermission = checkPermissionGroup(subdomain, user);
    await checkPermission('memberView');

    return models.BlockAgencyMember.getMember(_id);
  },

  blockAgentGetMembers: async (
    _root: undefined,
    {
      agencyId,
      page = 1,
      perPage = 20,
    }: { agencyId?: string; page?: number; perPage?: number },
    { models, user, subdomain }: IContext,
  ) => {
    checkLogin(user);
    const checkPermission = checkPermissionGroup(subdomain, user);
    await checkPermission('memberView');

    // Repairs the owner's own membership for agencies created before owners
    // were seeded; a no-op for everyone else.
    const agency = await ensureTenantAgency(models, subdomain);
    await ensureOwnerMembership(models, subdomain, user, String(agency._id));

    const filter = agencyId ? { agencyId } : {};

    return models.BlockAgencyMember.find(filter)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();
  },

  blockAgentGetMembersTotalCount: async (
    _root: undefined,
    { agencyId }: { agencyId?: string },
    { models, user, subdomain }: IContext,
  ) => {
    checkLogin(user);
    const checkPermission = checkPermissionGroup(subdomain, user);
    await checkPermission('memberView');

    const filter = agencyId ? { agencyId } : {};

    return models.BlockAgencyMember.countDocuments(filter);
  },

  blockAgentGetMemberProfile: async (
    _root: undefined,
    _args: unknown,
    { models, user, subdomain }: IContext,
  ) => {
    checkLogin(user);
    const checkPermission = checkPermissionGroup(subdomain, user);
    await checkPermission('memberView');

    const agency = await ensureTenantAgency(models, subdomain);
    await ensureOwnerMembership(models, subdomain, user, String(agency._id));

    return models.BlockAgencyMember.findOne({ memberId: user._id }).lean();
  },
};
