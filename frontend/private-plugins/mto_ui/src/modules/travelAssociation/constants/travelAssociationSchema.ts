import { z } from 'zod';

export const travelAssociationFormSchema = z.object({
  titleEn: z.string().min(1, { message: 'English title is required' }),
  titleMn: z.string().min(1, { message: 'Mongolian title is required' }),
  descriptionEn: z.string().optional(),
  descriptionMn: z.string().optional(),
  logo: z.string().optional(),
  cover: z.string().optional(),
  foundDate: z.string().min(1, { message: 'Found date is required' }),
});

export type TravelAssociationFormData = z.infer<
  typeof travelAssociationFormSchema
>;
