import { FilterQuery } from 'mongoose';
import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';
import {
  IBlockListingAgent,
  IBlockListingDocument,
  ListingQueryParams,
} from './@types/listing';

export const resolveListingAgent = async (
  memberId: string | undefined,
  subdomain: string,
  models: IModels,
): Promise<IBlockListingAgent | null> => {
  if (!memberId) return null;

  const agencyMember = await models.BlockAgencyMember.findById(memberId).lean();
  if (!agencyMember?.memberId) return null;

  const users = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    module: 'users',
    action: 'find',
    input: {
      query: { _id: agencyMember.memberId },
      fields: { _id: 1, email: 1, details: 1 },
    },
    defaultValue: [],
  });

  const user = Array.isArray(users) ? users[0] : null;
  if (!user) return null;

  return {
    _id: String(user._id),
    firstName: user.details?.firstName || null,
    lastName: user.details?.lastName || null,
    email: user.email || null,
  };
};

export const generateFilter = async (params: ListingQueryParams) => {
  const { searchValue, status, city, district } = params;

  const filter: FilterQuery<IBlockListingDocument> = {};

  if (status) {
    filter.status = status;
  }

  if (searchValue) {
    filter.name = { $regex: searchValue, $options: 'i' };
  }

  if (city) {
    filter['operationArea.city'] = city;
  }

  if (district) {
    filter['operationArea.district'] = district;
  }

  return filter;
};
