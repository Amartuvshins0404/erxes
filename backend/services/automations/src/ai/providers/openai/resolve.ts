import {
  AI_AGENT_DEFAULTS,
  AI_AGENT_PROVIDER_DEFAULT_MODELS,
} from '../../aiAgent/constants';
import type { TOpenAiAgentConnection } from '../../aiAgent/connection';
import { TAiProviderResolutionInput } from '../types';

type TOpenAiResolutionInput = Omit<
  TAiProviderResolutionInput,
  'connection'
> & {
  connection: TOpenAiAgentConnection;
};

export const resolveOpenAiConnection = ({
  connection,
}: TOpenAiResolutionInput): TOpenAiAgentConnection => {
  const config = connection.config || {};

  return {
    ...connection,
    provider: 'openai',
    model: connection.model?.trim() || AI_AGENT_PROVIDER_DEFAULT_MODELS['openai'],
    config: {
      ...config,
      apiKey: config.apiKey?.trim() || '',
      baseUrl: config.baseUrl?.trim() || AI_AGENT_DEFAULTS.openAiBaseUrl,
    },
  };
};
