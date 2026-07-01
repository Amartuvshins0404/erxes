import { Model } from 'mongoose';
import {
  IContractPayment,
  IContractPaymentDocument,
} from '@/contract/@types/payment';
import { IContractPaymentTransactionDocument } from '@/contract/@types/transaction';
import { IModels } from '~/connectionResolvers';
import { contractPaymentSchema } from '@/contract/db/definitions/payment';

export interface IContractPaymentModel extends Model<IContractPaymentDocument> {
  regenerateForContract(
    contractId: string,
    force?: boolean,
  ): Promise<IContractPaymentDocument[]>;
  recomputeStatus(
    paymentId: string,
  ): Promise<IContractPaymentDocument | null>;
  addTransaction(
    paymentId: string,
    input: {
      amount: number;
      date?: Date;
      note?: string;
      createdBy?: string;
      paymentMethod?: string;
    },
  ): Promise<IContractPaymentTransactionDocument>;
  updateTransaction(
    _id: string,
    input: { amount?: number; date?: Date; note?: string; paymentMethod?: string },
  ): Promise<IContractPaymentTransactionDocument | null>;
  removeTransaction(
    _id: string,
  ): Promise<IContractPaymentTransactionDocument>;
}

const addMonths = (base: Date, months: number) => {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
};
const addYears = (base: Date, years: number) => {
  const d = new Date(base);
  d.setFullYear(d.getFullYear() + years);
  return d;
};
const setSafeDay = (date: Date, day: number) => {
  const d = new Date(date);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
};

const periodsPerYear = (frequency: string | undefined): number => {
  switch (frequency) {
    case 'ONE_TIME_PER_MONTH': return 12;
    case 'TWO_TIME_PER_MONTH': return 24;
    case 'THREE_TIME_PER_MONTH': return 36;
    case 'QUARTERLY': return 4;
    case 'HALF_YEARLY': return 2;
    case 'YEARLY': return 1;
    default: return 12;
  }
};

function generateInstallmentDates(
  startDate: Date,
  count: number,
  frequency: string | undefined,
  paymentDates: number[],
): Date[] {
  const dates: Date[] = [];
  const days = paymentDates.length ? paymentDates : [15];

  const push = (computed: Date) => {
    dates.push(dates.length === 0 ? startDate : computed);
  };

  switch (frequency) {
    case 'ONE_TIME_PER_MONTH':
      for (let i = 0; i < count; i++)
        push(setSafeDay(addMonths(startDate, i), days[0]));
      break;
    case 'TWO_TIME_PER_MONTH': {
      const dd = days.length >= 2 ? days.slice(0, 2) : [15, 30];
      const monthsNeeded = Math.ceil(count / 2);
      for (let m = 0; m < monthsNeeded; m++)
        for (let i = 0; i < dd.length && dates.length < count; i++)
          push(setSafeDay(addMonths(startDate, m), dd[i]));
      break;
    }
    case 'THREE_TIME_PER_MONTH': {
      const dd = days.length >= 3 ? days.slice(0, 3) : [10, 20, 30];
      const monthsNeeded = Math.ceil(count / 3);
      for (let m = 0; m < monthsNeeded; m++)
        for (let i = 0; i < dd.length && dates.length < count; i++)
          push(setSafeDay(addMonths(startDate, m), dd[i]));
      break;
    }
    case 'QUARTERLY':
      for (let i = 0; i < count; i++)
        push(setSafeDay(addMonths(startDate, i * 3), days[0]));
      break;
    case 'HALF_YEARLY':
      for (let i = 0; i < count; i++)
        push(setSafeDay(addMonths(startDate, i * 6), days[0]));
      break;
    case 'YEARLY':
      for (let i = 0; i < count; i++)
        push(setSafeDay(addYears(startDate, i), days[0]));
      break;
    case 'ONE_TIME':
      break;
    default:
      for (let i = 0; i < count; i++)
        push(setSafeDay(addMonths(startDate, i), days[0]));
  }
  return dates;
}

export const loadContractPaymentClass = (models: IModels) => {
  class ContractPayment {
    public static async regenerateForContract(contractId: string, force = false) {
      const contract = await models.Contract.findOne({ _id: contractId });
      if (!contract) return [];

      const stage = contract.status
        ? await models.ContractStatus.findOne({ _id: contract.status })
        : null;
      if (stage?.type === 'cancelled') return [];
      if (!force && stage?.type !== 'signed') return [];

      const contractNumber = contract.number;
      const partyId = contract.party?.id;
      const partyType = contract.party?.type;

      const projectId = await (async () => {
        if (!contract.unit) return undefined;
        const unit = await models.Unit.findOne({ _id: contract.unit });
        if (!unit?.zoning) return undefined;
        const zoning = await models.Zoning.findOne({ _id: unit.zoning });
        if (!zoning?.building) return undefined;
        const building = await models.Building.findOne({ _id: zoning.building });
        return building?.project;
      })();

      const existingPayments = await models.ContractPayment.find({
        contractId,
      }).lean();
      const existingByIndex = new Map<number, any>();
      const paymentIdsToDelete: string[] = [];
      for (const p of existingPayments) {
        existingByIndex.set(p.index, p);
        paymentIdsToDelete.push(p._id.toString());
      }

      // Keep transactions for payments that will be regenerated with same index
      const existingTransactions = paymentIdsToDelete.length
        ? await models.ContractPaymentTransaction.find({
            paymentId: { $in: paymentIdsToDelete },
          }).lean()
        : [];
      const txByOldPaymentId = new Map<string, any[]>();
      for (const tx of existingTransactions) {
        const key = tx.paymentId.toString();
        if (!txByOldPaymentId.has(key)) txByOldPaymentId.set(key, []);
        txByOldPaymentId.get(key)!.push(tx);
      }

      await models.ContractPayment.deleteMany({ contractId });
      await models.ContractPaymentTransaction.deleteMany({ contractId });

      const paymentPlan = contract.paymentPlan as any;
      if (!paymentPlan) return [];

      const totalPrice = contract.amount || 0;
      const downPct = paymentPlan.downPaymentPercentage || 0;
      const finalPct = paymentPlan.completionPaymentPercentage || 0;
      const barterPct = paymentPlan.barterPercentage || 0;
      const discountPct = paymentPlan.discountPercentage || 0;
      const interestPct = paymentPlan.interestPercentage || 0;
      const interestType = paymentPlan.interestType || 'FLAT';
      const installmentCount = Math.max(0, paymentPlan.installment || 0);
      const isOneTime = paymentPlan.frequency === 'ONE_TIME';
      const ppy = periodsPerYear(paymentPlan.frequency);

      const discountAmount = (totalPrice * discountPct) / 100;
      const priceAfterDiscount = totalPrice - discountAmount;
      const downAmount = paymentPlan.downPaymentAmount > 0
        ? paymentPlan.downPaymentAmount
        : (priceAfterDiscount * downPct) / 100;
      const barterValue = paymentPlan.barterAmount > 0
        ? paymentPlan.barterAmount
        : (priceAfterDiscount * barterPct) / 100;
      const advanceAmount = paymentPlan.completionPaymentAmount > 0
        ? paymentPlan.completionPaymentAmount
        : (priceAfterDiscount * finalPct) / 100;
      const principal = priceAfterDiscount - downAmount - barterValue - advanceAmount;

      const contractDate = contract.date || new Date();
      const downPaymentDate = paymentPlan.downPaymentDate
        ? new Date(paymentPlan.downPaymentDate)
        : contractDate;
      // paymentDueDates are stored as Date objects
      const customDueDates = (paymentPlan.paymentDueDates || [])
        .map((d: Date | string) => (d instanceof Date ? d : new Date(d)))
        .filter((d: Date) => !isNaN(d.getTime()));

      const firstInstallmentStart =
        paymentPlan.firstPaymentDate
          ? new Date(paymentPlan.firstPaymentDate)
          : contractDate;

      const autoDates = isOneTime
        ? []
        : generateInstallmentDates(
            firstInstallmentStart,
            installmentCount,
            paymentPlan.frequency,
            paymentPlan.paymentDates || [],
          );

      const dates: Date[] = isOneTime
        ? []
        : Array.from({ length: installmentCount }).map(
            (_, i) => customDueDates[i] || autoDates[i],
          );

      const rows: IContractPayment[] = [];
      const currency = contract.currency || 'MNT';
      const commonFields = {
        contractId,
        contractNumber,
        partyId,
        partyType,
        projectId: projectId?.toString(),
        unit: contract.unit,
        currency,
        status: 'unpaid' as const,
        paidAmount: 0,
        penaltyAmount: 0,
        overdueDays: 0,
      };

      if (isOneTime) {
        // SIMPLE/FLAT for one-time: total interest on discounted price
        const totalInterest = (priceAfterDiscount * interestPct) / 100;
        rows.push({
          ...commonFields,
          index: 0,
          label: 'Full payment',
          dueDate: contractDate,
          amount: priceAfterDiscount + totalInterest,
        });
      } else {
        let rowIndex = 0;

        if (barterValue > 0) {
          rows.push({
            ...commonFields,
            index: rowIndex++,
            label: 'Barter',
            dueDate: contractDate,
            amount: barterValue,
          });
        }

        if (downAmount > 0) {
          rows.push({
            ...commonFields,
            index: rowIndex++,
            label: 'Down payment',
            dueDate: downPaymentDate,
            amount: downAmount,
          });
        }

        const defaultPerInstallment =
          installmentCount > 0 ? principal / installmentCount : 0;
        const savedAmounts: number[] = paymentPlan.installmentAmounts || [];

        // Compute per-installment principals: use saved overrides, auto-fill last as remainder
        const installmentPrincipals = Array.from({ length: installmentCount }, (_, i) => {
          if (i < installmentCount - 1) {
            return savedAmounts[i] || defaultPerInstallment;
          }
          // last row = remainder so totals always match
          const sumOfOthers = Array.from({ length: installmentCount - 1 }, (__, j) =>
            savedAmounts[j] || defaultPerInstallment,
          ).reduce((a, b) => a + b, 0);
          return savedAmounts[i] || (principal - sumOfOthers);
        });

        // SIMPLE: total interest = principal × rate × (installments / ppy), spread evenly
        const simpleInterestPerInstallment =
          interestPct > 0 && installmentCount > 0
            ? (principal * interestPct) / 100 * (installmentCount / ppy) / installmentCount
            : 0;

        for (let i = 0; i < installmentCount; i++) {
          const installPrincipal = installmentPrincipals[i];
          let interest = 0;

          if (interestPct > 0 && installmentCount > 0) {
            if (interestType === 'FLAT') {
              interest = (principal * interestPct) / 100 / installmentCount;
            } else if (interestType === 'REDUCING') {
              const paidSoFar = installmentPrincipals.slice(0, i).reduce((a, b) => a + b, 0);
              interest = ((principal - paidSoFar) * interestPct) / 100 / ppy;
            } else {
              interest = simpleInterestPerInstallment;
            }
          }

          rows.push({
            ...commonFields,
            index: rowIndex++,
            label: `Installment ${i + 1}`,
            dueDate: dates[i] || firstInstallmentStart,
            amount: installPrincipal + interest,
          });
        }

        if (advanceAmount > 0) {
          rows.push({
            ...commonFields,
            index: rowIndex++,
            label: 'Completion payment',
            dueDate: new Date('2099-12-31'),
            amount: advanceAmount,
          });
        }
      }

      if (rows.length) {
        const created = await models.ContractPayment.insertMany(rows);

        // Restore transactions from old payments matching by index
        for (const newPayment of created) {
          const oldPayment = existingByIndex.get(newPayment.index);
          if (!oldPayment) continue;
          const oldTxs = txByOldPaymentId.get(oldPayment._id.toString()) || [];
          if (oldTxs.length === 0) continue;
          const newTxs = oldTxs.map((tx) => ({
            paymentId: newPayment._id,
            contractId: newPayment.contractId,
            amount: tx.amount,
            date: tx.date,
            note: tx.note,
            createdBy: tx.createdBy,
          }));
          await models.ContractPaymentTransaction.insertMany(newTxs);
          await ContractPayment.recomputeStatus(newPayment._id.toString());
        }

        return created;
      }
      return [];
    }

    public static async recomputeStatus(paymentId: string) {
      const payment = await models.ContractPayment.findOne({ _id: paymentId });
      if (!payment) return null;
      if (payment.status === 'cancelled') return payment;

      const transactions = await models.ContractPaymentTransaction.find({
        paymentId,
      }).lean();

      const paidAmount = transactions.reduce(
        (sum, tx) => sum + (tx.amount || 0),
        0,
      );

      let status: 'unpaid' | 'partial' | 'paid' = 'unpaid';
      if (paidAmount >= payment.amount) {
        status = 'paid';
      } else if (paidAmount > 0) {
        status = 'partial';
      }

      const latestTx = transactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )[0];

      return models.ContractPayment.findOneAndUpdate(
        { _id: paymentId },
        {
          $set: {
            status,
            paidAmount,
            paidDate: latestTx?.date,
          },
        },
        { new: true },
      );
    }

    public static async addTransaction(
      paymentId: string,
      input: { amount: number; date?: Date; note?: string; createdBy?: string; paymentMethod?: string },
    ) {
      const payment = await models.ContractPayment.findOne({ _id: paymentId });
      if (!payment) throw new Error('Payment not found');

      const tx = await models.ContractPaymentTransaction.create({
        paymentId,
        contractId: payment.contractId,
        amount: input.amount,
        date: input.date || new Date(),
        note: input.note,
        createdBy: input.createdBy,
        paymentMethod: input.paymentMethod,
      });

      await ContractPayment.recomputeStatus(paymentId);
      return tx;
    }

    public static async updateTransaction(
      _id: string,
      input: { amount?: number; date?: Date; note?: string; paymentMethod?: string },
    ) {
      const tx = await models.ContractPaymentTransaction.findOne({ _id });
      if (!tx) throw new Error('Transaction not found');

      const updated = await models.ContractPaymentTransaction.findOneAndUpdate(
        { _id },
        { $set: input },
        { new: true },
      );

      await ContractPayment.recomputeStatus(tx.paymentId.toString());
      return updated;
    }

    public static async removeTransaction(_id: string) {
      const tx = await models.ContractPaymentTransaction.findOne({ _id });
      if (!tx) throw new Error('Transaction not found');

      const paymentId = tx.paymentId.toString();
      await models.ContractPaymentTransaction.deleteOne({ _id });
      await ContractPayment.recomputeStatus(paymentId);
      return tx;
    }
  }

  contractPaymentSchema.loadClass(ContractPayment);
  return contractPaymentSchema;
};
