import { BoardCardProps, Badge, Separator, formatAmount } from 'erxes-ui';
import { formatDateISOStringToRelativeDate } from 'erxes-ui/utils/localization/formatDateISOStringToRelativeDate';
import { useAtomValue, useSetAtom, atom } from 'jotai';
import { allContractsMapState } from '../states/allContractsMapState';
import { contractDetailSheetState } from '../states/contractDetailSheetState';
import { ContractPriority } from '../types/contractTypes';
import {
  SelectContractCategory,
  SelectContractPriorityRoot,
  SelectContractType,
} from './SelectContractType';
import { useState } from 'react';
import { CONTRACT_PRIORITIES_OPTIONS } from '../constants/priorityLabels';

export const contractBoardItemAtom = atom(
  (get) => (id: string) => get(allContractsMapState)[id],
);

const formatMarketAmount = (amount: number) => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}m`;
  }
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const getPriorityVariant = (priority?: ContractPriority) => {
  switch (priority) {
    case ContractPriority.LOW:
    case ContractPriority.MEDIUM:
      return 'warning';
    case ContractPriority.HIGH:
      return 'destructive';
    case ContractPriority.VIP:
      return 'success';
    default:
      return 'secondary';
  }
};

const getPriorityLabel = (priority?: ContractPriority) => {
  switch (priority) {
    case ContractPriority.LOW:
      return 'Low';
    case ContractPriority.MEDIUM:
      return 'Medium';
    case ContractPriority.HIGH:
      return 'High';
    case ContractPriority.VIP:
      return 'VIP';
    default:
      return '';
  }
};

export const ContractsBoardCard = ({ id, column }: BoardCardProps) => {
  const contract = useAtomValue(contractBoardItemAtom)(id);
  const setActiveContract = useSetAtom(contractDetailSheetState);
  const [priorityValue, setPriorityValue] = useState<number>(
    Math.floor(Math.random() * CONTRACT_PRIORITIES_OPTIONS.length),
  );

  const {
    number,
    _id,
    priority,
    customerName,
    customerId,
    reinsurance,
    main,
    category,
    insuranceType,
    amount,
    placingBroker,
    producingBroker,
    createdAt,
    updatedAt,
    inceptionDate,
    expiryDate,
    markets,
  } = contract || {};

  const isPendingMarkets = column === 'pending_markets';
  const contractId = number ? `#${number}` : `#${_id}`;

  const priorities = priority
    ? Array.isArray(priority)
      ? priority
      : [priority]
    : [];
  const filledPercentage =
    markets && amount
      ? (
          (markets.reduce((sum, m) => sum + m.amount, 0) / amount) *
          100
        ).toFixed(2)
      : '0';

  return (
    <div onClick={() => setActiveContract(contract)} className="bt:w-76">
      <div className="flex items-center justify-between h-9 px-3">
        <div className="text-sm font-semibold">{contractId}</div>
      </div>
      <Separator />
      <div className="p-3 flex flex-col gap-2">
        {/* <div className="flex gap-1 flex-wrap">
          {priorities.map((p) => (
            <Badge
              key={p}
              variant={getPriorityVariant(p) as any}
              className="text-xs"
            >
              {getPriorityLabel(p)}
            </Badge>
          ))}
        </div> */}
        {customerName && customerId && (
          <div className="font-semibold">
            {customerName} - {customerId}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <SelectContractPriorityRoot
            value={priorityValue}
            onValueChange={(value) => setPriorityValue(value)}
            variant="card"
          />
          <SelectContractType />
          <SelectContractCategory />
        </div>
        {amount && (
          <div className="text-sm font-semibold">
            Total amount: {formatAmount(amount)}₮
          </div>
        )}
      </div>
      {/* {isPendingMarkets && (inceptionDate || expiryDate) && (
        <div className="px-3 py-2 border-b flex gap-2 text-xs text-muted-foreground">
          <div className="flex-1">
            <div className="font-medium mb-1">inception date</div>
            <div className="h-6 border rounded px-2 flex items-center">
              {inceptionDate
                ? new Date(inceptionDate).toLocaleDateString()
                : ''}
            </div>
          </div>
          <div className="flex-1">
            <div className="font-medium mb-1">expiry date</div>
            <div className="h-6 border rounded px-2 flex items-center">
              {expiryDate ? new Date(expiryDate).toLocaleDateString() : ''}
            </div>
          </div>
        </div>
      )} */}

      <Separator />
      {(placingBroker || producingBroker) && (
        <div className="flex flex-col gap-1 text-sm p-3">
          {placingBroker && (
            <div>
              <span className="mr-1">•</span>
              Placing broker: {placingBroker}
            </div>
          )}
          {producingBroker && (
            <div>
              <span className="mr-1">•</span>
              Producing broker: {producingBroker}
            </div>
          )}
        </div>
      )}
      <Separator />
      {(updatedAt || createdAt) && (
        <div className="flex flex-col gap-1 text-xs text-muted-foreground p-3">
          {updatedAt && (
            <div>
              Updated at: {formatDateISOStringToRelativeDate(updatedAt)}
            </div>
          )}
          {createdAt && (
            <div>
              Created at: {formatDateISOStringToRelativeDate(createdAt)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

{
  /* <div className="p-3 flex flex-col gap-3"> */
}
{
  /* <div className="flex flex-col gap-2">
          <div className="h-8 border rounded px-2 flex items-center text-sm text-muted-foreground">
            {isPendingMarkets ? main || '' : reinsurance || ''}
          </div>
          <div className="h-8 border rounded px-2 flex items-center text-sm text-muted-foreground">
            {category || ''}
          </div>
          <div className="h-8 border rounded px-2 flex items-center text-sm text-muted-foreground">
            {insuranceType || ''}
          </div>
        </div> */
}

{
  /* {isPendingMarkets && markets && markets.length > 0 && (
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total markets:</span>
              <span className="font-medium">{markets.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Filled percentage:</span>
              <span className="font-medium">{filledPercentage}%</span>
            </div>
            {markets.map((market, idx) => (
              <div key={idx} className="text-sm">
                {market.name}: {formatMarketAmount(market.amount)}{' '}
                {market.percentage}%
              </div>
            ))}
          </div>
        )}
      </div> */
}
