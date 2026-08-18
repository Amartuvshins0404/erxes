import { z } from 'zod';

export const offerSchema = z.object({
  priceId: z.string().min(1, 'Price is required'),
  price: z.object({
    currency: z.string().min(1, 'Currency is required'),
    price: z.number().min(0, 'Price is required'),
    priceType: z.enum(['priceBySize', 'priceByQuantity']),
  }),
  paymentPlanId: z.string().optional(),
  paymentPlan: z.object({
    type: z.string().min(1, 'Type is required'),
    downPaymentPercentage: z
      .number()
      .min(0, 'Down payment percentage is required'),
    interestPercentage: z.number().min(0, 'Interest percentage is required'),
    discountPercentage: z.number().min(0, 'Discount percentage is required'),
    installment: z.number().min(0, 'Installment is required'),
    frequency: z.string().min(1, 'Frequency is required'),
  }),
  endDate: z.date().min(new Date(), 'End date must be in the future'),
  partyType: z.enum(['customer', 'company']),
  partyId: z.string().min(1, 'customer or company is required'),
  user: z.string().min(1, 'User is required'),
});

export type OfferFormData = z.infer<typeof offerSchema>;
