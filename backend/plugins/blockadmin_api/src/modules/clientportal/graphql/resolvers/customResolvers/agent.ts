import { normalizeAttachments } from '@/agency/utils';
import { IBlockAdminAgentDocument } from '@/member/@types/member';
import { findAgentAgency } from '@/member/utils';
import { IContext } from '~/connectionResolvers';

export default {
  certificatePhotos: ({ certificatePhotos }: IBlockAdminAgentDocument) =>
    normalizeAttachments(certificatePhotos),

  agency: (
    { subdomain, agencyId }: IBlockAdminAgentDocument,
    _args: undefined,
    { models }: IContext,
  ) => findAgentAgency(models, { subdomain, agencyId }),
};
