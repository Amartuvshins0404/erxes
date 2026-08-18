import { MutationHookOptions, useMutation } from '@apollo/client';
import { UPDATE_MEMBER_PROFILE, GET_MEMBER_PROFILE } from '../graphql';
import { IBlockAgencyMember, TAgentForm } from '../types/member';

type MutationResponse = {
  blockAgentUpdateMemberProfile: IBlockAgencyMember;
};

export const useUpdateMemberProfile = (options?: MutationHookOptions) => {
  const [updateMemberProfile, { loading, error }] =
    useMutation<MutationResponse>(UPDATE_MEMBER_PROFILE, {
      refetchQueries: [{ query: GET_MEMBER_PROFILE }],
      ...options,
    });

  const onSubmit = (input: TAgentForm) => {
    return updateMemberProfile({ variables: { input } });
  };

  return {
    onSubmit,
    loading,
    error,
  };
};
