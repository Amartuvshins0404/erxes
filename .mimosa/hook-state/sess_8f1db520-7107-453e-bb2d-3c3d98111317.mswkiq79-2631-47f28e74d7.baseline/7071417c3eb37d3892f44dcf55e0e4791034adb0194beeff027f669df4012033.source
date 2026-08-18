import { useMutation } from '@apollo/client';
import { UPDATE_AGENCY_MEMBER } from '../graphql';

export const useUpdateMember = () => {
  const [mutate, { loading }] = useMutation(UPDATE_AGENCY_MEMBER);

  return {
    loading,
    updateMember: mutate,
  };
};
