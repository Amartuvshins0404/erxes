import {
  AI_AGENT_DEFAULTS,
  AI_AGENT_PROVIDER_DEFAULT_MODELS,
} from '../../aiAgent/constants';
import type { TCloudflareAiGatewayAgentConnection } from '../../aiAgent/connection';
import { TAiProviderResolutionInput } from '../types';
import { buildCloudflareAiGatewayBaseUrl } from './url';

type TCloudflareAiGatewayResolutionInput = Omit<
  TAiProviderResolutionInput,
  'connection'
> & {
  connection: TCloudflareAiGatewayAgentConnection;
};

export const resolveCloudflareAiGatewayConnection = ({
  connection,
}: TCloudflareAiGatewayResolutionInput): TCloudflareAiGatewayAgentConnection => {
  const config = connection.config || {};
  const mode = config.mode || AI_AGENT_DEFAULTS.cloudflareAiGatewayMode;
  const gatewayToken = config.gatewayToken?.trim() || '';
  const baseUrl =
    config.baseUrl?.trim() ||
    buildCloudflareAiGatewayBaseUrl({
      accountId: config.accountId?.trim() || '',
      gatewayId: config.gatewayId?.trim() || '',
      mode,
      rootBaseUrl: AI_AGENT_DEFAULTS.cloudflareAiGatewayBaseUrl,
    });

  return {
    ...connection,
    provider: 'cloudflare-ai-gateway',
    model:
      connection.model?.trim() ||
      AI_AGENT_PROVIDER_DEFAULT_MODELS['cloudflare-ai-gateway'],
    config: {
      ...config,
      apiKey: config.apiKey?.trim() || '',
      baseUrl,
      headers: {
        ...(config.headers || {}),
        ...(gatewayToken
          ? { 'cf-aig-authorization': `Bearer ${gatewayToken}` }
          : {}),
      },
    },
  };
};
