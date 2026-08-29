import { CurrencyCode } from 'erxes-ui';
import { ContractFormData } from '@/contract/constants/contractSchema';
import {
  ContractInterestType,
  IContractInput,
  IContractPaymentPlan,
} from '@/contract/types/contractTypes';

// The form schema models every field as nullish (a cleared input yields `null`,
// an untouched one `undefined`), while the mutation input only accepts
// `undefined`. This is the single place that narrows one into the other, so the
// add and edit paths cannot drift apart on how a cleared field is sent.
const orUndefined = <T>(value: T | null | undefined): T | undefined =>
  value ?? undefined;

const toCurrency = (value?: string | null): CurrencyCode | undefined =>
  Object.values(CurrencyCode).find((currency) => currency === value);

const toInterestType = (
  value?: string | null,
): ContractInterestType | undefined =>
  Object.values(ContractInterestType).find((type) => type === value);

const toAmount = (value?: number | null): number | undefined =>
  typeof value === 'number' && !isNaN(value) ? value : undefined;

// A payment plan is only sent once it has a frequency — the rest of the plan is
// meaningless without one, and the schema already rejects that combination.
const buildPaymentPlan = (
  paymentPlan: ContractFormData['paymentPlan'],
): IContractPaymentPlan | undefined => {
  if (!paymentPlan?.frequency) {
    return undefined;
  }

  return {
    downPaymentPercentage: orUndefined(paymentPlan.downPaymentPercentage),
    downPaymentAmount: orUndefined(paymentPlan.downPaymentAmount),
    barterPercentage: orUndefined(paymentPlan.barterPercentage),
    barterAmount: orUndefined(paymentPlan.barterAmount),
    interestPercentage: orUndefined(paymentPlan.interestPercentage),
    interestType: toInterestType(paymentPlan.interestType),
    completionPaymentPercentage: orUndefined(
      paymentPlan.completionPaymentPercentage,
    ),
    completionPaymentAmount: orUndefined(paymentPlan.completionPaymentAmount),
    discountPercentage: orUndefined(paymentPlan.discountPercentage),
    description: orUndefined(paymentPlan.description),
    installment: orUndefined(paymentPlan.installment),
    frequency: paymentPlan.frequency,
    penaltyPercentage: orUndefined(paymentPlan.penaltyPercentage),
    vatIncluded: orUndefined(paymentPlan.vatIncluded),
    roundedInstallmentAmount: orUndefined(paymentPlan.roundedInstallmentAmount),
    installmentAmounts: orUndefined(paymentPlan.installmentAmounts),
    paymentDates: orUndefined(paymentPlan.paymentDates),
    paymentDueDates: orUndefined(paymentPlan.paymentDueDates),
    firstPaymentDate: orUndefined(paymentPlan.firstPaymentDate),
    downPaymentDate: orUndefined(paymentPlan.downPaymentDate),
    completionPaymentDate: orUndefined(paymentPlan.completionPaymentDate),
    completionPaymentDateLabel: orUndefined(
      paymentPlan.completionPaymentDateLabel,
    ),
  };
};

export const buildContractInput = (
  data: ContractFormData,
  unit: string,
): IContractInput => ({
  unit,
  number: orUndefined(data.number),
  currency: toCurrency(data.currency),
  date: orUndefined(data.date),
  amount: toAmount(data.amount),
  status: orUndefined(data.status),
  customerId: orUndefined(data.customerId),
  paymentPlan: buildPaymentPlan(data.paymentPlan),
  user: orUndefined(data.user),
});
