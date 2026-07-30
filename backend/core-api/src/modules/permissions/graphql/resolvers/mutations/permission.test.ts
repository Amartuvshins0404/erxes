const validateAgentProfilePermissions = jest.fn(() => Promise.resolve());
const validatePrincipalGroups = jest.fn(() => Promise.resolve());

jest.mock('~/modules/permissions/agentProfiles', () => ({
  validateAgentProfilePermissions: (...args: unknown[]) =>
    validateAgentProfilePermissions(...args),
}));

jest.mock('~/modules/permissions/principalGroups', () => ({
  validatePrincipalGroups: (...args: unknown[]) =>
    validatePrincipalGroups(...args),
}));

jest.mock('~/modules/organization/team-member/meta/activity-log', () => ({
  generateUserUpdateActivityLogs: jest.fn(),
}));

import type { IContext } from '~/connectionResolvers';
import { permissionMutations } from './permission';

describe('agent permission profile mutation authorization', () => {
  it('uses the centralized permission guard before creating a profile', async () => {
    const checkPermission = jest.fn(() => Promise.resolve());
    const create = jest.fn((doc: unknown) => Promise.resolve(doc));
    const context = {
      checkPermission,
      models: { PermissionGroups: { create } },
    } as unknown as IContext;

    await permissionMutations.permissionGroupAdd(
      undefined,
      {
        name: 'Agent profile',
        principalType: 'agent',
        permissions: [],
      },
      context,
    );

    expect(checkPermission).toHaveBeenCalledWith(
      'permissionsAgentProfilesManage',
    );
    expect(validateAgentProfilePermissions).toHaveBeenCalledWith([]);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Agent profile',
        principalType: 'agent',
      }),
    );
  });
});
