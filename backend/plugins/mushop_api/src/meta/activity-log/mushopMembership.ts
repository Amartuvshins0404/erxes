import { ActivityLogInput } from 'erxes-api-shared/core-modules';

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const formatAmount = (amount?: number, currency?: string) =>
  amount != null ? `${amount.toLocaleString()} ${currency || 'MNT'}` : null;

export const buildMembershipTarget = (sub: any) => ({
  _id: sub._id,
  entityId: sub.customerId,
});

export const buildMembershipCreatedLog = (
  sub: any,
  planName: string,
): ActivityLogInput => ({
  activityType: 'membership.created',
  target: buildMembershipTarget(sub),
  action: {
    type: 'created',
    description: `Joined to "${planName}" — paid ${formatAmount(sub.amount, sub.currency)}, active from ${formatDate(sub.startDate)} to ${formatDate(sub.endDate)} (invoice: ${sub.invoiceId})`,
  },
  changes: {
    planId: sub.planId,
    startDate: sub.startDate,
    endDate: sub.endDate,
    amount: sub.amount,
    currency: sub.currency,
  },
  metadata: { invoiceId: sub.invoiceId },
});

export const buildMembershipExtendedLog = (
  sub: any,
  planName: string,
  prevEndDate: Date,
): ActivityLogInput => ({
  activityType: 'membership.extended',
  target: buildMembershipTarget(sub),
  action: {
    type: 'extended',
    description: `Renewed "${planName}" — paid ${formatAmount(sub.amount, sub.currency)}, extended from ${formatDate(prevEndDate)} to ${formatDate(sub.endDate)} (invoice: ${sub.invoiceId})`,
  },
  changes: {
    prev: { endDate: prevEndDate },
    current: { endDate: sub.endDate },
  },
  metadata: { invoiceId: sub.invoiceId, planId: sub.planId },
});

export const buildMembershipEndDateAdjustedLog = (
  sub: any,
  planName: string,
  prevEndDate: Date,
): ActivityLogInput => ({
  activityType: 'membership.endDateAdjusted',
  target: buildMembershipTarget(sub),
  action: {
    type: 'endDateAdjusted',
    description: `"${planName}" end date adjusted from ${formatDate(prevEndDate)} to ${formatDate(sub.endDate)}`,
  },
  changes: {
    prev: { endDate: prevEndDate },
    current: { endDate: sub.endDate },
  },
  metadata: { planId: sub.planId },
});

export const buildMembershipStatusChangedLog = (
  sub: any,
  planName: string,
  prevStatus: string,
): ActivityLogInput => ({
  activityType: 'membership.statusChanged',
  target: buildMembershipTarget(sub),
  action: {
    type: 'statusChanged',
    description: `"${planName}" status changed from ${prevStatus} to ${sub.status}`,
  },
  changes: {
    prev: { status: prevStatus },
    current: { status: sub.status },
  },
  metadata: { planId: sub.planId },
});

export const buildMembershipCancelledLog = (
  sub: any,
  planName: string,
): ActivityLogInput => ({
  activityType: 'membership.cancelled',
  target: buildMembershipTarget(sub),
  action: {
    type: 'cancelled',
    description: `"${planName}" membership cancelled — was active until ${formatDate(sub.endDate)}`,
  },
  changes: { status: 'cancelled' },
  metadata: { planId: sub.planId },
});

export const buildMembershipExpiredLog = (
  sub: any,
  planName: string,
): ActivityLogInput => ({
  activityType: 'membership.expired',
  target: buildMembershipTarget(sub),
  action: {
    type: 'expired',
    description: `"${planName}" membership expired — ended ${formatDate(sub.endDate)}, started ${formatDate(sub.startDate)}`,
  },
  changes: { status: 'expired' },
  metadata: { planId: sub.planId },
});
