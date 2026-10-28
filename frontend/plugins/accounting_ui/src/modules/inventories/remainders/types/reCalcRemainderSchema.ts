import { z } from 'zod';

export const reCalcRemainderSchema = z.object({
  placeEntityId: z.string().optional(),
  productCategoryId: z.string().optional(),
});
