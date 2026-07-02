import { useOffers } from '../hooks/useOffers';
import { IOffer } from '../types/offerTypes';
import { InfoCard, InfoCardContent } from '@/block/components/card';
import { OfferAddSheet } from '@/offer/components/OfferAdd';
import { offerDetailSheetState } from '@/offer/states/offerDetailSheetState';
import { IconDots, IconMail, IconPencil } from '@tabler/icons-react';
import { format } from 'date-fns';
import {
  Badge,
  Button,
  CurrencyDisplay,
  DropdownMenu,
  Empty,
  Spinner,
  useQueryState,
} from 'erxes-ui';
import { CustomersInline, CompaniesInline, MembersInline } from 'ui-modules';
import { useSetAtom } from 'jotai';

const parseDate = (val: string | number | undefined) => {
  if (!val) return null;
  const num = Number(val);
  const d = new Date(isNaN(num) ? val : num);
  return isNaN(d.getTime()) ? null : d;
};

const StatusBadge = ({ status }: { status: IOffer['status'] }) => {
  if (status === 'sent') {
    return <Badge variant="default">Sent</Badge>;
  }
  return <Badge variant="secondary">Draft</Badge>;
};

const DisplayParty = ({ party }: { party: IOffer['party'] }) => {
  if (!party?.id) return <span className="text-muted-foreground">—</span>;
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

const COLS = 'grid-cols-[1fr_2fr_1.5fr_1fr_1fr_1fr_1fr_40px]';

const OfferRow = ({ offer }: { offer: IOffer }) => {
  const offerDate = parseDate(offer.date);
  const expiryDate = parseDate(offer.endDate);
  const isExpired = expiryDate ? expiryDate < new Date() : false;
  const setActiveOffer = useSetAtom(offerDetailSheetState);

  return (
    <div className={`grid ${COLS} gap-2 items-center px-3 py-2 border-t hover:bg-muted/40 transition-colors`}>
      <button
        className="font-mono text-xs text-muted-foreground text-left hover:underline"
        onClick={() => offer._id && setActiveOffer(offer._id)}
      >
        #{offer.number || offer._id?.slice(-6)}
      </button>
      <div className="truncate text-sm">
        <DisplayParty party={offer.party} />
      </div>
      <div className="flex items-center gap-1 text-sm">
        <CurrencyDisplay variant="icon" code={offer.currency} />
        {offer.amount?.toLocaleString() ?? '—'}
      </div>
      <div>
        <StatusBadge status={offer.status ?? 'draft'} />
      </div>
      <div className="text-sm text-muted-foreground">
        {offerDate ? format(offerDate, 'MMM dd, yyyy') : '—'}
      </div>
      <div className="text-sm text-muted-foreground">
        {expiryDate ? (
          <span className={isExpired ? 'text-destructive' : ''}>
            {format(expiryDate, 'MMM dd, yyyy')}
          </span>
        ) : (
          '—'
        )}
      </div>
      <div className="text-sm text-muted-foreground">
        <MembersInline memberIds={offer.user ? [offer.user] : []} />
      </div>
      <div>
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <IconDots className="size-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content className="blk:min-w-36" align="end">
            <DropdownMenu.Item
              className="cursor-pointer"
              onClick={() => offer._id && setActiveOffer(offer._id)}
            >
              <IconPencil className="size-4" />
              <span>Edit</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item className="cursor-pointer">
              <IconMail className="size-4" />
              <span>Send via Email</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
    </div>
  );
};

const TableHeader = () => (
  <div className={`grid ${COLS} gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase bg-muted/30`}>
    <span>#</span>
    <span>Customer</span>
    <span>Amount</span>
    <span>Status</span>
    <span>Date</span>
    <span>Expiry</span>
    <span>Assigned to</span>
    <span />
  </div>
);

export function OffersList({ unitId }: { unitId?: string }) {
  const { offers, loading, error } = useOffers(unitId);

  if (loading) return <Spinner containerClassName="blk:py-16" />;

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-destructive">
        Error loading offers
      </div>
    );
  }

  if (!offers?.length) {
    return (
      <Empty>
        <Empty.Header>
          <Empty.Title>No offers yet</Empty.Title>
          <Empty.Description>
            Create the first offer for this unit.
          </Empty.Description>
        </Empty.Header>
      </Empty>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <TableHeader />
      {offers.map((offer) => (
        <OfferRow key={offer._id} offer={offer} />
      ))}
    </div>
  );
}

export const OffersListCard = () => {
  const [unitId] = useQueryState<string>('unitId');
  return (
    <InfoCard title={`Offers`}>
      <InfoCardContent>
        <OffersList unitId={unitId || ''} />
        <div className="flex justify-end pt-2">
          <OfferAddSheet />
        </div>
      </InfoCardContent>
    </InfoCard>
  );
};
