import { format } from 'date-fns';
import { Button, Label, useQueryState } from 'erxes-ui';
import { InfoCard, InfoCardContent } from '@/block/components/card';
import { OfferAddSheet } from '@/offer/components/OfferAdd';
import { CompaniesInline, CustomersInline, MembersInline } from 'ui-modules';
import { useOffers } from '../hooks/useOffers';
import { IOffer } from '../types/offerTypes';

interface OffersListProps {
  unitId?: string;
  onSelectOffer?: (offer: IOffer) => void;
}

export function OffersList({ unitId, onSelectOffer }: OffersListProps) {
  const { offers, loading, error } = useOffers(unitId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">Loading offers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-red-500">Error loading offers</div>
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">No offers found</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {offers.map((offer) => (
        <OfferItem key={offer._id} {...offer} />
      ))}
    </div>
  );
}

export const OfferItem = ({
  number,
  party,
  amount,
  currency,
  user,
  endDate,
}: IOffer) => {
  return (
    <div className="grid grid-cols-6 gap-2">
      <div className="font-medium flex items-center gap-1 truncate">
        #{number}
      </div>
      <div className="truncate">{<DisplayParty party={party} />}</div>
      <div className="flex items-center gap-1 truncate">
        {amount.toLocaleString()}
        <span className="text-accent-foreground">{currency}</span>
      </div>
      <div className="flex items-center gap-1 truncate">
        <MembersInline memberIds={user ? [user] : []} />
      </div>
      <div className="truncate">
        {format(new Date(Number(endDate)), 'MMM dd, yyyy')}
      </div>
    </div>
  );
};

export const DisplayParty = ({ party }: { party: IOffer['party'] }) => {
  const PartyInline =
    party.type === 'customer' ? CustomersInline : CompaniesInline;
  return (
    <PartyInline
      {...(party.type === 'customer'
        ? { customerIds: [party.id] }
        : { companyIds: [party.id] })}
    />
  );
};

export const OffersListCard = () => {
  const [unitId] = useQueryState<string>('unitId');
  return (
    <InfoCard title="Offers">
      <InfoCardContent>
        <div className="grid grid-cols-6 gap-2">
          <Label asChild>
            <span>Number</span>
          </Label>
          <Label asChild>
            <span>Customer</span>
          </Label>
          <Label asChild>
            <span>Amount</span>
          </Label>
          <Label asChild>
            <span>Assigned To</span>
          </Label>
          <Label asChild>
            <span>Validity</span>
          </Label>
          <Label asChild>
            <span>Actions</span>
          </Label>
        </div>
        <OffersList unitId={unitId || ''} />
        <OfferAddSheet />
      </InfoCardContent>
    </InfoCard>
  );
};

export const OfferSend = ({ offer }: { offer: IOffer }) => {
  return (
    <div className="flex items-center gap-1">
      <Button variant="secondary">View</Button>
    </div>
  );
};
