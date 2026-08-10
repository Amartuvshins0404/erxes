import { z } from 'zod';

// The "Run agent workflow" automation action stores only the id of the Mastra
// workflow to execute; the trigger document becomes the workflow input at run
// time (see erxes-agent_api/src/meta/automations.ts).
export const workflowActionConfigFormSchema = z.object({
  workflowId: z.string().trim().min(1, 'Please select a workflow'),
});

export type TWorkflowActionConfigForm = z.infer<
  typeof workflowActionConfigFormSchema
>;
