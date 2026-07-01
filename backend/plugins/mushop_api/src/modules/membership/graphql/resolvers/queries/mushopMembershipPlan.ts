import { IContext } from '~/connectionResolvers';
import { Resolver } from 'erxes-api-shared/core-types';
import { cursorPaginate } from 'erxes-api-shared/utils';
import { IMushopMembershipPlanDocument } from '@/membership/@types/mushopMembershipPlan';

const mushopMembershipPlans: Resolver = async (
  _root,
  params,
  { models }: IContext,
) => {
  const { searchValue, isActive, ...cursorParams } = params;

  const query: Record<string, any> = {};

  if (typeof isActive === 'boolean') query.isActive = isActive;
  if (searchValue) query.name = { $regex: searchValue, $options: 'i' };

  return cursorPaginate<IMushopMembershipPlanDocument>({
    model: models.MembershipPlan,
    params: cursorParams,
    query,
  });
};

const mushopMembershipPlanDetail: Resolver = async (
  _root,
  { _id },
  { models }: IContext,
) => {
  return models.MembershipPlan.findOne({ _id }).lean();
};

export const membershipPlanQueries = {
  mushopMembershipPlans,
  mushopMembershipPlanDetail,
};
