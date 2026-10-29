import {
  AI_AGENT_DEFAULTS,
  AI_AGENT_PROVIDER_DEFAULT_MODELS,
} from '../../aiAgent/constants';
import type { TKimiCodingAgentConnection } from '../../aiAgent/connection';
import { TAiProviderResolutionInput } from '../types';

type TKimiCodingResolutionInput = Omit<
  TAiProviderResolutionInput,
  'connection'
> & {
  connection: TKimiCodingAgentConnection;
};

export const resolveKimiCodingConnection = ({
  connection,
}: TKimiCodingResolutionInput): TKimiCodingAgentConnection => {
  const config = connection.config || {};
  const configuredModel = connection.model?.trim();
  const model =
    !configuredModel || configuredModel === 'kimi-code'
      ? AI_AGENT_PROVIDER_DEFAULT_MODELS['kimi-code']
      : configuredModel;

  return {
    ...connection,
    provider: 'kimi-code',
    model,
    config: {
      ...config,
      apiKey: config.apiKey?.trim() || '',
      baseUrl: config.baseUrl?.trim() || AI_AGENT_DEFAULTS.kimiCodingBaseUrl,
    },
  };
};
