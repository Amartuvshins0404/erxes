import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { isDev, sendTRPCMessage } from 'erxes-api-shared/utils';
import {
  COLLECTIVE_BUNDLE_TYPE,
  isValid,
} from '@/collective/utils/isCollective';

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

router.post('/collective', async (req: Request, res: Response) => {
  try {
    const { subdomain, payload } = req.body || {};
    const {
      collectiveId,
      products,
      supplierId,
      supplierName,
      sourcePosToken,
      targetPosToken,
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

    if (!targetPosToken) {
      return res
        .status(400)
        .json({ error: 'payload.targetPosToken is required' });
    }

    if (!(await isValid(subdomain, COLLECTIVE_BUNDLE_TYPE))) {
      return res.status(403).json({
        error: `Subdomain "${subdomain}" does not have an active "${COLLECTIVE_BUNDLE_TYPE}" bundle`,
      });
    }

    const categoryCode = `collective-${collectiveId}-${supplierId}`;
    const categoryId = deterministicObjectId(
      'collective-cat',
      collectiveId,
      supplierId,
    );

    await sendTRPCMessage({
      subdomain,
      pluginName: 'posclient',
      method: 'mutation',
      module: 'posclient',
      action: 'crudData',
      input: {
        token: targetPosToken,
        type: 'productCategory',
        action: 'create',
        object: {
          _id: categoryId,
          name: supplierName || `Supplier ${supplierId}`,
          code: categoryCode,
        },
      },
    });

    const results: CollectiveProductResult[] = [];

    for await (const doc of products) {
      const { _id: sourceProductId, prices, ...rest } = doc || {};

      delete (rest as any).__v;
      delete (rest as any).createdAt;
      delete (rest as any).updatedAt;
      delete (rest as any).categoryId;
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

      const targetProductId = sourceProductId;

      const unitPrice =
        sourcePosToken && prices ? prices[sourcePosToken] : undefined;

      const object = {
        ...rest,
        _id: targetProductId,
        code: `${doc.code}_${supplierName ?? supplierId}`,
        categoryId,
        ...(unitPrice !== undefined ? { unitPrice } : {}),
      };

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
            action: 'create',
            object,
          },
        });

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
        error: `Subdomain "${targetSubdomain}" does not have an active "${COLLECTIVE_BUNDLE_TYPE}" bundle`,
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
    console.log('endpoint', endpoint);
    const body = JSON.stringify({
      subdomain: targetSubdomain,
      payload: {
        collectiveId,
        products,
        supplierId,
        supplierName,
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
        error: `Subdomain "${subdomain}" does not have an active "${COLLECTIVE_BUNDLE_TYPE}" bundle`,
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
        error: `Subdomain "${targetSubdomain}" does not have an active "${COLLECTIVE_BUNDLE_TYPE}" bundle`,
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
        error: `Subdomain "${subdomain}" does not have an active "${COLLECTIVE_BUNDLE_TYPE}" bundle`,
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

export { router };
