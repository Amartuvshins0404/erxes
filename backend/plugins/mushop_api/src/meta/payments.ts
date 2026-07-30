import { sendTRPCMessage } from 'erxes-api-shared/utils';
import { generateModels } from '~/connectionResolvers';
import { linkRelation } from '~/utils/relation';

interface IPaymentCallbackData {
  _id: string;
  contentType: string;
  status: string;
  amount: number;
  currency: string;
  data: {
    cpUserId: string;
    clientPortalId: string;
    planId?: string;
    // For ticket purchases the UI creates the ticket itself and passes its id
    // through on the invoice, so the callback only has to link the relation.
    ticketId?: string;
  };
}

const resolveCustomerId = async (
  subdomain: string,
  data: IPaymentCallbackData,
): Promise<string | null> => {
  const cpUser = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'query',
    module: 'cpUsers',
    action: 'get',
    input: {
      id: data.data.cpUserId,
      clientPortalId: data.data.clientPortalId,
    },
  });

  if (!cpUser) {
    console.error(
      `[mushop:payments] cpUser not found for id=${data.data.cpUserId}`,
    );

    return null;
  }

  return cpUser.erxesCustomerId || cpUser._id;
};

const handleTicketPayment = async (
  subdomain: string,
  data: IPaymentCallbackData,
) => {
  const ticketId = data.data.ticketId;

  if (!ticketId) {
    console.error(
      `[mushop:payments] Invoice ${data._id} is a ticket purchase but carries no ticketId`,
    );

    return;
  }

  const customerId = await resolveCustomerId(subdomain, data);

  if (!customerId) {
    return;
  }

  await linkRelation({
    subdomain,
    main: { contentType: 'frontline:ticket', contentId: ticketId },
    related: [
      { contentType: 'core:customer', contentId: customerId },
      { contentType: 'payment:invoice', contentId: data._id },
    ],
  });
};

const handleMembershipPayment = async (
  subdomain: string,
  data: IPaymentCallbackData,
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
    return;
  }

  const planId = process.env.MUSHOP_MEMBERSHIP_PLAN_ID;

  if (!planId) {
    console.error(
      `[mushop:payments] Invoice ${data._id} missing planId — cannot determine membership duration`,
    );

    return;
  }

  const existMembership =
    await models.Membership.getActiveMembership(customerId);

  if (existMembership) {
    await models.Membership.renewMembership(existMembership._id, {
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
    main: { contentType: 'mushop:membership', contentId: membership._id },
    related: [
      { contentType: 'core:customer', contentId: customerId },
      { contentType: 'payment:invoice', contentId: data._id },
    ],
  });
};

export const payments = {
  callback: async (subdomain: string, data: IPaymentCallbackData) => {
    if (data.status !== 'paid') {
      return;
    }

    try {
      switch (data.contentType) {
        case 'mushop:membership':
          await handleMembershipPayment(subdomain, data);
          break;
        case 'frontline:ticket':
          await handleTicketPayment(subdomain, data);
          break;
        default:
          return;
      }
    } catch (e: any) {
      console.error(
        `[mushop:payments] callback failed for invoice ${data._id}: ${e.message}`,
      );
      throw e;
    }
  },
};
