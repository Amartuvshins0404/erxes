import { IContractPaymentDocument } from '@/contract/@types/payment';
import { IModels } from '~/connectionResolvers';
import { notifyBlockCustomer } from '~/utils/cpNotify';

const REMINDER_DAYS_BEFORE = [5, 3, 1];
const UNSETTLED_STATUSES = ['unpaid', 'partial'];

const startOfDay = (date: Date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
};

const addDays = (date: Date, days: number) => {
  const day = new Date(date);
  day.setDate(day.getDate() + days);
  return day;
};

const daysBetween = (from: Date, to: Date) =>
  Math.round(
    (startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000,
  );

const formatDate = (date?: Date) =>
  date ? new Date(date).toLocaleDateString('mn-MN') : '';

const paymentLabel = (payment: IContractPaymentDocument) =>
  payment.label ||
  (payment.contractNumber
    ? `${payment.contractNumber} #${payment.index + 1}`
    : `#${payment.index + 1}`);

const notifyPayment = async (
  models: IModels,
  payment: IContractPaymentDocument,
  data: {
    title: string;
    message: string;
    type: 'warning' | 'error';
  },
) => {
  if (!payment.customerId) {
    return;
  }

  await notifyBlockCustomer(models, payment.subdomain, payment.customerId, {
    ...data,
    contentType: 'blockadmin:contractPayment',
    contentTypeId: payment._id,
  });
};

export const sendUpcomingPaymentReminders = async (models: IModels) => {
  const today = startOfDay(new Date());

  for (const daysBefore of REMINDER_DAYS_BEFORE) {
    const targetStart = addDays(today, daysBefore);
    const targetEnd = addDays(targetStart, 1);

    const payments = await models.ContractPayment.find({
      status: { $in: UNSETTLED_STATUSES },
      dueDate: { $gte: targetStart, $lt: targetEnd },
    });

    for (const payment of payments) {
      await notifyPayment(models, payment, {
        title: 'Төлбөрийн сануулга',
        message: `Таны ${paymentLabel(payment)} төлбөр (${payment.amount} ${
          payment.currency || ''
        }) ${formatDate(
          payment.dueDate,
        )}-нд төлөгдөх ёстой. ${daysBefore} хоног үлдлээ.`,
        type: 'warning',
      });
    }
  }
};

export const sendOverduePaymentReminders = async (models: IModels) => {
  const today = startOfDay(new Date());

  const payments = await models.ContractPayment.find({
    status: { $in: UNSETTLED_STATUSES },
    dueDate: { $lt: today },
  });

  for (const payment of payments) {
    const daysOverdue = payment.dueDate
      ? daysBetween(payment.dueDate, today)
      : 0;

    await notifyPayment(models, payment, {
      title: 'Хугацаа хэтэрсэн төлбөр',
      message: `Таны ${paymentLabel(payment)} төлбөр (${payment.amount} ${
        payment.currency || ''
      }) ${formatDate(
        payment.dueDate,
      )}-нд төлөгдөх ёстой байсан бөгөөд ${daysOverdue} өдрөөр хэтэрсэн байна.`,
      type: 'error',
    });
  }
};

export const processPaymentReminders = async (models: IModels) => {
  await sendUpcomingPaymentReminders(models);
  await sendOverduePaymentReminders(models);
};
