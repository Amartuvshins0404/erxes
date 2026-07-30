import type { ReactNode } from 'react';
import {
  Badge,
  Button,
  FocusSheet,
  InfoCard,
  ScrollArea,
  Select,
  Sheet,
  Spinner,
  Table,
  toast,
} from 'erxes-ui';
import { useAtom } from 'jotai';
import { offerDetailSheetState } from '@/offer/states/offerDetailSheetState';
import { useOffer } from '@/offer/hooks/useOffers';
import { useUpdateOffer } from '@/offer/hooks/useManageOffer';
import { OfferEditSheet } from './OfferEditSheet';
import { CustomersInline, CompaniesInline, MembersInline } from 'ui-modules';
import { IOffer, IOfferPaymentPlan } from '@/offer/types/offerTypes';
import {
  formatAmount,
  formatDate,
  parseDateLike,
  renderRow,
  generateInstallmentDates,
} from '@/contract/components/contract-detail/shared';

export const OfferDetailSheet = () => {
  const [activeOfferId, setActiveOfferId] = useAtom(offerDetailSheetState);
  const { offer, loading } = useOffer(activeOfferId || undefined);
  const { updateOffer } = useUpdateOffer();

  const handleStatusChange = async (status: 'draft' | 'sent') => {
    if (!offer) return;
    try {
      await updateOffer(offer._id, {
        unit: offer.unit,
        amount: offer.amount,
        currency: offer.currency,
        date: offer.date as any,
        status,
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message, variant: 'destructive' });
    }
  };

  return (
    <FocusSheet open={!!activeOfferId} onOpenChange={(open) => !open && setActiveOfferId(null)}>
      <FocusSheet.View className="sm:w-full sm:max-w-4xl">
        <FocusSheet.Header title="Offer Detail" />
        <FocusSheet.Content className="flex flex-auto overflow-hidden">
          <ScrollArea className="flex-auto h-full">
            <div className="p-4 flex flex-col gap-4">
              {loading ? (
                <Spinner />
              ) : !offer ? (
                <div className="text-muted-foreground">Offer not found</div>
              ) : (
                <>
                  <OfferOverviewBody offer={offer} onStatusChange={handleStatusChange} />
                  <OfferPaymentPlanBody offer={offer} />
                </>
              )}
            </div>
          </ScrollArea>
        </FocusSheet.Content>

        <Sheet.Footer className="flex-none">
          {activeOfferId && <OfferEditSheet />}
          <Sheet.Close asChild>
            <Button variant="secondary" className="bg-border">
              Close
            </Button>
          </Sheet.Close>
        </Sheet.Footer>
      </FocusSheet.View>
    </FocusSheet>
  );
};

const OfferOverviewBody = ({
  offer,
  onStatusChange,
}: {
  offer: IOffer;
  onStatusChange: (status: 'draft' | 'sent') => void;
}) => {
  const isCustomer = offer.party?.type === 'customer';
  const partyId = offer.party?.id;

  const partyNode = partyId ? (
    isCustomer ? (
      <CustomersInline.Provider customerIds={[partyId]}>
        <span className="inline-flex items-center gap-2">
          <CustomersInline.Avatar />
          <CustomersInline.Title />
        </span>
      </CustomersInline.Provider>
    ) : (
      <CompaniesInline.Provider companyIds={[partyId]}>
        <span className="inline-flex items-center gap-2">
          <CompaniesInline.Avatar />
          <CompaniesInline.Title />
        </span>
      </CompaniesInline.Provider>
    )
  ) : null;

  return (
    <InfoCard title="Offer Information">
      <InfoCard.Content className="shadow-none p-0 overflow-hidden">
        <Table>
          <Table.Body className="bt:[&_td]:px-2 bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10">
            {renderRow('Number', offer.number ? `#${offer.number}` : null, true)}
            {renderRow(
              'Status',
              <Select
                value={offer.status ?? 'draft'}
                onValueChange={(v) => onStatusChange(v as 'draft' | 'sent')}
              >
                <Select.Trigger className="h-7 w-28 text-xs">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="draft">
                    <Badge variant="secondary">Draft</Badge>
                  </Select.Item>
                  <Select.Item value="sent">
                    <Badge variant="default">Sent</Badge>
                  </Select.Item>
                </Select.Content>
              </Select>,
            )}
            {renderRow('Party', partyNode)}
            {renderRow('Amount', formatAmount(offer.amount, offer.currency))}
            {renderRow('Currency', offer.currency)}
            {renderRow('Date', formatDate(offer.date))}
            {renderRow('Expires', formatDate(offer.endDate))}
            {renderRow(
              'Assigned to',
              offer.user ? (
                <MembersInline.Provider memberIds={[offer.user]}>
                  <span className="inline-flex items-center gap-2">
                    <MembersInline.Avatar />
                    <MembersInline.Title />
                  </span>
                </MembersInline.Provider>
              ) : null,
              false,
              true,
            )}
          </Table.Body>
        </Table>
      </InfoCard.Content>
    </InfoCard>
  );
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

const OfferPaymentPlanBody = ({ offer }: { offer: IOffer }) => {
  const { paymentPlan, amount, currency } = offer;

  if (!paymentPlan) {
    return (
      <div className="text-muted-foreground p-4">
        No payment plan attached to this offer.
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
                  ? formatAmount(paymentPlan.downPaymentAmount, currency)
                  : paymentPlan.downPaymentPercentage != null
                  ? `${paymentPlan.downPaymentPercentage}%`
                  : null,
              )}
              {renderRow(
                'Barter',
                (paymentPlan.barterAmount || 0) > 0
                  ? formatAmount(paymentPlan.barterAmount, currency)
                  : (paymentPlan.barterPercentage || 0) > 0
                  ? `${paymentPlan.barterPercentage}%`
                  : null,
              )}
              {renderRow(
                'Completion Payment',
                (paymentPlan.completionPaymentAmount || 0) > 0
                  ? formatAmount(paymentPlan.completionPaymentAmount, currency)
                  : paymentPlan.completionPaymentPercentage != null
                  ? `${paymentPlan.completionPaymentPercentage}%`
                  : null,
              )}
              {renderRow('Discount', paymentPlan.discountPercentage != null ? `${paymentPlan.discountPercentage}%` : null)}
              {renderRow('Interest', paymentPlan.interestPercentage != null ? `${paymentPlan.interestPercentage}%` : null)}
              {renderRow('Interest Type', paymentPlan.interestType)}
              {renderRow('Installments', paymentPlan.installment)}
              {renderRow('Frequency', paymentPlan.frequency)}
              {renderRow('Payment Dates', paymentPlan.paymentDates?.length ? paymentPlan.paymentDates.join(', ') : null)}
              {renderRow('Penalty', paymentPlan.penaltyPercentage != null ? `${paymentPlan.penaltyPercentage}%` : null)}
              {renderRow('VAT Included', paymentPlan.vatIncluded ? 'Yes' : 'No')}
              {renderRow('Down Payment Due', paymentPlan.downPaymentDate ? formatDate(paymentPlan.downPaymentDate) : null)}
              {renderRow('First Installment', paymentPlan.firstPaymentDate ? formatDate(paymentPlan.firstPaymentDate) : null)}
              {renderRow(
                'Completion Date',
                paymentPlan.completionPaymentDate ? formatDate(paymentPlan.completionPaymentDate) : null,
                false,
                true,
              )}
            </Table.Body>
          </Table>
        </InfoCard.Content>
      </InfoCard>

      <OfferSchedule
        paymentPlan={paymentPlan}
        totalPrice={amount || 0}
        currency={currency}
        dateRaw={offer.date}
      />
    </div>
  );
};

const OfferSchedule = ({
  paymentPlan,
  totalPrice,
  currency,
  dateRaw,
}: {
  paymentPlan: IOfferPaymentPlan;
  totalPrice: number;
  currency: string;
  dateRaw: string;
}) => {
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
  const downAmount =
    (paymentPlan.downPaymentAmount || 0) > 0
      ? paymentPlan.downPaymentAmount!
      : (priceAfterDiscount * downPct) / 100;
  const barterValue =
    (paymentPlan.barterAmount || 0) > 0
      ? paymentPlan.barterAmount!
      : (priceAfterDiscount * barterPct) / 100;
  const completionAmount =
    (paymentPlan.completionPaymentAmount || 0) > 0
      ? paymentPlan.completionPaymentAmount!
      : (priceAfterDiscount * completionPct) / 100;
  const principal = priceAfterDiscount - downAmount - barterValue - completionAmount;

  const roundedAmount = paymentPlan.roundedInstallmentAmount || 0;
  const basePerInstallment =
    installmentCount > 0
      ? roundedAmount > 0 ? roundedAmount : principal / installmentCount
      : 0;

  const savedAmounts: number[] = paymentPlan.installmentAmounts || [];
  const effectivePrincipals = Array.from({ length: installmentCount }, (_, i) =>
    savedAmounts[i] > 0 ? savedAmounts[i] : basePerInstallment,
  );
  if (installmentCount > 0) {
    const sumOfOthers = effectivePrincipals.slice(0, -1).reduce((a, b) => a + b, 0);
    const last = savedAmounts[installmentCount - 1];
    effectivePrincipals[installmentCount - 1] = last > 0 ? last : principal - sumOfOthers;
  }

  const getInterest = (i: number): number => {
    if (interestPct <= 0 || installmentCount <= 0) return 0;
    if (interestType === 'FLAT') return (principal * interestPct) / 100 / installmentCount;
    if (interestType === 'REDUCING') {
      const paidSoFar = effectivePrincipals.slice(0, i).reduce((a, b) => a + b, 0);
      return ((principal - paidSoFar) * interestPct) / 100 / ppy;
    }
    return ((principal * interestPct) / 100) * (installmentCount / ppy) / installmentCount;
  };

  const baseDate =
    parseDateLike(paymentPlan.firstPaymentDate) ||
    parseDateLike(dateRaw) ||
    new Date();
  const autoDates = generateInstallmentDates(
    baseDate,
    installmentCount,
    frequency,
    paymentPlan.paymentDates || [],
  );
  const customDates = paymentPlan.paymentDueDates || [];
  const getDate = (i: number) => {
    const override = customDates[i] ? parseDateLike(customDates[i]) : null;
    return override || autoDates[i];
  };

  const fmt = (val: number) =>
    new Intl.NumberFormat('mn-MN', {
      style: 'currency',
      currency: currency || 'MNT',
      minimumFractionDigits: 0,
    }).format(val);

  const fmtDate = (d: Date | null | undefined) =>
    d ? d.toLocaleDateString('mn-MN') : '-';

  type Row = { key: string; label: string; date: string; type: string; amount: number };
  const rows: Row[] = [];

  if (isOneTime) {
    rows.push({
      key: 'one-time',
      label: 'Full payment',
      date: fmtDate(parseDateLike(dateRaw)),
      type: 'One-time',
      amount: priceAfterDiscount + (priceAfterDiscount * interestPct) / 100,
    });
  } else {
    const contractDateFmt = fmtDate(parseDateLike(dateRaw));
    const downDateFmt = fmtDate(parseDateLike(paymentPlan.downPaymentDate)) || contractDateFmt;
    if (barterValue > 0)
      rows.push({ key: 'barter', label: 'Barter', date: contractDateFmt, type: 'Barter', amount: barterValue });
    if (downAmount > 0)
      rows.push({ key: 'down', label: 'Reservation', date: downDateFmt, type: 'Down payment', amount: downAmount });
    for (let i = 0; i < installmentCount; i++) {
      rows.push({
        key: `inst-${i}`,
        label: String(i + 1),
        date: fmtDate(getDate(i)),
        type: 'Progress payment',
        amount: effectivePrincipals[i] + getInterest(i),
      });
    }
    if (completionAmount > 0) {
      rows.push({
        key: 'completion',
        label: 'Completion',
        date: fmtDate(parseDateLike(paymentPlan.completionPaymentDate)),
        type: 'Completion payment',
        amount: completionAmount,
      });
    }
  }

  if (!rows.length) return null;

  const grandTotal = rows.reduce((s, r) => s + r.amount, 0);

  const Header = ({ children }: { children: ReactNode }) => (
    <div className="px-2 py-2 text-xs font-medium text-muted-foreground uppercase">{children}</div>
  );
  const Cell = ({ children }: { children: ReactNode }) => (
    <div className="px-2 py-2 border-t text-sm">{children}</div>
  );

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
