import { useAtom, useAtomValue } from 'jotai';
import { adminAgencyViewModeAtom } from '../states';
import { lazy, Suspense, useState } from 'react';
import { Button, Popover, PopoverScoped, ToggleGroup } from 'erxes-ui';
import {
  IconAdjustmentsHorizontal,
  IconLayoutGrid,
  IconTable,
} from '@tabler/icons-react';

const AgenciesBoard = lazy(() =>
  import('@/agencies/components/Agencies').then((mod) => ({
    default: mod.Agencies,
  })),
);

const AgenciesList = lazy(() =>
  import('@/agencies/components/AgenciesListView').then((mod) => ({
    default: mod.AgenciesListView,
  })),
);

export const AgencyViewControl = () => {
  const [view, setView] = useAtom(adminAgencyViewModeAtom);
  const [open, setOpen] = useState<boolean>(false);

  return (
    <PopoverScoped open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button variant={'ghost'}>
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
            setOpen(false);
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
              <IconLayoutGrid className="size-5!" />
              <span className="text-xs font-normal">Grid</span>
            </Button>
          </ToggleGroup.Item>
        </ToggleGroup>
      </Popover.Content>
    </PopoverScoped>
  );
};

export const AgencyView = () => {
  const view = useAtomValue(adminAgencyViewModeAtom);

  return (
    <Suspense>
      {view === 'grid' ? <AgenciesBoard /> : <AgenciesList />}
    </Suspense>
  );
};
