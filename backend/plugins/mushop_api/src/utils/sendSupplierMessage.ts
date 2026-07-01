import crypto from 'crypto';
import { isDev } from 'erxes-api-shared/utils';

export interface SendSupplierMessageArgs {
  // Supplier subdomain — used both to resolve the server URL and as body.subdomain.
  subdomain: string;
  // Webhook action under /pl:supplier/webhook/mushop/, e.g. 'order', 'create-pos'.
  action: string;
  payload?: Record<string, any>;
  timeout?: number;
}

export const sendSupplierMessage = async <T = any>({
  subdomain,
  action,
  payload = {},
  timeout = 30000,
}: SendSupplierMessageArgs): Promise<T> => {
  const { SUPPLIER_API_URL, MUSHOP_SECRET } = process.env;

  if (!SUPPLIER_API_URL || !MUSHOP_SECRET) {
    throw new Error('SUPPLIER_API_URL or MUSHOP_SECRET is not configured');
  }

  const baseUrl = isDev
    ? SUPPLIER_API_URL
    : SUPPLIER_API_URL.replace('<subdomain>', subdomain);

  const endpoint = `${baseUrl}/pl:supplier/webhook/mushop/${action}`;

  const body = JSON.stringify({ subdomain, payload });

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
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supplier webhook ${action} HTTP ${res.status}: ${text}`);
  }

  return (await res.json().catch(() => ({}))) as T;
};
