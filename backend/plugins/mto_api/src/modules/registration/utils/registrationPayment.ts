import { IRegistrationApplicationDocument } from '@/registration/@types/registrationApplicationDocument';
import { resolveRegistrationMembershipFee } from '@/registration/utils/resolveRegistrationMembershipFee';
import { getEnv, sendTRPCMessage } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';

export const REGISTRATION_PAYMENT_CONTENT_TYPE =
  'mto:registration:registrationapplication';

type CpUserRecord = {
  _id: string;
  erxesCustomerId?: string;
  clientPortalId?: string;
  phone?: string;
  email?: string;
};

type InvoiceRecord = {
  _id: string;
  status?: string;
};

function buildPaymentWidgetUrl(invoiceId: string, subdomain: string): string {
  const domainEnv = getEnv({ name: 'DOMAIN' });
  const base = domainEnv
    ? `${domainEnv}/gateway`.replace('<subdomain>', subdomain)
    : 'http://localhost:4000';
  return `${base}/pl:payment/widget/invoice/${invoiceId}`;
}

async function getSelectedPaymentIds(
  models: IContext['models'],
): Promise<string[]> {
  const selectedPaymentsConfig =
    await models.SystemConfig.getConfig('selectedPayments');
  const paymentIds = selectedPaymentsConfig?.value;

  if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
    throw new Error(
      'No payment methods configured. Please configure payments in MTO settings.',
    );
  }

  return paymentIds.filter((id): id is string => typeof id === 'string');
}

async function getCpUser(
  cpUserId: string,
  subdomain: string,
): Promise<CpUserRecord | null> {
  const cpUser = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'query',
    module: 'cpUsers',
    action: 'get',
    input: { id: cpUserId },
    defaultValue: null,
  });

  if (!cpUser || typeof cpUser !== 'object') {
    return null;
  }

  return cpUser as CpUserRecord;
}

async function resolveCustomerId(
  application: IRegistrationApplicationDocument,
  subdomain: string,
): Promise<{ customerId: string; cpUser: CpUserRecord | null }> {
  if (!application.cpUserId) {
    throw new Error(
      'Link a client portal user before approving for online payment.',
    );
  }

  const cpUser = await getCpUser(application.cpUserId, subdomain);

  if (!cpUser) {
    throw new Error('Client portal user not found.');
  }

  const customerId = cpUser.erxesCustomerId || cpUser._id;

  return { customerId, cpUser };
}

async function getInvoice(
  invoiceId: string,
  subdomain: string,
): Promise<InvoiceRecord | null> {
  const invoice = await sendTRPCMessage({
    subdomain,
    pluginName: 'payment',
    method: 'query',
    module: 'payment',
    action: 'getInvoiceWithTransactions',
    input: { _id: invoiceId },
    defaultValue: null,
  });

  if (!invoice || typeof invoice !== 'object') {
    return null;
  }

  return invoice as InvoiceRecord;
}

export async function getRegistrationPaymentUrl(
  invoiceId: string,
  subdomain: string,
): Promise<string> {
  return buildPaymentWidgetUrl(invoiceId, subdomain);
}

export async function sendRegistrationPaymentNotification(
  subdomain: string,
  options: {
    cpUserId: string;
    clientPortalId: string;
    membershipTypeTitle: string;
    paymentUrl: string;
    applicationId: string;
  },
): Promise<void> {
  await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'mutation',
    module: 'cpNotifications',
    action: 'create',
    input: {
      cpUserIds: [options.cpUserId],
      clientPortalId: options.clientPortalId,
      data: {
        title: 'Гишүүний төлбөр',
        message: `Таны "${options.membershipTypeTitle}" бүртгэл баталгаажлаа. Төлбөрөө онлайнаар төлнө үү.`,
        type: 'info',
        contentType: REGISTRATION_PAYMENT_CONTENT_TYPE,
        contentTypeId: options.applicationId,
        link: options.paymentUrl,
      },
    },
    defaultValue: null,
  });
}

export async function createRegistrationInvoice(
  application: IRegistrationApplicationDocument,
  context: IContext,
  membershipTypeTitle: string,
): Promise<IRegistrationApplicationDocument> {
  const { models, subdomain } = context;

  const feeAmount = resolveRegistrationMembershipFee(
    application.membershipTypeId,
    application.answers,
  );

  if (feeAmount <= 0) {
    throw new Error('Membership fee amount must be greater than zero.');
  }

  const paymentIds = await getSelectedPaymentIds(models);
  const { customerId, cpUser } = await resolveCustomerId(application, subdomain);

  const invoiceInput: Record<string, unknown> = {
    amount: feeAmount,
    currency: 'MNT',
    description: `MTO membership registration: ${membershipTypeTitle}`,
    status: 'pending',
    customerType: 'customer',
    customerId,
    contentType: REGISTRATION_PAYMENT_CONTENT_TYPE,
    contentTypeId: String(application._id),
    paymentIds,
  };

  if (cpUser?.phone) {
    invoiceInput.phone = cpUser.phone;
  }

  if (cpUser?.email) {
    invoiceInput.email = cpUser.email;
  }

  if (cpUser?._id && cpUser.clientPortalId) {
    invoiceInput.data = {
      cpUserId: cpUser._id,
      clientPortalId: cpUser.clientPortalId,
    };
  }

  const invoice = await sendTRPCMessage({
    subdomain,
    pluginName: 'payment',
    method: 'mutation',
    module: 'payment',
    action: 'addInvoice',
    input: invoiceInput,
    defaultValue: null,
  });

  if (!invoice || typeof invoice !== 'object' || !('_id' in invoice)) {
    throw new Error('Failed to create payment invoice.');
  }

  const invoiceId = String((invoice as InvoiceRecord)._id);

  const updated = await models.RegistrationApplication.updateApplicationById(
    String(application._id),
    subdomain,
    {
      invoiceId,
      membershipFeeAmount: feeAmount,
    },
  );

  if (!updated) {
    throw new Error('Failed to update registration application with invoice.');
  }

  if (cpUser?._id && cpUser.clientPortalId) {
    const paymentUrl = buildPaymentWidgetUrl(invoiceId, subdomain);
    await sendRegistrationPaymentNotification(subdomain, {
      cpUserId: cpUser._id,
      clientPortalId: cpUser.clientPortalId,
      membershipTypeTitle,
      paymentUrl,
      applicationId: String(application._id),
    });
  }

  return updated;
}

function isPaymentSatisfied(
  application: IRegistrationApplicationDocument,
): boolean {
  return (
    application.paymentStatus === 'paid' ||
    application.paymentStatus === 'manual_verified'
  );
}

export async function maybeCreateRegistrationInvoiceOnApproval(
  previousStatus: string | undefined,
  application: IRegistrationApplicationDocument,
  context: IContext,
  membershipTypeTitle: string,
): Promise<IRegistrationApplicationDocument> {
  if (application.status !== 'approved') {
    return application;
  }

  if (previousStatus === 'approved') {
    return application;
  }

  if (isPaymentSatisfied(application)) {
    return application;
  }

  if (application.invoiceId) {
    const existingInvoice = await getInvoice(
      application.invoiceId,
      context.subdomain,
    );

    if (existingInvoice?.status === 'paid') {
      const updated = await context.models.RegistrationApplication.updateApplicationById(
        String(application._id),
        context.subdomain,
        { paymentStatus: 'paid' },
      );
      return updated ?? application;
    }

    return application;
  }

  return createRegistrationInvoice(application, context, membershipTypeTitle);
}

export async function handleRegistrationPaymentCallback(
  subdomain: string,
  data: {
    contentType?: string;
    contentTypeId?: string;
    status?: string;
    data?: { cpUserId?: string; clientPortalId?: string };
  },
): Promise<void> {
  if (data.contentType !== REGISTRATION_PAYMENT_CONTENT_TYPE) {
    return;
  }

  if (data.status !== 'paid' || !data.contentTypeId) {
    return;
  }

  const { generateModels } = await import('~/connectionResolvers');
  const models = await generateModels(subdomain);

  const application = await models.RegistrationApplication.findOne({
    _id: data.contentTypeId,
    subdomain,
  });

  if (!application) {
    return;
  }

  if (application.paymentStatus === 'paid') {
    return;
  }

  await models.RegistrationApplication.updateApplicationById(
    String(application._id),
    subdomain,
    { paymentStatus: 'paid' },
  );

  const cpUserId = data.data?.cpUserId;
  const clientPortalId = data.data?.clientPortalId;

  if (cpUserId && clientPortalId) {
    await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      method: 'mutation',
      module: 'cpNotifications',
      action: 'create',
      input: {
        cpUserIds: [cpUserId],
        clientPortalId,
        data: {
          title: 'Төлбөр хүлээн авлаа',
          message: 'Таны гишүүний төлбөр амжилттай төлөгдлөө.',
          type: 'success',
          contentType: REGISTRATION_PAYMENT_CONTENT_TYPE,
          contentTypeId: data.contentTypeId,
        },
      },
      defaultValue: null,
    });
  }
}
