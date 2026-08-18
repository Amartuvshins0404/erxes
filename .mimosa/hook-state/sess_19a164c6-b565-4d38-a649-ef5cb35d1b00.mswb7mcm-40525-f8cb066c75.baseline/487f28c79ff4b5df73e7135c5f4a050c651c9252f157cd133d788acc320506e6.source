import { useMutation } from '@apollo/client';
import { CREATE_AGENCY_MEMBER } from '../graphql';

export const useAddMember = () => {
  const [mutate, { loading }] = useMutation(CREATE_AGENCY_MEMBER);

  return {
    addMember: mutate,
    loading,
  };
};
