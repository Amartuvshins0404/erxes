import {
  IPermissionAction,
  IPermissionInput,
  IPermissionGroupPermission,
  IPermissionModule,
} from 'erxes-api-shared/core-types';
import { getPlugin } from 'erxes-api-shared/utils';

export type AgentProfilePermission = IPermissionInput &
  Pick<IPermissionGroupPermission, 'plugin'>;

export class InvalidAgentProfilePermissionError extends Error {}

const invalidAgentProfilePermission = (message: string): never => {
  throw new InvalidAgentProfilePermissionError(message);
};

export const isAgentCallablePermissionAction = (
  _permissionModule: IPermissionModule,
  permissionAction: IPermissionAction,
) => permissionAction.agentCallable === true;

export const validateAgentProfilePermissions = async (
  permissions: AgentProfilePermission[],
) => {
  for (const permission of permissions) {
    const service = await getPlugin(permission.plugin);
    const permissionModules = service?.config?.meta?.permissions?.modules;
    if (!permissionModules) {
      throw new Error(
        'Permission catalog is unavailable for agent grant validation',
      );
    }
    const permissionModule = permissionModules.find(
      (candidate: IPermissionModule) => candidate.name === permission.module,
    );
    if (!permissionModule) {
      invalidAgentProfilePermission(
        'Agent grant contains an unknown permission module',
      );
    }
    if (
      !permissionModule.scopes?.some(
        (candidate) => candidate.name === permission.scope,
      )
    ) {
      invalidAgentProfilePermission(
        'Agent grant contains an invalid permission scope',
      );
    }
    for (const actionName of permission.actions) {
      const permissionAction = permissionModule.actions.find(
        (candidate) => candidate.name === actionName,
      );
      if (
        !permissionAction ||
        !isAgentCallablePermissionAction(permissionModule, permissionAction)
      ) {
        invalidAgentProfilePermission(
          `Permission action "${actionName}" cannot be granted to an agent`,
        );
      }
    }
  }
};
