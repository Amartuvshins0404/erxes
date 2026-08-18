import { z } from 'zod';

export const agentFormSchema = z.object({
  city: z.string().optional(),
  district: z.string().optional(),
  description: z
    .string()
    .max(300, 'Description must be at most 300 characters')
    .optional(),
  facebookUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  linkedUrl: z.string().optional(),
  certificatePhotos: z.array(z.string()).optional(),
});
