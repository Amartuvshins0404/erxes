import { z } from 'zod';

export const agentFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  description: z.string(),
  instructions: z
    .string()
    .min(1, 'System instructions are required')
    .max(20000, 'System instructions are too long'),
  provider: z.string(),
  model: z.string().min(1, 'Model is required'),
  permissionGroupIds: z
    .array(z.string())
    .min(1, 'Select at least one permission group'),
  destructiveOps: z.enum(['allow', 'ask']),
  memoryEnabled: z.boolean(),
  debug: z.boolean(),
  maxSteps: z.number().int().min(1).max(50),
  temperature: z.number().nullable(),
  isActive: z.boolean(),
});

export type AgentFormValues = z.infer<typeof agentFormSchema>;

export const AGENT_FORM_DEFAULTS: AgentFormValues = {
  name: '',
  description: '',
  instructions: '',
  provider: '',
  model: '',
  permissionGroupIds: [],
  destructiveOps: 'ask',
  memoryEnabled: true,
  debug: false,
  maxSteps: 10,
  temperature: null,
  isActive: true,
};
