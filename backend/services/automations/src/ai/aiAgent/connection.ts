import { z } from 'zod';
import {
  AI_AGENT_DEFAULTS,
  AI_AGENT_LIMITS,
  AI_AGENT_PROVIDER_DEFAULT_MODELS,
} from './constants';

const headersSchema = z.record(z.string(), z.string()).default({});
const optionalUrlSchema = z
  .string()
  .trim()
  .refine((value) => !value || z.string().url().safeParse(value).success, {
    message: 'Invalid url',
  });

export const cloudflareAiGatewayConnectionSchema = z.object({
  provider: z.literal('cloudflare-ai-gateway'),
  model: z
    .string()
    .trim()
    .min(1, 'Connection model is required')
    .max(AI_AGENT_LIMITS.maxModelChars)
    .default(AI_AGENT_PROVIDER_DEFAULT_MODELS['cloudflare-ai-gateway']),
  config: z
    .object({
      apiKey: z
        .string()
        .trim()
        .max(AI_AGENT_LIMITS.maxSecretChars)
        .optional()
        .default(''),
      baseUrl: optionalUrlSchema.optional().default(''),
      headers: headersSchema,
      accountId: z.string().trim().optional().default(''),
      gatewayId: z.string().trim().optional().default(''),
      gatewayToken: z
        .string()
        .trim()
        .max(AI_AGENT_LIMITS.maxSecretChars)
        .optional()
        .default(''),
      mode: z
        .enum(['compat', 'openai-provider'])
        .optional()
        .default(AI_AGENT_DEFAULTS.cloudflareAiGatewayMode),
    })
    .default({}),
});

export const openAiConnectionSchema = z.object({
  provider: z.literal('openai'),
  model: z
    .string()
    .trim()
    .min(1, 'Connection model is required')
    .max(AI_AGENT_LIMITS.maxModelChars)
    .default(AI_AGENT_PROVIDER_DEFAULT_MODELS.openai),
  config: z
    .object({
      apiKey: z
        .string()
        .trim()
        .max(AI_AGENT_LIMITS.maxSecretChars)
        .optional()
        .default(''),
      baseUrl: z
        .string()
        .trim()
        .url()
        .optional()
        .default(AI_AGENT_DEFAULTS.openAiBaseUrl),
      headers: headersSchema,
    })
    .default({}),
});

export const kimiConnectionSchema = z.object({
  provider: z.literal('kimi'),
  model: z
    .string()
    .trim()
    .min(1, 'Connection model is required')
    .max(AI_AGENT_LIMITS.maxModelChars)
    .default(AI_AGENT_PROVIDER_DEFAULT_MODELS.kimi),
  config: z
    .object({
      apiKey: z
        .string()
        .trim()
        .max(AI_AGENT_LIMITS.maxSecretChars)
        .optional()
        .default(''),
      baseUrl: z
        .string()
        .trim()
        .url()
        .optional()
        .default(AI_AGENT_DEFAULTS.kimiBaseUrl),
      headers: headersSchema,
    })
    .default({}),
});

export const kimiCodingConnectionSchema = z.object({
  provider: z.literal('kimi-code'),
  model: z
    .string()
    .trim()
    .min(1, 'Connection model is required')
    .max(AI_AGENT_LIMITS.maxModelChars)
    .default(AI_AGENT_PROVIDER_DEFAULT_MODELS['kimi-code']),
  config: z
    .object({
      apiKey: z
        .string()
        .trim()
        .max(AI_AGENT_LIMITS.maxSecretChars)
        .optional()
        .default(''),
      baseUrl: z
        .string()
        .trim()
        .url()
        .optional()
        .default(AI_AGENT_DEFAULTS.kimiCodingBaseUrl),
      headers: headersSchema,
    })
    .default({}),
});

export const grokConnectionSchema = z.object({
  provider: z.literal('grok'),
  model: z
    .string()
    .trim()
    .min(1, 'Connection model is required')
    .max(AI_AGENT_LIMITS.maxModelChars)
    .default(AI_AGENT_PROVIDER_DEFAULT_MODELS.grok),
  config: z
    .object({
      apiKey: z
        .string()
        .trim()
        .max(AI_AGENT_LIMITS.maxSecretChars)
        .optional()
        .default(''),
      baseUrl: z
        .string()
        .trim()
        .url()
        .optional()
        .default(AI_AGENT_DEFAULTS.grokBaseUrl),
      headers: headersSchema,
    })
    .default({}),
});

export const aiProviderConnectionSchema = z.discriminatedUnion('provider', [
  cloudflareAiGatewayConnectionSchema,
  grokConnectionSchema,
  kimiConnectionSchema,
  kimiCodingConnectionSchema,
  openAiConnectionSchema,
]);

export const aiAgentConnectionSchema = z.object({
  connectionId: z
    .string()
    .trim()
    .min(1, 'Select an AI connection for this agent'),
  model: z
    .string()
    .trim()
    .min(1, 'Connection model is required')
    .max(AI_AGENT_LIMITS.maxModelChars),
});

export type TAiAgentConnection = z.infer<typeof aiAgentConnectionSchema>;
export type TAiProviderConnection = z.infer<typeof aiProviderConnectionSchema>;
export type TCloudflareAiGatewayAgentConnection = Extract<
  TAiProviderConnection,
  { provider: 'cloudflare-ai-gateway' }
>;
export type TOpenAiAgentConnection = Extract<
  TAiProviderConnection,
  { provider: 'openai' }
>;
export type TKimiAgentConnection = Extract<
  TAiProviderConnection,
  { provider: 'kimi' }
>;
export type TKimiCodingAgentConnection = Extract<
  TAiProviderConnection,
  { provider: 'kimi-code' }
>;
export type TGrokAgentConnection = Extract<
  TAiProviderConnection,
  { provider: 'grok' }
>;
