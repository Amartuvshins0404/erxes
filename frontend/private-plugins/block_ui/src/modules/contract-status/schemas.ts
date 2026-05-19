import { z } from 'zod';

export const BLOCK_CONTRACT_STATUS_FORM_SCHEMA = z.object({
  name: z.string().min(1).max(20),
  description: z.string().max(255).optional(),
  color: z.string().optional(),
});
