import crypto from 'crypto';
import { isDev } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';
import {
  COLLECTIVE_STATUS,
  ICollectiveSupplierSyncResult,
} from '@/collective/@types/collective';

interface CollectiveWebhookResult {
  total: number;
  created: number;
  failed: number;
  results: Array<{
    code?: string;
    entityId?: string;
    ok: boolean;
    productId?: string;
    error?: string;
  }>;
}

const postToSupplierPush = async ({
  supplierSubdomain,
  targetSubdomain,
  targetPosToken,
  collectiveId,
  posToken,
  supplierId,
  supplierName,
}: {
  supplierSubdomain: string;
  targetSubdomain: string;
  targetPosToken: string;
  collectiveId: string;
  posToken: string;
  supplierId: string;
  supplierName?: string;
}): Promise<CollectiveWebhookResult> => {
  const { SUPPLIER_API_URL, MUSHOP_SECRET } = process.env;

  if (!SUPPLIER_API_URL || !MUSHOP_SECRET) {
    throw new Error('SUPPLIER_API_URL or MUSHOP_SECRET is not configured');
  }

  const baseUrl = isDev
    ? SUPPLIER_API_URL
    : SUPPLIER_API_URL.replace('<subdomain>', supplierSubdomain);

  const endpoint = `${baseUrl}/pl:supplier/webhook/mushop/collective-push`;

  const body = JSON.stringify({
    subdomain: supplierSubdomain,
    payload: {
      collectiveId,
      targetSubdomain,
      targetPosToken,
      posToken,
      supplierId,
      supplierName,
    },
  });

  const signature = crypto
    .createHmac('sha256', MUSHOP_SECRET)
    .update(body)
    .digest('hex');

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': `sha256=${signature}`,
    },
    body,
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');

    throw new Error(`Supplier push HTTP ${res.status}: ${text}`);
  }

  return (await res.json()) as CollectiveWebhookResult;
};

export const syncCollectiveProducts = async ({
  models,
  collectiveId,
  supplierIds,
}: {
  models: IModels;
  collectiveId: string;
  supplierIds?: string[];
}): Promise<void> => {
  const collective = await models.Collective.findOne({ _id: collectiveId });

  if (!collective) return;

  if (!collective.targetPosToken) {
    await models.Collective.updateSyncProgress(collectiveId, {
      status: COLLECTIVE_STATUS.FAILED,
    });
    throw new Error(
      `Collective ${collectiveId} has no targetPosToken; cannot sync`,
    );
  }

  await models.Collective.updateSyncProgress(collectiveId, {
    status: COLLECTIVE_STATUS.SYNCING,
  });

  const filterIds = supplierIds?.length
    ? supplierIds
    : collective.supplierIds;

  const suppliers = await models.Supplier.find({
    _id: { $in: filterIds },
  }).lean();

  const results: ICollectiveSupplierSyncResult[] = [];

  let totalCreated = 0;
  let totalFailed = 0;

  for (const supplier of suppliers) {
    const result: ICollectiveSupplierSyncResult = {
      supplierId: supplier._id,
      subdomain: supplier.subdomain,
      total: 0,
      created: 0,
      failed: 0,
      errors: [],
    };

    if (!supplier.posToken) {
      result.errors = ['supplier has no posToken configured'];
      results.push(result);
      continue;
    }

    try {
      const response = await postToSupplierPush({
        supplierSubdomain: supplier.subdomain,
        targetSubdomain: collective.targetSubdomain,
        targetPosToken: collective.targetPosToken,
        collectiveId: collective._id,
        posToken: supplier.posToken,
        supplierId: supplier._id,
        supplierName: supplier.name,
      });

      result.total = response.total;
      result.created = response.created;
      result.failed = response.failed;
      result.errors = response.results
        .filter((r) => !r.ok)
        .map((r) => `${r.code ?? '<no-code>'}: ${r.error ?? 'unknown'}`);
    } catch (e: any) {
      result.errors = [`transport: ${e?.message ?? String(e)}`];
      result.failed = 1;
    }

    totalCreated += result.created;
    totalFailed += result.failed;
    results.push(result);
  }

  await models.Collective.updateSyncProgress(collectiveId, {
    status:
      totalFailed > 0 && totalCreated === 0
        ? COLLECTIVE_STATUS.FAILED
        : COLLECTIVE_STATUS.ACTIVE,
    syncResults: results,
    totalCreated,
    totalFailed,
    lastSyncedAt: new Date(),
  });
};
