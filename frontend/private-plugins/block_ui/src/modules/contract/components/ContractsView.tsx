import { Button, Popover, PopoverScoped, ToggleGroup } from 'erxes-ui';
import {
  IconAdjustmentsHorizontal,
  IconLayoutKanban,
  IconTable,
} from '@tabler/icons-react';
import { useAtom, useAtomValue } from 'jotai';
import { contractsViewAtom } from '@/contract/states/contractsViewState';
import { lazy, Suspense, useState } from 'react';
import { ContractDetailSheet } from '@/contract/components/ContractDetailSheet';

const ContractsRecordTable = lazy(() =>
  import('@/contract/components/ContractsRecordTable').then((mod) => ({
    default: mod.ContractsRecordTable,
  })),
);

const ContractsBoard = lazy(() =>
  import('@/contract/components/ContractsBoard').then((mod) => ({
    default: mod.ContractsBoard,
  })),
);

export const ContractsViewControl = () => {
  const [view, setView] = useAtom(contractsViewAtom);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <PopoverScoped open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <Button variant="ghost">
          <IconAdjustmentsHorizontal />
          View
        </Button>
      </Popover.Trigger>
      <Popover.Content>
        <ToggleGroup
          type="single"
          defaultValue="list"
          className="grid grid-cols-2 gap-2"
          value={view}
          onValueChange={(value) => {
            setView(value as 'list' | 'grid');
            setIsOpen(false);
          }}
        >
          <ToggleGroup.Item value="list" asChild>
            <Button
              variant="secondary"
              size="lg"
              className="h-11 flex-col gap-0"
            >
              <IconTable className="size-5!" />
              <span className="text-xs font-normal">List</span>
            </Button>
          </ToggleGroup.Item>
          <ToggleGroup.Item value="grid" asChild>
            <Button
              variant="secondary"
              size="lg"
              className="h-11 flex-col gap-0"
            >
              <IconLayoutKanban className="size-5!" />
              <span className="text-xs font-normal">Board</span>
            </Button>
          </ToggleGroup.Item>
        </ToggleGroup>
      </Popover.Content>
    </PopoverScoped>
  );
};

export const ContractsView = () => {
  const view = useAtomValue(contractsViewAtom);

  return (
    <Suspense>
      {view === 'list' ? <ContractsRecordTable /> : <ContractsBoard />}
      <ContractDetailSheet />
    </Suspense>
  );
};
