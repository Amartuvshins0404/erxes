import { z } from 'zod';

export const aiAgentConnectionSchema = z.object({
  connectionId: z.string().trim().min(1, 'Select an AI connection'),
  model: z.string().trim().min(1, 'Model is required'),
});

export type TAiAgentConnection = z.infer<typeof aiAgentConnectionSchema>;

export const buildDefaultAiAgentConnection = (): TAiAgentConnection => ({
  connectionId: '',
  model: '',
});

export const normalizeAiAgentConnection = (
  detailConnection?: Partial<TAiAgentConnection> | null,
): TAiAgentConnection => ({
  connectionId: detailConnection?.connectionId || '',
  model: detailConnection?.model || '',
});
