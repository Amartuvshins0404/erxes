import { z } from 'zod';

export const eventFormSchema = z
  .object({
    titleEn: z.string().min(1, { message: 'English title is required' }),
    titleMn: z.string().min(1, { message: 'Mongolian title is required' }),
    descriptionEn: z.string().optional(),
    descriptionMn: z.string().optional(),
    image: z.string().optional(),
    startDate: z.string().min(1, { message: 'Start date is required' }),
    endDate: z.string().min(1, { message: 'End date is required' }),
    location: z.string().optional(),
    categoryIds: z
      .array(z.string())
      .min(1, { message: 'Select at least one category' }),
    status: z.enum(['draft', 'published']),
    isActive: z.boolean(),
  })
  .refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    },
  );

export type EventFormData = z.infer<typeof eventFormSchema>;
