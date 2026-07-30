import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { linkRelation } from '~/utils/relation';

const mushopCancelMyMembership = async (
  _root,
  { _id }: { _id: string },
  { models, cpUser }: IContext,
) => {
  if (!cpUser) throw new Error('Login required');

  const sub = await models.Membership.findOne({
    _id,
    customerId: cpUser.erxesCustomerId || cpUser._id,
  });

  if (!sub) throw new Error('Membership not found');

  return models.Membership.cancelMembership(_id);
};
mushopCancelMyMembership.wrapperConfig = {
  forClientPortal: true,
  cpUserRequired: true,
};

const mushopCancelMembership = async (
  _root,
  { _id }: { _id: string },
  { models, checkPermission }: IContext,
) => {
  await checkPermission('mushopCancelMembership');
  const sub = await models.Membership.findOne({ _id });
  if (!sub) throw new Error('Membership not found');
  return models.Membership.cancelMembership(_id);
};

const mushopGrantMembership = async (
  _root,
  {
    customerId,
    planId,
    paymentId,
    amount: amountInput,
  }: {
    customerId: string;
    planId: string;
    paymentId?: string;
    amount?: number;
  },
  { models, subdomain, checkPermission }: IContext,
) => {
  await checkPermission('mushopGrantMembership');
  if (!customerId) throw new Error('customerId is required');
  if (!planId) throw new Error('planId is required');

  const plan = await models.MembershipPlan.findOne({ _id: planId }).lean();
  if (!plan) throw new Error('Membership plan not found');

  const amount = amountInput != null ? amountInput : plan.price;
  const currency = plan.currency || 'MNT';

  const invoice = await sendTRPCMessage({
    subdomain,
    pluginName: 'payment',
    method: 'mutation',
    module: 'payment',
    action: 'addInvoice',
    input: {
      amount,
      currency,
      customerId,
      customerType: 'customer',
      contentType: 'mushop:membership',
      contentTypeId: customerId,
      description: `Mushop — ${plan.name}`,
      paymentIds: paymentId ? [paymentId] : [],
      status: 'paid',
      resolvedAt: new Date(),
      data: { planId, manual: true },
    },
    defaultValue: null,
  });

  if (!invoice?._id) {
    throw new Error('Failed to create invoice for membership grant');
  }

  const existing = await models.Membership.getActiveMembership(customerId);

  if (existing) {
    return models.Membership.renewMembership(existing._id, {
      planId,
      invoiceId: invoice._id,
      amount,
      currency,
    });
  }

  const membership = await models.Membership.createMembership({
    customerId,
    planId,
    invoiceId: invoice._id,
    amount,
    currency,
  });

  await linkRelation({
    subdomain,
    main: { contentType: 'mushop:membership', contentId: membership._id },
    related: [
      { contentType: 'core:customer', contentId: customerId },
      { contentType: 'payment:invoice', contentId: invoice._id },
    ],
  });

  return membership;
};

const mushopUpdateMembershipEndDate = async (
  _root,
  { _id, endDate }: { _id: string; endDate: Date },
  { models, checkPermission }: IContext,
) => {
  await checkPermission('mushopUpdateMembershipEndDate');
  if (!_id) throw new Error('_id is required');
  if (!endDate) throw new Error('endDate is required');

  return models.Membership.updateEndDate(_id, endDate);
};

const mushopUpdateMembershipStatus = async (
  _root,
  { _id, status }: { _id: string; status: string },
  { models, checkPermission }: IContext,
) => {
  await checkPermission('mushopUpdateMembershipStatus');
  if (!_id) throw new Error('_id is required');
  if (!status) throw new Error('status is required');

  return models.Membership.updateStatus(_id, status);
};

export const membershipMutations = {
  mushopCancelMyMembership,
  mushopCancelMembership,
  mushopGrantMembership,
  mushopUpdateMembershipEndDate,
  mushopUpdateMembershipStatus,
};
