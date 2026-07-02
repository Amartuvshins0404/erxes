import {
  BeforeResolverParams,
  BeforeResolverResult,
  BeforeResolversConfig,
  extractCPUserFromHeader,
  sendTRPCMessage,
} from 'erxes-api-shared/utils';
import { IModels, generateModels } from '~/connectionResolvers';
import { getSupplierId } from '~/utils/getSupplierId';
import { sendSupplierMessage } from '~/utils/sendSupplierMessage';

const SUPPLIER_RESOLVERS = [
  'cpOrdersAdd',
  'invoiceCreate',
  'paymentTransactionsAdd',
  'invoicesCheck',
  'cpOrdersEdit',
  'cpOrdersCancel',
  'cpFullOrders',
  'cpCurrentOrder',
  'cpOrderDetail',
];

type ForwardSupplier = {
  _id: string;
  subdomain: string;
  posToken?: string;
  paymentId?: string;
};

type CustomerInfo = {
  sourceUserId?: string;
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

const resolveSupplier = async (
  models: IModels,
  supplierId: string,
): Promise<ForwardSupplier | null> => {
  const supplier = await models.Supplier.findOne({
    _id: supplierId,
  }).lean<ForwardSupplier>();

  if (!supplier?.subdomain) {
    return null;
  }

  return supplier;
};

const buildCustomerInfo = async (
  subdomain: string,
  cpUser: any,
): Promise<CustomerInfo | undefined> => {
  const customerId = cpUser?.erxesCustomerId || cpUser?._id;

  if (!customerId && !cpUser) {
    return undefined;
  }

  const coreCustomer = customerId
    ? ((await sendTRPCMessage({
        subdomain,
        pluginName: 'core',
        method: 'query',
        module: 'customers',
        action: 'findOne',
        input: { query: { _id: customerId } },
        defaultValue: null,
      })) as {
        primaryPhone?: string;
        primaryEmail?: string;
        firstName?: string;
        lastName?: string;
      } | null)
    : null;

  return {
    sourceUserId: customerId,
    phone: coreCustomer?.primaryPhone || cpUser?.phone,
    email: coreCustomer?.primaryEmail || cpUser?.email,
    firstName: coreCustomer?.firstName || cpUser?.firstName,
    lastName: coreCustomer?.lastName || cpUser?.lastName,
  };
};

const proxyOrder = async (
  models: IModels,
  supplier: ForwardSupplier,
  args: Record<string, any>,
  customerInfo?: CustomerInfo,
): Promise<BeforeResolverResult> => {
  if (!supplier.posToken) {
    return {
      status: 'blocked',
      code: 'SUPPLIER_NO_POS',
      message: `Supplier ${supplier._id} has no posToken configured`,
    };
  }

  const items = Array.isArray(args.items)
    ? (args.items as Record<string, any>[])
    : [];

  const forwardItems = await Promise.all(
    items.map(async (item) => {
      const product = await models.Product.findOne({
        $or: [{ _id: item.productId }, { entityId: item.productId }],
        subdomain: supplier.subdomain,
      }).lean<{ entityId: string }>();

      return { ...item, productId: product?.entityId ?? item.productId };
    }),
  );

  const order = { ...args, items: forwardItems };

  const log = await models.Order.logForward({
    subdomain: supplier.subdomain,
    posToken: supplier.posToken,
    order,
  });

  try {
    const res = await sendSupplierMessage<{
      order?: Record<string, any>;
      customerId?: string;
    }>({
      subdomain: supplier.subdomain,
      action: 'order',
      payload: { posToken: supplier.posToken, order, customerInfo },
    });

    await models.Order.markResult(log._id, {
      ok: true,
      orderId: res?.order?._id,
      customerId: res?.customerId,
    });

    return { status: 'resolved', data: res?.order ?? null };
  } catch (e: any) {
    await models.Order.markResult(log._id, { ok: false, error: e.message });

    return {
      status: 'blocked',
      code: 'SUPPLIER_ROUTE_FAILED',
      message: `Failed to route order to supplier ${supplier._id}: ${e.message}`,
    };
  }
};

const proxyInvoiceCreate = async (
  supplier: ForwardSupplier,
  args: Record<string, any>,
): Promise<BeforeResolverResult> => {
  if (!supplier.posToken || !supplier.paymentId) {
    return {
      status: 'blocked',
      code: 'SUPPLIER_NO_PAYMENT_CONFIG',
      message: `Supplier ${supplier._id} has no posToken/paymentId configured`,
    };
  }

  const input = (args.input || {}) as Record<string, any>;

  const res = await sendSupplierMessage({
    subdomain: supplier.subdomain,
    action: 'invoice',
    payload: {
      posToken: supplier.posToken,
      paymentId: supplier.paymentId,
      contentTypeId: input.contentTypeId,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      customer: {
        id: input.customerId,
        type: input.customerType,
        phone: input.phone,
        email: input.email,
      },
    },
  });

  if (!res?.invoice?._id) {
    return {
      status: 'blocked',
      code: 'SUPPLIER_INVOICE_FAILED',
      message: `Supplier ${supplier._id} did not create an invoice`,
    };
  }

  return {
    status: 'resolved',
    data: {
      _id: res.invoice._id,
      invoiceNumber: res.invoice.invoiceNumber,
      amount: res.invoice.amount ?? input.amount,
      currency: input.currency || 'MNT',
      phone: input.phone,
      email: input.email,
      description: input.description,
      status: res.transaction?.status || 'pending',
      customerType: input.customerType,
      customerId: input.customerId,
      contentType: 'pos:orders',
      contentTypeId: input.contentTypeId,
      createdAt: res.invoice.createdAt,
      data: input.data ?? null,
      transactions: res.transactions,
    },
  };
};

const proxyTransactionAdd = async (
  supplier: ForwardSupplier,
  args: Record<string, any>,
): Promise<BeforeResolverResult> => {
  if (!supplier.paymentId) {
    return {
      status: 'blocked',
      code: 'SUPPLIER_NO_PAYMENT_CONFIG',
      message: `Supplier ${supplier._id} has no paymentId configured`,
    };
  }

  const input = (args.input || {}) as Record<string, any>;

  const res = await sendSupplierMessage<{
    transaction?: { _id?: string; status?: string; response?: any } | null;
  }>({
    subdomain: supplier.subdomain,
    action: 'transaction',
    payload: {
      paymentId: supplier.paymentId,
      invoiceId: input.invoiceId,
      amount: input.amount,
      details: input.details,
    },
  });

  if (!res?.transaction?._id) {
    return {
      status: 'blocked',
      code: 'SUPPLIER_TRANSACTION_FAILED',
      message: `Supplier ${supplier._id} did not create a transaction`,
    };
  }

  return {
    status: 'resolved',
    data: {
      _id: res.transaction._id,
      status: res.transaction.status,
      response: res.transaction.response,
      paymentId: supplier.paymentId,
      amount: input.amount,
    },
  };
};

const proxyInvoiceCheck = async (
  supplier: ForwardSupplier,
  args: Record<string, any>,
): Promise<BeforeResolverResult> => {
  const res = await sendSupplierMessage<{ status?: string }>({
    subdomain: supplier.subdomain,
    action: 'invoice-check',
    payload: { invoiceId: args._id },
  });

  return { status: 'resolved', data: res?.status ?? null };
};

const proxyOrderAction = async (
  supplier: ForwardSupplier,
  action: string,
  payload: Record<string, any>,
): Promise<BeforeResolverResult> => {
  if (!supplier.posToken) {
    return {
      status: 'blocked',
      code: 'SUPPLIER_NO_POS',
      message: `Supplier ${supplier._id} has no posToken configured`,
    };
  }

  const res = await sendSupplierMessage<{ result?: unknown }>({
    subdomain: supplier.subdomain,
    action,
    payload: { posToken: supplier.posToken, ...payload },
  });

  return { status: 'resolved', data: res?.result ?? null };
};

const proxyCurrentOrder = (
  supplier: ForwardSupplier,
  args: Record<string, any>,
) => proxyOrderAction(supplier, 'orders-list', { params: args });

const orderTime = (order: any): number => {
  const t = order?.createdAt ?? order?.modifiedAt;
  const ms = t ? new Date(t).getTime() : 0;
  return Number.isNaN(ms) ? 0 : ms;
};

const aggregateFullOrders = async (
  subdomain: string,
  models: IModels,
  args: Record<string, any>,
  mushopPosToken?: string,
): Promise<BeforeResolverResult> => {
  const { page, perPage, ...params } = args;

  const suppliers = await models.Supplier.find({
    subdomain: { $exists: true, $ne: null },
    posToken: { $exists: true, $ne: null },
  }).lean<ForwardSupplier[]>();

  type Leg = () => Promise<any[]>;
  const legs: Leg[] = [];

  if (mushopPosToken) {
    legs.push(async () => {
      const result = await callOwnPosclient(subdomain, mushopPosToken, params);
      return Array.isArray(result) ? result : [];
    });
  }

  for (const supplier of suppliers) {
    if (!supplier.posToken) continue;
    legs.push(async () => {
      const res = await sendSupplierMessage<{ result?: unknown }>({
        subdomain: supplier.subdomain,
        action: 'orders-list',
        payload: { posToken: supplier.posToken, params },
      });
      return Array.isArray(res?.result) ? (res?.result as any[]) : [];
    });
  }

  console.log(
    `[cpFullOrders] aggregate: subdomain=${subdomain} mushopPosToken=${
      mushopPosToken ? 'yes' : 'no'
    } suppliers=${suppliers.length} legs=${legs.length} customerId=${
      params.customerId
    }`,
  );

  const settled = await Promise.allSettled(legs.map((leg) => leg()));

  const merged: any[] = [];
  settled.forEach((outcome, i) => {
    if (outcome.status === 'fulfilled') {
      console.log(`[cpFullOrders] leg ${i}: ${outcome.value.length} orders`);
      merged.push(...outcome.value);
    } else {
      console.error('[cpFullOrders] leg', i, 'failed:', outcome.reason);
    }
  });

  console.log(`[cpFullOrders] merged total before paging: ${merged.length}`);

  merged.sort((a, b) => orderTime(b) - orderTime(a));

  const _perPage = Number(perPage) || 20;
  const _page = Number(page) || 1;
  const paged = merged.slice((_page - 1) * _perPage, _page * _perPage);

  return { status: 'resolved', data: paged };
};

const callOwnPosclient = (
  subdomain: string,
  posToken: string,
  params: Record<string, any>,
) =>
  sendTRPCMessage({
    subdomain,
    pluginName: 'posclient',
    method: 'query',
    module: 'posclient',
    action: 'fullOrders',
    input: { posToken, ...params },
    defaultValue: [],
  });

const getMushopPosToken = (
  headers?: Record<string, unknown>,
): string | undefined => {
  const value = headers?.['erxes-pos-token'];
  return typeof value === 'string' && value ? value : undefined;
};

const proxyOrderDetail = (
  supplier: ForwardSupplier,
  args: Record<string, any>,
) =>
  proxyOrderAction(supplier, 'order-detail', {
    _id: args._id,
    customerId: args.customerId,
  });

const proxyOrdersEdit = async (
  models: IModels,
  supplier: ForwardSupplier,
  args: Record<string, any>,
): Promise<BeforeResolverResult> => {
  const items = Array.isArray(args.items)
    ? (args.items as Record<string, any>[])
    : undefined;

  let doc = args;

  if (items) {
    const forwardItems = await Promise.all(
      items.map(async (item) => {
        const product = await models.Product.findOne({
          $or: [{ _id: item.productId }, { entityId: item.productId }],
          subdomain: supplier.subdomain,
        }).lean<{ entityId: string }>();

        return { ...item, productId: product?.entityId ?? item.productId };
      }),
    );

    doc = { ...args, items: forwardItems };
  }

  return proxyOrderAction(supplier, 'order-edit', { doc });
};

const proxyOrdersCancel = (
  supplier: ForwardSupplier,
  args: Record<string, any>,
) => proxyOrderAction(supplier, 'order-cancel', { _id: args._id });

export const supplierBeforeResolvers: BeforeResolversConfig = {
  resolvers: {
    posclient: [
      'cpOrdersAdd',
      'cpOrdersEdit',
      'cpOrdersCancel',
      'cpFullOrders',
      'cpCurrentOrder',
      'cpOrderDetail',
    ],
    payment: ['invoiceCreate', 'paymentTransactionsAdd', 'invoicesCheck'],
  },
  handler: async (
    subdomain: string,
    params: BeforeResolverParams,
  ): Promise<BeforeResolverResult> => {
    const { resolver, args = {}, headers } = params;

    if (!SUPPLIER_RESOLVERS.includes(resolver)) {
      return { status: 'ok', args };
    }

    const cpUser = extractCPUserFromHeader((headers || {}) as any);
    const customerId = cpUser?.erxesCustomerId || cpUser?._id;
    const scopedArgs =
      customerId !== undefined ? { ...args, customerId } : args;

    // Enrich from mushop's own core customer so the supplier gets real contact
    // info to match/create against, not just the header's (often sparse) fields.
    const customerInfo = cpUser
      ? await buildCustomerInfo(subdomain, cpUser)
      : undefined;

    const models = await generateModels(subdomain);

    if (resolver === 'cpFullOrders') {
      const mushopPosToken = getMushopPosToken(headers);

      return aggregateFullOrders(subdomain, models, scopedArgs, mushopPosToken);
    }

    const supplierId = getSupplierId(headers);

    if (!supplierId) {
      return { status: 'ok', args };
    }

    const supplier = await resolveSupplier(models, supplierId);

    if (!supplier) {
      return { status: 'ok', args };
    }

    switch (resolver) {
      case 'cpOrdersAdd':
        return proxyOrder(models, supplier, scopedArgs, customerInfo);
      case 'invoiceCreate':
        return proxyInvoiceCreate(supplier, args);
      case 'paymentTransactionsAdd':
        return proxyTransactionAdd(supplier, args);
      case 'invoicesCheck':
        return proxyInvoiceCheck(supplier, args);
      case 'cpOrdersEdit':
        return proxyOrdersEdit(models, supplier, scopedArgs);
      case 'cpOrdersCancel':
        return proxyOrdersCancel(supplier, scopedArgs);
      case 'cpCurrentOrder':
        return proxyCurrentOrder(supplier, scopedArgs);
      case 'cpOrderDetail':
        return proxyOrderDetail(supplier, scopedArgs);
      default:
        return args;
    }
  },
};
