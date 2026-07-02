import { InfoCard, Spinner, Table } from 'erxes-ui';
import { format } from 'date-fns';
import { IContract } from '@/contract/types/contractTypes';
import { useContractPayments } from '@/contract-payment/hooks/usePayments';
import {
  formatDate,
  generateInstallmentDates,
  parseDateLike,
  renderRow,
} from './shared';

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

export const ContractPaymentPlanBody = ({
  contract,
}: {
  contract: IContract;
}) => {
  const { paymentPlan } = contract;

  if (!paymentPlan) {
    return (
      <div className="text-muted-foreground p-4">
        No payment plan attached to this contract.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <InfoCard title="Payment Plan">
        <InfoCard.Content className="shadow-none p-0 overflow-hidden">
          <Table>
            <Table.Body className="bt:[&_td]:px-2 bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10">
              {renderRow(
                'Down Payment',
                (paymentPlan.downPaymentAmount || 0) > 0
                  ? paymentPlan.downPaymentAmount!.toLocaleString()
                  : paymentPlan.downPaymentPercentage != null
                  ? `${paymentPlan.downPaymentPercentage}%`
                  : null,
              )}
              {renderRow(
                'Barter',
                (paymentPlan.barterAmount || 0) > 0
                  ? paymentPlan.barterAmount!.toLocaleString()
                  : (paymentPlan.barterPercentage || 0) > 0
                  ? `${paymentPlan.barterPercentage}%`
                  : null,
              )}
              {renderRow(
                'Interest',
                paymentPlan.interestPercentage != null
                  ? `${paymentPlan.interestPercentage}%`
                  : null,
              )}
              {renderRow('Interest Type', paymentPlan.interestType)}
              {renderRow(
                'Completion Payment',
                paymentPlan.completionPaymentPercentage != null
                  ? `${paymentPlan.completionPaymentPercentage}%`
                  : null,
              )}
              {renderRow(
                'Discount',
                paymentPlan.discountPercentage != null
                  ? `${paymentPlan.discountPercentage}%`
                  : null,
              )}
              {renderRow('Installments', paymentPlan.installment)}
              {renderRow('Frequency', paymentPlan.frequency)}
              {renderRow(
                'Payment Dates',
                paymentPlan.paymentDates && paymentPlan.paymentDates.length
                  ? paymentPlan.paymentDates.join(', ')
                  : null,
              )}
              {renderRow(
                'Penalty',
                paymentPlan.penaltyPercentage != null
                  ? `${paymentPlan.penaltyPercentage}%`
                  : null,
              )}
              {renderRow('Description', paymentPlan.description)}
              {renderRow(
                'Down Payment Due',
                paymentPlan.downPaymentDate
                  ? formatDate(paymentPlan.downPaymentDate)
                  : null,
              )}
              {renderRow(
                'First Installment Date',
                paymentPlan.firstPaymentDate
                  ? formatDate(paymentPlan.firstPaymentDate)
                  : null,
              )}
              {renderRow(
                'Completion Payment Date',
                paymentPlan.completionPaymentDate
                  ? formatDate(paymentPlan.completionPaymentDate)
                  : null,
              )}
              {renderRow(
                'VAT Included',
                paymentPlan.vatIncluded ? 'Yes' : 'No',
                false,
                true,
              )}
            </Table.Body>
          </Table>
        </InfoCard.Content>
      </InfoCard>

      <PaymentSchedule contract={contract} />
    </div>
  );
};

type ScheduleRow = {
  key: string;
  label: string;
  date: string;
  type: string;
  amount: number;
};

const computeRowsFromPlan = (contract: IContract): ScheduleRow[] => {
  const { paymentPlan, amount, date: contractDateRaw } = contract;
  if (!paymentPlan) return [];

  const totalPrice = amount || 0;
  const discountPct = paymentPlan.discountPercentage || 0;
  const downPct = paymentPlan.downPaymentPercentage || 0;
  const barterPct = paymentPlan.barterPercentage || 0;
  const completionPct = paymentPlan.completionPaymentPercentage || 0;
  const interestPct = paymentPlan.interestPercentage || 0;
  const interestType = paymentPlan.interestType || 'FLAT';
  const frequency = paymentPlan.frequency;
  const isOneTime = frequency === 'ONE_TIME';
  const installmentCount = isOneTime ? 0 : Math.max(0, paymentPlan.installment || 0);
  const ppy = periodsPerYear(frequency);

  const discountAmount = (totalPrice * discountPct) / 100;
  const priceAfterDiscount = totalPrice - discountAmount;
  const downAmount = (paymentPlan.downPaymentAmount || 0) > 0
    ? paymentPlan.downPaymentAmount!
    : (priceAfterDiscount * downPct) / 100;
  const barterValue = (paymentPlan.barterAmount || 0) > 0
    ? paymentPlan.barterAmount!
    : (priceAfterDiscount * barterPct) / 100;
  const completionAmount = (paymentPlan.completionPaymentAmount || 0) > 0
    ? paymentPlan.completionPaymentAmount!
    : (priceAfterDiscount * completionPct) / 100;
  const principal = priceAfterDiscount - downAmount - barterValue - completionAmount;

  const roundedAmount = paymentPlan.roundedInstallmentAmount || 0;
  const basePerInstallment = installmentCount > 0
    ? (roundedAmount > 0 ? roundedAmount : principal / installmentCount)
    : 0;

  const savedAmounts: number[] = paymentPlan.installmentAmounts || [];
  const effectivePrincipals = Array.from({ length: installmentCount }, (_, i) => {
    return savedAmounts[i] > 0 ? savedAmounts[i] : basePerInstallment;
  });
  if (installmentCount > 0) {
    const sumOfOthers = effectivePrincipals.slice(0, -1).reduce((a, b) => a + b, 0);
    const lastSaved = savedAmounts[installmentCount - 1];
    effectivePrincipals[installmentCount - 1] = lastSaved > 0 ? lastSaved : principal - sumOfOthers;
  }

  const contractDate = parseDateLike(contractDateRaw) || new Date();
  const firstInstallmentStart = parseDateLike(paymentPlan.firstPaymentDate) || contractDate;
  const autoDates = generateInstallmentDates(
    firstInstallmentStart,
    installmentCount,
    frequency,
    paymentPlan.paymentDates || [],
  );
  const customDueDates = paymentPlan.paymentDueDates || [];
  const getDate = (i: number): Date | null => {
    const override = customDueDates[i] ? parseDateLike(customDueDates[i]) : null;
    return override || autoDates[i] || null;
  };

  const getInterest = (i: number): number => {
    if (interestPct <= 0 || installmentCount <= 0) return 0;
    if (interestType === 'FLAT') return (principal * interestPct) / 100 / installmentCount;
    if (interestType === 'REDUCING') {
      const paidSoFar = effectivePrincipals.slice(0, i).reduce((a, b) => a + b, 0);
      return ((principal - paidSoFar) * interestPct) / 100 / ppy;
    }
    return ((principal * interestPct) / 100) * (installmentCount / ppy) / installmentCount;
  };

  const fmtDate = (d: Date | null) => (d ? format(d, 'dd.MM.yyyy') : '-');
  const contractDateStr = fmtDate(contractDate);
  const downDateStr = fmtDate(parseDateLike(paymentPlan.downPaymentDate)) || contractDateStr;

  const rows: ScheduleRow[] = [];

  if (isOneTime) {
    const totalInterest = (priceAfterDiscount * interestPct) / 100;
    rows.push({
      key: 'one-time',
      label: 'Full payment',
      date: contractDateStr,
      type: 'One-time',
      amount: priceAfterDiscount + totalInterest,
    });
    return rows;
  }

  if (barterValue > 0) {
    rows.push({ key: 'barter', label: 'Barter', date: contractDateStr, type: 'Barter', amount: barterValue });
  }
  if (downAmount > 0) {
    rows.push({ key: 'down', label: 'Reservation', date: downDateStr, type: 'Down payment', amount: downAmount });
  }
  for (let i = 0; i < installmentCount; i++) {
    const p = effectivePrincipals[i];
    const interest = getInterest(i);
    rows.push({
      key: `inst-${i}`,
      label: String(i + 1),
      date: fmtDate(getDate(i)),
      type: 'Progress payment',
      amount: p + interest,
    });
  }
  if (completionAmount > 0) {
    const completionDateStr = fmtDate(parseDateLike(paymentPlan.completionPaymentDate));
    rows.push({
      key: 'completion',
      label: 'Completion',
      date: completionDateStr || contractDateStr,
      type: 'Completion payment',
      amount: completionAmount,
    });
  }

  return rows;
};

const PaymentSchedule = ({ contract }: { contract: IContract }) => {
  const { payments, loading } = useContractPayments(contract._id);
  const { currency } = contract;

  const fmt = (val: number) =>
    new Intl.NumberFormat('mn-MN', {
      style: 'currency',
      currency: currency || 'MNT',
      minimumFractionDigits: 0,
    }).format(val);

  const Header = ({ children }: { children: React.ReactNode }) => (
    <div className="px-2 py-2 text-xs font-medium text-muted-foreground uppercase">
      {children}
    </div>
  );
  const Cell = ({ children }: { children: React.ReactNode }) => (
    <div className="px-2 py-2 border-t text-sm">{children}</div>
  );

  if (loading) {
    return (
      <InfoCard title="Payment Schedule">
        <InfoCard.Content className="shadow-none p-4">
          <Spinner />
        </InfoCard.Content>
      </InfoCard>
    );
  }

  // Use stored payment records if they exist (signed contract),
  // otherwise compute from saved paymentPlan fields (matches editor preview)
  const rows: ScheduleRow[] = payments.length > 0
    ? payments.map((p, i) => ({
        key: p._id,
        label: String(i + 1),
        date: p.dueDate ? format(new Date(p.dueDate), 'dd.MM.yyyy') : '-',
        type: p.label || '-',
        amount: p.amount || 0,
      }))
    : computeRowsFromPlan(contract);

  if (!rows.length) return null;

  const grandTotal = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <InfoCard title="Payment Schedule">
      <InfoCard.Content className="shadow-none p-0 overflow-hidden">
        <div className="grid grid-cols-4 bg-sidebar">
          <Header>#</Header>
          <Header>Date</Header>
          <Header>Type</Header>
          <Header>Amount</Header>
        </div>
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-4">
            <Cell>{row.label}</Cell>
            <Cell>{row.date}</Cell>
            <Cell>{row.type}</Cell>
            <Cell>{fmt(row.amount)}</Cell>
          </div>
        ))}
        <div className="grid grid-cols-4 bg-sidebar border-t font-medium">
          <Cell>Total</Cell>
          <Cell> </Cell>
          <Cell> </Cell>
          <Cell>{fmt(grandTotal)}</Cell>
        </div>
      </InfoCard.Content>
    </InfoCard>
  );
};

export default ContractPaymentPlanBody;
