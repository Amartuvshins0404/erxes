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

// The storefront calls mushop's own resolvers (cpOrdersAdd, invoiceCreate,
// invoicesCheck, cpFullOrders, cpOrdersEdit, ...) against a single endpoint.
// When a request carries an erxes-supplier-id header it belongs to a supplier
// SaaS, so mushop proxies the call into that supplier's server and returns the
// supplier's result verbatim (via the 'resolved' short-circuit) — the storefront
// never knows it was routed. Requests without a supplier id fall through to
// mushop's own handling.
const SUPPLIER_RESOLVERS = [
  'cpOrdersAdd',
  'invoiceCreate',
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

// The shopper's contact info forwarded to a supplier tenant so it can create its
// own customer record (linked back to the global shopper via sourceUserId).
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

// cpOrdersAdd → supplier /order. Remaps product ids (mushop → supplier
// entityId), logs the forward, and returns the supplier's created order so the
// storefront receives { _id, number } to invoice against.
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
    // customerInfo lets the supplier create its own customer; it returns that
    // local customerId so mushop can index global shopper → tenant customer.
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

// invoiceCreate → supplier /invoice. Injects the supplier's posToken/paymentId
// (never exposed to the storefront) and returns the supplier-tenant invoice +
// transaction shaped as the storefront's Invoice type.
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

  const res = await sendSupplierMessage<{
    invoice?: {
      _id?: string;
      invoiceNumber?: string;
      amount?: number;
      createdAt?: string;
    };
    transaction?: { _id?: string; status?: string; response?: any } | null;
  }>({
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

  // Shaped to match the payment plugin's Invoice type the storefront expects.
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
      transactions: res.transaction
        ? [
            {
              _id: res.transaction._id,
              status: res.transaction.status,
              response: res.transaction.response,
            },
          ]
        : [],
    },
  };
};

// invoicesCheck → supplier /invoice-check. Returns the paid status string.
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

// Runs a posclient order query/mutation in the supplier tenant via the supplier
// webhook (posToken-scoped, no client-portal token needed) and returns the
// result via the short-circuit.
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

// Returns the createdAt timestamp of an order for cross-tenant sorting; orders
// from different posclient tenants only share their stored field shape.
const orderTime = (order: any): number => {
  const t = order?.createdAt ?? order?.modifiedAt;
  const ms = t ? new Date(t).getTime() : 0;
  return Number.isNaN(ms) ? 0 : ms;
};

// cpFullOrders aggregates ONE shopper's orders across every supplier tenant AND
// mushop's own POS into a single list. The shopper's customerId (the client-
// portal user id stored on each posclient order) is the same across tenants, so
// it's passed through to every leg unchanged. Each leg is isolated (allSettled)
// so one slow/broken tenant can't break the whole history.
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

  // mushop's own POS — the storefront passes its token in erxes-pos-token.
  if (mushopPosToken) {
    legs.push(async () => {
      const result = await callOwnPosclient(subdomain, mushopPosToken, params);
      return Array.isArray(result) ? result : [];
    });
  }

  // Every supplier tenant, via its /orders-list webhook.
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

  // Apply pagination once, after the merge, since each tenant paginated its own.
  const _perPage = Number(perPage) || 20;
  const _page = Number(page) || 1;
  const paged = merged.slice((_page - 1) * _perPage, _page * _perPage);

  return { status: 'resolved', data: paged };
};

// Calls mushop's OWN posclient fullOrders in-tenant (no webhook) using the
// marketplace's own POS token.
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

// mushop's own POS token, sent by the storefront so its own orders join the
// aggregate. Without it the aggregate covers supplier tenants only.
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

// cpOrdersEdit remaps each item's productId (mushop → supplier entityId) so the
// edited order references the supplier's products, then runs the edit in the
// supplier tenant.
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
    payment: ['invoiceCreate', 'invoicesCheck'],
  },
  handler: async (
    subdomain: string,
    params: BeforeResolverParams,
  ): Promise<BeforeResolverResult> => {
    const { resolver, args = {}, headers } = params;

    if (!SUPPLIER_RESOLVERS.includes(resolver)) {
      return args;
    }

    // The shopper's customerId (the client-portal user id stored on each
    // posclient order) is the same across every tenant, so it scopes orders in
    // all of them. Trust the authenticated cpUser, never the client's arg —
    // otherwise a customer could read/edit another's orders.
    const cpUser = extractCPUserFromHeader((headers || {}) as any);
    const customerId = cpUser?.erxesCustomerId || cpUser?._id;
    const scopedArgs =
      customerId !== undefined ? { ...args, customerId } : args;

    // The shopper's contact info, forwarded so a supplier tenant can create its
    // OWN customer (keyed by phone/email, linked back via sourceUserId) — the
    // order still carries the global customerId for cross-tenant aggregation.
    const customerInfo = cpUser
      ? {
          sourceUserId: customerId,
          phone: cpUser.phone,
          email: cpUser.email,
          firstName: cpUser.firstName,
          lastName: cpUser.lastName,
        }
      : undefined;

    const models = await generateModels(subdomain);

    // cpFullOrders is special: it aggregates the shopper's orders across ALL
    // supplier tenants + mushop's own POS, regardless of which (if any) supplier
    // the request came in under. So it runs before the single-supplier routing.
    if (resolver === 'cpFullOrders') {
      const mushopPosToken = getMushopPosToken(headers);
      return aggregateFullOrders(
        subdomain,
        models,
        scopedArgs,
        mushopPosToken,
      );
    }

    const supplierId = getSupplierId(headers);

    // No supplier context → not a supplier request; mushop handles it itself.
    if (!supplierId) {
      return args;
    }

    const supplier = await resolveSupplier(models, supplierId);

    if (!supplier) {
      return args;
    }

    switch (resolver) {
      case 'cpOrdersAdd':
        return proxyOrder(models, supplier, scopedArgs, customerInfo);
      case 'invoiceCreate':
        return proxyInvoiceCreate(supplier, args);
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
