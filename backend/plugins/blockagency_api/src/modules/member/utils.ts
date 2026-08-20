import { IUserDocument } from 'erxes-api-shared/core-types';
import { ExpectedError, sendTRPCMessage } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';
import { sendBlockAdminMessage } from '~/modules/admin/utils';
import {
  IBlockAgencyMemberDocument,
  IBlockAgencyMemberUser,
  IBlockAgencySyncedMember,
} from '~/modules/member/@types/member';

/**
 * Members only store the core user id. Block admin lives in another tenant and
 * cannot resolve that user itself, so every member mutation ships a denormalized
 * user summary along with the synced record.
 */
export const resolveMemberUsers = async (
  memberIds: string[],
  subdomain: string,
): Promise<Record<string, IBlockAgencyMemberUser>> => {
  const ids = memberIds.filter(Boolean);

  if (!ids.length) {
    return {};
  }

  const users = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    module: 'users',
    action: 'find',
    input: {
      query: { _id: { $in: ids } },
      fields: { _id: 1, email: 1, details: 1 },
    },
    defaultValue: [],
  });

  if (!Array.isArray(users)) {
    return {};
  }

  return users.reduce<Record<string, IBlockAgencyMemberUser>>((acc, user) => {
    acc[String(user._id)] = {
      _id: String(user._id),
      firstName: user.details?.firstName || null,
      lastName: user.details?.lastName || null,
      avatar: user.details?.avatar || null,
      email: user.email || null,
    };

    return acc;
  }, {});
};

export const resolveMemberUser = async (
  memberId: string | undefined,
  subdomain: string,
): Promise<IBlockAgencyMemberUser | null> => {
  if (!memberId) return null;

  const users = await resolveMemberUsers([memberId], subdomain);

  return users[memberId] ?? null;
};

/**
 * The snapshot block admin mirrors. `wrapMutationResolver` forwards mutation
 * arguments and only takes the `_id` off a single-object result, so this shape
 * is what travels on the webhook rather than the resolver's return value.
 */
export const toSyncedMember = (
  member: IBlockAgencyMemberDocument,
  user: IBlockAgencyMemberUser | null,
): IBlockAgencySyncedMember => ({
  ...member.toObject(),
  user,
});

export const withResolvedUsers = async (
  members: IBlockAgencyMemberDocument[],
  subdomain: string,
): Promise<IBlockAgencySyncedMember[]> => {
  const users = await resolveMemberUsers(
    members.map((member) => member.memberId ?? ''),
    subdomain,
  );

  return members.map((member) =>
    toSyncedMember(member, users[member.memberId ?? ''] ?? null),
  );
};

/**
 * The tenant's erxes owners. They run the agency, so they are seeded as its
 * first members with the `admin` role.
 */
const resolveOwnerIds = async (subdomain: string): Promise<string[]> => {
  const owners = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    module: 'users',
    action: 'find',
    input: {
      query: { isOwner: true },
      fields: { _id: 1 },
    },
    defaultValue: [],
  });

  if (!Array.isArray(owners)) {
    return [];
  }

  return owners.map((owner) => String(owner._id)).filter(Boolean);
};

/**
 * Agency roles, not erxes permission groups: a user may hold `memberCreate` in
 * the org and still be a plain member of this agency. The tenant's owner always
 * counts as an agency admin, the same way core treats `isOwner` as every
 * permission.
 */
export const isAgencyAdmin = async (
  models: IModels,
  user: IUserDocument,
): Promise<boolean> => {
  if (user?.isOwner) {
    return true;
  }

  const member = await models.BlockAgencyMember.findOne({
    memberId: user?._id,
  }).lean();

  return member?.role === 'admin';
};

export const assertAgencyAdmin = async (
  models: IModels,
  user: IUserDocument,
): Promise<void> => {
  if (!(await isAgencyAdmin(models, user))) {
    throw new ExpectedError(
      'Only an agency admin can manage members',
      'FORBIDDEN',
    );
  }
};

/**
 * Keeps the tenant's owner an `admin` member of the agency.
 *
 * Seeding only happens when the agency is created, so agencies that predate it
 * — and owners who joined later — are repaired here instead. Writes only when
 * something actually changes, since this runs on member reads.
 */
export const ensureOwnerMembership = async (
  models: IModels,
  subdomain: string,
  user: IUserDocument,
  agencyId: string,
) => {
  if (!user?.isOwner || !user?._id) {
    return null;
  }

  const existing = await models.BlockAgencyMember.findOne({
    memberId: user._id,
  }).lean();

  if (existing?.role === 'admin' && existing?.agencyId === agencyId) {
    return null;
  }

  const member = await models.BlockAgencyMember.findOneAndUpdate(
    { memberId: user._id },
    { $set: { agencyId, role: 'admin' }, $setOnInsert: { memberId: user._id } },
    { new: true, upsert: true },
  );

  const [syncedMember] = await withResolvedUsers([member], subdomain);

  sendBlockAdminMessage({
    subdomain,
    path: 'blockAgentCreateMember',
    payload: { data: { agencyId, members: [syncedMember] } },
  });

  return syncedMember;
};

/**
 * Seeds the tenant's owners as `admin` members of a freshly created agency.
 *
 * Runs outside `wrapMutationResolver`, so the block admin mirror is notified
 * here through the same `blockAgentCreateMember` webhook the mutation uses.
 * `role` is only applied on insert, so an owner who is already a member keeps
 * whatever role the agency gave them.
 */
export const seedAgencyOwnerMembers = async (
  models: IModels,
  subdomain: string,
  agencyId: string,
) => {
  const ownerIds = await resolveOwnerIds(subdomain);

  if (!ownerIds.length) {
    return [];
  }

  const members = await Promise.all(
    ownerIds.map((memberId) =>
      models.BlockAgencyMember.findOneAndUpdate(
        { memberId },
        {
          $set: { agencyId },
          $setOnInsert: { memberId, role: 'admin' },
        },
        { new: true, upsert: true },
      ),
    ),
  );

  const syncedMembers = await withResolvedUsers(members, subdomain);

  sendBlockAdminMessage({
    subdomain,
    path: 'blockAgentCreateMember',
    payload: { data: { agencyId, members: syncedMembers } },
  });

  return syncedMembers;
};
