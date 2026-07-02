import { getCoreDomain } from 'erxes-api-shared/utils';

export interface RegisterCollectivePartnersArgs {
  subdomain: string;
  subdomains: string[];
  timeout?: number;
}

export interface PlatformPartnersResponse {
  status?: string;
  organization?: Record<string, any>;
  syncedOwnerCount?: number;
  [key: string]: any;
}

export const registerCollectivePartners = async ({
  subdomain,
  subdomains,
  timeout = 60000,
}: RegisterCollectivePartnersArgs): Promise<PlatformPartnersResponse> => {
  const {
    PLATFORM_ENDPOINT,
    ERXES_PLATFORM_TOKEN,
    COLLECTIVE_PRODUCT_ID,
    COLLECTIVE_BUNDLE_ID,
  } = process.env;

  if (!ERXES_PLATFORM_TOKEN) {
    throw new Error('ERXES_PLATFORM_TOKEN is not configured');
  }

  if (!COLLECTIVE_PRODUCT_ID || !COLLECTIVE_BUNDLE_ID) {
    throw new Error(
      'COLLECTIVE_PRODUCT_ID or COLLECTIVE_BUNDLE_ID is not configured',
    );
  }

  const BASE_URL = (PLATFORM_ENDPOINT || getCoreDomain()).replace(/\/+$/, '');

  const ENDPOINT = `${BASE_URL}/platform/organization/partners`;

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'erxes-platform-token': ERXES_PLATFORM_TOKEN,
    },
    body: JSON.stringify({
      subdomain,
      subdomains,
      productId: COLLECTIVE_PRODUCT_ID,
      bundleId: COLLECTIVE_BUNDLE_ID,
    }),
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Platform partners registration HTTP ${res.status}: ${text}`,
    );
  }

  const data = (await res
    .json()
    .catch(() => ({}))) as PlatformPartnersResponse;

  if (data?.status && data.status !== 'success') {
    throw new Error(
      `Platform partners registration failed: ${JSON.stringify(data)}`,
    );
  }

  return data;
};
