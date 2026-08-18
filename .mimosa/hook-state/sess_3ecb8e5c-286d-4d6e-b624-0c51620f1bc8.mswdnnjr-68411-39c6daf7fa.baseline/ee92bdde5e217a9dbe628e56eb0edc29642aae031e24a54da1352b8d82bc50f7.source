import { useMutation } from '@apollo/client';
import { REMOVE_AGENCY_MEMBER } from '../graphql';

export const useRemoveMember = () => {
  const [mutate, { loading }] = useMutation(REMOVE_AGENCY_MEMBER);

  return {
    loading,
    removeMember: mutate,
  };
};
