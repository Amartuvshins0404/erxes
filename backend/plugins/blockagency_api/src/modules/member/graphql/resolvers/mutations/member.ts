import {
  checkLogin,
  checkPermissionGroup,
} from 'erxes-api-shared/core-modules';
import { IContext } from '~/connectionResolvers';
import { ensureTenantAgency } from '~/modules/agency/utils';
import {
  IBlockAgencyMember,
  IBlockAgencySyncedMember,
} from '~/modules/member/@types/member';
import {
  assertAgencyAdmin,
  resolveMemberUser,
  toSyncedMember,
  withResolvedUsers,
} from '~/modules/member/utils';

export const blockMemberMutations = {
  blockAgentCreateMember: async (
    _root: undefined,
    args: {
      agencyId: string;
      memberIds: string[];
      members?: IBlockAgencySyncedMember[];
    },
    { models, user, subdomain }: IContext,
  ) => {
    const checkPermission = checkPermissionGroup(subdomain, user);
    await checkPermission('memberCreate');

    // Org permissions say what a user may do in erxes; membership of *this*
    // agency is a separate question, and only its admins manage it.
    await assertAgencyAdmin(models, user);

    const { memberIds } = args;

    // `agencyId` is optional on the mutation, and a member without one belongs
    // to no agency anywhere downstream, so it falls back to the tenant's agency.
    const agencyId =
      args.agencyId ||
      String((await ensureTenantAgency(models, subdomain))._id);

    args.agencyId = agencyId;

    const members = await models.BlockAgencyMember.createMember(
      memberIds.map((memberId) => ({
        agencyId,
        memberId,
      })),
    );

    // `wrapMutationResolver` forwards the mutation arguments to block admin and
    // only takes the `_id` off the resolver result, so the synced snapshot is
    // written back onto the arguments to travel with the webhook.
    const syncedMembers = await withResolvedUsers(members, subdomain);

    args.members = syncedMembers;

    return syncedMembers;
  },

  blockAgentUpdateMember: async (
    _root: undefined,
    args: {
      _id: string;
      input: Partial<IBlockAgencyMember>;
      member?: IBlockAgencySyncedMember;
    },
    { models, user, subdomain }: IContext,
  ) => {
    const checkPermission = checkPermissionGroup(subdomain, user);
    await checkPermission('memberUpdate');

    // Editing another member — including their role — is an admin action.
    await assertAgencyAdmin(models, user);

    const member = await models.BlockAgencyMember.updateMember(
      args._id,
      args.input,
    );

    const syncedMember = toSyncedMember(
      member,
      await resolveMemberUser(member.memberId, subdomain),
    );

    args.member = syncedMember;

    return syncedMember;
  },

  blockAgentUpdateMemberProfile: async (
    _root: undefined,
    args: {
      input: Partial<IBlockAgencyMember>;
      member?: IBlockAgencySyncedMember;
    },
    { models, user, subdomain }: IContext,
  ) => {
    const checkPermission = checkPermissionGroup(subdomain, user);
    await checkPermission('memberUpdate');

    // This mutation upserts the acting user's own member record, so the first
    // profile save can be the row's insert. `agencyId` comes from the tenant's
    // agency and `role` is left to the agency's admins — neither is taken from
    // `input`, or saving a profile could move a member to another agency or
    // promote them.
    const agency = await ensureTenantAgency(models, subdomain);

    const member = await models.BlockAgencyMember.updateProfile(user._id, {
      description: args.input.description,
      country: args.input.country,
      city: args.input.city,
      district: args.input.district,
      facebookUrl: args.input.facebookUrl,
      instagramUrl: args.input.instagramUrl,
      linkedUrl: args.input.linkedUrl,
      certificatePhotos: args.input.certificatePhotos,
      agencyId: String(agency._id),
    });

    const syncedMember = toSyncedMember(
      member,
      await resolveMemberUser(member.memberId, subdomain),
    );

    args.member = syncedMember;

    return syncedMember;
  },

  blockAgentRemoveMember: async (
    _root: undefined,
    { _id }: { _id: string },
    { models, user, subdomain }: IContext,
  ) => {
    checkLogin(user);
    const checkPermission = checkPermissionGroup(subdomain, user);
    await checkPermission('memberRemove');

    await assertAgencyAdmin(models, user);

    await models.BlockAgencyMember.removeMember(_id);
    return true;
  },
};
