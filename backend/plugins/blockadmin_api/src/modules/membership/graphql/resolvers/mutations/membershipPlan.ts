import { IContext } from '~/connectionResolvers';

const baMembershipPlanCreate = async (
  _root,
  { doc }: { doc: any },
  { models }: IContext,
) => {
  return models.MembershipPlan.createPlan(doc);
};

const baMembershipPlanUpdate = async (
  _root,
  { _id, doc }: { _id: string; doc: any },
  { models }: IContext,
) => {
  return models.MembershipPlan.updatePlan(_id, doc);
};

const baMembershipPlanDeactivate = async (
  _root,
  { _id }: { _id: string },
  { models }: IContext,
) => {
  return models.MembershipPlan.deactivatePlan(_id);
};

export const membershipPlanMutations = {
  baMembershipPlanCreate,
  baMembershipPlanUpdate,
  baMembershipPlanDeactivate,
};
