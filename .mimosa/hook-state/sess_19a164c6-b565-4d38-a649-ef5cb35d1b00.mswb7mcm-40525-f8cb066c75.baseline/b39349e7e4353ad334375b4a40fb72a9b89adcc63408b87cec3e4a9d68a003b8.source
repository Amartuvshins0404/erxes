import { PAYMENT_PLAN_FREQUENCY } from '@/pricing/constants/paymentPlans';

export interface IPaymentPlanInput {
  advancePaymentPercentage: number;
  description: string;
  discountPercentage: number;
  downPaymentPercentage: number;
  interestPercentage: number;
  name: string;
  project: string;
  type: string;
  installment: number;
  frequency: (typeof PAYMENT_PLAN_FREQUENCY)[keyof typeof PAYMENT_PLAN_FREQUENCY];
}

export interface IPaymentPlan extends IPaymentPlanInput {
  _id: string;
}
