import { z } from 'zod';

export const profileFormSchema = z.object({
  businessNameEn: z.string().min(1, { message: 'English name is required' }),
  businessNameMn: z.string().min(1, { message: 'Mongolian name is required' }),
  descriptionEn: z.string().optional(),
  descriptionMn: z.string().optional(),
  phone: z.string().min(1, { message: 'Phone is required' }),
  email: z.string().email({ message: 'Enter a valid email' }),
  website: z.string().optional(),
  isActive: z.boolean(),
  icon: z.string().optional(),
  coverImages: z.array(z.string()),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;
