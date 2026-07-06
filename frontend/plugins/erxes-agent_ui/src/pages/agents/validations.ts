import { z } from 'zod';

export const agentFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  agentId: z.string().min(1, 'Agent ID is required'),
  description: z.string(),
  instructions: z
    .string()
    .min(1, 'System instructions are required')
    .max(20000, 'System instructions are too long'),
  provider: z.string(),
  model: z.string().min(1, 'Model is required'),
  toolPolicy: z.enum(['all', 'custom']),
  allowedTools: z.array(z.string()),
  destructiveOps: z.enum(['allow', 'ask']),
  memoryEnabled: z.boolean(),
  debug: z.boolean(),
  maxSteps: z.number().int().min(1).max(50),
  temperature: z.number().nullable(),
  isEnabled: z.boolean(),
  // Visibility is derived automatically by the cascade:
  //   branch only → 'team', branch+dept → 'department', branch+dept+unit → 'unit'
  visibility: z.enum(['private', 'team', 'department', 'unit', 'org']),
  // teamId holds the branch _id for all scoped modes so the edit form can
  // reconstruct which branch was selected without a reverse-lookup.
  teamId: z.string().optional(),
  departmentId: z.string().optional(),
  unitId: z.string().optional(),
});

export type AgentFormValues = z.infer<typeof agentFormSchema>;

export const AGENT_FORM_DEFAULTS: AgentFormValues = {
  name: '',
  agentId: '',
  description: '',
  instructions: '',
  provider: '',
  model: '',
  toolPolicy: 'all',
  allowedTools: [],
  destructiveOps: 'ask',
  memoryEnabled: true,
  debug: false,
  maxSteps: 10,
  temperature: null,
  isEnabled: true,
  visibility: 'private',
  teamId: undefined,
  departmentId: undefined,
  unitId: undefined,
};
