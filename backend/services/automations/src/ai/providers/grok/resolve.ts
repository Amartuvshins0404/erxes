import {
  AI_AGENT_DEFAULTS,
  AI_AGENT_PROVIDER_DEFAULT_MODELS,
} from '../../aiAgent/constants';
import type { TGrokAgentConnection } from '../../aiAgent/connection';
import { TAiProviderResolutionInput } from '../types';

type TGrokResolutionInput = Omit<
  TAiProviderResolutionInput,
  'connection'
> & {
  connection: TGrokAgentConnection;
};

export const resolveGrokConnection = ({
  connection,
}: TGrokResolutionInput): TGrokAgentConnection => {
  const config = connection.config || {};

  return {
    ...connection,
    provider: 'grok',
    model: connection.model?.trim() || AI_AGENT_PROVIDER_DEFAULT_MODELS['grok'],
    config: {
      ...config,
      apiKey: config.apiKey?.trim() || '',
      baseUrl: config.baseUrl?.trim() || AI_AGENT_DEFAULTS.grokBaseUrl,
    },
  };
};
