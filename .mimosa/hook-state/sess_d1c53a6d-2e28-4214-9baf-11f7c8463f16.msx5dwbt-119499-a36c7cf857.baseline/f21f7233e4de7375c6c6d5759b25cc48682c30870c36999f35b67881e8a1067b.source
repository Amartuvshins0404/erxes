import { z } from 'zod';

export const paymentPlanSchema = z.object({
  // advancePaymentPercentage: z
  //   .number()
  //   .min(0, { message: 'Advance payment is required' })
  //   .max(100, { message: 'Advance payment must be less than 100%' }),
  description: z.string().min(1, { message: 'Description is required' }),
  discountPercentage: z
    .number()
    .min(0, { message: 'Discount percentage is required' })
    .max(100, { message: 'Discount percentage must be less than 100%' }),
  downPaymentPercentage: z
    .number()
    .min(0, { message: 'Down payment percentage is required' })
    .max(100, { message: 'Down payment percentage must be less than 100%' }),
  interestPercentage: z
    .number()
    .min(0, { message: 'Interest percentage is required' })
    .max(100, { message: 'Interest percentage must be less than 100%' }),
  name: z.string().min(1, { message: 'Name is required' }),
  type: z.string().min(1, { message: 'Type is required' }),
  frequency: z.string().min(1, { message: 'Frequency is required' }),
  installment: z.number().min(1, { message: 'Installment is required' }),
});
