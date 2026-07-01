import { IModels } from '~/connectionResolvers';
import { sendSupplierMessage } from '~/utils/sendSupplierMessage';
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

  // When only a subset of suppliers is resynced, keep the existing results for
  // the other suppliers instead of overwriting the whole syncResults array.
  const isPartial = !!supplierIds?.length;
  const filterIds = isPartial ? supplierIds! : collective.supplierIds;

  const suppliers = await models.Supplier.find({
    _id: { $in: filterIds },
  }).lean();

  const results: ICollectiveSupplierSyncResult[] = [];

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
      const response = await sendSupplierMessage<CollectiveWebhookResult>({
        subdomain: supplier.subdomain,
        action: 'collective-push',
        payload: {
          collectiveId: collective._id,
          targetSubdomain: collective.targetSubdomain,
          targetPosToken: collective.targetPosToken,
          posToken: supplier.posToken,
          supplierId: supplier._id,
          supplierName: supplier.name,
          supplierCode: supplier.code,
        },
        timeout: 120000,
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

    results.push(result);
  }

  // Merge freshly-synced supplier results with the previously stored ones for
  // suppliers that were not part of this (partial) sync.
  const syncedIds = new Set(results.map((r) => r.supplierId));
  const preserved = isPartial
    ? (collective.syncResults || []).filter((r) => !syncedIds.has(r.supplierId))
    : [];
  const mergedResults = [...preserved, ...results];

  const totalCreated = mergedResults.reduce((sum, r) => sum + (r.created || 0), 0);
  const totalFailed = mergedResults.reduce((sum, r) => sum + (r.failed || 0), 0);

  await models.Collective.updateSyncProgress(collectiveId, {
    status:
      totalFailed > 0 && totalCreated === 0
        ? COLLECTIVE_STATUS.FAILED
        : COLLECTIVE_STATUS.ACTIVE,
    syncResults: mergedResults,
    totalCreated,
    totalFailed,
    lastSyncedAt: new Date(),
  });
};
