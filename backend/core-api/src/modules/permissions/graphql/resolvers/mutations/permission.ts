import { IContext, IModels } from '~/connectionResolvers';
import {
  IPermissionInput,
  PermissionPrincipalType,
} from 'erxes-api-shared/core-types';
import { generateUserUpdateActivityLogs } from '~/modules/organization/team-member/meta/activity-log';
import { clearGroupActionsCache } from 'erxes-api-shared/core-modules';
import {
  type AgentProfilePermission,
  validateAgentProfilePermissions,
} from '~/modules/permissions/agentProfiles';
import { validatePrincipalGroups } from '~/modules/permissions/principalGroups';

const validatePrincipalType = (
  principalType: string | undefined,
): PermissionPrincipalType => {
  const value = principalType ?? 'human';
  if (value !== 'human' && value !== 'agent') {
    throw new Error('Invalid permission group principal type');
  }
  return value;
};

const validatePrincipalTypeChange = async (
  models: IModels,
  groupId: string,
  principalType: PermissionPrincipalType,
) => {
  const members = await models.Users.find({
    permissionGroupIds: groupId,
  })
    .select({ role: 1 })
    .lean();

  const hasWrongPrincipal = members.some((member) =>
    principalType === 'agent'
      ? member.role !== 'system'
      : member.role === 'system',
  );
  if (hasWrongPrincipal) {
    throw new Error(
      `Cannot convert a permission group while it has ${
        principalType === 'agent' ? 'human' : 'service-user'
      } members`,
    );
  }
};

const requirePermissionGroupManage = async (
  context: IContext,
  principalType: PermissionPrincipalType,
) => {
  if (principalType === 'agent') {
    await context.checkPermission('permissionsAgentProfilesManage');
    return;
  }
  await context.checkPermission('permissionsManage');
};

export const permissionMutations = {
  async permissionGroupAdd(
    _root: unknown,
    {
      name,
      description,
      principalType,
      permissions,
    }: {
      name: string;
      description?: string;
      principalType?: string;
      permissions: AgentProfilePermission[];
    },
    context: IContext,
  ) {
    const validatedPrincipalType = validatePrincipalType(principalType);
    await requirePermissionGroupManage(context, validatedPrincipalType);
    if (validatedPrincipalType === 'agent') {
      await validateAgentProfilePermissions(permissions);
    }

    return context.models.PermissionGroups.create({
      name,
      description,
      principalType: validatedPrincipalType,
      permissions,
    });
  },

  // Update custom permission group
  async permissionGroupEdit(
    _root: unknown,
    {
      _id,
      name,
      description,
      principalType,
      permissions,
    }: {
      _id: string;
      name?: string;
      description?: string;
      principalType?: string;
      permissions?: AgentProfilePermission[];
    },
    context: IContext,
  ) {
    const { models, subdomain } = context;
    const group = await models.PermissionGroups.findOne({ _id });
    if (!group) throw new Error('Permission group not found');

    const nextPrincipalType =
      principalType === undefined
        ? validatePrincipalType(group.principalType)
        : validatePrincipalType(principalType);
    await requirePermissionGroupManage(
      context,
      group.principalType === 'agent' && nextPrincipalType === 'agent'
        ? 'agent'
        : 'human',
    );
    if (nextPrincipalType === 'agent') {
      await validateAgentProfilePermissions(
        (permissions ?? group.permissions ?? []) as AgentProfilePermission[],
      );
    }

    const update: {
      name?: string;
      description?: string;
      principalType?: PermissionPrincipalType;
      permissions?: AgentProfilePermission[];
    } = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (principalType !== undefined) {
      await validatePrincipalTypeChange(models, _id, nextPrincipalType);
      update.principalType = nextPrincipalType;
    }
    if (permissions !== undefined) update.permissions = permissions;

    await models.PermissionGroups.updateOne({ _id }, { $set: update });

    await clearGroupActionsCache({ subdomain, groupId: _id });

    return models.PermissionGroups.findOne({ _id });
  },

  // Remove custom permission group
  async permissionGroupRemove(
    _root: unknown,
    { _id }: { _id: string },
    context: IContext,
  ) {
    const { models, subdomain } = context;
    const group = await models.PermissionGroups.findOne({ _id });
    if (!group) throw new Error('Permission group not found');
    await requirePermissionGroupManage(
      context,
      validatePrincipalType(group.principalType),
    );

    await clearGroupActionsCache({ subdomain, groupId: _id });

    // Remove from all users
    await models.Users.updateMany(
      { permissionGroupIds: _id },
      { $pull: { permissionGroupIds: _id } },
    );

    await models.PermissionGroups.deleteOne({ _id });

    return { success: true };
  },

  // Assign permission groups to user
  async userUpdatePermissionGroups(
    _root: unknown,
    { userId, groupIds }: { userId: string; groupIds: string[] },
    { models, checkPermission }: IContext,
  ) {
    await checkPermission('permissionsManage');

    const user = await models.Users.findOne({ _id: userId });
    if (!user) throw new Error('User not found');
    await validatePrincipalGroups(models, user, groupIds);

    await models.Users.updateUser(userId, { permissionGroupIds: groupIds });

    await clearGroupActionsCache({ userId });

    return models.Users.findOne({ _id: userId });
  },

  // Assign permission groups to many users at once.
  // Default groups (id contains ':') replace any existing group with the
  // same plugin prefix; custom groups (Mongo ObjectId, no ':') are added.
  async usersUpdatePermissionGroups(
    _root: unknown,
    { userIds, groupIds }: { userIds: string[]; groupIds: string[] },
    { models, checkPermission }: IContext,
  ) {
    await checkPermission('permissionsManage');

    const newDefaultPrefixes = groupIds
      .filter((id) => id.includes(':'))
      .map((id) => id.split(':')[0]);

    const users = await models.Users.find({
      _id: { $in: userIds },
    }).lean();

    const foundIds = new Set(users.map((userDocument) => userDocument._id));
    const missing = userIds.filter((id) => !foundIds.has(id));
    if (missing.length) {
      throw new Error(`Users not found: ${missing.join(', ')}`);
    }
    await Promise.all(
      users.map((user) => validatePrincipalGroups(models, user, groupIds)),
    );
    for (const user of users) {
      const existing: string[] = user.permissionGroupIds || [];

      const kept = existing.filter((id) => {
        if (!id.includes(':')) return true;
        const prefix = id.split(':')[0];
        return !newDefaultPrefixes.includes(prefix);
      });

      const merged = Array.from(new Set([...kept, ...groupIds]));

      await models.Users.updateUser(user._id, {
        permissionGroupIds: merged,
      });
    }
    await Promise.all(
      users.map((user) => clearGroupActionsCache({ userId: user._id })),
    );
    return { success: true, count: users.length };
  },

  // Add custom permission to user
  async userAddCustomPermission(
    _root: unknown,
    { userId, permission }: { userId: string; permission: IPermissionInput },
    { subdomain, models, eventHandlers, checkPermission }: IContext,
  ) {
    await checkPermission('permissionsManage');

    const user = await models.Users.findOne({ _id: userId });
    if (!user) throw new Error('User not found');
    if (user.role === 'system') {
      throw new Error('Service users must use an agent grant profile');
    }

    const { sendDbEventLog, createActivityLog } = eventHandlers('core')(
      'organization',
      'users',
    );
    // Remove existing permission for same module (replace)
    await models.Users.updateOne(
      { _id: userId },
      { $pull: { customPermissions: { module: permission.module } } },
    );

    // Add new permission

    await models.Users.updateOne(
      { _id: userId },
      { $push: { customPermissions: permission } },
    );

    const updatedUser = await models.Users.findOne({ _id: userId });
    if (updatedUser) {
      sendDbEventLog({
        action: 'update',
        docId: updatedUser._id,
        currentDocument: updatedUser.toObject(),
        prevDocument: user.toObject(),
      });

      // Generate activity logs for changed activity fields
      generateUserUpdateActivityLogs(
        { models, subdomain },
        user,
        updatedUser,
        createActivityLog,
      );
    }
    await clearGroupActionsCache({ userId });
    return updatedUser;
  },

  // Remove custom permission from user
  async userRemoveCustomPermission(
    _root: unknown,
    { userId, module }: { userId: string; module: string },
    { models, subdomain, eventHandlers, checkPermission }: IContext,
  ) {
    await checkPermission('permissionsManage');

    const user = await models.Users.findOne({ _id: userId });
    if (!user) throw new Error('User not found');
    const { sendDbEventLog, createActivityLog } = eventHandlers('core')(
      'organization',
      'users',
    );
    await models.Users.updateOne(
      { _id: userId },
      { $pull: { customPermissions: { module } } },
    );

    const updatedUser = await models.Users.findOne({ _id: userId });

    if (updatedUser) {
      sendDbEventLog({
        action: 'update',
        docId: updatedUser._id,
        currentDocument: updatedUser.toObject(),
        prevDocument: user.toObject(),
      });

      // Generate activity logs for changed activity fields
      generateUserUpdateActivityLogs(
        { models, subdomain },
        user,
        updatedUser,
        createActivityLog,
      );
    }
    await clearGroupActionsCache({ userId });
    return updatedUser;
  },
};
