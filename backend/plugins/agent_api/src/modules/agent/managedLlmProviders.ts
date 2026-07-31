interface ManagedLlmProviderConfig {
  defaultModel: string;
  label: string;
  modelsEndpoint: string;
  modelsAuth?: 'bearer' | 'query' | 'x-api-key';
  headers?: Record<string, string>;
}

export const MANAGED_LLM_PROVIDERS = {
  kimi: {
    defaultModel: 'kimi/kimi-for-coding',
    label: 'Kimi For Coding',
    modelsEndpoint: 'https://api.kimi.com/coding/v1/models',
    headers: { 'User-Agent': 'claude-cli/1.0.65 (external, cli)' },
  },
  moonshot: {
    defaultModel: 'moonshot/kimi-k2.6',
    label: 'Moonshot Kimi',
    modelsEndpoint: 'https://api.moonshot.ai/v1/models',
  },
  openai: {
    defaultModel: 'openai/gpt-5.6',
    label: 'OpenAI',
    modelsEndpoint: 'https://api.openai.com/v1/models',
  },
  anthropic: {
    defaultModel: 'anthropic/claude-opus-4-6',
    label: 'Anthropic Claude',
    modelsEndpoint: 'https://api.anthropic.com/v1/models',
    modelsAuth: 'x-api-key',
    headers: { 'anthropic-version': '2023-06-01' },
  },
  google: {
    defaultModel: 'google/gemini-3.1-pro-preview',
    label: 'Google Gemini',
    modelsEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    modelsAuth: 'query',
  },
  openrouter: {
    defaultModel: 'openrouter/auto',
    label: 'OpenRouter',
    modelsEndpoint: 'https://openrouter.ai/api/v1/models',
  },
  deepseek: {
    defaultModel: 'deepseek/deepseek-v4-flash',
    label: 'DeepSeek',
    modelsEndpoint: 'https://api.deepseek.com/models',
  },
  xai: {
    defaultModel: 'xai/grok-4.3',
    label: 'xAI Grok',
    modelsEndpoint: 'https://api.x.ai/v1/models',
  },
  zai: {
    defaultModel: 'zai/glm-5.2',
    label: 'GLM (Z.AI)',
    modelsEndpoint: 'https://api.z.ai/api/coding/paas/v4/models',
  },
} as const satisfies Record<string, ManagedLlmProviderConfig>;

export type ManagedLlmApiKeyProvider = keyof typeof MANAGED_LLM_PROVIDERS;
export type ManagedLlmCredentialMode = 'api_key' | 'subscription';

export const MANAGED_LLM_SUBSCRIPTION_PROVIDERS = {
  openai: {
    defaultModel: 'openai/gpt-5.6-sol',
    authKind: 'device_code',
  },
  anthropic: {
    defaultModel: 'anthropic/claude-sonnet-4-6',
    authKind: 'setup_token',
  },
  'github-copilot': {
    defaultModel: 'github-copilot/claude-opus-4.7',
    authKind: 'device_code',
  },
  'minimax-portal': {
    defaultModel: 'minimax-portal/MiniMax-M3',
    authKind: 'device_code',
  },
  qwen: {
    defaultModel: 'qwen/qwen3.7-plus',
    authKind: 'plan_key',
  },
  zai: {
    defaultModel: 'zai/glm-5.2',
    authKind: 'plan_key',
  },
} as const;

export type ManagedLlmSubscriptionProvider =
  keyof typeof MANAGED_LLM_SUBSCRIPTION_PROVIDERS;
export type ManagedLlmProvider =
  | ManagedLlmApiKeyProvider
  | ManagedLlmSubscriptionProvider;

export interface ManagedLlmConnection {
  provider: ManagedLlmProvider;
  model: string;
  credentialMode: ManagedLlmCredentialMode;
}

export interface ManagedLlmModel {
  id: string;
  name: string;
}

interface ProviderModelEntry {
  id?: string;
  name?: string;
  display_name?: string;
  displayName?: string;
  supportedGenerationMethods?: string[];
}

const isManagedLlmProvider = (
  provider: string,
): provider is ManagedLlmApiKeyProvider => provider in MANAGED_LLM_PROVIDERS;

export const isManagedLlmSubscriptionProvider = (
  provider: string,
): provider is ManagedLlmSubscriptionProvider =>
  provider in MANAGED_LLM_SUBSCRIPTION_PROVIDERS;

export const managedLlmSubscriptionNeedsToken = (provider: string) =>
  isManagedLlmSubscriptionProvider(provider) &&
  MANAGED_LLM_SUBSCRIPTION_PROVIDERS[provider].authKind !== 'device_code';

export const managedLlmSubscriptionUsesDeviceCode = (provider: string) =>
  isManagedLlmSubscriptionProvider(provider) &&
  MANAGED_LLM_SUBSCRIPTION_PROVIDERS[provider].authKind === 'device_code';

const normalizeModelReference = (
  provider: ManagedLlmApiKeyProvider,
  modelId: string,
) => {
  const normalizedId = modelId.trim().replace(/^models\//, '');
  const providerPrefix = `${provider}/`;

  return normalizedId.startsWith(providerPrefix)
    ? normalizedId
    : `${providerPrefix}${normalizedId}`;
};

const hasControlCharacters = (value: string) =>
  [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });

export const resolveManagedLlmConnection = (
  provider?: string,
  model?: string,
  credentialMode: ManagedLlmCredentialMode = 'api_key',
): ManagedLlmConnection => {
  const normalizedProvider = (provider || 'kimi').trim().toLowerCase();

  if (credentialMode === 'subscription') {
    if (!isManagedLlmSubscriptionProvider(normalizedProvider)) {
      throw new Error('Subscription sign-in is not supported for this provider');
    }

    const subscriptionConfig =
      MANAGED_LLM_SUBSCRIPTION_PROVIDERS[normalizedProvider];
    const normalizedModel =
      model?.trim() || subscriptionConfig.defaultModel;

    if (model?.trim() && normalizedModel !== subscriptionConfig.defaultModel) {
      throw new Error(
        'Subscription connections must use the supported subscription model',
      );
    }

    if (
      normalizedModel.length > 512 ||
      hasControlCharacters(normalizedModel) ||
      !normalizedModel.startsWith(`${normalizedProvider}/`) ||
      normalizedModel.length === normalizedProvider.length + 1
    ) {
      throw new Error('Model must belong to the selected LLM provider');
    }

    return {
      provider: normalizedProvider,
      model: normalizedModel,
      credentialMode,
    };
  }

  if (!isManagedLlmProvider(normalizedProvider)) {
    throw new Error('Unsupported LLM provider');
  }

  const validProvider = normalizedProvider;
  const defaultModel = MANAGED_LLM_PROVIDERS[validProvider].defaultModel;
  const normalizedModel = model?.trim() || defaultModel;

  if (
    normalizedModel.length > 512 ||
    hasControlCharacters(normalizedModel) ||
    !normalizedModel.startsWith(`${validProvider}/`) ||
    normalizedModel.length === validProvider.length + 1
  ) {
    throw new Error('Model must belong to the selected LLM provider');
  }

  return { provider: validProvider, model: normalizedModel, credentialMode };
};

export const resolveManagedLlmCredentialMode = (
  value?: string,
): ManagedLlmCredentialMode => {
  const normalized = value?.trim().toLowerCase() || 'api_key';

  if (normalized !== 'api_key' && normalized !== 'subscription') {
    throw new Error('credentialMode must be api_key or subscription');
  }

  return normalized;
};

export const fetchManagedLlmModels = async (
  provider: string,
  apiKey: string,
): Promise<ManagedLlmModel[]> => {
  const normalizedProvider = provider.trim().toLowerCase();
  const normalizedApiKey = apiKey.trim();

  if (!isManagedLlmProvider(normalizedProvider)) {
    throw new Error('Unsupported LLM provider');
  }

  if (!normalizedApiKey || normalizedApiKey.length > 4096) {
    throw new Error('A valid API key is required');
  }

  const config: ManagedLlmProviderConfig =
    MANAGED_LLM_PROVIDERS[normalizedProvider];
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...config.headers,
  };
  let url = config.modelsEndpoint;

  if (config.modelsAuth === 'query') {
    url += `${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(
      normalizedApiKey,
    )}`;
  } else if (config.modelsAuth === 'x-api-key') {
    headers['x-api-key'] = normalizedApiKey;
  } else {
    headers.Authorization = `Bearer ${normalizedApiKey}`;
  }

  let response: Response;

  try {
    response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error(`Could not reach ${config.label}'s model catalog`);
  }

  if (!response.ok) {
    throw new Error(
      `Could not load ${config.label} models (HTTP ${response.status}). Check the API key and try again.`,
    );
  }

  let payload: {
    data?: ProviderModelEntry[];
    models?: ProviderModelEntry[];
  };

  try {
    payload = (await response.json()) as {
      data?: ProviderModelEntry[];
      models?: ProviderModelEntry[];
    };
  } catch {
    throw new Error(`${config.label} returned an invalid model catalog`);
  }

  const entries = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.models)
    ? payload.models
    : [];
  const seen = new Set<string>();

  return entries
    .filter(
      (entry) =>
        !Array.isArray(entry.supportedGenerationMethods) ||
        entry.supportedGenerationMethods.includes('generateContent'),
    )
    .flatMap((entry) => {
      const rawId =
        entry.id ||
        (typeof entry.name === 'string'
          ? entry.name.replace(/^models\//, '')
          : '');

      if (!rawId) {
        return [];
      }

      const id = normalizeModelReference(normalizedProvider, rawId);

      if (seen.has(id)) {
        return [];
      }

      seen.add(id);

      return [
        {
          id,
          name:
            entry.display_name ||
            entry.displayName ||
            (entry.id ? entry.name : undefined) ||
            rawId,
        },
      ];
    })
    .slice(0, 500)
    .sort((first, second) => first.name.localeCompare(second.name));
};
