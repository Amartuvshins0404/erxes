export const AI_AGENT_PROVIDER_TYPES = [
  'cloudflare-ai-gateway',
  'grok',
  'kimi',
  'kimi-code',
  'openai',
] as const;

export type TAiAgentProvider = (typeof AI_AGENT_PROVIDER_TYPES)[number];

export const AI_AGENT_PROVIDERS_REQUIRING_API_KEY: TAiAgentProvider[] = [
  'grok',
  'kimi',
  'kimi-code',
  'openai',
];

export const AI_AGENT_PROVIDER_LABELS: Record<TAiAgentProvider, string> = {
  'cloudflare-ai-gateway': 'Cloudflare AI Gateway',
  grok: 'Grok',
  kimi: 'Kimi',
  'kimi-code': 'Kimi Coding',
  openai: 'OpenAI Direct',
};

export const AI_AGENT_PROVIDER_DEFAULT_MODELS: Record<
  TAiAgentProvider,
  string
> = {
  'cloudflare-ai-gateway': 'openai/gpt-5-mini',
  grok: 'grok-4.3',
  kimi: 'kimi-k2.6',
  'kimi-code': 'kimi-for-coding',
  openai: 'gpt-5-mini',
};

export const isAiAgentProvider = (value: unknown): value is TAiAgentProvider =>
  AI_AGENT_PROVIDER_TYPES.some((provider) => provider === value);

export const AI_AGENT_AUTOMATIONS_SERVICE = 'automations';

export const AI_AGENT_CONNECTIONS_SETTINGS_PATH = '/settings/connections';
