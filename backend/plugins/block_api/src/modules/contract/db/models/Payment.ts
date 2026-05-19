import { Model } from 'mongoose';
import {
  IContractPayment,
  IContractPaymentDocument,
} from '@/contract/@types/payment';
import { IModels } from '~/connectionResolvers';
import { contractPaymentSchema } from '@/contract/db/definitions/payment';

export interface IContractPaymentModel extends Model<IContractPaymentDocument> {
  regenerateForContract(contractId: string): Promise<IContractPaymentDocument[]>;
  markPaid(
    _id: string,
    input: { paidAmount?: number; paidDate?: Date; note?: string },
  ): Promise<IContractPaymentDocument | null>;
  markUnpaid(_id: string): Promise<IContractPaymentDocument | null>;
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

function generateInstallmentDates(
  startDate: Date,
  count: number,
  frequency: string | undefined,
  paymentDates: number[],
): Date[] {
  const dates: Date[] = [];
  const days = paymentDates.length ? paymentDates : [15];

  switch (frequency) {
    case 'ONE_TIME_PER_MONTH':
      for (let i = 0; i < count; i++)
        dates.push(setSafeDay(addMonths(startDate, i + 1), days[0]));
      break;
    case 'TWO_TIME_PER_MONTH': {
      const dd = days.length >= 2 ? days.slice(0, 2) : [15, 30];
      const monthsNeeded = Math.ceil(count / 2);
      for (let m = 0; m < monthsNeeded; m++) {
        for (let i = 0; i < dd.length && dates.length < count; i++)
          dates.push(setSafeDay(addMonths(startDate, m + 1), dd[i]));
      }
      break;
    }
    case 'THREE_TIME_PER_MONTH': {
      const dd = days.length >= 3 ? days.slice(0, 3) : [10, 20, 30];
      const monthsNeeded = Math.ceil(count / 3);
      for (let m = 0; m < monthsNeeded; m++) {
        for (let i = 0; i < dd.length && dates.length < count; i++)
          dates.push(setSafeDay(addMonths(startDate, m + 1), dd[i]));
      }
      break;
    }
    case 'QUARTERLY':
      for (let i = 0; i < count; i++)
        dates.push(setSafeDay(addMonths(startDate, (i + 1) * 3), days[0]));
      break;
    case 'HALF_YEARLY':
      for (let i = 0; i < count; i++)
        dates.push(setSafeDay(addMonths(startDate, (i + 1) * 6), days[0]));
      break;
    case 'YEARLY':
      for (let i = 0; i < count; i++)
        dates.push(setSafeDay(addYears(startDate, i + 1), days[0]));
      break;
    case 'ONE_TIME':
      break;
    default:
      for (let i = 0; i < count; i++)
        dates.push(setSafeDay(addMonths(startDate, i + 1), days[0]));
  }
  return dates;
}

export const loadContractPaymentClass = (models: IModels) => {
  class ContractPayment {
    public static async regenerateForContract(contractId: string) {
      const contract = await models.Contract.findOne({ _id: contractId });
      if (!contract) return [];

      if (contract.status) {
        const stage = await models.ContractStatus.findOne({
          _id: contract.status,
        });
        if (stage?.type === 'signed') return [];
      }

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

      const existingPaid = await models.ContractPayment.find({
        contractId,
        paid: true,
      }).lean();
      const paidByIndex = new Map<number, any>();
      for (const p of existingPaid) paidByIndex.set(p.index, p);

      await models.ContractPayment.deleteMany({ contractId });

      const paymentPlan = contract.paymentPlan as any;
      if (!paymentPlan) return [];

      const totalPrice = contract.amount || 0;
      const downPct = paymentPlan.downPaymentPercentage || 0;
      const installmentCount = Math.max(0, paymentPlan.installment || 0);
      const isOneTime = paymentPlan.frequency === 'ONE_TIME';
      const downAmount = (totalPrice * downPct) / 100;
      const installmentPct =
        installmentCount > 0 ? (100 - downPct) / installmentCount : 0;
      const installmentAmount = (totalPrice * installmentPct) / 100;

      const startDate =
        contract.startDate || contract.date || new Date();
      const dates = isOneTime
        ? []
        : generateInstallmentDates(
            startDate,
            installmentCount,
            paymentPlan.frequency,
            paymentPlan.paymentDates || [],
          );

      const rows: IContractPayment[] = [];

      if (isOneTime) {
        rows.push({
          contractId,
          contractNumber,
          partyId,
          partyType,
          projectId,
          unit: contract.unit,
          index: 0,
          label: 'Full payment',
          dueDate: contract.date || startDate,
          amount: totalPrice,
          currency: contract.currency || 'MNT',
          paid: false,
        });
      } else {
        if (downAmount > 0 || downPct > 0) {
          rows.push({
            contractId,
            contractNumber,
            partyId,
            partyType,
            projectId,
            unit: contract.unit,
            index: 0,
            label: 'Down payment',
            dueDate: contract.date || startDate,
            amount: downAmount,
            currency: contract.currency || 'MNT',
            paid: false,
          });
        }
        for (let i = 0; i < installmentCount; i++) {
          rows.push({
            contractId,
            contractNumber,
            partyId,
            partyType,
            projectId,
            unit: contract.unit,
            index: i + 1,
            label: `Installment ${i + 1}`,
            dueDate: dates[i] || startDate,
            amount: installmentAmount,
            currency: contract.currency || 'MNT',
            paid: false,
          });
        }
      }

      // restore paid markers
      for (const row of rows) {
        const existing = paidByIndex.get(row.index);
        if (existing) {
          row.paid = true;
          row.paidAmount = existing.paidAmount;
          row.paidDate = existing.paidDate;
          row.note = existing.note;
        }
      }

      if (rows.length) {
        const created = await models.ContractPayment.insertMany(rows);
        return created;
      }
      return [];
    }

    public static async markPaid(
      _id: string,
      input: { paidAmount?: number; paidDate?: Date; note?: string },
    ) {
      const payment = await models.ContractPayment.findOne({ _id });
      if (!payment) throw new Error('Payment not found');

      return models.ContractPayment.findOneAndUpdate(
        { _id },
        {
          $set: {
            paid: true,
            paidAmount: input.paidAmount ?? payment.amount,
            paidDate: input.paidDate || new Date(),
            note: input.note,
          },
        },
        { new: true },
      );
    }

    public static async markUnpaid(_id: string) {
      return models.ContractPayment.findOneAndUpdate(
        { _id },
        { $set: { paid: false, paidAmount: null, paidDate: null } },
        { new: true },
      );
    }
  }

  contractPaymentSchema.loadClass(ContractPayment);
  return contractPaymentSchema;
};
