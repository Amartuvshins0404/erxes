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

export const generalSettingsSchema = z
  .object({
    erxesApiUrl: z.string(),
    memoryEnabled: z.boolean(),
    attachmentsEnabled: z.boolean(),
    backgroundRemovalEnabled: z.boolean(),
    sandboxMode: z.enum(['onserver', 'isolated']),
    openSandboxApiUrl: z.string().max(2048),
    openSandboxApiKey: z.string().max(512),
  })
  .superRefine((values, ctx) => {
    // The URL format rule only applies in isolated mode; in onserver mode the
    // fields are hidden and stripped by the transform below.
    if (
      values.sandboxMode === 'isolated' &&
      values.openSandboxApiUrl &&
      !/^https?:\/\//i.test(values.openSandboxApiUrl)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['openSandboxApiUrl'],
        message: 'OpenSandbox API URL must start with http:// or https://',
      });
    }
  })
  .transform((values) =>
    values.sandboxMode === 'onserver'
      ? { ...values, openSandboxApiUrl: '', openSandboxApiKey: '' }
      : values,
  );

export type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;

export const GENERAL_SETTINGS_DEFAULTS: GeneralSettingsValues = {
  erxesApiUrl: 'http://localhost:4000',
  memoryEnabled: true,
  attachmentsEnabled: true,
  backgroundRemovalEnabled: true,
  sandboxMode: 'onserver',
  openSandboxApiUrl: '',
  openSandboxApiKey: '',
};
