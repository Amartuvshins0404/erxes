import type { TAiProviderConnection } from '../aiAgent/connection';
import { resolveCloudflareAiGatewayConnection } from './cloudflareAiGateway';
import { resolveGrokConnection } from './grok';
import { resolveKimiConnection } from './kimi';
import { resolveKimiCodingConnection } from './kimiCoding';
import { resolveOpenAiConnection } from './openai';
import { TAiProviderResolutionInput } from './types';

const describeConnection = (
  provider: string,
  connectionName?: string,
): string =>
  connectionName
    ? `AI connection "${connectionName}"`
    : `AI provider "${provider}"`;

export const resolveAiProviderConnection = ({
  connection,
  connectionName,
}: TAiProviderResolutionInput): TAiProviderConnection => {
  let resolved: TAiProviderConnection;

  switch (connection.provider) {
    case 'cloudflare-ai-gateway':
      resolved = resolveCloudflareAiGatewayConnection({ connection });
      break;
    case 'grok':
      resolved = resolveGrokConnection({ connection });
      break;
    case 'kimi':
      resolved = resolveKimiConnection({ connection });
      break;
    case 'kimi-code':
      resolved = resolveKimiCodingConnection({ connection });
      break;
    case 'openai':
      resolved = resolveOpenAiConnection({ connection });
      break;
    default:
      throw new Error('Unsupported AI provider');
  }

  if (
    (resolved.provider === 'openai' ||
      resolved.provider === 'kimi' ||
      resolved.provider === 'kimi-code' ||
      resolved.provider === 'grok') &&
    !resolved.config.apiKey?.trim()
  ) {
    throw new Error(
      `${describeConnection(
        resolved.provider,
        connectionName,
      )} has no API key. Add one in Settings > Connections.`,
    );
  }

  if (!resolved.config.baseUrl?.trim()) {
    throw new Error(
      `${describeConnection(
        resolved.provider,
        connectionName,
      )} has no base URL. Set it, or the Cloudflare account and gateway IDs, in Settings > Connections.`,
    );
  }

  return resolved;
};
