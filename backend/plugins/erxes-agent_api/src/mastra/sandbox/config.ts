import { ConnectionConfig } from '@alibaba-group/opensandbox';
import { ExpectedError } from 'erxes-api-shared/utils';
import type { IMastraSettings } from '@/settings/@types/settings';

export interface OpenSandboxRuntimeConfig {
  connection: ConnectionConfig;
  image: string;
}

const normalizeApiUrl = (value: string): string => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new ExpectedError('OpenSandbox API URL is invalid.');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new ExpectedError('OpenSandbox API URL must use HTTP or HTTPS.');
  }
  return value.replace(/\/+$/, '');
};

export const resolveOpenSandboxApiUrl = (
  configuredUrl?: string | null,
): string => {
  const savedUrl = configuredUrl?.trim();
  if (savedUrl) return normalizeApiUrl(savedUrl);

  const domain = (process.env.OPEN_SANDBOX_DOMAIN || '').trim();
  if (!domain) return '';
  if (/^https?:\/\//i.test(domain)) return normalizeApiUrl(domain);

  const protocol = (process.env.OPEN_SANDBOX_PROTOCOL || 'https')
    .trim()
    .replace(/:$/, '');
  return normalizeApiUrl(`${protocol}://${domain}`);
};

export const resolveOpenSandboxRuntimeConfig = (
  settings: IMastraSettings,
): OpenSandboxRuntimeConfig => {
  const apiUrl = resolveOpenSandboxApiUrl(settings.openSandboxApiUrl);
  const apiKey = (
    settings.openSandboxApiKey ||
    process.env.OPEN_SANDBOX_API_KEY ||
    ''
  ).trim();
  if (!apiUrl || !apiKey) {
    throw new ExpectedError(
      'OpenSandbox is not configured. Add its API URL and API key in AI settings.',
    );
  }

  return {
    connection: new ConnectionConfig({
      domain: normalizeApiUrl(apiUrl),
      apiKey,
      useServerProxy: true,
      requestTimeoutSeconds: 30,
      disableMetrics: true,
    }),
    image:
      process.env.ERXES_AGENT_SANDBOX_IMAGE || 'opensandbox/execd:v1.0.21',
  };
};
