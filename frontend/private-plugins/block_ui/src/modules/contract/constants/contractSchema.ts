import { z } from 'zod';

export const contractSchema = z.object({
  unit: z.string().nullish(),
  number: z.string().nullish(),
  currency: z.string().nullish(),
  date: z.string().nullish(),
  amount: z.number().nullish(),
  status: z.string().nullish(),
  user: z.string().nullish(),
  party: z
    .object({
      type: z.enum(['customer', 'company']).nullish(),
      id: z.string().nullish(),
    })
    .optional(),
  paymentPlan: z
    .object({
      downPaymentPercentage: z.number().nullish(),
      downPaymentAmount: z.number().nullish(),
      barterPercentage: z.number().nullish(),
      barterAmount: z.number().nullish(),
      interestPercentage: z.number().nullish(),
      interestType: z.string().nullish(),
      completionPaymentPercentage: z.number().nullish(),
      completionPaymentAmount: z.number().nullish(),
      discountPercentage: z.number().nullish(),
      description: z.string().nullish(),
      installment: z.number().nullish(),
      frequency: z.string().nullish(),
      penaltyPercentage: z.number().nullish(),
      vatIncluded: z.boolean().nullish(),
      roundedInstallmentAmount: z.number().nullish(),
      installmentAmounts: z.array(z.number()).nullish(),
      paymentDates: z.array(z.number()).nullish(),
      paymentDueDates: z.array(z.string()).nullish(),
      firstPaymentDate: z.string().nullish(),
      downPaymentDate: z.string().nullish(),
      completionPaymentDate: z.string().nullish(),
      completionPaymentDateLabel: z.string().nullish(),
    })
    .optional(),
});

export type ContractFormData = z.infer<typeof contractSchema>;
