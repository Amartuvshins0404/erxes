import { z } from 'zod';

// Mirrors the Mastra skill limits enforced server-side (name ≤64, description
// ≤1024, instructions ≤5000 tokens). Token count can't be measured exactly in
// the browser, so instructions get a generous character guardrail (~4 chars per
// token) — the backend remains the source of truth and surfaces the precise
// limit as an ExpectedError.
export const INSTRUCTIONS_CHAR_LIMIT = 20000;

export const skillFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(64, 'Name must be 64 characters or fewer')
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      'Use lowercase letters, numbers and hyphens (no leading/trailing hyphen)',
    ),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(1024, 'Description must be 1024 characters or fewer'),
  instructions: z
    .string()
    .min(1, 'Instructions are required')
    .max(
      INSTRUCTIONS_CHAR_LIMIT,
      'Instructions are too long (max ~5000 tokens)',
    ),
  userInvocable: z.boolean(),
  category: z.string(),
  metadataText: z.string(),
});

export type SkillFormValues = z.infer<typeof skillFormSchema>;

export const SKILL_FORM_DEFAULTS: SkillFormValues = {
  name: '',
  description: '',
  instructions: '',
  userInvocable: true,
  category: '',
  metadataText: '',
};
