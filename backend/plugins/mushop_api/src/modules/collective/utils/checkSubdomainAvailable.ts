import { getCoreDomain } from 'erxes-api-shared/utils';

const CHECK_SUBDOMAIN_QUERY = `
  query CheckSubdomainAviable($subdomain: String) {
    checkSubdomainAviable(subdomain: $subdomain)
  }
`;

export const checkSubdomainAvailable = async (
  subdomain: string,
  timeout = 15000,
): Promise<any> => {
  const { PLATFORM_ENDPOINT } = process.env;

  const BASE_URL = (PLATFORM_ENDPOINT || getCoreDomain()).replace(/\/+$/, '');

  try {
    const res = await fetch(`${BASE_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: CHECK_SUBDOMAIN_QUERY,
        variables: { subdomain },
      }),
      signal: AbortSignal.timeout(timeout),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Subdomain check HTTP ${res.status}: ${text}`);
    }

    const json: any = await res.json().catch(() => ({}));

    if (json?.errors?.length) {
      throw new Error(json.errors[0]?.message || 'Subdomain check failed');
    }

    return json?.data?.checkSubdomainAviable ?? null;
  } catch (error) {
    console.error('Error checking subdomain availability:', error);
    throw error;
  }
};
