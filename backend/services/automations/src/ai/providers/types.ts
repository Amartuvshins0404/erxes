import type { TAiProviderConnection } from '../aiAgent/connection';

export type TAiProvider = TAiProviderConnection['provider'];

export type TCloudflareAiGatewayMode = 'compat' | 'openai-provider';

export type TAiProviderResolutionInput = {
  connection: TAiProviderConnection;
  connectionName?: string;
};

export type TAiProviderResolver = (
  input: TAiProviderResolutionInput,
) => TAiProviderConnection;
