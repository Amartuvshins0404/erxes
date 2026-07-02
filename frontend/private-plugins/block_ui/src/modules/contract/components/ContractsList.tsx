import { useContracts } from '../hooks/useContracts';
import { IContract } from '../types/contractTypes';
import { InfoCard, InfoCardContent } from '@/block/components/card';
import { IconDots, IconPencil, IconPrinter } from '@tabler/icons-react';
import { format } from 'date-fns';
import {
  Badge,
  Button,
  CurrencyDisplay,
  DropdownMenu,
  Empty,
  Label,
  Sheet,
  Spinner,
  useQueryState,
} from 'erxes-ui';
import { CustomersInline, CompaniesInline } from 'ui-modules';
import { ContractAddSheet } from './ContractAdd';
import { ContractPrintPreview } from './ContractPrintPreview';
import { CONTRACT_STATUS_OPTIONS } from '../constants/contract';

interface ContractsListProps {
  unitId?: string;
  onSelectContract?: (contract: IContract) => void;
}

export function ContractsList({
  unitId,
  onSelectContract,
}: ContractsListProps) {
  const { contracts, loading, error } = useContracts(unitId);

  if (loading) {
    return <Spinner containerClassName="blk:py-32" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-red-500">Error loading contracts</div>
      </div>
    );
  }

  if (!contracts || contracts.length === 0) {
    return (
      <Empty>
        <Empty.Header>
          <Empty.Title>No contracts found</Empty.Title>
          <Empty.Description>There seems to be no contracts.</Empty.Description>
        </Empty.Header>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      {contracts.map((contract) => (
        <ContractItem
          key={contract._id}
          {...contract}
          onSelect={onSelectContract}
        />
      ))}
    </div>
  );
}

export const ContractItem = ({
  _id,
  number,
  party,
  amount,
  currency,
  status,
  date,
  onSelect,
}: IContract & { onSelect?: (contract: IContract) => void }) => {
  return (
    <div className="flex gap-2">
      <div className="grid grid-cols-5 gap-2 items-center flex-auto">
        <Badge
          variant="secondary"
          className="ml-2 cursor-pointer truncate font-medium"
          onClick={() => onSelect?.({ _id, number, party, amount, currency, status, date } as IContract)}
        >
          #{number || _id}
        </Badge>
        <div className="truncate">
          <DisplayParty party={party} />
        </div>
        <div className="flex items-center truncate">
          {currency && amount && (
            <>
              <CurrencyDisplay variant="icon" code={currency} />
              {amount.toLocaleString()}
            </>
          )}
        </div>

        <div className="truncate">
          {status && <Badge variant="secondary">{status}</Badge>}
        </div>
        <div className="truncate">
          {date && format(Number(date), 'MMM dd, yyyy')}
        </div>
      </div>
      <div className="w-10 text-right">
        <ContractPrintPreview>
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <Button variant="secondary" size="icon">
                <IconDots />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content className="blk:min-w-36" align="end">
              <DropdownMenu.Item
                onClick={() => onSelect?.({ _id } as IContract)}
              >
                <IconPencil className="size-4" />
                <span>Edit</span>
              </DropdownMenu.Item>
              <Sheet.Trigger asChild>
                <DropdownMenu.Item>
                  <IconPrinter className="size-4" />
                  <span>Print</span>
                </DropdownMenu.Item>
              </Sheet.Trigger>
              <DropdownMenu.Separator />
              <DropdownMenu.Label>Contract status</DropdownMenu.Label>
              <DropdownMenu.RadioGroup>
                {CONTRACT_STATUS_OPTIONS.map((status) => (
                  <DropdownMenu.RadioItem
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </DropdownMenu.RadioItem>
                ))}
              </DropdownMenu.RadioGroup>
            </DropdownMenu.Content>
          </DropdownMenu>
        </ContractPrintPreview>
      </div>
    </div>
  );
};

export const DisplayParty = ({ party }: { party: IContract['party'] }) => {
  if (!party) return null;
  if (party.type === 'customer') {
    return (
      <CustomersInline.Provider customerIds={[party.id]}>
        <span className="inline-flex items-center gap-2 overflow-hidden">
          <CustomersInline.Avatar />
          <CustomersInline.Title />
        </span>
      </CustomersInline.Provider>
    );
  }
  return (
    <CompaniesInline.Provider companyIds={[party.id]}>
      <span className="inline-flex items-center gap-2 overflow-hidden">
        <CompaniesInline.Avatar />
        <CompaniesInline.Title />
      </span>
    </CompaniesInline.Provider>
  );
};

export const ContractsListCard = () => {
  const [unitId] = useQueryState<string>('unitId');
  return (
    <InfoCard title="Contracts">
      <InfoCardContent>
        <div className="flex gap-2 blk:pr-9">
          <div className="grid grid-cols-5 gap-2 flex-auto">
            <Label asChild>
              <span>Number</span>
            </Label>
            <Label asChild>
              <span>Party</span>
            </Label>
            <Label asChild>
              <span>Amount</span>
            </Label>
            <Label asChild>
              <span>Status</span>
            </Label>
            <Label asChild>
              <span>Date</span>
            </Label>
          </div>
        </div>
        <ContractsList unitId={unitId || ''} />
        <ContractAddSheet />
      </InfoCardContent>
    </InfoCard>
  );
};
