import crypto from 'crypto';
import { isDev } from 'erxes-api-shared/utils';

export const provisionCollectivePos = async ({
  targetSubdomain,
  name,
  description,
}: {
  targetSubdomain: string;
  name?: string;
  description?: string;
}): Promise<{ _id: string; token: string }> => {
  const { SUPPLIER_API_URL, MUSHOP_SECRET } = process.env;

  if (!SUPPLIER_API_URL || !MUSHOP_SECRET) {
    throw new Error('SUPPLIER_API_URL or MUSHOP_SECRET is not configured');
  }

  const baseUrl = isDev
    ? SUPPLIER_API_URL
    : SUPPLIER_API_URL.replace('<subdomain>', targetSubdomain);

  const endpoint = `${baseUrl}/pl:supplier/webhook/mushop/create-pos`;

  const body = JSON.stringify({
    subdomain: targetSubdomain,
    payload: { name, description },
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
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');

    throw new Error(`POS provisioning HTTP ${res.status}: ${text}`);
  }

  const result = (await res.json()) as { _id: string; token: string };

  if (!result?.token) {
    throw new Error('POS provisioning response missing token');
  }

  return result;
};
