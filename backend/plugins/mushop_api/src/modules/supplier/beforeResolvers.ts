import {
  BeforeResolverParams,
  BeforeResolverResult,
  BeforeResolversConfig,
  extractCPUserFromHeader,
  sendTRPCMessage,
} from 'erxes-api-shared/utils';
import { IModels, generateModels } from '~/connectionResolvers';
import { ORDER_STATUS } from '@/supplier/@types/order';
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
  customerId: string | undefined,
  cpUser: any,
): Promise<CustomerInfo | undefined> => {
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
    customerId: customerInfo?.sourceUserId ?? null,
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
      order: res?.order ?? null,
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
  customerInfo?: CustomerInfo,
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
        phone: input.phone || customerInfo?.phone,
        email: input.email || customerInfo?.email,
      },
      customerInfo,
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
      status: res.invoice.status || 'pending',
      customerType: input.customerType,
      customerId: res.customerId ?? res.invoice.customerId ?? input.customerId,
      contentType: res.invoice.contentType ?? 'sales:pos:orders',
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
  customerInfo?: CustomerInfo,
) => proxyOrderAction(supplier, 'orders-list', { params: args, customerInfo });

const aggregateFullOrders = async (
  subdomain: string,
  models: IModels,
  args: Record<string, any>,
  mushopPosToken?: string,
): Promise<BeforeResolverResult> => {
  const { customerId, ...params } = args;

  const supplierOrders = customerId
    ? (
        await models.Order.find({
          customerId,
          status: { $in: [ORDER_STATUS.FORWARDED, ORDER_STATUS.CANCELLED] },
        })
          .sort({ createdAt: -1 })
          .lean()
      ).map((row) => row.order)
    : [];

  let ownOrders: any[] = [];

  if (mushopPosToken) {
    const result = await sendTRPCMessage({
      subdomain,
      pluginName: 'posclient',
      method: 'query',
      module: 'posclient',
      action: 'fullOrders',
      input: { posToken: mushopPosToken, ...params },
      defaultValue: [],
    });

    ownOrders = Array.isArray(result) ? result : [];
  }

  console.log(
    `[cpFullOrders] local aggregate: subdomain=${subdomain} mushopPosToken=${
      mushopPosToken ? 'yes' : 'no'
    } ownOrders=${ownOrders.length} supplierOrders=${
      supplierOrders.length
    } customerId=${customerId}`,
  );

  const orders = [...ownOrders, ...supplierOrders].filter(Boolean);

  return { status: 'resolved', data: orders };
};

const getMushopPosToken = (
  headers?: Record<string, unknown>,
): string | undefined => {
  const value = headers?.['erxes-pos-token'];
  return typeof value === 'string' && value ? value : undefined;
};

const proxyOrderDetail = (
  supplier: ForwardSupplier,
  args: Record<string, any>,
  customerInfo?: CustomerInfo,
) =>
  proxyOrderAction(supplier, 'order-detail', {
    _id: args._id,
    customerId: args.customerId,
    customerInfo,
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

  const result = await proxyOrderAction(supplier, 'order-edit', { doc });

  if (result?.status === 'resolved' && args._id) {
    await models.Order.syncFromSupplier(
      supplier.subdomain,
      args._id,
      result.data ?? doc,
      ORDER_STATUS.FORWARDED,
    );
  }

  return result;
};

const proxyOrdersCancel = async (
  models: IModels,
  supplier: ForwardSupplier,
  args: Record<string, any>,
): Promise<BeforeResolverResult> => {
  const result = await proxyOrderAction(supplier, 'order-cancel', {
    _id: args._id,
  });

  if (result?.status === 'resolved' && args._id) {
    await models.Order.syncFromSupplier(
      supplier.subdomain,
      args._id,
      result.data,
      ORDER_STATUS.CANCELLED,
    );
  }

  return result;
};

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
    const customerId = args.customerId || cpUser?.erxesCustomerId || cpUser?._id;

    const models = await generateModels(subdomain);

    if (resolver === 'cpFullOrders') {
      const mushopPosToken = getMushopPosToken(headers);

      return aggregateFullOrders(
        subdomain,
        models,
        { ...args, customerId },
        mushopPosToken,
      );
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
      case 'cpOrdersAdd': {
        const orderCustomerId = args.customerId || customerId;
      
        const customerInfo = await buildCustomerInfo(
          subdomain,
          orderCustomerId,
          cpUser,
        );

        return proxyOrder(models, supplier, args, customerInfo);
      }
      case 'invoiceCreate': {
        const input = (args.input || {}) as Record<string, any>;
        const customerInfo = await buildCustomerInfo(
          subdomain,
          input.customerId || customerId,
          cpUser,
        );

        return proxyInvoiceCreate(supplier, args, customerInfo);
      }
      case 'paymentTransactionsAdd':
        return proxyTransactionAdd(supplier, args);
      case 'invoicesCheck':
        return proxyInvoiceCheck(supplier, args);
      case 'cpOrdersEdit':
        return proxyOrdersEdit(models, supplier, args);
      case 'cpOrdersCancel':
        return proxyOrdersCancel(models, supplier, args);
      case 'cpCurrentOrder': {
        const customerInfo = await buildCustomerInfo(
          subdomain,
          customerId,
          cpUser,
        );

        return proxyCurrentOrder(supplier, args, customerInfo);
      }
      case 'cpOrderDetail': {
        const customerInfo = await buildCustomerInfo(
          subdomain,
          args.customerId || customerId,
          cpUser,
        );

        return proxyOrderDetail(supplier, args, customerInfo);
      }
      default:
        return args;
    }
  },
};
