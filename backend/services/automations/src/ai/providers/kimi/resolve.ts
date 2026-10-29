import {
  AI_AGENT_DEFAULTS,
  AI_AGENT_PROVIDER_DEFAULT_MODELS,
} from '../../aiAgent/constants';
import type { TKimiAgentConnection } from '../../aiAgent/connection';
import { TAiProviderResolutionInput } from '../types';

type TKimiResolutionInput = Omit<
  TAiProviderResolutionInput,
  'connection'
> & {
  connection: TKimiAgentConnection;
};

export const resolveKimiConnection = ({
  connection,
}: TKimiResolutionInput): TKimiAgentConnection => {
  const config = connection.config || {};

  return {
    ...connection,
    provider: 'kimi',
    model: connection.model?.trim() || AI_AGENT_PROVIDER_DEFAULT_MODELS['kimi'],
    config: {
      ...config,
      apiKey: config.apiKey?.trim() || '',
      baseUrl: config.baseUrl?.trim() || AI_AGENT_DEFAULTS.kimiBaseUrl,
    },
  };
};
