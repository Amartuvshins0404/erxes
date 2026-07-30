import { IModels } from '~/connectionResolvers';

type PermissionPrincipal = {
  role?: string;
};

export const validatePrincipalGroups = async (
  models: IModels,
  user: PermissionPrincipal,
  groupIds: string[],
) => {
  const customGroupIds = groupIds.filter((id) => !id.includes(':'));
  const customGroups = await models.PermissionGroups.find({
    _id: { $in: customGroupIds },
  })
    .select({ _id: 1, principalType: 1 })
    .lean();

  if (customGroups.length !== customGroupIds.length) {
    throw new Error('One or more permission groups were not found');
  }

  if (user.role === 'system') {
    if (
      groupIds.length !== customGroups.length ||
      customGroups.some((group) => group.principalType !== 'agent')
    ) {
      throw new Error('Service users may only receive agent grant profiles');
    }
    return;
  }

  if (customGroups.some((group) => group.principalType === 'agent')) {
    throw new Error('Agent grant profiles cannot be assigned to human users');
  }
};
