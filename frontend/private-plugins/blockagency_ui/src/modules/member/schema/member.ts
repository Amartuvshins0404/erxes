import { z } from 'zod';
import { agencyAttachmentSchema } from '~/modules/agency/schema/form';

export const agentFormSchema = z.object({
  city: z.string().optional(),
  district: z.string().optional(),
  description: z
    .string()
    .max(300, 'Description must be at most 300 characters')
    .optional(),
  facebookUrl: z.string().optional().nullable(),
  instagramUrl: z.string().optional().nullable(),
  linkedUrl: z.string().optional().nullable(),
  certificatePhotos: z.array(agencyAttachmentSchema).optional(),
});
