import {
  ASSISTANT_PROVIDER_OPTIONS,
  getManagedAssistantModel,
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
});
