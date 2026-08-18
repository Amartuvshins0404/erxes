import { Button, Popover, PopoverScoped, ToggleGroup } from 'erxes-ui';
import {
  IconAdjustmentsHorizontal,
  IconLayoutKanban,
  IconTable,
} from '@tabler/icons-react';
import { useAtom, useAtomValue } from 'jotai';
import { opptysViewAtom } from '@/oppty/states/opptysViewState';
import { lazy, Suspense, useState } from 'react';
import { OpptyDetailSheet } from '@/oppty/components/OpptyDetailSheet';
import { useParams } from 'react-router-dom';

const OpptysRecordTable = lazy(() =>
  import('@/oppty/components/OpptysRecordTable').then((mod) => ({
    default: mod.OpptysRecordTable,
  })),
);

const OpptysBoard = lazy(() =>
  import('@/oppty/components/OpttysBoard').then((mod) => ({
    default: mod.OpptysBoard,
  })),
);

export const OpptysViewControl = () => {
  const [view, setView] = useAtom(opptysViewAtom);
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

export const OpptysView = () => {
  const view = useAtomValue(opptysViewAtom);
  const { projectId } = useParams<{ projectId?: string }>();

  if (!projectId) return null;

  return (
    <Suspense>
      {view === 'list' ? (
        <OpptysRecordTable />
      ) : (
        <OpptysBoard projectId={projectId} />
      )}
      <OpptyDetailSheet />
    </Suspense>
  );
};
