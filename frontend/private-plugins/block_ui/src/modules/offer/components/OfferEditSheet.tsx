import { Button, CurrencyCode, Sheet, Spinner, toast } from 'erxes-ui';
import { IconPencil } from '@tabler/icons-react';
import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { addDays } from 'date-fns';
import { offerDetailSheetState } from '@/offer/states/offerDetailSheetState';
import { useOffer } from '@/offer/hooks/useOffers';
import { useUpdateOffer } from '@/offer/hooks/useManageOffer';
import { useUnit } from '@/unit/hooks/useUnit';
import { OfferAddForm } from './OfferAdd';
import { OfferFormData } from '@/offer/constants/offerSchema';

export const OfferEditSheet = () => {
  const [open, setOpen] = useState(false);
  const activeOfferId = useAtomValue(offerDetailSheetState);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button>
          <IconPencil />
          Edit
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="blk:sm:max-w-5xl blk:md:w-[calc(100vw-(--spacing(4)))]">
        <Sheet.Header>
          <Sheet.Title>Edit offer</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        {open && activeOfferId && (
          <OfferEditBody offerId={activeOfferId} onClose={() => setOpen(false)} />
        )}
      </Sheet.View>
    </Sheet>
  );
};

const OfferEditBody = ({
  offerId,
  onClose,
}: {
  offerId: string;
  onClose: () => void;
}) => {
  const { offer, loading: loadingOffer } = useOffer(offerId);
  const { updateOffer, loading: updateLoading } = useUpdateOffer();
  const { unit } = useUnit(offer?.unit);

  if (loadingOffer) return <Spinner containerClassName="flex-auto" />;
  if (!offer) return null;

  const parseDateLike = (val: any): Date | undefined => {
    if (!val) return undefined;
    const num = Number(val);
    const d = new Date(isNaN(num) ? val : num);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const defaultValues: Partial<OfferFormData> = {
    unit: offer.unit,
    date: offer.date ? String(offer.date) : new Date().toISOString(),
    priceId: 'mainPrice',
    price: {
      currency: (offer.currency as CurrencyCode) || CurrencyCode.MNT,
      price: offer.amount || 0,
    },
    paymentPlanId: '',
    paymentPlan: offer.paymentPlan
      ? {
          downPaymentPercentage: offer.paymentPlan.downPaymentPercentage,
          downPaymentAmount: offer.paymentPlan.downPaymentAmount,
          barterPercentage: offer.paymentPlan.barterPercentage,
          barterAmount: offer.paymentPlan.barterAmount,
          interestPercentage: offer.paymentPlan.interestPercentage,
          interestType: offer.paymentPlan.interestType,
          completionPaymentPercentage:
            offer.paymentPlan.completionPaymentPercentage,
          completionPaymentAmount: offer.paymentPlan.completionPaymentAmount,
          discountPercentage: offer.paymentPlan.discountPercentage,
          description: offer.paymentPlan.description,
          installment: offer.paymentPlan.installment,
          frequency: offer.paymentPlan.frequency,
          penaltyPercentage: offer.paymentPlan.penaltyPercentage,
          vatIncluded: offer.paymentPlan.vatIncluded,
          roundedInstallmentAmount: offer.paymentPlan.roundedInstallmentAmount,
          installmentAmounts: offer.paymentPlan.installmentAmounts,
          paymentDates: offer.paymentPlan.paymentDates,
          paymentDueDates: offer.paymentPlan.paymentDueDates,
          firstPaymentDate: offer.paymentPlan.firstPaymentDate,
          downPaymentDate: offer.paymentPlan.downPaymentDate,
          completionPaymentDate: offer.paymentPlan.completionPaymentDate,
          completionPaymentDateLabel:
            offer.paymentPlan.completionPaymentDateLabel,
        }
      : undefined,
    endDate:
      parseDateLike(offer.endDate) ?? addDays(new Date(), 7),
    partyType: (offer.party?.type as 'customer' | 'company') ?? 'customer',
    partyId: offer.party?.id ?? '',
    user: offer.user ?? '',
  };

  const handleSubmit = async (data: OfferFormData) => {
    try {
      await updateOffer(offerId, {
        unit: offer.unit,
        amount: data.price?.price,
        currency: data.price?.currency as CurrencyCode,
        date: data.date || new Date().toISOString(),
        endDate: data.endDate?.toISOString(),
        party: data.partyType ? { type: data.partyType, id: data.partyId } : undefined,
        paymentPlan: data.paymentPlan,
        user: data.user,
      });
      toast({ title: 'Offer updated', variant: 'success' });
      onClose();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Update failed',
        variant: 'destructive',
      });
    }
  };

  return (
    <OfferAddForm
      onClose={onClose}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitLabel="Update offer"
      externalLoading={updateLoading}
      unit={unit}
    />
  );
};
