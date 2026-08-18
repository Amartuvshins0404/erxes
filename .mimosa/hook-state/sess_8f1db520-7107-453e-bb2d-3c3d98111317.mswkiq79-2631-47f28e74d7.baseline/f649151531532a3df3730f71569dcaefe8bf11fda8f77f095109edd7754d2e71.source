import {
  Board,
  BoardColumnProps,
  BoardItemProps,
  CurrencyCode,
} from 'erxes-ui';
import {
  ContractStatus,
  ContractPartyType,
  ContractPriority,
} from '../types/contractTypes';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  allContractsMapState,
  IContractWithDescription,
} from '../states/allContractsMapState';
import { fetchedContractsState } from '../states/fetchedContractsState';
import { contractCountByBoardAtom } from '../states/contractCountByBoardAtom';
// import { useUpdateContract } from '../hooks/useManageContract'; // TODO: Enable when backend is ready
import { useEffect } from 'react';
import { ContractsBoardCard } from './ContractsBoardCard';

const columns = [
  {
    id: 'draft',
    name: 'Draft',
    type: 'new',
    color: 'blue',
  },
  {
    id: 'pending_customer',
    name: 'Pending Customer',
    type: 'in-progress',
    color: 'green',
  },
  {
    id: 'pending_markets',
    name: 'Pending Markets',
    type: 'in-progress',
    color: 'yellow',
  },
  {
    id: 'done',
    name: 'Done',
    type: 'done',
    color: 'yellow',
  },
  {
    id: 'cancelled',
    name: 'Cancelled',
    type: 'cancelled',
    color: 'yellow',
  },
  {
    id: 'lost',
    name: 'Алдагдсан',
    type: 'cancelled',
    color: 'red',
  },
];

const getDateDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const getDateMonthsAgo = (months: number) => {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString();
};

const mockContractsDraft: IContractWithDescription[] = [
  {
    _id: 'contract-001',
    unit: '',
    number: '2025112301',
    currency: CurrencyCode.MNT,
    date: undefined,
    amount: 15000000,
    amountType: undefined,
    status: ContractStatus.DRAFT,
    startDate: undefined,
    endDate: undefined,
    isLifeTime: undefined,
    party: { type: ContractPartyType.CUSTOMER, id: '' },
    paymentPlan: undefined,
    user: undefined,
    priority: ContractPriority.LOW,
    customerName: 'Customer A',
    customerId: '77000077',
    reinsurance: '',
    category: '',
    insuranceType: '',
    placingBroker: 'Broker A',
    producingBroker: 'Broker B',
    createdAt: getDateMonthsAgo(1),
    updatedAt: getDateDaysAgo(2),
  },
  {
    _id: 'contract-002',
    unit: '',
    number: '2025112301',
    currency: CurrencyCode.MNT,
    date: undefined,
    amount: 15000000,
    amountType: undefined,
    status: ContractStatus.DRAFT,
    startDate: undefined,
    endDate: undefined,
    isLifeTime: undefined,
    party: { type: ContractPartyType.CUSTOMER, id: '' },
    paymentPlan: undefined,
    user: undefined,
    priority: ContractPriority.MEDIUM,
    customerName: 'Customer A',
    customerId: '77000077',
    reinsurance: '',
    category: '',
    insuranceType: '',
    placingBroker: 'Broker A',
    producingBroker: 'Broker B',
    createdAt: getDateMonthsAgo(1),
    updatedAt: getDateDaysAgo(2),
  },
];

const mockContractsSigned: IContractWithDescription[] = [
  {
    _id: 'contract-003',
    unit: '',
    number: '2025112301',
    currency: CurrencyCode.MNT,
    date: undefined,
    amount: 15000000,
    amountType: undefined,
    status: ContractStatus.SIGNED,
    startDate: undefined,
    endDate: undefined,
    isLifeTime: undefined,
    party: { type: ContractPartyType.CUSTOMER, id: '' },
    paymentPlan: undefined,
    user: undefined,
    priority: [ContractPriority.VIP, ContractPriority.HIGH],
    customerName: 'Customer A',
    customerId: '77000077',
    main: '',
    category: '',
    insuranceType: '',
    placingBroker: 'Broker A',
    producingBroker: 'Broker B',
    createdAt: getDateMonthsAgo(1),
    updatedAt: getDateDaysAgo(2),
  },
];

const mockContractsCompleted: IContractWithDescription[] = [
  {
    _id: 'contract-004',
    unit: '',
    number: '2025110301',
    currency: CurrencyCode.MNT,
    date: undefined,
    amount: 15000000,
    amountType: undefined,
    status: ContractStatus.COMPLETED,
    startDate: undefined,
    endDate: undefined,
    isLifeTime: undefined,
    party: { type: ContractPartyType.CUSTOMER, id: '' },
    paymentPlan: undefined,
    user: undefined,
    priority: [ContractPriority.VIP, ContractPriority.HIGH],
    customerName: 'Customer A',
    customerId: '77000077',
    main: '',
    category: '',
    insuranceType: '',
    placingBroker: 'Broker A',
    producingBroker: 'Broker B',
    createdAt: getDateMonthsAgo(1),
    updatedAt: getDateDaysAgo(2),
    inceptionDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    markets: [
      { name: 'Market A', amount: 5000000, percentage: 33.3 },
      { name: 'Market B', amount: 2000000, percentage: 13.3 },
      { name: 'Market C', amount: 3000000, percentage: 20 },
    ],
  },
];

const mockContractsCancelled: IContractWithDescription[] = [
  {
    _id: 'contract-005',
    unit: '',
    number: '2025101501',
    currency: CurrencyCode.MNT,
    date: undefined,
    amount: 12000000,
    amountType: undefined,
    status: ContractStatus.CANCELLED,
    startDate: undefined,
    endDate: undefined,
    isLifeTime: undefined,
    party: { type: ContractPartyType.CUSTOMER, id: '' },
    paymentPlan: undefined,
    user: undefined,
    priority: ContractPriority.MEDIUM,
    customerName: 'Customer C',
    customerId: '77000079',
    reinsurance: '',
    category: '',
    insuranceType: '',
    placingBroker: 'Broker C',
    producingBroker: 'Broker D',
    createdAt: getDateMonthsAgo(2),
    updatedAt: getDateDaysAgo(5),
  },
  {
    _id: 'contract-006',
    unit: '',
    number: '2025102001',
    currency: CurrencyCode.MNT,
    date: undefined,
    amount: 8500000,
    amountType: undefined,
    status: ContractStatus.CANCELLED,
    startDate: undefined,
    endDate: undefined,
    isLifeTime: undefined,
    party: { type: ContractPartyType.CUSTOMER, id: '' },
    paymentPlan: undefined,
    user: undefined,
    priority: ContractPriority.LOW,
    customerName: 'Customer D',
    customerId: '77000080',
    reinsurance: '',
    category: '',
    insuranceType: '',
    placingBroker: 'Broker E',
    producingBroker: 'Broker F',
    createdAt: getDateMonthsAgo(1),
    updatedAt: getDateDaysAgo(10),
  },
  {
    _id: 'contract-007',
    unit: '',
    number: '2025102501',
    currency: CurrencyCode.MNT,
    date: undefined,
    amount: 9500000,
    amountType: undefined,
    status: ContractStatus.CANCELLED,
    startDate: undefined,
    endDate: undefined,
    isLifeTime: undefined,
    party: { type: ContractPartyType.CUSTOMER, id: '' },
    paymentPlan: undefined,
    user: undefined,
    priority: ContractPriority.HIGH,
    customerName: 'Customer E',
    customerId: '77000081',
    reinsurance: '',
    category: '',
    insuranceType: '',
    placingBroker: 'Broker G',
    producingBroker: 'Broker H',
    createdAt: getDateMonthsAgo(3),
    updatedAt: getDateDaysAgo(7),
  },
];

const mockContractsLost: IContractWithDescription[] = [
  {
    _id: 'contract-008',
    unit: '',
    number: '2025091001',
    currency: CurrencyCode.MNT,
    date: undefined,
    amount: 11000000,
    amountType: undefined,
    status: ContractStatus.CANCELLED,
    startDate: undefined,
    endDate: undefined,
    isLifeTime: undefined,
    party: { type: ContractPartyType.CUSTOMER, id: '' },
    paymentPlan: undefined,
    user: undefined,
    priority: ContractPriority.MEDIUM,
    customerName: 'Customer F',
    customerId: '77000082',
    reinsurance: '',
    category: '',
    insuranceType: '',
    placingBroker: 'Broker I',
    producingBroker: 'Broker J',
    createdAt: getDateMonthsAgo(4),
    updatedAt: getDateDaysAgo(15),
  },
  {
    _id: 'contract-009',
    unit: '',
    number: '2025091501',
    currency: CurrencyCode.MNT,
    date: undefined,
    amount: 13000000,
    amountType: undefined,
    status: ContractStatus.CANCELLED,
    startDate: undefined,
    endDate: undefined,
    isLifeTime: undefined,
    party: { type: ContractPartyType.CUSTOMER, id: '' },
    paymentPlan: undefined,
    user: undefined,
    priority: ContractPriority.HIGH,
    customerName: 'Customer G',
    customerId: '77000083',
    reinsurance: '',
    category: '',
    insuranceType: '',
    placingBroker: 'Broker K',
    producingBroker: 'Broker L',
    createdAt: getDateMonthsAgo(5),
    updatedAt: getDateDaysAgo(20),
  },
  {
    _id: 'contract-010',
    unit: '',
    number: '2025092001',
    currency: CurrencyCode.MNT,
    date: undefined,
    amount: 14000000,
    amountType: undefined,
    status: ContractStatus.CANCELLED,
    startDate: undefined,
    endDate: undefined,
    isLifeTime: undefined,
    party: { type: ContractPartyType.CUSTOMER, id: '' },
    paymentPlan: undefined,
    user: undefined,
    priority: [ContractPriority.VIP, ContractPriority.HIGH],
    customerName: 'Customer H',
    customerId: '77000084',
    reinsurance: '',
    category: '',
    insuranceType: '',
    placingBroker: 'Broker M',
    producingBroker: 'Broker N',
    createdAt: getDateMonthsAgo(6),
    updatedAt: getDateDaysAgo(25),
  },
];

const mockContractsDone: IContractWithDescription[] = [
  {
    _id: 'contract-011',
    unit: '',
    number: '2025081001',
    currency: CurrencyCode.MNT,
    date: undefined,
    amount: 16000000,
    amountType: undefined,
    status: ContractStatus.COMPLETED,
    startDate: undefined,
    endDate: undefined,
    isLifeTime: undefined,
    party: { type: ContractPartyType.CUSTOMER, id: '' },
    paymentPlan: undefined,
    user: undefined,
    priority: [ContractPriority.VIP, ContractPriority.HIGH],
    customerName: 'Customer I',
    customerId: '77000085',
    main: '',
    category: '',
    insuranceType: '',
    placingBroker: 'Broker O',
    producingBroker: 'Broker P',
    createdAt: getDateMonthsAgo(3),
    updatedAt: getDateDaysAgo(1),
    inceptionDate: new Date(
      Date.now() - 60 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    expiryDate: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000).toISOString(),
    markets: [
      { name: 'Market D', amount: 6000000, percentage: 37.5 },
      { name: 'Market E', amount: 4000000, percentage: 25 },
      { name: 'Market F', amount: 6000000, percentage: 37.5 },
    ],
  },
  {
    _id: 'contract-012',
    unit: '',
    number: '2025081501',
    currency: CurrencyCode.MNT,
    date: undefined,
    amount: 18000000,
    amountType: undefined,
    status: ContractStatus.COMPLETED,
    startDate: undefined,
    endDate: undefined,
    isLifeTime: undefined,
    party: { type: ContractPartyType.CUSTOMER, id: '' },
    paymentPlan: undefined,
    user: undefined,
    priority: ContractPriority.HIGH,
    customerName: 'Customer J',
    customerId: '77000086',
    main: '',
    category: '',
    insuranceType: '',
    placingBroker: 'Broker Q',
    producingBroker: 'Broker R',
    createdAt: getDateMonthsAgo(4),
    updatedAt: getDateDaysAgo(3),
    inceptionDate: new Date(
      Date.now() - 90 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    expiryDate: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000).toISOString(),
    markets: [
      { name: 'Market G', amount: 7200000, percentage: 40 },
      { name: 'Market H', amount: 5400000, percentage: 30 },
      { name: 'Market I', amount: 5400000, percentage: 30 },
    ],
  },
  {
    _id: 'contract-013',
    unit: '',
    number: '2025082001',
    currency: CurrencyCode.MNT,
    date: undefined,
    amount: 20000000,
    amountType: undefined,
    status: ContractStatus.COMPLETED,
    startDate: undefined,
    endDate: undefined,
    isLifeTime: undefined,
    party: { type: ContractPartyType.CUSTOMER, id: '' },
    paymentPlan: undefined,
    user: undefined,
    priority: ContractPriority.MEDIUM,
    customerName: 'Customer K',
    customerId: '77000087',
    main: '',
    category: '',
    insuranceType: '',
    placingBroker: 'Broker S',
    producingBroker: 'Broker T',
    createdAt: getDateMonthsAgo(5),
    updatedAt: getDateDaysAgo(5),
    inceptionDate: new Date(
      Date.now() - 120 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    expiryDate: new Date(Date.now() + 245 * 24 * 60 * 60 * 1000).toISOString(),
    markets: [
      { name: 'Market J', amount: 8000000, percentage: 40 },
      { name: 'Market K', amount: 6000000, percentage: 30 },
      { name: 'Market L', amount: 4000000, percentage: 20 },
      { name: 'Market M', amount: 2000000, percentage: 10 },
    ],
  },
];

const mockContracts: IContractWithDescription[] = [
  ...mockContractsDraft,
  ...mockContractsSigned,
  ...mockContractsCompleted,
  ...mockContractsDone,
  ...mockContractsCancelled,
  ...mockContractsLost,
];

function mapContractStatusToColumn(
  status?: ContractStatus,
  contractId?: string,
): string {
  // Check if contract is in lost contracts array
  const isLost = mockContractsLost.some((c) => c._id === contractId);
  // Check if contract is in done contracts array
  const isDone = mockContractsDone.some((c) => c._id === contractId);

  switch (status) {
    case ContractStatus.DRAFT:
      return 'draft';
    case ContractStatus.SIGNED:
      return 'pending_customer';
    case ContractStatus.COMPLETED:
      return isDone ? 'done' : 'pending_markets';
    case ContractStatus.CANCELLED:
      return isLost ? 'lost' : 'cancelled';
    default:
      return 'draft';
  }
}

function mapColumnToContractStatus(columnId: string): ContractStatus {
  switch (columnId) {
    case 'draft':
      return ContractStatus.DRAFT;
    case 'pending_customer':
      return ContractStatus.SIGNED;
    case 'pending_markets':
    case 'done':
      return ContractStatus.COMPLETED;
    case 'cancelled':
    case 'lost':
      return ContractStatus.CANCELLED;
    default:
      return ContractStatus.DRAFT;
  }
}

function transformContractsToBoardItems(
  contracts: IContractWithDescription[],
): BoardItemProps[] {
  return contracts.map((contract) => ({
    id: contract._id,
    column: mapContractStatusToColumn(contract.status, contract._id),
    sort: contract.updatedAt || contract.createdAt || new Date().toISOString(),
  }));
}

export const ContractsBoard = () => {
  const allContractsMap = useAtomValue(allContractsMapState);
  const [contracts, setContracts] = useAtom(fetchedContractsState);
  const setContractCountByBoard = useSetAtom(contractCountByBoardAtom);
  const setAllContractsMap = useSetAtom(allContractsMapState);

  useEffect(() => {
    const boardItems = transformContractsToBoardItems(mockContracts);
    setContracts(boardItems);

    const contractsMap: Record<string, IContractWithDescription> = {};
    mockContracts.forEach((contract) => {
      contractsMap[contract._id] = contract;
    });
    setAllContractsMap(contractsMap);

    const countByBoard: Record<string, number> = {};
    boardItems.forEach((item) => {
      countByBoard[item.column] = (countByBoard[item.column] || 0) + 1;
    });
    setContractCountByBoard(countByBoard);
  }, [setContracts, setAllContractsMap, setContractCountByBoard]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }
    const activeItem = allContractsMap[active.id as string];
    const overItem = allContractsMap[over.id as string];
    const overColumn = overItem?.status
      ? mapContractStatusToColumn(overItem.status, overItem._id)
      : columns.find((col) => col.id === over.id)?.id || columns[0]?.id;

    if (
      !activeItem ||
      mapContractStatusToColumn(activeItem.status, activeItem._id) ===
        overColumn
    ) {
      return;
    }

    const newStatus = mapColumnToContractStatus(overColumn);

    // TODO: Connect to backend when ready
    // updateContract(activeItem._id, {
    //   unit: activeItem.unit,
    //   number: activeItem.number,
    //   currency: activeItem.currency,
    //   date: activeItem.date,
    //   amount: activeItem.amount,
    //   amountType: activeItem.amountType,
    //   status: newStatus,
    //   startDate: activeItem.startDate,
    //   endDate: activeItem.endDate,
    //   isLifeTime: activeItem.isLifeTime,
    //   party: activeItem.party,
    //   paymentPlan: activeItem.paymentPlan,
    //   user: activeItem.user,
    // });

    // Update contract in map with new status
    setAllContractsMap((prev) => ({
      ...prev,
      [activeItem._id]: {
        ...prev[activeItem._id],
        status: newStatus,
      },
    }));

    setContracts((prev) =>
      prev.map((contract) => {
        if (contract.id === activeItem._id) {
          return {
            ...contract,
            column: overColumn,
            sort: new Date().toISOString(),
          };
        }
        return contract;
      }),
    );

    const previousColumn = mapContractStatusToColumn(
      activeItem.status,
      activeItem._id,
    );
    setContractCountByBoard((prev) => ({
      ...prev,
      [previousColumn]: (prev[previousColumn] || 1) - 1,
      [overColumn]: (prev[overColumn] || 0) + 1,
    }));
  };

  return (
    <Board.Provider
      columns={columns}
      data={contracts}
      onDragEnd={handleDragEnd}
      boardId="contracts"
    >
      {(column) => (
        <Board id={column.id} key={column.id} sortBy="updated">
          <ContractsBoardCards column={column} />
        </Board>
      )}
    </Board.Provider>
  );
};

export const ContractsBoardCards = ({
  column,
}: {
  column: BoardColumnProps;
}) => {
  const [contractCards] = useAtom(fetchedContractsState);
  const [contractCountByBoard] = useAtom(contractCountByBoardAtom);

  const boardCards = contractCards
    .filter((contract) => contract.column === column.id)
    .sort((a, b) => {
      if (a.sort && b.sort) {
        return b.sort.toString().localeCompare(a.sort.toString());
      }
      return 0;
    });

  return (
    <>
      <Board.Header>
        <h4 className="capitalize flex items-center gap-1 pl-1">
          {column.name}{' '}
          <span className="text-accent-foreground font-medium pl-1 ml-auto">
            {contractCountByBoard[column.id] || 0}
          </span>
        </h4>
      </Board.Header>
      <Board.Cards
        id={column.id}
        items={boardCards.map((contract) => contract.id)}
      >
        {boardCards.map((contract) => (
          <Board.Card
            key={contract.id}
            id={contract.id}
            name={contract.name || `Contract ${contract.id}`}
            column={column.id}
          >
            <ContractsBoardCard id={contract.id} column={column.id} />
          </Board.Card>
        ))}
      </Board.Cards>
    </>
  );
};
