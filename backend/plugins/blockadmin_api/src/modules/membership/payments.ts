import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { generateModels } from '~/connectionResolvers';
import { linkRelation } from '~/utils/relation';

export interface IMembershipPaymentData {
  _id: string;
  contentType: string;
  contentTypeId?: string;
  status: string;
  amount: number;
  currency: string;
  data?: {
    cpUserId?: string;
    clientPortalId?: string;
    planId?: string;
    manual?: boolean;
  };
}

const resolveCustomerId = async (
  subdomain: string,
  data: IMembershipPaymentData,
): Promise<string | null> => {
  const cpUserId = data.data?.cpUserId;

  if (!cpUserId) {
    return data.contentTypeId || null;
  }

  const cpUser = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'query',
    module: 'cpUsers',
    action: 'get',
    input: {
      id: cpUserId,
      clientPortalId: data.data?.clientPortalId,
    },
  });

  if (!cpUser) {
    console.error(`[blockadmin:payments] cpUser not found for id=${cpUserId}`);

    return null;
  }

  return cpUser.erxesCustomerId || cpUser._id;
};

export const handleMembershipPayment = async (
  subdomain: string,
  data: IMembershipPaymentData,
) => {
  const models = await generateModels(subdomain);

  const exists = await models.Membership.findOne({
    invoiceId: data._id,
  }).lean();

  if (exists) {
    return;
  }

  const customerId = await resolveCustomerId(subdomain, data);

  if (!customerId) {
    console.error(
      `[blockadmin:payments] Invoice ${data._id} could not be resolved to a customer`,
    );

    return;
  }

  let planId = data.data?.planId;

  if (!planId) {
    const plan = await models.MembershipPlan.findOne().lean();

    planId = plan?._id;
  }

  if (!planId) {
    console.error(
      `[blockadmin:payments] Invoice ${data._id} could not be resolved to a plan`,
    );

    return;
  }

  const existing = await models.Membership.getActiveMembership(customerId);

  if (existing) {
    await models.Membership.renewMembership(existing._id, {
      planId,
      invoiceId: data._id,
      amount: data.amount,
      currency: data.currency,
    });

    return;
  }

  const membership = await models.Membership.createMembership({
    customerId,
    planId,
    invoiceId: data._id,
    amount: data.amount,
    currency: data.currency,
  });

  await linkRelation({
    subdomain,
    main: { contentType: 'blockadmin:membership', contentId: membership._id },
    related: [
      { contentType: 'core:customer', contentId: customerId },
      { contentType: 'payment:invoice', contentId: data._id },
    ],
  });
};
