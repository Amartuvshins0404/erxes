import { IBlockAdminListingDocument } from '@/listing/@types/listing';
import { IContext } from '~/connectionResolvers';

export default {
  agencyId: async (
    { subdomain }: IBlockAdminListingDocument,
    _args: undefined,
    { models }: IContext,
  ) => {
    const agency = await models.Agency.findOne({ subdomain })
      .select('_id')
      .lean();

    return agency?._id;
  },
};
