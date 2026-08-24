import { IBlockAdminAgentDocument } from '@/member/@types/member';
import {
  findAgentAgency,
  toAgentCertificatePhotos,
  toAgentUser,
} from '@/member/utils';
import { IContext } from '~/connectionResolvers';

export default {
  certificatePhotos: (agent: IBlockAdminAgentDocument) =>
    toAgentCertificatePhotos(agent),

  user: (agent: IBlockAdminAgentDocument) => toAgentUser(agent),

  agency: (
    { subdomain, agencyId }: IBlockAdminAgentDocument,
    _args: undefined,
    { models }: IContext,
  ) => findAgentAgency(models, { subdomain, agencyId }),
};
