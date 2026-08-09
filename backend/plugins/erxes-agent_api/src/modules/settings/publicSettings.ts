import { IMastraSettings } from '@/settings/@types/settings';
import { resolveOpenSandboxApiUrl } from '~/mastra/sandbox/config';

export interface IPublicMastraSettings
  extends Omit<IMastraSettings, 'openSandboxApiKey'> {
  hasOpenSandboxApiKey: boolean;
  openSandboxApiKeyHint: string | null;
}

const maskSecret = (secret?: string | null): string | null => {
  if (!secret) return null;
  if (secret.length <= 4) return '••••';
  return `••••${secret.slice(-4)}`;
};

/** Remove write-only secrets from GraphQL-facing settings. */
export const toPublicSettings = (
  settings: IMastraSettings & {
    toObject?: () => IMastraSettings;
  },
): IPublicMastraSettings => {
  const plain = settings.toObject ? settings.toObject() : settings;
  const { openSandboxApiKey, ...publicSettings } = plain;
  const effectiveApiKey =
    openSandboxApiKey || process.env.OPEN_SANDBOX_API_KEY || '';
  const effectiveApiUrl = resolveOpenSandboxApiUrl(
    publicSettings.openSandboxApiUrl,
  );

  return {
    ...publicSettings,
    openSandboxApiUrl: effectiveApiUrl,
    hasOpenSandboxApiKey: Boolean(effectiveApiKey),
    openSandboxApiKeyHint: maskSecret(effectiveApiKey),
  };
};
