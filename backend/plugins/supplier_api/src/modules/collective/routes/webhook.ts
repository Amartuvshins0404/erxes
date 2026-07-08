import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import {
  isDev,
  sendTRPCMessage,
  sendWorkerMessage,
  sendWorkerQueue,
} from 'erxes-api-shared/utils';
import { splitType } from 'erxes-api-shared/core-modules';
import { isValid } from '@/collective/utils/bundleGuard';
import { sendMessage } from '~/modules/platform/shared';
import { generateModels } from '~/connectionResolvers';

const COLLECTIVE_BUNDLE_TYPE = 'COLLECTIVE_BUNDLE_TYPE';

const router: Router = Router();

interface CollectiveProductResult {
  code?: string;
  entityId?: string;
  ok: boolean;
  productId?: string;
  error?: string;
}

const deterministicObjectId = (...parts: string[]): string => {
  return crypto
    .createHash('sha1')
    .update(parts.join(':'))
    .digest('hex')
    .slice(0, 24);
};

const upsertCore = async (
  subdomain: string,
  module: string,
  createAction: string,
  _id: string,
  doc: Record<string, any>,
  buildInput: (object: Record<string, any>) => Record<string, any> = (
    object,
  ) => ({ doc: object }),
): Promise<void> => {
  const existing = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'query',
    module,
    action: 'findOne',
    input: { query: { _id } },
    defaultValue: null,
  });

  if (existing) return;

  await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'mutation',
    module,
    action: createAction,
    input: buildInput({ _id, ...doc }),
  });
};

router.post('/collective', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const {
      collectiveId,
      products,
      categories,
      supplierId,
      supplierName,
      supplierCode,
      supplierEmail,
      supplierPhone,
      supplierEmails,
      supplierPhones,
      sourcePosToken,
    } = payload || {};

    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }

    if (!Array.isArray(products)) {
      return res
        .status(400)
        .json({ error: 'payload.products must be an array' });
    }

    if (!collectiveId) {
      return res
        .status(400)
        .json({ error: 'payload.collectiveId is required' });
    }

    if (!supplierId) {
      return res.status(400).json({ error: 'payload.supplierId is required' });
    }

    if (!(await isValid(subdomain, COLLECTIVE_BUNDLE_TYPE))) {
      return res.status(403).json({
        error: `Subdomain "${subdomain}" does not have an active collective bundle`,
      });
    }

    const supplierLabel = supplierName || `Supplier ${supplierId}`;
    const supplierKey = supplierCode || supplierId;

    const companyId = deterministicObjectId(
      'collective-company',
      collectiveId,
      supplierId,
    );

    const emailList: string[] = Array.isArray(supplierEmails)
      ? supplierEmails
      : [];
    const phoneList: string[] = Array.isArray(supplierPhones)
      ? supplierPhones
      : [];
    const primaryEmail = supplierEmail || emailList[0];
    const primaryPhone = supplierPhone || phoneList[0];
    const emails = Array.from(
      new Set([...(primaryEmail ? [primaryEmail] : []), ...emailList]),
    );
    const phones = Array.from(
      new Set([...(primaryPhone ? [primaryPhone] : []), ...phoneList]),
    );

    await upsertCore(subdomain, 'companies', 'createCompany', companyId, {
      primaryName: supplierLabel,
      names: [supplierLabel],
      code: supplierKey,
      ...(primaryEmail ? { primaryEmail } : {}),
      ...(primaryPhone ? { primaryPhone } : {}),
      ...(emails.length ? { emails } : {}),
      ...(phones.length ? { phones } : {}),
    });

    const supplierCategoryId = deterministicObjectId(
      'collective-supplier-cat',
      collectiveId,
      supplierId,
    );
    await upsertCore(
      subdomain,
      'productCategories',
      'createProductCategory',
      supplierCategoryId,
      {
        name: supplierLabel,
        code: supplierKey,
        parentId: '',
      },
    );

    const categoryList: Record<string, any>[] = Array.isArray(categories)
      ? categories
      : [];
    const sourceById = new Map<string, Record<string, any>>();
    for (const cat of categoryList) {
      if (cat?._id) sourceById.set(cat._id, cat);
    }

    const targetCatId = (sourceId: string) =>
      deterministicObjectId(
        'collective-cat',
        collectiveId,
        supplierId,
        sourceId,
      );

    const targetCategoryBySource = new Map<string, string>();
    const ensureCategory = async (
      sourceId: string,
      seen: Set<string> = new Set(),
    ): Promise<string> => {
      const cached = targetCategoryBySource.get(sourceId);
      if (cached) return cached;

      const cat = sourceById.get(sourceId);
      if (!cat || seen.has(sourceId)) return supplierCategoryId;
      seen.add(sourceId);

      const parentTargetId =
        cat.parentId && sourceById.has(cat.parentId)
          ? await ensureCategory(cat.parentId, seen)
          : supplierCategoryId;

      const cloneId = targetCatId(sourceId);
      await upsertCore(
        subdomain,
        'productCategories',
        'createProductCategory',
        cloneId,
        {
          name: cat.name || cat.code || sourceId,
          code: `${supplierKey}-${cat.code || sourceId}`,
          parentId: parentTargetId,
        },
      );

      targetCategoryBySource.set(sourceId, cloneId);
      return cloneId;
    };

    for (const cat of categoryList) {
      if (!cat?._id) continue;
      try {
        await ensureCategory(cat._id);
      } catch {
        // If a category fails, products under it fall back to the supplier
        // parent rather than failing the whole sync.
      }
    }

    const results: CollectiveProductResult[] = [];

    for await (const doc of products) {
      const { _id: sourceProductId, prices, categoryId, ...rest } = doc || {};

      delete rest.__v;
      delete rest.createdAt;
      delete rest.updatedAt;
      delete rest.vendorId;
      delete rest.tokens;
      delete rest.isCheckRems;
      delete rest.taxRules;
      delete rest.scopeBrandIds;
      delete rest.mergedIds;
      delete rest.sameDefault;
      delete rest.sameMasks;

      if (!doc?.code) {
        results.push({
          entityId: sourceProductId,
          ok: false,
          error: 'product has no code',
        });
        continue;
      }

      const targetProductId = deterministicObjectId(
        'collective-product',
        collectiveId,
        supplierId,
        sourceProductId,
      );

      const unitPrice =
        sourcePosToken && prices ? prices[sourcePosToken] : undefined;

      const targetCategoryId =
        (categoryId && targetCategoryBySource.get(categoryId)) ||
        supplierCategoryId;

      const targetCode = `${supplierKey}-${doc.code}`;

      const doc_ = {
        ...rest,
        _id: targetProductId,
        code: targetCode,
        categoryId: targetCategoryId,
        vendorId: companyId,
        ...(unitPrice !== undefined ? { unitPrice } : {}),
      };

      try {
        await upsertCore(
          subdomain,
          'products',
          'createProduct',
          targetProductId,
          doc_,
        );

        results.push({
          code: doc.code,
          entityId: sourceProductId,
          ok: true,
          productId: targetProductId,
        });
      } catch (e: any) {
        results.push({
          code: doc.code,
          entityId: sourceProductId,
          ok: false,
          error: e?.message || String(e),
        });
      }
    }

    const created = results.filter((r) => r.ok).length;
    const failed = results.length - created;

    return res.status(200).json({
      success: true,
      collectiveId,
      total: results.length,
      created,
      failed,
      results,
    });
  } catch (e: any) {
    console.error('collective webhook failed:', e);
    return res.status(400).json({ error: e.message });
  }
});

router.post('/collective-push', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};

    const {
      collectiveId,
      targetSubdomain,
      targetPosToken,
      posToken,
      supplierId,
      supplierName,
      supplierCode,
    } = payload || {};

    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }

    if (!targetSubdomain) {
      return res.status(400).json({ error: 'targetSubdomain is required' });
    }

    if (!targetPosToken) {
      return res.status(400).json({ error: 'targetPosToken is required' });
    }

    if (!posToken) {
      return res.status(400).json({ error: 'posToken is required' });
    }

    if (!supplierId) {
      return res.status(400).json({ error: 'supplierId is required' });
    }

    if (!(await isValid(targetSubdomain, COLLECTIVE_BUNDLE_TYPE))) {
      return res.status(403).json({
        error: `Subdomain "${targetSubdomain}" does not have an active collective bundle`,
      });
    }

    const models = await generateModels(subdomain);
    const supplier = await models.Supplier.findOne({}).lean();

    const products = await sendTRPCMessage({
      subdomain,
      pluginName: 'posclient',
      method: 'query',
      module: 'products',
      action: 'findByToken',
      input: { token: posToken },
      defaultValue: [],
    });

    if (!products.length) {
      return res.status(200).json({
        success: true,
        collectiveId,
        total: 0,
        created: 0,
        failed: 0,
        results: [],
      });
    }

    const leafCategoryIds = new Set<string>();

    for (const product of products) {
      const categoryId = product?.categoryId;

      if (categoryId) {
        leafCategoryIds.add(categoryId);
      }
    }

    const categoryById = new Map<string, Record<string, any>>();
    let pending = Array.from(leafCategoryIds);

    while (pending.length) {
      const fetched = await sendTRPCMessage({
        subdomain,
        pluginName: 'core',
        method: 'query',
        module: 'productCategories',
        action: 'find',
        input: {
          query: { _id: { $in: pending } },
          fields: { _id: 1, name: 1, code: 1, parentId: 1 },
        },
        defaultValue: [],
      });

      const nextParents: string[] = [];
      for (const cat of fetched) {
        if (!cat?._id || categoryById.has(cat._id)) continue;
        categoryById.set(cat._id, cat);
        if (cat.parentId && !categoryById.has(cat.parentId)) {
          nextParents.push(cat.parentId);
        }
      }
      pending = nextParents;
    }

    const categories = Array.from(categoryById.values());

    const { SUPPLIER_API_URL, MUSHOP_SECRET } = process.env;

    if (!SUPPLIER_API_URL || !MUSHOP_SECRET) {
      return res
        .status(500)
        .json({ error: 'SUPPLIER_API_URL or MUSHOP_SECRET is not configured' });
    }

    const baseUrl = isDev
      ? SUPPLIER_API_URL
      : SUPPLIER_API_URL.replace('<subdomain>', targetSubdomain);

    const endpoint = `${baseUrl}/pl:supplier/webhook/mushop/collective`;

    const body = JSON.stringify({
      subdomain: targetSubdomain,
      payload: {
        collectiveId,
        products,
        categories,
        supplierId,
        supplierName,
        supplierCode,
        supplierEmail: supplier?.primaryEmail,
        supplierPhone: supplier?.primaryPhone,
        supplierEmails: supplier?.emails,
        supplierPhones: supplier?.phones,
        sourcePosToken: posToken,
        targetPosToken,
      },
    });

    const signature = crypto
      .createHmac('sha256', MUSHOP_SECRET)
      .update(body)
      .digest('hex');

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': `sha256=${signature}`,
      },
      body,
      signal: AbortSignal.timeout(120000),
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      return res
        .status(502)
        .json({ error: `target HTTP ${upstream.status}: ${text}` });
    }

    return res.status(200).type('application/json').send(text);
  } catch (e: any) {
    console.error('collective-push webhook failed:', e);

    return res.status(400).json({ error: e.message });
  }
});

router.post('/collective-purge', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { collectiveId, productIds, supplierId, targetPosToken } =
      payload || {};

    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }

    if (!collectiveId) {
      return res
        .status(400)
        .json({ error: 'payload.collectiveId is required' });
    }

    if (!supplierId) {
      return res.status(400).json({ error: 'payload.supplierId is required' });
    }

    if (!targetPosToken) {
      return res
        .status(400)
        .json({ error: 'payload.targetPosToken is required' });
    }

    if (!Array.isArray(productIds)) {
      return res
        .status(400)
        .json({ error: 'payload.productIds must be an array' });
    }

    if (!(await isValid(subdomain, COLLECTIVE_BUNDLE_TYPE))) {
      return res.status(403).json({
        error: `Subdomain "${subdomain}" does not have an active collective bundle`,
      });
    }

    const results: Array<{ _id: string; ok: boolean; error?: string }> = [];

    for (const productId of productIds) {
      try {
        await sendTRPCMessage({
          subdomain,
          pluginName: 'posclient',
          method: 'mutation',
          module: 'posclient',
          action: 'crudData',
          input: {
            token: targetPosToken,
            type: 'product',
            action: 'delete',
            object: { _id: productId },
          },
        });
        results.push({ _id: productId, ok: true });
      } catch (e: any) {
        results.push({
          _id: productId,
          ok: false,
          error: e?.message || String(e),
        });
      }
    }

    const categoryId = deterministicObjectId(
      'collective-cat',
      collectiveId,
      supplierId,
    );

    let categoryDeleted = false;
    let categoryError: string | undefined;

    try {
      await sendTRPCMessage({
        subdomain,
        pluginName: 'posclient',
        method: 'mutation',
        module: 'posclient',
        action: 'crudData',
        input: {
          token: targetPosToken,
          type: 'productCategory',
          action: 'delete',
          object: { _id: categoryId },
        },
      });
      categoryDeleted = true;
    } catch (e: any) {
      categoryError = e?.message || String(e);
    }

    const deleted = results.filter((r) => r.ok).length;
    const failed = results.length - deleted;

    return res.status(200).json({
      success: failed === 0 && !categoryError,
      collectiveId,
      total: results.length,
      deleted,
      failed,
      results,
      categoryDeleted,
      categoryError,
    });
  } catch (e: any) {
    console.error('collective-purge webhook failed:', e);
    return res.status(400).json({ error: e.message });
  }
});

router.post('/collective-purge-push', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const {
      collectiveId,
      targetSubdomain,
      targetPosToken,
      posToken,
      supplierId,
    } = payload || {};

    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }

    if (!targetSubdomain) {
      return res.status(400).json({ error: 'targetSubdomain is required' });
    }

    if (!targetPosToken) {
      return res.status(400).json({ error: 'targetPosToken is required' });
    }

    if (!posToken) {
      return res.status(400).json({ error: 'posToken is required' });
    }

    if (!supplierId) {
      return res.status(400).json({ error: 'supplierId is required' });
    }

    if (!(await isValid(targetSubdomain, COLLECTIVE_BUNDLE_TYPE))) {
      return res.status(403).json({
        error: `Subdomain "${targetSubdomain}" does not have an active collective bundle`,
      });
    }

    const products = await sendTRPCMessage({
      subdomain,
      pluginName: 'posclient',
      method: 'query',
      module: 'products',
      action: 'findByToken',
      input: { token: posToken },
      defaultValue: [],
    });

    const productIds = products
      .map((p) => p?._id)
      .filter((id): id is string => !!id);

    const { SUPPLIER_API_URL, MUSHOP_SECRET } = process.env;

    if (!SUPPLIER_API_URL || !MUSHOP_SECRET) {
      return res
        .status(500)
        .json({ error: 'SUPPLIER_API_URL or MUSHOP_SECRET is not configured' });
    }

    const baseUrl = isDev
      ? SUPPLIER_API_URL
      : SUPPLIER_API_URL.replace('<subdomain>', targetSubdomain);

    const endpoint = `${baseUrl}/pl:supplier/webhook/mushop/collective-purge`;

    const body = JSON.stringify({
      subdomain: targetSubdomain,
      payload: {
        collectiveId,
        productIds,
        supplierId,
        targetPosToken,
      },
    });

    const signature = crypto
      .createHmac('sha256', MUSHOP_SECRET)
      .update(body)
      .digest('hex');

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': `sha256=${signature}`,
      },
      body,
      signal: AbortSignal.timeout(120000),
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      return res
        .status(502)
        .json({ error: `target HTTP ${upstream.status}: ${text}` });
    }

    return res.status(200).type('application/json').send(text);
  } catch (e: any) {
    console.error('collective-purge-push webhook failed:', e);
    return res.status(400).json({ error: e.message });
  }
});

router.post('/create-pos', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { name, description } = payload || {};

    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }

    if (!(await isValid(subdomain, COLLECTIVE_BUNDLE_TYPE))) {
      return res.status(403).json({
        error: `Subdomain "${subdomain}" does not have an active collective bundle`,
      });
    }

    const owner = await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      method: 'query',
      module: 'users',
      action: 'findOne',
      input: { query: { isOwner: true } },
      defaultValue: null,
    });

    if (!owner?._id) {
      return res.status(400).json({
        error: `No owner user found in subdomain "${subdomain}" to assign POS to`,
      });
    }

    const pos = await sendTRPCMessage({
      subdomain,
      pluginName: 'sales',
      method: 'mutation',
      module: 'pos',
      action: 'create',
      input: {
        user: owner,
        doc: {
          name: name || 'Collective POS',
          description: description || `Auto-provisioned POS for ${subdomain}`,
          adminIds: [owner._id],
          cashierIds: [owner._id],
        },
      },
    });

    if (!pos?.token) {
      return res
        .status(502)
        .json({ error: `sales_api did not return a POS token` });
    }

    return res.status(200).json({ _id: pos._id, token: pos.token });
  } catch (e: any) {
    console.error('create-pos webhook failed:', e);

    return res.status(400).json({ error: e.message });
  }
});

interface CustomerInfo {
  sourceUserId?: string;
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

const findLocalCustomerId = async (
  subdomain: string,
  info?: CustomerInfo,
): Promise<string | undefined> => {
  if (!info || (!info.sourceUserId && !info.phone && !info.email)) {
    return undefined;
  }

  const existing = (await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'query',
    module: 'customers',
    action: 'getWidgetCustomer',
    input: {
      code: info.sourceUserId,
      email: info.email,
      phone: info.phone,
    },
    defaultValue: null,
  })) as { _id?: string } | null;

  return existing?._id;
};

const upsertLocalCustomer = async (
  subdomain: string,
  info?: CustomerInfo,
): Promise<string | undefined> => {
  if (!info || (!info.sourceUserId && !info.phone && !info.email)) {
    return undefined;
  }

  const existingId = await findLocalCustomerId(subdomain, info);

  const doc: Record<string, any> = { state: 'customer' };
  if (info.sourceUserId) doc.code = info.sourceUserId;
  if (info.phone) doc.primaryPhone = info.phone;
  if (info.email) doc.primaryEmail = info.email;
  if (info.firstName) doc.firstName = info.firstName;
  if (info.lastName) doc.lastName = info.lastName;

  const saved = existingId
    ? ((await sendTRPCMessage({
        subdomain,
        pluginName: 'core',
        method: 'mutation',
        module: 'customers',
        action: 'updateCustomer',
        input: { _id: existingId, doc },
        defaultValue: null,
      })) as { _id?: string } | null)
    : ((await sendTRPCMessage({
        subdomain,
        pluginName: 'core',
        method: 'mutation',
        module: 'customers',
        action: 'createCustomer',
        input: { doc },
        defaultValue: null,
      })) as { _id?: string } | null);

  return saved?._id ?? existingId;
};

router.post('/order', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { posToken, order, customerInfo } = payload || {};

    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }

    if (!posToken) {
      return res.status(400).json({ error: 'payload.posToken is required' });
    }

    if (!order || typeof order !== 'object') {
      return res.status(400).json({ error: 'payload.order is required' });
    }

    let localCustomerId: string | undefined;
    try {
      localCustomerId = await upsertLocalCustomer(subdomain, customerInfo);
    } catch (e: any) {
      console.error('mushop/order: customer upsert failed:', e.message);
    }

    const orderInput = localCustomerId
      ? {
          ...order,
          posToken,
          customerId: localCustomerId,
          customerType: 'customer',
        }
      : { ...order, posToken };

    const created = await sendTRPCMessage({
      subdomain,
      pluginName: 'posclient',
      method: 'mutation',
      module: 'posclient',
      action: 'createOrder',
      input: { order: orderInput },
      defaultValue: null,
    });

    if (!created?._id) {
      return res
        .status(502)
        .json({ error: 'posclient did not create the order' });
    }

    return res
      .status(200)
      .json({ success: true, order: created, customerId: localCustomerId });
  } catch (e: any) {
    console.error('mushop/order webhook failed:', e);
    return res.status(400).json({ error: e.message });
  }
});

router.post('/invoice', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const {
      posToken,
      paymentId,
      contentTypeId,
      amount,
      currency,
      customer,
      customerInfo,
      description,
    } = payload || {};

    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }
    if (!posToken) {
      return res.status(400).json({ error: 'payload.posToken is required' });
    }
    if (!paymentId) {
      return res.status(400).json({ error: 'payload.paymentId is required' });
    }
    if (!contentTypeId) {
      return res
        .status(400)
        .json({ error: 'payload.contentTypeId is required' });
    }
    if (!amount) {
      return res.status(400).json({ error: 'payload.amount is required' });
    }

    let customerId: string | undefined;

    try {
      customerId = await upsertLocalCustomer(subdomain, customerInfo);
    } catch (e: any) {
      console.error('mushop/invoice: customer upsert failed:', e.message);
    }

    const invoice = await sendTRPCMessage({
      subdomain,
      pluginName: 'payment',
      method: 'mutation',
      module: 'payment',
      action: 'addInvoice',
      input: {
        amount,
        currency: currency || 'MNT',
        phone: customer?.phone || '',
        email: customer?.email || '',
        description: description || '',
        customerId: customerId,
        customerType: 'customer',
        contentType: 'sales:pos:orders',
        contentTypeId,
        paymentIds: [paymentId],
        data: { posToken },
      },
      defaultValue: null,
    });

    if (!invoice?._id) {
      return res
        .status(502)
        .json({ error: 'payment plugin did not create the invoice' });
    }

    const invoiceWithTransactions = await sendTRPCMessage({
      subdomain,
      pluginName: 'payment',
      method: 'query',
      module: 'payment',
      action: 'getInvoiceWithTransactions',
      input: { _id: invoice._id },
      defaultValue: null,
    });

    const transactions = invoiceWithTransactions?.transactions || [];

    return res.status(200).json({
      success: true,
      invoice,
      transactions,
      customerId: customerId,
    });
  } catch (e: any) {
    console.error('mushop/invoice webhook failed:', e);
    return res.status(400).json({ error: e.message });
  }
});

router.post('/transaction', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { paymentId, invoiceId, amount, details } = payload || {};

    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }
    if (!paymentId) {
      return res.status(400).json({ error: 'payload.paymentId is required' });
    }
    if (!invoiceId) {
      return res.status(400).json({ error: 'payload.invoiceId is required' });
    }
    if (!amount) {
      return res.status(400).json({ error: 'payload.amount is required' });
    }

    const transaction = await sendTRPCMessage({
      subdomain,
      pluginName: 'payment',
      method: 'mutation',
      module: 'payment',
      action: 'addTransaction',
      input: { invoiceId, paymentId, amount, details },
      defaultValue: null,
    });

    if (!transaction?._id) {
      return res
        .status(502)
        .json({ error: 'payment plugin did not create the transaction' });
    }

    return res.status(200).json({
      success: true,
      transaction,
    });
  } catch (e: any) {
    console.error('mushop/transaction webhook failed:', e);
    return res.status(400).json({ error: e.message });
  }
});

const callPosclientOrder = async (
  subdomain: string,
  action: string,
  input: Record<string, any>,
  method: 'query' | 'mutation',
) =>
  sendTRPCMessage({
    subdomain,
    pluginName: 'posclient',
    method,
    module: 'posclient',
    action,
    input,
    defaultValue: null,
  });

router.post('/orders-list', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { posToken, params } = payload || {};

    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }
    if (!posToken) {
      return res.status(400).json({ error: 'payload.posToken is required' });
    }

    const result = await callPosclientOrder(
      subdomain,
      'fullOrders',
      { posToken, ...(params || {}) },
      'query',
    );

    return res.status(200).json({ success: true, result });
  } catch (e: any) {
    console.error('mushop/orders-list webhook failed:', e);
    return res.status(400).json({ error: e.message });
  }
});

router.post('/order-detail', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { posToken, _id, customerId } = payload || {};

    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }
    if (!posToken) {
      return res.status(400).json({ error: 'payload.posToken is required' });
    }
    if (!_id) {
      return res.status(400).json({ error: 'payload._id is required' });
    }

    const result = await callPosclientOrder(
      subdomain,
      'orderDetail',
      { posToken, _id, customerId },
      'query',
    );

    return res.status(200).json({ success: true, result });
  } catch (e: any) {
    console.error('mushop/order-detail webhook failed:', e);
    return res.status(400).json({ error: e.message });
  }
});

router.post('/order-edit', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { posToken, doc } = payload || {};

    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }
    if (!posToken) {
      return res.status(400).json({ error: 'payload.posToken is required' });
    }
    if (!doc?._id) {
      return res.status(400).json({ error: 'payload.doc._id is required' });
    }

    const result = await callPosclientOrder(
      subdomain,
      'ordersEdit',
      { posToken, ...doc },
      'mutation',
    );

    return res.status(200).json({ success: true, result });
  } catch (e: any) {
    console.error('mushop/order-edit webhook failed:', e);
    return res.status(400).json({ error: e.message });
  }
});

router.post('/order-cancel', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { posToken, _id } = payload || {};

    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }
    if (!posToken) {
      return res.status(400).json({ error: 'payload.posToken is required' });
    }
    if (!_id) {
      return res.status(400).json({ error: 'payload._id is required' });
    }

    const result = await callPosclientOrder(
      subdomain,
      'ordersCancel',
      { posToken, _id },
      'mutation',
    );

    return res.status(200).json({ success: true, result });
  } catch (e: any) {
    console.error('mushop/order-cancel webhook failed:', e);
    return res.status(400).json({ error: e.message });
  }
});

const syncPaidOrderToMushop = async (subdomain: string, invoiceId: string) => {
  const invoiceWithTransactions = await sendTRPCMessage({
    subdomain,
    pluginName: 'payment',
    method: 'query',
    module: 'payment',
    action: 'getInvoiceWithTransactions',
    input: { _id: invoiceId },
    defaultValue: null,
  });

  if (!invoiceWithTransactions?._id) {
    return;
  }

  const { transactions, ...invoice } = invoiceWithTransactions;

  const contentTypeId = invoice.contentTypeId;
  const posToken = invoice.data?.posToken;

  if (!contentTypeId || !posToken) {
    return;
  }

  const fetchOrder = () =>
    sendTRPCMessage({
      subdomain,
      pluginName: 'posclient',
      method: 'query',
      module: 'posclient',
      action: 'orderDetail',
      input: { posToken, _id: contentTypeId, customerId: invoice.customerId },
      defaultValue: null,
    });

  let order = await fetchOrder();

  if (order && !order.paidDate) {
    const [pluginName, moduleName, collectionType] = splitType(
      invoice.contentType || 'sales:pos:orders',
    );

    try {
      await sendWorkerMessage({
        subdomain,
        pluginName: pluginName === 'pos' ? 'sales' : pluginName,
        queueName: 'payments',
        jobName: 'callback',
        data: {
          ...invoice,
          status: 'paid',
          moduleName,
          collectionType,
          apiResponse: 'success',
        },
        defaultValue: null,
        timeout: 10000,
      });
    } catch (e: any) {
      console.error(
        'mushop/invoice-check: payment callback failed:',
        e.message,
      );
    }

    order = await fetchOrder();
  }

  if (!order) {
    return;
  }

  await sendMessage({
    subdomain,
    path: 'order-sync',
    payload: { entityId: contentTypeId, order },
    platform: 'mushop',
  });
};

router.post('/invoice-check', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const { invoiceId } = payload || {};

    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }
    if (!invoiceId) {
      return res.status(400).json({ error: 'payload.invoiceId is required' });
    }

    const status = await sendTRPCMessage({
      subdomain,
      pluginName: 'payment',
      method: 'mutation',
      module: 'payment',
      action: 'checkInvoice',
      input: { _id: invoiceId },
      defaultValue: null,
    });

    if (status === 'paid') {
      try {
        await syncPaidOrderToMushop(subdomain, invoiceId);
      } catch (e: any) {
        console.error('mushop/invoice-check: order sync failed:', e.message);
      }
    }

    return res.status(200).json({ success: true, status });
  } catch (e: any) {
    console.error('mushop/invoice-check webhook failed:', e);
    return res.status(400).json({ error: e.message });
  }
});

export { router };
