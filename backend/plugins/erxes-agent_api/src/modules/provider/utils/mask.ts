import { IMastraProviderDocument } from '@/provider/@types/provider';

// Secret-free GraphQL view of a stored provider. Mirrors the voice BYOK module:
// the raw `apiKey` AND custom header VALUES NEVER cross the GraphQL boundary.
// Custom headers can carry auth secrets (e.g. `Authorization: Bearer ...`), so
// reads expose only whether a key is set, a masked last-4 hint, and the NAMES of
// configured headers — never their values. The real secrets stay server-side and
// are read straight from Mongo by the agent runtime (mastra/providers.buildModel).
export interface IPublicMastraProvider {
  _id: string;
  provider: string;
  label?: string;
  baseUrl?: string;
  isDefault?: boolean;
  isEnabled?: boolean;
  isOpenAICompatible?: boolean;
  modelsEndpoint?: string;
  envKey?: string;
  createdAt?: Date;
  hasApiKey: boolean;
  apiKeyHint: string | null;
  // Names only of the configured custom headers — values are withheld.
  headerKeys: string[];
}

// `••••a1b2` — bullets + the last 4 chars so an admin can recognise which key is
// stored without it being usable. Keys of 4 chars or fewer are fully masked so
// nothing recoverable leaks.
export const maskApiKey = (key?: string | null): string | null => {
  if (!key) return null;
  if (key.length <= 4) return '••••';
  return `••••${key.slice(-4)}`;
};

// Strip the secret from a stored provider doc and attach the masked hint. Accepts
// either a Mongoose document or a plain object.
export const toPublicProvider = (
  doc:
    | IMastraProviderDocument
    | (Record<string, unknown> & { toObject?: () => Record<string, unknown> })
    | null
    | undefined,
): IPublicMastraProvider | null => {
  if (!doc) return null;
  const plain = (
    typeof doc.toObject === 'function' ? doc.toObject() : { ...doc }
  ) as Record<string, unknown> & {
    apiKey?: string;
    headers?: Record<string, string> | null;
  };
  // Drop both secrets: apiKey and the header VALUES never leave the server.
  const { apiKey, headers, ...rest } = plain;
  return {
    ...(rest as Omit<
      IPublicMastraProvider,
      'hasApiKey' | 'apiKeyHint' | 'headerKeys'
    >),
    hasApiKey: Boolean(apiKey),
    apiKeyHint: maskApiKey(apiKey),
    headerKeys:
      headers && typeof headers === 'object' ? Object.keys(headers) : [],
  };
};
