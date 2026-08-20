import { z } from 'zod';

export const categoryFormSchema = z.object({
  nameEn: z.string().min(1, { message: 'English name is required' }),
  nameMn: z.string().min(1, { message: 'Mongolian name is required' }),
  logo: z.string().optional(),
  level: z.enum(['main', 'sub']),
  isActive: z.boolean(),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;
