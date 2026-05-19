import { InfoCard, Table } from 'erxes-ui';
import { format } from 'date-fns';
import { IContract } from '@/contract/types/contractTypes';
import {
  formatDate,
  generateInstallmentDates,
  parseDateLike,
  renderRow,
} from './shared';

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
              {renderRow('Type', paymentPlan.type, true)}
              {renderRow(
                'Down Payment',
                paymentPlan.downPaymentPercentage != null
                  ? `${paymentPlan.downPaymentPercentage}%`
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
                'Advance Payment',
                paymentPlan.advancePaymentPercentage != null
                  ? `${paymentPlan.advancePaymentPercentage}%`
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

const PaymentSchedule = ({ contract }: { contract: IContract }) => {
  const { paymentPlan, amount, currency } = contract;
  if (!paymentPlan) return null;

  const totalPrice = amount || 0;
  const downPct = paymentPlan.downPaymentPercentage || 0;
  const frequency = paymentPlan.frequency;
  const isOneTime = frequency === 'ONE_TIME';
  const installmentCount = isOneTime
    ? 0
    : Math.max(0, paymentPlan.installment || 0);

  if (!totalPrice && installmentCount === 0 && !isOneTime) return null;

  const downAmount = (totalPrice * downPct) / 100;
  const installmentPct =
    installmentCount > 0 ? (100 - downPct) / installmentCount : 0;
  const installmentAmount = (totalPrice * installmentPct) / 100;

  const startDate =
    parseDateLike(contract.startDate) ||
    parseDateLike(contract.date) ||
    new Date();
  const installmentDates = generateInstallmentDates(
    startDate,
    installmentCount,
    frequency,
    paymentPlan.paymentDates || [],
  );

  const contractDateStr = formatDate(contract.date) || '-';

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

  return (
    <InfoCard title="Payment Schedule">
      <InfoCard.Content className="shadow-none p-0 overflow-hidden">
        <div className="grid grid-cols-5 bg-sidebar">
          <Header>Payment</Header>
          <Header>Date</Header>
          <Header>Type</Header>
          <Header>%</Header>
          <Header>Amount</Header>
        </div>
        {isOneTime ? (
          <div className="grid grid-cols-5">
            <Cell>Full payment</Cell>
            <Cell>{contractDateStr}</Cell>
            <Cell>One-time</Cell>
            <Cell>100%</Cell>
            <Cell>{fmt(totalPrice)}</Cell>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-5">
              <Cell>Reservation</Cell>
              <Cell>{contractDateStr}</Cell>
              <Cell>Down payment</Cell>
              <Cell>{downPct}%</Cell>
              <Cell>{fmt(downAmount)}</Cell>
            </div>
            {Array.from({ length: installmentCount }).map((_, index) => {
              const isLast = index === installmentCount - 1;
              const date = installmentDates[index];
              return (
                <div key={index} className="grid grid-cols-5">
                  <Cell>{index + 1}</Cell>
                  <Cell>
                    {date
                      ? format(date, 'dd.MM.yyyy')
                      : isLast
                      ? 'Key handover'
                      : '-'}
                  </Cell>
                  <Cell>
                    {isLast ? 'Final payment' : 'Progress payment'}
                  </Cell>
                  <Cell>
                    {installmentPct.toFixed(2).replace('.00', '')}%
                  </Cell>
                  <Cell>{fmt(installmentAmount)}</Cell>
                </div>
              );
            })}
          </>
        )}
        <div className="grid grid-cols-5 bg-sidebar border-t font-medium">
          <Cell>Total</Cell>
          <Cell> </Cell>
          <Cell> </Cell>
          <Cell>100%</Cell>
          <Cell>{fmt(totalPrice)}</Cell>
        </div>
      </InfoCard.Content>
    </InfoCard>
  );
};

export default ContractPaymentPlanBody;
