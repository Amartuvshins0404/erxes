import { IContext } from '~/connectionResolvers';

const mushopMembershipPlanCreate = async (
  _root,
  { doc }: { doc: any },
  { models, checkPermission }: IContext,
) => {
  await checkPermission('mushopMembershipPlanCreate');
  return models.MembershipPlan.createPlan(doc);
};

const mushopMembershipPlanUpdate = async (
  _root,
  { _id, doc }: { _id: string; doc: any },
  { models, checkPermission }: IContext,
) => {
  await checkPermission('mushopMembershipPlanUpdate');
  return models.MembershipPlan.updatePlan(_id, doc);
};

const mushopMembershipPlanDeactivate = async (
  _root,
  { _id }: { _id: string },
  { models, checkPermission }: IContext,
) => {
  await checkPermission('mushopMembershipPlanDeactivate');
  return models.MembershipPlan.deactivatePlan(_id);
};

export const membershipPlanMutations = {
  mushopMembershipPlanCreate,
  mushopMembershipPlanUpdate,
  mushopMembershipPlanDeactivate,
};
