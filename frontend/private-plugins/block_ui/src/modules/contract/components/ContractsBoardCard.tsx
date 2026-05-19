import { BoardCardProps, Separator, Badge, Skeleton, Button } from 'erxes-ui';
import { format } from 'date-fns';
import {
  IconCalendarEventFilled,
  IconHome,
  IconCreditCard,
} from '@tabler/icons-react';
import { useAtomValue, useSetAtom, atom } from 'jotai';
import {
  allContractsMapState,
  IContractWithDescription,
} from '../states/allContractsMapState';
import { contractDetailSheetState } from '../states/contractDetailSheetState';
import { MembersInline, useCustomerDetail } from 'ui-modules';
import { useUnit } from '@/unit/hooks/useUnit';
import { ContractPartyType } from '../types/contractTypes';

export const contractBoardItemAtom = atom(
  (get) => (id: string) => get(allContractsMapState)[id],
);

const parseDate = (value: any) => {
  if (!value) return null;
  const num = Number(value);
  const d = new Date(isNaN(num) ? value : num);
  return isNaN(d.getTime()) ? null : d;
};

export const ContractsBoardCard = ({ id }: BoardCardProps) => {
  const contract = useAtomValue(contractBoardItemAtom)(id);
  const setActiveContract = useSetAtom(contractDetailSheetState);

  const {
    description,
    number,
    _id,
    date,
    startDate,
    endDate,
    isLifeTime,
    amount,
    currency,
    unit,
    party,
    paymentPlan,
    user,
  } = contract || ({} as IContractWithDescription);

  const { unit: unitDoc } = useUnit(unit);

  const partyId = party?.id;
  const isCustomer = party?.type === ContractPartyType.CUSTOMER;
  const { customerDetail, loading: customerLoading } = useCustomerDetail(
    { variables: { _id: partyId }, skip: !partyId || !isCustomer },
    true,
  );

  const customerDisplayName = customerDetail
    ? [customerDetail.firstName, customerDetail.lastName]
        .filter(Boolean)
        .join(' ') ||
      customerDetail.primaryPhone ||
      customerDetail.primaryEmail ||
      'Unnamed'
    : isCustomer
    ? ''
    : party?.id || '';

  const formatAmount = (val?: number) => {
    if (!val) return null;
    return new Intl.NumberFormat('mn-MN', {
      style: 'currency',
      currency: currency || 'MNT',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const dateLabel = parseDate(date);
  const startLabel = parseDate(startDate);
  const endLabel = parseDate(endDate);

  const planTypeLabel = paymentPlan?.type
    ? String(paymentPlan.type).replace(/_/g, ' ').toLowerCase()
    : null;

  return (
    <div
      onClick={() => setActiveContract(id)}
      className="blk:w-76 overflow-hidden cursor-pointer"
    >
      <div className="h-9 flex items-center justify-between px-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground px-1 hover:bg-background"
        >
          <IconCalendarEventFilled />
          <span>
            {startLabel ? format(startLabel, 'MMM dd, yyyy') : '—'}
          </span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground px-1 hover:bg-background"
        >
          <IconCalendarEventFilled />
          <span>
            {isLifeTime
              ? 'Lifetime'
              : endLabel
              ? format(endLabel, 'MMM dd, yyyy')
              : '—'}
          </span>
        </Button>
      </div>
      <Separator />
      <div className="flex flex-col gap-1 p-3">
        {number && (
          <span className="text-accent-foreground text-xs uppercase">
            #{number}
          </span>
        )}
        <div className="flex flex-col gap-1">
          {customerLoading ? (
            <Skeleton className="h-4 w-28 rounded" />
          ) : (
            <h5 className="font-semibold truncate">
              {customerDisplayName || description || `Contract ${_id}`}
            </h5>
          )}
          {description && customerDisplayName && (
            <span className="text-xs text-muted-foreground truncate">
              {description}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mt-1">
          {unitDoc?.number && (
            <Badge variant="secondary">
              <IconHome className="size-3 mr-1" />
              Unit {unitDoc.number}
            </Badge>
          )}
          {planTypeLabel && (
            <Badge variant="secondary" className="capitalize">
              <IconCreditCard className="size-3 mr-1" />
              {planTypeLabel}
            </Badge>
          )}
          {amount ? <Badge>{formatAmount(amount)}</Badge> : null}
        </div>
      </div>
      <Separator />
      <div className="h-9 flex items-center justify-between px-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground px-1 hover:bg-background"
        >
          <IconCalendarEventFilled />
          Created on: {dateLabel && format(dateLabel, 'MMM dd, yyyy')}
        </Button>
        {user && (
          <MembersInline.Provider memberIds={[user]}>
            <MembersInline.Avatar />
          </MembersInline.Provider>
        )}
      </div>
    </div>
  );
};
