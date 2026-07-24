import {
  IconBrandGoogle,
  IconBrandOpenai,
  IconBrandX,
  IconBrain,
  IconCode,
  IconSparkles,
} from '@tabler/icons-react';
import type { LlmProviderOption } from './components/LlmProviderApiKeyFields';

export const ASSISTANT_PROVIDER_OPTIONS = [
  {
    value: 'kimi',
    label: 'Kimi For Coding',
    defaultModel: 'kimi/kimi-for-coding',
    icon: IconSparkles,
  },
  {
    value: 'moonshot',
    label: 'Moonshot Kimi',
    defaultModel: 'moonshot/kimi-k2.6',
    icon: IconSparkles,
  },
  {
    value: 'openai',
    label: 'OpenAI',
    defaultModel: 'openai/gpt-5.6',
    icon: IconBrandOpenai,
  },
  {
    value: 'anthropic',
    label: 'Anthropic Claude',
    defaultModel: 'anthropic/claude-opus-4-6',
    icon: IconBrain,
  },
  {
    value: 'google',
    label: 'Google Gemini',
    defaultModel: 'google/gemini-3.1-pro-preview',
    icon: IconBrandGoogle,
  },
  {
    value: 'openrouter',
    label: 'OpenRouter',
    defaultModel: 'openrouter/auto',
    icon: IconCode,
  },
  {
    value: 'deepseek',
    label: 'DeepSeek',
    defaultModel: 'deepseek/deepseek-v4-flash',
    icon: IconBrain,
  },
  {
    value: 'xai',
    label: 'xAI Grok',
    defaultModel: 'xai/grok-4.3',
    icon: IconBrandX,
  },
  {
    value: 'zai',
    label: 'GLM (Z.AI)',
    defaultModel: 'zai/glm-5.2',
    icon: IconBrain,
  },
] as const satisfies readonly LlmProviderOption[];

export const getManagedAssistantModel = (provider?: string | null) => {
  const normalizedProvider = provider?.trim().toLowerCase() || 'kimi';

  return (
    ASSISTANT_PROVIDER_OPTIONS.find(({ value }) => value === normalizedProvider)
      ?.defaultModel || ASSISTANT_PROVIDER_OPTIONS[0].defaultModel
  );
};
