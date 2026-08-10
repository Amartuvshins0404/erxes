import {
  ASSISTANT_PROVIDER_OPTIONS,
  ASSISTANT_SUBSCRIPTION_PROVIDER_OPTIONS,
  getManagedAssistantModel,
  getSubscriptionAssistantModel,
  subscriptionProviderNeedsCredential,
  subscriptionProviderUsesDeviceCode,
} from './llmProviders';

describe('managed assistant LLM providers', () => {
  it('keeps every default model scoped to its provider', () => {
    for (const option of ASSISTANT_PROVIDER_OPTIONS) {
      expect(option.defaultModel.startsWith(`${option.value}/`)).toBe(true);
    }
  });

  it('resolves provider defaults and safely falls back to Kimi', () => {
    expect(getManagedAssistantModel('openai')).toBe('openai/gpt-5.6');
    expect(getManagedAssistantModel('unknown-provider')).toBe(
      'kimi/kimi-for-coding',
    );
  });

  it('keeps subscription models and auth instructions scoped to each provider', () => {
    for (const option of ASSISTANT_SUBSCRIPTION_PROVIDER_OPTIONS) {
      expect(option.defaultModel.startsWith(`${option.value}/`)).toBe(true);
      expect(option.guideSteps.length).toBeGreaterThan(0);
      expect(option.guideUrl.startsWith('https://docs.openclaw.ai/')).toBe(
        true,
      );
    }

    expect(getSubscriptionAssistantModel('anthropic')).toBe(
      'anthropic/claude-sonnet-4-6',
    );
    expect(getSubscriptionAssistantModel('qwen')).toBe('qwen/qwen3.7-plus');
    expect(getSubscriptionAssistantModel('unknown-provider')).toBe(
      'openai/gpt-5.6-sol',
    );
  });

  it('separates device-code subscriptions from plan credentials', () => {
    const apiProviderValues: readonly string[] = ASSISTANT_PROVIDER_OPTIONS.map(
      ({ value }) => value,
    );

    expect(subscriptionProviderUsesDeviceCode('openai')).toBe(true);
    expect(subscriptionProviderUsesDeviceCode('github-copilot')).toBe(true);
    expect(subscriptionProviderUsesDeviceCode('minimax-portal')).toBe(true);
    expect(subscriptionProviderNeedsCredential('anthropic')).toBe(true);
    expect(subscriptionProviderNeedsCredential('qwen')).toBe(true);
    expect(subscriptionProviderNeedsCredential('zai')).toBe(true);
    expect(apiProviderValues).not.toContain('github-copilot');
    expect(apiProviderValues).not.toContain('qwen');
  });
});
