import { IContext } from '~/connectionResolvers';
import { Resolver } from 'erxes-api-shared/core-types';
import { cursorPaginate } from 'erxes-api-shared/utils';
import { IBaMembershipPlanDocument } from '@/membership/@types/membershipPlan';

const baMembershipPlans: Resolver = async (
  _root,
  params,
  { models }: IContext,
) => {
  const { searchValue, isActive, ...cursorParams } = params;

  const query: Record<string, any> = {};

  if (typeof isActive === 'boolean') query.isActive = isActive;
  if (searchValue) query.name = { $regex: searchValue, $options: 'i' };

  return cursorPaginate<IBaMembershipPlanDocument>({
    model: models.MembershipPlan,
    params: cursorParams,
    query,
  });
};

const baMembershipPlanDetail: Resolver = async (
  _root,
  { _id },
  { models }: IContext,
) => {
  return models.MembershipPlan.findOne({ _id }).lean();
};

export const membershipPlanQueries = {
  baMembershipPlans,
  baMembershipPlanDetail,
};
