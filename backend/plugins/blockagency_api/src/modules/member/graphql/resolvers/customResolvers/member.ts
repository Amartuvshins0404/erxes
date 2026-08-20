import { normalizeAttachments } from '~/modules/agency/utils';
import { IBlockAgencyMemberDocument } from '~/modules/member/@types/member';

export const BlockMember = {
  member: ({ memberId }: IBlockAgencyMemberDocument) => ({
    __typename: 'User',
    _id: memberId,
  }),
  certificatePhotos: ({ certificatePhotos }: IBlockAgencyMemberDocument) =>
    normalizeAttachments(certificatePhotos),
};
