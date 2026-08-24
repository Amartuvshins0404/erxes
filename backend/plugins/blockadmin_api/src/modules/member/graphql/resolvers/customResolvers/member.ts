import { IBlockAdminAgentDocument } from '@/member/@types/member';
import { toAgentCertificatePhotos, toAgentUser } from '@/member/utils';

export const BlockAdminAgent = {
  certificatePhotos: (agent: IBlockAdminAgentDocument) =>
    toAgentCertificatePhotos(agent),

  user: (agent: IBlockAdminAgentDocument) => toAgentUser(agent),
};
