import { OfferAddSheet } from '@/offer/components/OfferAdd';
import { OfferDetailSheet } from '@/offer/components/OfferDetailSheet';
import { OffersRecordTable } from '@/offer/components/OffersRecordTable';
import { useUnitContext } from '@/unit/context/unitContext';

export const UnitOffers = () => {
  const { unit } = useUnitContext();
  const unitId = unit?._id;

  const hasSignedContract = unit?.activeContract?.statusType === 'signed';
  const canAdd = !hasSignedContract && !unit?.locked;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
        <div />
        {canAdd && <OfferAddSheet />}
      </div>
      <OffersRecordTable unitId={unitId} />
      <OfferDetailSheet />
    </div>
  );
};
