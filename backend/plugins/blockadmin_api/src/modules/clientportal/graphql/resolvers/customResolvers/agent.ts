import { normalizeAttachments } from '@/agency/utils';
import { IBlockAdminAgentDocument } from '@/member/@types/member';

export default {
  certificatePhotos: ({ certificatePhotos }: IBlockAdminAgentDocument) =>
    normalizeAttachments(certificatePhotos),
};
