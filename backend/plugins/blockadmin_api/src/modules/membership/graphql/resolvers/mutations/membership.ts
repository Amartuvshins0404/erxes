import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { linkRelation } from '~/utils/relation';

const baCancelMembership = async (
  _root,
  { _id }: { _id: string },
  { models }: IContext,
) => {
  const sub = await models.Membership.findOne({ _id });
  if (!sub) throw new Error('Membership not found');
  return models.Membership.cancelMembership(_id);
};

const baGrantMembership = async (
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
  { models, subdomain }: IContext,
) => {
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
      contentType: 'blockadmin:membership',
      contentTypeId: customerId,
      description: `Blockadmin — ${plan.name}`,
      paymentIds: paymentId ? [paymentId] : [],
      status: 'paid',
      resolvedAt: new Date(),
      data: { planId, manual: true },
    },
    defaultValue: null,
  });

  const invoiceId = invoice?._id || '';

  const existing = await models.Membership.getActiveMembership(customerId);

  const membership = existing
    ? await models.Membership.renewMembership(existing._id, {
        planId,
        invoiceId,
        amount,
        currency,
      })
    : await models.Membership.createMembership({
        customerId,
        planId,
        invoiceId,
        amount,
        currency,
      });

  if (membership) {
    await linkRelation({
      subdomain,
      main: {
        contentType: 'blockadmin:membership',
        contentId: membership._id,
      },
      related: [
        { contentType: 'core:customer', contentId: customerId },
        ...(invoiceId
          ? [{ contentType: 'payment:invoice', contentId: invoiceId }]
          : []),
      ],
    });
  }

  return membership;
};

const baUpdateMembershipEndDate = async (
  _root,
  { _id, endDate }: { _id: string; endDate: Date },
  { models }: IContext,
) => {
  if (!_id) throw new Error('_id is required');
  if (!endDate) throw new Error('endDate is required');

  return models.Membership.updateEndDate(_id, endDate);
};

const baUpdateMembershipStatus = async (
  _root,
  { _id, status }: { _id: string; status: string },
  { models }: IContext,
) => {
  if (!_id) throw new Error('_id is required');
  if (!status) throw new Error('status is required');

  return models.Membership.updateStatus(_id, status);
};

export const membershipMutations = {
  baCancelMembership,
  baGrantMembership,
  baUpdateMembershipEndDate,
  baUpdateMembershipStatus,
};
