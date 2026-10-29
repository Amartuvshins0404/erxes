import { MutationHookOptions, useMutation } from '@apollo/client';
import { ADD_PERMISSIONS } from 'ui-modules/modules/permissions/graphql';
import { FIX_PERMISSIONS } from 'ui-modules/modules/permissions/graphql/mutations/fixPermissions';
import { REMOVE_PERMISSIONS } from 'ui-modules/modules/permissions/graphql/mutations/removePermissions';

export const usePermissionsAdd = () => {
  const [permissionsAdd, { loading }] = useMutation(ADD_PERMISSIONS);

  const mutate = ({ variables, ...options }: MutationHookOptions) => {
    permissionsAdd({
      ...options,
      variables,
    });
  };

  return {
    permissionsAdd: mutate,
    loading,
  };
};

export const usePermissionsFix = () => {
  const [fix, { loading }] = useMutation(FIX_PERMISSIONS);

  const mutate = ({ ...options }: MutationHookOptions) => {
    fix({
      ...options,
    });
  };

  return {
    permissionsFix: mutate,
    loading,
  };
};

export const usePermissionsRemove = () => {
  const [permissionsRemove, { loading }] = useMutation(REMOVE_PERMISSIONS);

  const mutate = ({ variables, ...options }: MutationHookOptions) => {
    permissionsRemove({
      ...options,
      variables,
    });
  };

  return {
    permissionsRemove: mutate,
    loading,
  };
};
