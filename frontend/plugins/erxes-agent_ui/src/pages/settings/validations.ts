import { z } from 'zod';

export const providerFormSchema = z.object({
  // Required: a custom provider with a blank key would otherwise silently
  // no-op on save. Presets pre-fill this with their own key.
  provider: z.string().min(1, 'Provider key is required'),
  apiKey: z.string(),
  baseUrl: z.string(),
  modelsEndpoint: z.string(),
  isOpenAICompatible: z.boolean(),
  envKey: z.string(),
  // Custom headers edited as one `Header-Name: value` per line.
  headersText: z.string(),
  isDefault: z.boolean(),
  isEnabled: z.boolean(),
});

export type ProviderFormValues = z.infer<typeof providerFormSchema>;

export const PROVIDER_FORM_DEFAULTS: ProviderFormValues = {
  provider: '',
  apiKey: '',
  baseUrl: '',
  modelsEndpoint: '',
  isOpenAICompatible: false,
  envKey: '',
  headersText: '',
  isDefault: false,
  isEnabled: true,
};

export const generalSettingsSchema = z.object({
  erxesApiUrl: z.string(),
  memoryEnabled: z.boolean(),
  attachmentsEnabled: z.boolean(),
  learningEnabled: z.boolean(),
  learningAutoPromoteMinSources: z.number().int().min(1).max(20),
  learningAutoPromoteMinConfidence: z.number().min(0).max(1),
  learningDigestMaxChars: z.number().int().min(500).max(10000),
  learningDigestMaxEntries: z.number().int().min(1).max(100),
  learningIdleMinutes: z.number().int().min(1).max(10080),
  learningDecayDays: z.number().int().min(1).max(3650),
  learningDecayFactor: z.number().min(0).max(1),
  learningArchiveBelowConfidence: z.number().min(0).max(1),
  evaluationEnabled: z.boolean(),
  evaluationDsn: z.string(),
  clearEvaluationDsn: z.boolean(),
  backgroundRemovalEnabled: z.boolean(),
  openSandboxApiUrl: z
    .string()
    .max(2048)
    .refine(
      (value) => !value || /^https?:\/\//i.test(value),
      'OpenSandbox API URL must start with http:// or https://',
    ),
  openSandboxApiKey: z.string().max(512),
});

export type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;

export const GENERAL_SETTINGS_DEFAULTS: GeneralSettingsValues = {
  erxesApiUrl: 'http://localhost:4000',
  memoryEnabled: true,
  attachmentsEnabled: true,
  learningEnabled: false,
  learningAutoPromoteMinSources: 3,
  learningAutoPromoteMinConfidence: 0.75,
  learningDigestMaxChars: 2400,
  learningDigestMaxEntries: 12,
  learningIdleMinutes: 30,
  learningDecayDays: 30,
  learningDecayFactor: 0.9,
  learningArchiveBelowConfidence: 0.2,
  evaluationEnabled: false,
  evaluationDsn: '',
  clearEvaluationDsn: false,
  backgroundRemovalEnabled: true,
  openSandboxApiUrl: '',
  openSandboxApiKey: '',
};
