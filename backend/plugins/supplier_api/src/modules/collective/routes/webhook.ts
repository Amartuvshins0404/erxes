import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { isDev, sendTRPCMessage } from 'erxes-api-shared/utils';
import { isValid } from '@/collective/utils/isCollective';
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
    // The supplier's unique, human-readable code drives all replicated codes
    // (company / categories / products). Falls back to the id if absent.
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

    await upsertCore(
      subdomain,
      'companies',
      'createCompany',
      companyId,
      {
        primaryName: supplierLabel,
        names: [supplierLabel],
        code: supplierKey,
        ...(primaryEmail ? { primaryEmail } : {}),
        ...(primaryPhone ? { primaryPhone } : {}),
        ...(emails.length ? { emails } : {}),
        ...(phones.length ? { phones } : {}),
      },
    );

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
      deterministicObjectId('collective-cat', collectiveId, supplierId, sourceId);

    // Create a source category and its ancestors first (depth order), so every
    // node's cloned parent already exists. Returns the cloned category id.
    const targetCategoryBySource = new Map<string, string>();
    const ensureCategory = async (
      sourceId: string,
      seen: Set<string> = new Set(),
    ): Promise<string> => {
      const cached = targetCategoryBySource.get(sourceId);
      if (cached) return cached;

      const cat = sourceById.get(sourceId);
      // Parent not in the payload, or a cycle: hang it off the supplier root.
      if (!cat || seen.has(sourceId)) return supplierCategoryId;
      seen.add(sourceId);

      // Resolve the cloned parent first; top-level → supplier root.
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
          // Flat code per category regardless of depth; nesting is in parentId.
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

      delete (rest as any).__v;
      delete (rest as any).createdAt;
      delete (rest as any).updatedAt;
      delete (rest as any).vendorId;
      delete (rest as any).tokens;
      delete (rest as any).isCheckRems;
      delete (rest as any).taxRules;
      delete (rest as any).scopeBrandIds;
      delete (rest as any).mergedIds;
      delete (rest as any).sameDefault;
      delete (rest as any).sameMasks;

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

      // Code: <supplierCode>-<srcProductCode>, e.g. UB-BZD-001-PHONEX1. The
      // category isn't repeated here — it's already linked via categoryId.
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

    // The supplier's authoritative profile lives in this (the supplier's) own
    // tenant — exactly one per tenant — so we read its contact info here rather
    // than relying on mushop to pass it down.
    const models = await generateModels(subdomain);
    const supplier = await models.Supplier.findOne({}).lean();

    const products = (await sendTRPCMessage({
      subdomain,
      pluginName: 'posclient',
      method: 'query',
      module: 'products',
      action: 'findByToken',
      input: { token: posToken },
      defaultValue: [],
    })) as Record<string, any>[];

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

    // Resolve the categories the products sit in AND all their ancestors, so
    // the target can rebuild the full tree. Walk up parentId until no new ids.
    const categoryById = new Map<string, Record<string, any>>();
    let pending = Array.from(leafCategoryIds);

    while (pending.length) {
      const fetched = (await sendTRPCMessage({
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
      })) as Record<string, any>[];

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
    const {
      collectiveId,
      productIds,
      supplierId,
      targetPosToken,
    } = payload || {};

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
        results.push({ _id: productId, ok: false, error: e?.message || String(e) });
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

    const products = (await sendTRPCMessage({
      subdomain,
      pluginName: 'posclient',
      method: 'query',
      module: 'products',
      action: 'findByToken',
      input: { token: posToken },
      defaultValue: [],
    })) as Record<string, any>[];

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

    const owner = (await sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      method: 'query',
      module: 'users',
      action: 'findOne',
      input: { query: { isOwner: true } },
      defaultValue: null,
    })) as { _id: string } | null;

    if (!owner?._id) {
      return res.status(400).json({
        error: `No owner user found in subdomain "${subdomain}" to assign POS to`,
      });
    }

    const pos = (await sendTRPCMessage({
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
    })) as { _id: string; token: string } | null;

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

// Creates/finds THIS tenant's own customer for a mushop shopper, matched by the
// global shopper id (stored in `code`) or phone/email. Returns the tenant-local
// customer id so mushop can index the global→local mapping. The tenant owns the
// id — no foreign id is injected; the global id only lives in `code`.
const upsertLocalCustomer = async (
  subdomain: string,
  info?: CustomerInfo,
): Promise<string | undefined> => {
  if (!info || (!info.sourceUserId && !info.phone && !info.email)) {
    return undefined;
  }

  const findOne = (query: Record<string, any>) =>
    sendTRPCMessage({
      subdomain,
      pluginName: 'core',
      method: 'query',
      module: 'customers',
      action: 'findOne',
      input: { query },
      defaultValue: null,
    }) as Promise<{ _id?: string } | null>;

  // Match by the global shopper id first (stable), then phone, then email.
  let existing: { _id?: string } | null = null;
  if (info.sourceUserId) existing = await findOne({ code: info.sourceUserId });
  if (!existing?._id && info.phone)
    existing = await findOne({ customerPrimaryPhone: info.phone });
  if (!existing?._id && info.email)
    existing = await findOne({ customerPrimaryEmail: info.email });

  if (existing?._id) return existing._id;

  const created = (await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    method: 'mutation',
    module: 'customers',
    action: 'createCustomer',
    input: {
      doc: {
        code: info.sourceUserId,
        primaryPhone: info.phone,
        primaryEmail: info.email,
        firstName: info.firstName,
        lastName: info.lastName,
        state: 'customer',
      },
    },
    defaultValue: null,
  })) as { _id?: string } | null;

  return created?._id;
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

    // Create this tenant's own customer for the shopper (best-effort: a contact
    // failure must not block the order). The order keeps the global customerId.
    let localCustomerId: string | undefined;
    try {
      localCustomerId = await upsertLocalCustomer(subdomain, customerInfo);
    } catch (e: any) {
      console.error('mushop/order: customer upsert failed:', e.message);
    }

    const created = (await sendTRPCMessage({
      subdomain,
      pluginName: 'posclient',
      method: 'mutation',
      module: 'posclient',
      action: 'createOrder',
      input: { order: { ...order, posToken } },
      defaultValue: null,
    }))

    if (!created?._id) {
      return res
        .status(502)
        .json({ error: 'posclient did not create the order' });
    }

    // Return the full created order so the storefront (via mushop's proxy) gets
    // _id/number/totalAmount/paidAmounts to invoice against, plus the tenant's
    // own customerId so mushop can index the global→local customer mapping.
    return res
      .status(200)
      .json({ success: true, order: created, customerId: localCustomerId });
  } catch (e: any) {
    console.error('mushop/order webhook failed:', e);
    return res.status(400).json({ error: e.message });
  }
});

// Creates a gateway invoice (+ transaction/QR) in the SUPPLIER tenant for a
// posclient order, using the supplier's own payment method. mushop proxies the
// storefront's invoiceCreate here so the invoice + money live in the supplier
// tenant; the returned QR is handed back to the storefront unchanged.
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

    const invoice = (await sendTRPCMessage({
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
        customerId: customer?.id,
        customerType: customer?.type || 'customer',
        contentType: 'pos:orders',
        contentTypeId,
        paymentIds: [paymentId],
        data: { posToken },
      },
      defaultValue: null,
    })) as { _id?: string; invoiceNumber?: string; createdAt?: string } | null;

    if (!invoice?._id) {
      return res
        .status(502)
        .json({ error: 'payment plugin did not create the invoice' });
    }

    const transaction = (await sendTRPCMessage({
      subdomain,
      pluginName: 'payment',
      method: 'mutation',
      module: 'payment',
      action: 'addTransaction',
      input: { invoiceId: invoice._id, paymentId, amount },
      defaultValue: null,
    })) as { _id?: string; status?: string; response?: any } | null;

    return res.status(200).json({
      success: true,
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        amount,
        createdAt: invoice.createdAt,
      },
      transaction: transaction
        ? {
            _id: transaction._id,
            status: transaction.status,
            response: transaction.response,
          }
        : null,
    });
  } catch (e: any) {
    console.error('mushop/invoice webhook failed:', e);
    return res.status(400).json({ error: e.message });
  }
});

// Customer order operations proxied from mushop, run in the SUPPLIER tenant
// against its posclient (posToken-scoped via new posclient tRPC procedures).
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

    // params carries the shopper's customerId (the client-portal user id, the
    // same across tenants); posclient fullOrders filters this tenant's orders by
    // it.
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

// Polls the SUPPLIER tenant for an invoice's paid status. On 'paid', the
// supplier tenant's own payment callback settles the posclient order.
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

    const status = (await sendTRPCMessage({
      subdomain,
      pluginName: 'payment',
      method: 'mutation',
      module: 'payment',
      action: 'checkInvoice',
      input: { _id: invoiceId },
      defaultValue: null,
    })) as string | null;

    return res.status(200).json({ success: true, status });
  } catch (e: any) {
    console.error('mushop/invoice-check webhook failed:', e);
    return res.status(400).json({ error: e.message });
  }
});

export { router };
