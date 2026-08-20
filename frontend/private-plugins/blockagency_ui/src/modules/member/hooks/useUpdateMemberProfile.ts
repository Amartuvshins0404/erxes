import { MutationHookOptions, useMutation } from '@apollo/client';
import { toAttachmentInputs } from '~/modules/agency/utils/attachment';
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
    // The form is seeded from `blockAgentGetMemberProfile`, so its attachments
    // carry `__typename`, which `AttachmentInput` rejects.
    return updateMemberProfile({
      variables: {
        input: {
          ...input,
          certificatePhotos: toAttachmentInputs(input.certificatePhotos),
        },
      },
    });
  };

  return {
    onSubmit,
    loading,
    error,
  };
};
