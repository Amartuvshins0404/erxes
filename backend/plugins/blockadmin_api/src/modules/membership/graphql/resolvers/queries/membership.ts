import { IContext } from '~/connectionResolvers';
import { Resolver } from 'erxes-api-shared/core-types';
import { cursorPaginate, sendTRPCMessage } from 'erxes-api-shared/utils';
import { IBaMembershipDocument } from '@/membership/@types/membership';

const baMemberships: Resolver = async (
  _root,
  params,
  { models, subdomain }: IContext,
) => {
  const { searchValue, status, ...cursorParams } = params;

  await models.Membership.expireStale();

  const query: Record<string, any> = {};

  if (status) query.status = status;

  if (searchValue) {
    const customers = await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      method: 'query',
      module: 'customers',
      action: 'find',
      input: {
        query: {
          $or: [
            { primaryEmail: { $regex: searchValue, $options: 'i' } },
            { primaryPhone: { $regex: searchValue, $options: 'i' } },
            { firstName: { $regex: searchValue, $options: 'i' } },
            { lastName: { $regex: searchValue, $options: 'i' } },
            { middleName: { $regex: searchValue, $options: 'i' } },
          ],
          status: { $ne: 'deleted' },
        },
      },
      defaultValue: [],
    });

    query.customerId = { $in: customers.map((c: { _id: string }) => c._id) };
  }

  return cursorPaginate<IBaMembershipDocument>({
    model: models.Membership,
    params: { ...cursorParams, orderBy: { createdAt: -1 } },
    query,
  });
};

const baMembershipDetail: Resolver = async (
  _root,
  { _id },
  { models }: IContext,
) => {
  return models.Membership.expireIfStale(_id);
};

export const membershipQueries = {
  baMemberships,
  baMembershipDetail,
};

export const membershipTypeResolvers = {
  BaMembership: {
    plan: async (sub, _args, { models }: IContext) => {
      if (!sub.planId) return null;
      return models.MembershipPlan.findOne({ _id: sub.planId }).lean();
    },
    customer: async (sub, _args, { subdomain }: IContext) => {
      if (!sub.customerId) return null;
      return sendTRPCMessage({
        subdomain,
        pluginName: 'core',
        method: 'query',
        module: 'contacts',
        action: 'customers.findOne',
        input: { query: { _id: sub.customerId } },
      });
    },
  },
};
