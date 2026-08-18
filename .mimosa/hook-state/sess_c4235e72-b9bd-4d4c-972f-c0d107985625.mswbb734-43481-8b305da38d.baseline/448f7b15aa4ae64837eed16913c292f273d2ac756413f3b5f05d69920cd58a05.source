export const OPENCODE_PROVIDER_OPTIONS = [
  { value: 'moonshotai', label: 'Moonshot AI (Kimi)' },
  { value: 'kimi-for-coding', label: 'Kimi For Coding' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'google', label: 'Google' },
] as const;

export const getOpencodeProviderOptions = (current?: string) => {
  const normalized = current?.trim();

  if (
    !normalized ||
    OPENCODE_PROVIDER_OPTIONS.some((option) => option.value === normalized)
  ) {
    return OPENCODE_PROVIDER_OPTIONS;
  }

  return [
    { value: normalized, label: normalized },
    ...OPENCODE_PROVIDER_OPTIONS,
  ] as const;
};
