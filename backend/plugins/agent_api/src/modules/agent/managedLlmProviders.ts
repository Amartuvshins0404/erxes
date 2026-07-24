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

export type ManagedLlmProvider = keyof typeof MANAGED_LLM_PROVIDERS;

export interface ManagedLlmConnection {
  provider: ManagedLlmProvider;
  model: string;
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
): provider is ManagedLlmProvider => provider in MANAGED_LLM_PROVIDERS;

const normalizeModelReference = (
  provider: ManagedLlmProvider,
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
): ManagedLlmConnection => {
  const normalizedProvider = (provider || 'kimi').trim().toLowerCase();

  if (!isManagedLlmProvider(normalizedProvider)) {
    throw new Error('Unsupported LLM provider');
  }

  const validProvider = normalizedProvider;
  const defaultModel = MANAGED_LLM_PROVIDERS[validProvider].defaultModel;
  const normalizedModel = model?.trim() || defaultModel;

  if (
    normalizedModel.length > 512 ||
    hasControlCharacters(normalizedModel) ||
    !normalizedModel.startsWith(`${validProvider}/`)
  ) {
    throw new Error('Model must belong to the selected LLM provider');
  }

  return { provider: validProvider, model: normalizedModel };
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
