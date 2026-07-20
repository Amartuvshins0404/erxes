export const MANAGED_LLM_PROVIDERS = {
  kimi: { defaultModel: 'kimi/kimi-for-coding' },
  moonshot: { defaultModel: 'moonshot/kimi-k2.6' },
  openai: { defaultModel: 'openai/gpt-5.6' },
  anthropic: { defaultModel: 'anthropic/claude-opus-4-6' },
  google: { defaultModel: 'google/gemini-3.1-pro-preview' },
  openrouter: { defaultModel: 'openrouter/auto' },
  deepseek: { defaultModel: 'deepseek/deepseek-v4-flash' },
  xai: { defaultModel: 'xai/grok-4.3' },
  zai: { defaultModel: 'zai/glm-5.2' },
} as const;

export type ManagedLlmProvider = keyof typeof MANAGED_LLM_PROVIDERS;

export interface ManagedLlmConnection {
  provider: ManagedLlmProvider;
  model: string;
}

export const resolveManagedLlmConnection = (
  provider?: string,
  model?: string,
): ManagedLlmConnection => {
  const normalizedProvider = (provider || 'kimi').trim().toLowerCase();

  if (!(normalizedProvider in MANAGED_LLM_PROVIDERS)) {
    throw new Error('Unsupported LLM provider');
  }

  const validProvider = normalizedProvider as ManagedLlmProvider;
  const defaultModel = MANAGED_LLM_PROVIDERS[validProvider].defaultModel;
  const normalizedModel = model?.trim() || defaultModel;

  if (normalizedModel !== defaultModel) {
    throw new Error('Unsupported model for the selected LLM provider');
  }

  return { provider: validProvider, model: normalizedModel };
};
