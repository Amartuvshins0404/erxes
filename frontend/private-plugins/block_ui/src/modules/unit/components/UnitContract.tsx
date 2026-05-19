import { InfoCard, InfoCardContent } from '@/block/components/card';
import { useContracts } from '@/contract/hooks/useContracts';
import { ContractAddSheet } from '@/contract/components/ContractAdd';
import { contractDetailSheetState } from '@/contract/states/contractDetailSheetState';
import {
  ContractPartyType,
  IContract,
} from '@/contract/types/contractTypes';
import { useUnitContext } from '@/unit/context/unitContext';
import {
  IconCalendar,
  IconCreditCard,
  IconUser,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { Badge, Empty, Skeleton, Spinner } from 'erxes-ui';
import { useSetAtom } from 'jotai';
import {
  CompaniesInline,
  MembersInline,
  useCustomerDetail,
} from 'ui-modules';

const parseDate = (value: unknown) => {
  if (!value) return null;
  const num = Number(value);
  const d = new Date(isNaN(num) ? (value as string) : num);
  return isNaN(d.getTime()) ? null : d;
};

const formatAmount = (val?: number, currency = 'MNT') => {
  if (!val) return null;
  return new Intl.NumberFormat('mn-MN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(val);
};

const ContractGridCard = ({ contract }: { contract: IContract }) => {
  const setActiveContract = useSetAtom(contractDetailSheetState);
  const isCustomer = contract.party?.type === ContractPartyType.CUSTOMER;
  const { customerDetail, loading: customerLoading } = useCustomerDetail(
    {
      variables: { _id: contract.party?.id },
      skip: !contract.party?.id || !isCustomer,
    },
    true,
  );

  const partyName = isCustomer
    ? customerDetail
      ? [customerDetail.firstName, customerDetail.lastName]
          .filter(Boolean)
          .join(' ') ||
        customerDetail.primaryPhone ||
        customerDetail.primaryEmail ||
        'Unnamed'
      : ''
    : '';

  const startLabel = parseDate(contract.startDate);
  const endLabel = parseDate(contract.endDate);
  const dateLabel = parseDate(contract.date);
  const planTypeLabel = contract.paymentPlan?.type
    ? String(contract.paymentPlan.type).replace(/_/g, ' ').toLowerCase()
    : null;

  return (
    <div
      onClick={() => setActiveContract(contract._id)}
      className="border rounded-lg bg-background hover:border-primary/40 transition cursor-pointer flex flex-col"
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="text-xs font-mono uppercase text-muted-foreground">
          #{contract.number || contract._id.slice(-6)}
        </span>
        {contract.amount ? (
          <Badge>{formatAmount(contract.amount, contract.currency)}</Badge>
        ) : null}
      </div>
      <div className="px-4 pt-2 pb-3 flex-1">
        {customerLoading ? (
          <Skeleton className="h-5 w-32 rounded" />
        ) : (
          <h5 className="font-semibold truncate text-base">
            {isCustomer
              ? partyName
              : contract.party?.id
              ? null
              : 'No party'}
            {!isCustomer && contract.party?.id && (
              <CompaniesInline companyIds={[contract.party.id]} />
            )}
          </h5>
        )}
      </div>
      <div className="px-4 pb-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
        {(startLabel || endLabel) && (
          <div className="flex items-center gap-1.5">
            <IconCalendar className="size-3.5 flex-none" />
            <span className="truncate">
              {startLabel ? format(startLabel, 'MMM dd, yyyy') : '—'}
              {' – '}
              {contract.isLifeTime
                ? 'Lifetime'
                : endLabel
                ? format(endLabel, 'MMM dd, yyyy')
                : '—'}
            </span>
          </div>
        )}
        {planTypeLabel && (
          <div className="flex items-center gap-1.5">
            <IconCreditCard className="size-3.5 flex-none" />
            <span className="truncate capitalize">{planTypeLabel}</span>
          </div>
        )}
        {dateLabel && (
          <div className="flex items-center gap-1.5">
            <IconCalendar className="size-3.5 flex-none" />
            <span className="truncate">
              Created {format(dateLabel, 'MMM dd, yyyy')}
            </span>
          </div>
        )}
      </div>
      {contract.user && (
        <div className="px-4 pb-3 flex items-center gap-1.5 text-xs text-muted-foreground border-t pt-3">
          <IconUser className="size-3.5 flex-none" />
          <MembersInline.Provider memberIds={[contract.user]}>
            <MembersInline.Avatar />
            <MembersInline.Title />
          </MembersInline.Provider>
        </div>
      )}
    </div>
  );
};

export const UnitContract = () => {
  const { unit } = useUnitContext();
  const unitId = unit?._id;
  const { contracts, loading } = useContracts(unitId);

  const hasSignedContract = unit?.activeContract?.statusType === 'signed';
  const canAdd = !hasSignedContract && !unit?.locked;

  return (
    <div className="p-8 flex flex-col gap-3">
      {canAdd && (
        <div className="flex justify-end">
          <ContractAddSheet />
        </div>
      )}
      <InfoCard title="Contracts">
        <InfoCardContent>
          {loading ? (
            <Spinner containerClassName="blk:py-16" />
          ) : !contracts || contracts.length === 0 ? (
            <Empty>
              <Empty.Header>
                <Empty.Title>No contracts</Empty.Title>
                <Empty.Description>
                  There are no contracts for this unit yet.
                </Empty.Description>
              </Empty.Header>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contracts.map((contract) => (
                <ContractGridCard key={contract._id} contract={contract} />
              ))}
            </div>
          )}
        </InfoCardContent>
      </InfoCard>
    </div>
  );
};
