import { normalizeAttachments } from '@/agency/utils';
import { IBlockAdminAgentDocument } from '@/member/@types/member';

export const BlockAdminAgent = {
  certificatePhotos: ({ certificatePhotos }: IBlockAdminAgentDocument) =>
    normalizeAttachments(certificatePhotos),
};
