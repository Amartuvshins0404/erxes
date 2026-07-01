import { z } from 'zod';

export const paymentPlanSchema = z.object({
  completionPaymentPercentage: z.number().min(0).max(100).optional(),
  description: z.string().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  downPaymentPercentage: z.number().min(0).max(100).optional(),
  interestPercentage: z.number().min(0).max(100).optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  frequency: z.string().optional(),
  installment: z.number().min(0).optional(),
});
