import { useMutation } from '@apollo/client';
import {
  ADD_PACKAGE,
  CHANGE_PACKAGE_STATUS,
  EDIT_PACKAGE,
  REMOVE_PACKAGES,
} from '../graphql/packageMutations';

export const useAddPackage = () => {
  const [mutate, { loading }] = useMutation(ADD_PACKAGE);
  return { addPackage: mutate, loading };
};

export const useEditPackage = () => {
  const [mutate, { loading }] = useMutation(EDIT_PACKAGE);
  return { editPackage: mutate, loading };
};

export const useChangePackageStatus = () => {
  const [mutate, { loading }] = useMutation(CHANGE_PACKAGE_STATUS);
  return { changeStatus: mutate, loading };
};

export const useRemovePackages = () => {
  const [mutate, { loading }] = useMutation(REMOVE_PACKAGES);
  return { removePackages: mutate, loading };
};
