import { z } from 'zod';

export const contractSchema = z
  .object({
    unit: z.string().nullish(),
    number: z.string().nullish(),
    currency: z.string().nullish(),
    date: z.string().nullish(),
    amount: z.number().nullish(),
    status: z.string().nullish(),
    user: z.string().nullish(),
    customerId: z.string().nullish(),
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
  })
  .superRefine((data, ctx) => {
    const paymentPlan = data.paymentPlan;
    if (!paymentPlan || paymentPlan.frequency) {
      return;
    }

    const hasOtherValue = Object.entries(paymentPlan).some(([key, value]) => {
      if (
        key === 'frequency' ||
        value === null ||
        value === undefined ||
        value === false
      ) {
        return false;
      }
      return Array.isArray(value) ? value.length > 0 : value !== '';
    });

    if (hasOtherValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentPlan', 'frequency'],
        message: 'Frequency is required when a payment plan is set',
      });
    }
  });

export type ContractFormData = z.infer<typeof contractSchema>;
