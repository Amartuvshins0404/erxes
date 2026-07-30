import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import {
  currentUserPermissionsState,
  pluginsWithPermissionsState,
  isPermissionsLoadedState,
} from 'ui-modules/states/currentUserPermissionsState';
import { currentUserState } from 'ui-modules/states/currentUserState';
import { PermissionScope } from './useCurrentUserPermissions';

export const usePermissionCheck = () => {
  const permissions = useAtomValue(currentUserPermissionsState);
  const pluginsWithPermissions = useAtomValue(pluginsWithPermissionsState);
  const isLoaded = useAtomValue(isPermissionsLoadedState);
  const currentUser = useAtomValue(currentUserState);

  const isOwner = currentUser?.isOwner === true;

  const isWildcard = useMemo(() => {
    if (isOwner) return true;
    if (!permissions) return false;
    return permissions.some((p) => p.module === '*' && p.actions.includes('*'));
  }, [permissions, isOwner]);

  const hasPluginPermission = useMemo(() => {
    return (pluginName: string) => {
      if (isWildcard) return true;
      if (!pluginsWithPermissions.includes(pluginName)) return true;
      if (!permissions) return false;
      return permissions.some(
        (p) => p.plugin === pluginName && p.actions.length > 0,
      );
    };
  }, [permissions, pluginsWithPermissions, isWildcard]);

  const hasModulePermission = useMemo(() => {
    return (moduleName: string, pluginName?: string) => {
      if (isWildcard) return true;
      if (!permissions) return false;
      return permissions.some(
        (permission) =>
          permission.module === moduleName &&
          (!pluginName || permission.plugin === pluginName) &&
          permission.actions.length > 0,
      );
    };
  }, [permissions, isWildcard]);

  const hasActionPermission = useMemo(() => {
    return (actionName: string, pluginName?: string) => {
      if (isWildcard) return true;
      if (!permissions) return false;
      return permissions.some(
        (permission) =>
          (!pluginName || permission.plugin === pluginName) &&
          permission.actions.includes(actionName),
      );
    };
  }, [permissions, isWildcard]);

  const getModuleActions = useMemo(() => {
    return (moduleName: string, pluginName?: string): string[] => {
      if (isWildcard) return ['*'];
      if (!permissions) return [];
      const permission = permissions.find(
        (candidate) =>
          candidate.module === moduleName &&
          (!pluginName || candidate.plugin === pluginName),
      );
      return permission?.actions ?? [];
    };
  }, [permissions, isWildcard]);

  const getModuleScope = useMemo(() => {
    return (moduleName: string, pluginName?: string): PermissionScope => {
      if (isWildcard) return 'all';
      if (!permissions) return 'own';
      const permission = permissions.find(
        (candidate) =>
          candidate.module === moduleName &&
          (!pluginName || candidate.plugin === pluginName),
      );
      return permission?.scope ?? 'own';
    };
  }, [permissions, isWildcard]);

  const getActionScope = useMemo(() => {
    return (
      actionName: string,
      pluginName?: string,
    ): PermissionScope | null => {
      if (isWildcard) return 'all';
      if (!permissions) return null;

      const permission = permissions.find(
        (candidate) =>
          (!pluginName || candidate.plugin === pluginName) &&
          candidate.actions.includes(actionName),
      );

      return (
        permission?.actionScopes?.[actionName] ?? permission?.scope ?? null
      );
    };
  }, [permissions, isWildcard]);

  return {
    isLoaded,
    isOwner,
    isWildcard,
    permissions,
    hasPluginPermission,
    hasModulePermission,
    hasActionPermission,
    getModuleActions,
    getModuleScope,
    getActionScope,
  };
};
