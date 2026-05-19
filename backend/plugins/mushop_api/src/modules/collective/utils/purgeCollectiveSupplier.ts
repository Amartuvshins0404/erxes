import crypto from 'crypto';
import { isDev } from 'erxes-api-shared/utils';

interface PurgeResult {
  total: number;
  deleted: number;
  failed: number;
  categoryDeleted: boolean;
  categoryError?: string;
}

export const purgeCollectiveSupplier = async ({
  supplierSubdomain,
  supplierPosToken,
  supplierId,
  targetSubdomain,
  targetPosToken,
  collectiveId,
}: {
  supplierSubdomain: string;
  supplierPosToken: string;
  supplierId: string;
  targetSubdomain: string;
  targetPosToken: string;
  collectiveId: string;
}): Promise<PurgeResult> => {
  const { SUPPLIER_API_URL, MUSHOP_SECRET } = process.env;

  if (!SUPPLIER_API_URL || !MUSHOP_SECRET) {
    throw new Error('SUPPLIER_API_URL or MUSHOP_SECRET is not configured');
  }

  const baseUrl = isDev
    ? SUPPLIER_API_URL
    : SUPPLIER_API_URL.replace('<subdomain>', supplierSubdomain);

  const endpoint = `${baseUrl}/webhook/mushop/collective-purge-push`;

  const body = JSON.stringify({
    subdomain: supplierSubdomain,
    payload: {
      collectiveId,
      targetSubdomain,
      targetPosToken,
      posToken: supplierPosToken,
      supplierId,
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
    throw new Error(`Supplier purge HTTP ${res.status}: ${text}`);
  }

  return (await res.json()) as PurgeResult;
};
