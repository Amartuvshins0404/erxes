import { ExpectedError } from 'erxes-api-shared/utils';
import { canGroup } from 'erxes-api-shared/core-modules';
import type { IUserDocument } from 'erxes-api-shared/core-types';
import { IContext } from '~/connectionResolvers';
import type {
  IMastraAgent,
  IMastraAgentDocument,
  IMastraAgentInput,
} from '@/agent/@types/agent';
import {
  AgentAccount,
  createAgentAccount,
  deactivateAgentAccount,
  updateAgentAccount,
} from '~/mastra/auth/servicePrincipal';
import { resolveAgentPermissions } from '~/mastra/tools/permissionCapabilities';
import { toUserFacingAgentError } from './agentErrors';

const assertPermissionGroupsExist = async (
  subdomain: string,
  permissionGroupIds: string[],
): Promise<string[]> => {
  const normalized = [
    ...new Set(permissionGroupIds.map((id) => id.trim()).filter(Boolean)),
  ];
  if (!normalized.length) {
    throw new ExpectedError(
      'Select at least one permission group for this AI team member.',
    );
  }
  const { foundGroupIds } = await resolveAgentPermissions({
    subdomain,
    permissionGroupIds: normalized,
  });
  const missing = normalized.filter((id) => !foundGroupIds.includes(id));
  if (missing.length) {
    throw new ExpectedError(
      `Permission group${
        missing.length > 1 ? 's' : ''
      } not found: ${missing.join(', ')}`,
    );
  }
  return normalized;
};

const assertPermissionGroupsAssignable = async (
  subdomain: string,
  user: IUserDocument,
): Promise<void> => {
  if (await canGroup(subdomain, 'permissionsManage', user)) return;
  throw new ExpectedError(
    'Assigning AI team-member permissions requires the Manage Permissions permission.',
  );
};

const toAgentView = (profile: IMastraAgentDocument, account: AgentAccount) => ({
  ...profile.toObject(),
  _id: profile._id,
  accountName:
    account.details?.fullName ||
    account.username ||
    account.email ||
    'AI team member',
  accountDescription: account.details?.description || '',
  permissionGroupIds: account.permissionGroupIds || [],
  isActive: account.isActive !== false,
});

const splitInput = (doc: IMastraAgentInput) => {
  const { name, description, permissionGroupIds, isActive, ...profile } = doc;
  return {
    account: { name, description, permissionGroupIds, isActive },
    profile,
  };
};

export const agentMutations = {
  mastraAgentCreate: async (
    _parent: undefined,
    { doc }: { doc: IMastraAgentInput },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission('agentsCreate');
    if (!user?._id) throw new ExpectedError('Login required');
    const { account, profile } = splitInput(doc);
    const name = account.name?.trim();
    if (!name) throw new ExpectedError('Name is required');
    if (!profile.provider?.trim()) {
      throw new ExpectedError('Provider is required');
    }
    if (!profile.model?.trim()) throw new ExpectedError('Model is required');
    await assertPermissionGroupsAssignable(subdomain, user);
    const permissionGroupIds = await assertPermissionGroupsExist(
      subdomain,
      account.permissionGroupIds ?? [],
    );

    let createdAccount: AgentAccount | null = null;
    try {
      createdAccount = await createAgentAccount({
        subdomain,
        input: {
          name,
          description: account.description,
          permissionGroupIds,
          isActive: account.isActive,
        },
      });
      const createdProfile = await models.MastraAgent.createAgent(
        createdAccount._id,
        profile as IMastraAgent,
      );
      return toAgentView(createdProfile, createdAccount);
    } catch (error) {
      if (createdAccount?._id) {
        await deactivateAgentAccount({
          userId: createdAccount._id,
          subdomain,
        }).catch(() => undefined);
        await models.MastraAgent.deleteOne({
          _id: createdAccount._id,
        });
      }
      throw toUserFacingAgentError(error);
    }
  },

  mastraAgentUpdate: async (
    _parent: undefined,
    { _id, doc }: { _id: string; doc: IMastraAgentInput },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission('agentsEdit');
    if (!user?._id) throw new ExpectedError('Login required');
    const { account, profile } = splitInput(doc);
    const existingProfile = await models.MastraAgent.getAgent(_id);
    const existingAccount = await updateAgentAccount({
      userId: _id,
      subdomain,
      input: {},
    });

    let permissionGroupIds = account.permissionGroupIds;
    if (permissionGroupIds !== undefined) {
      await assertPermissionGroupsAssignable(subdomain, user);
      permissionGroupIds = await assertPermissionGroupsExist(
        subdomain,
        permissionGroupIds,
      );
    }
    if (account.name !== undefined && !account.name.trim()) {
      throw new ExpectedError('Name is required');
    }

    const accountChanged =
      account.name !== undefined ||
      account.description !== undefined ||
      permissionGroupIds !== undefined ||
      account.isActive !== undefined;
    const profileChanged = Object.keys(profile).length > 0;

    try {
      const updatedAccount = accountChanged
        ? await updateAgentAccount({
            userId: _id,
            subdomain,
            input: {
              ...(account.name !== undefined ? { name: account.name } : {}),
              ...(account.description !== undefined
                ? { description: account.description }
                : {}),
              ...(permissionGroupIds !== undefined
                ? { permissionGroupIds }
                : {}),
              ...(account.isActive !== undefined
                ? { isActive: account.isActive }
                : {}),
            },
          })
        : existingAccount;
      const updatedProfile = profileChanged
        ? await models.MastraAgent.updateAgent(_id, profile)
        : existingProfile;
      return toAgentView(updatedProfile, updatedAccount);
    } catch (error) {
      if (accountChanged) {
        await updateAgentAccount({
          userId: _id,
          subdomain,
          input: {
            name:
              existingAccount.details?.fullName ||
              existingAccount.username ||
              existingAccount.email ||
              'AI team member',
            description: existingAccount.details?.description || '',
            permissionGroupIds: existingAccount.permissionGroupIds || [],
            isActive: existingAccount.isActive !== false,
          },
        }).catch(() => undefined);
      }
      throw toUserFacingAgentError(error);
    }
  },

  mastraAgentRemove: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission('agentsRemove');
    if (!user?._id) throw new ExpectedError('Login required');
    try {
      await models.MastraAgent.getAgent(_id);
      await deactivateAgentAccount({ userId: _id, subdomain });
      return models.MastraAgent.removeAgent(_id);
    } catch (error) {
      throw toUserFacingAgentError(error);
    }
  },
};
