import { ActivityLogInput } from 'erxes-api-shared/core-modules';

const formatAmount = (price: number, currency: string) =>
  `${price.toLocaleString()} ${currency}`;

export const buildMembershipPlanTarget = (plan: any) => ({
  _id: plan._id,
  entityId: plan._id,
});

export const buildPlanCreatedLog = (plan: any): ActivityLogInput => ({
  activityType: 'membership_plan.created',
  target: buildMembershipPlanTarget(plan),
  action: {
    type: 'created',
    description: `Plan "${plan.name}" created — ${formatAmount(plan.price, plan.currency)} / ${plan.durationMonths} months`,
  },
  changes: {
    name: plan.name,
    price: plan.price,
    currency: plan.currency,
    durationMonths: plan.durationMonths,
    description: plan.description,
  },
  metadata: {},
});

export const buildPlanUpdatedLog = (
  plan: any,
  prev: Record<string, any>,
): ActivityLogInput => ({
  activityType: 'membership_plan.updated',
  target: buildMembershipPlanTarget(plan),
  action: {
    type: 'updated',
    description: `Plan "${plan.name}" updated — ${formatAmount(plan.price, plan.currency)} / ${plan.durationMonths} months`,
  },
  changes: {
    prev,
    current: {
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      durationMonths: plan.durationMonths,
      description: plan.description,
    },
  },
  metadata: {},
});

export const buildPlanDeactivatedLog = (plan: any): ActivityLogInput => ({
  activityType: 'membership_plan.deactivated',
  target: buildMembershipPlanTarget(plan),
  action: {
    type: 'deactivated',
    description: `Plan "${plan.name}" deactivated — was ${formatAmount(plan.price, plan.currency)} / ${plan.durationMonths} months`,
  },
  changes: { isActive: false },
  metadata: {},
});
