import { z } from 'zod';

// Safe local tools are on for new agents. Network access and terminal stay
// opt-in.
const DEFAULT_ADDITIONAL_TOOLS = [
  'calculator',
  'renderChart',
  'renderDiagram',
  'generatePdf',
  'generateDocx',
  'generateXlsx',
  'generatePptx',
  'removeImageBackground',
];

export const agentFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
    description: z.string(),
    visibility: z.enum(['private', 'shared', 'organization']),
    audienceUserIds: z.array(z.string().max(128)).max(250),
    instructions: z
      .string()
      .min(1, 'System instructions are required')
      .max(20000, 'System instructions are too long'),
    provider: z.string(),
    model: z.string().min(1, 'Model is required'),
    permissionGroupIds: z.array(z.string()),
    additionalTools: z.array(z.string()).max(20),
    isActive: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.visibility === 'shared' && !value.audienceUserIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['visibility'],
        message: 'Select at least one person',
      });
    }
  });

export type AgentFormValues = z.infer<typeof agentFormSchema>;

export const AGENT_FORM_DEFAULTS: AgentFormValues = {
  name: '',
  description: '',
  visibility: 'private',
  audienceUserIds: [],
  instructions: '',
  provider: '',
  model: '',
  additionalTools: [...DEFAULT_ADDITIONAL_TOOLS],
  permissionGroupIds: [],
  isActive: true,
};
