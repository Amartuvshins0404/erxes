import {
  Breadcrumb,
  Button,
  Sheet,
  FocusSheet,
  Spinner,
  toast,
  useMultiQueryState,
  useQueryState,
  useFocusSheet,
} from 'erxes-ui';
import { UnitSidebar } from '@/unit/components/UnitSidebar';
import { UnitTabs } from '@/unit/components/UnitTabs';
import { useUnit } from '@/unit/hooks/useUnit';
import { UnitContext } from '@/unit/context/unitContext';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { contractDetailSheetState } from '@/contract/states/contractDetailSheetState';
import { useMutation } from '@apollo/client';
import { BLOCK_TOGGLE_UNIT_LOCK } from '@/unit/graphql/unitMutations';
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLock,
  IconLockOpen,
} from '@tabler/icons-react';

const ContractDetailSheet = lazy(() =>
  import('@/contract/components/ContractDetailSheet').then((m) => ({
    default: m.ContractDetailSheet,
  })),
);

const OpptyDetailSheet = lazy(() =>
  import('@/oppty/components/OpptyDetailSheet').then((m) => ({
    default: m.OpptyDetailSheet,
  })),
);

const ContractDetailSheetMount = () => {
  const activeContractId = useAtomValue(contractDetailSheetState);
  const [hasOpened, setHasOpened] = useState(false);
  useEffect(() => {
    if (activeContractId) setHasOpened(true);
  }, [activeContractId]);
  if (!hasOpened) return null;
  return (
    <Suspense fallback={null}>
      <ContractDetailSheet />
    </Suspense>
  );
};

const OpptyDetailSheetMount = () => {
  const [activeOpptyId] = useQueryState<string>('activeOpptyId');
  const [hasOpened, setHasOpened] = useState(false);
  useEffect(() => {
    if (activeOpptyId) setHasOpened(true);
  }, [activeOpptyId]);
  if (!hasOpened) return null;
  return (
    <Suspense fallback={null}>
      <OpptyDetailSheet />
    </Suspense>
  );
};

export const UnitDetailSheet = () => {
  const [{ unitId }, setQueries] = useMultiQueryState<{
    unitId: string;
    activeUnitTab: string;
  }>(['unitId', 'activeUnitTab']);

  return (
    <FocusSheet
      open={!!unitId}
      onOpenChange={() => setQueries({ unitId: null, activeUnitTab: null })}
    >
      <FocusSheet.View>
        {unitId && <UnitDetailSheetContent />}
      </FocusSheet.View>
    </FocusSheet>
  );
};

const UnitDetailHeader = () => {
  const [unitId] = useQueryState<string>('unitId');
  const { unit, loading } = useUnit(unitId);
  const { isSidebarOpen, setIsSidebarOpen } = useFocusSheet();
  const [toggleLock, { loading: toggling }] = useMutation(BLOCK_TOGGLE_UNIT_LOCK);

  const isLocked = !!unit?.locked;

  const handleToggleLock = () => {
    if (!unit?._id) return;
    toggleLock({
      variables: { id: unit._id, locked: !isLocked },
      optimisticResponse: {
        blockToggleUnitLock: {
          __typename: 'BlockUnit',
          _id: unit._id,
          locked: !isLocked,
        },
      },
      refetchQueries: ['BlockGetUnit', 'BlockGetUnits'],
      onCompleted: () => {
        toast({
          title: isLocked ? 'Unit unlocked' : 'Unit locked',
          variant: 'success',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Sheet.Header className="gap-2 flex-row items-center space-y-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? (
          <IconLayoutSidebarLeftCollapse />
        ) : (
          <IconLayoutSidebarLeftExpand />
        )}
      </Button>

      <div className="flex flex-col flex-1 min-w-0">
        <Sheet.Title>
          {loading ? (
            <Spinner />
          ) : (
            <Breadcrumb>
              <Breadcrumb.List className="gap-1 flex-nowrap">
                {unit?.projectData && (
                  <>
                    <Breadcrumb.Item className="text-muted-foreground text-sm font-normal">
                      {unit.projectData.name}
                    </Breadcrumb.Item>
                    <Breadcrumb.Separator />
                  </>
                )}
                {unit?.buildingData && (
                  <>
                    <Breadcrumb.Item className="text-muted-foreground text-sm font-normal">
                      {unit.buildingData.name}
                    </Breadcrumb.Item>
                    <Breadcrumb.Separator />
                  </>
                )}
                {unit?.zoningData?.floor !== undefined && (
                  <>
                    <Breadcrumb.Item className="text-muted-foreground text-sm font-normal">
                      {unit.zoningData.floor < 0
                        ? `B${-unit.zoningData.floor}`
                        : `Floor ${unit.zoningData.floor}`}
                    </Breadcrumb.Item>
                    <Breadcrumb.Separator />
                  </>
                )}
                <Breadcrumb.Page className="text-base font-semibold">
                  {unit?.number}
                </Breadcrumb.Page>
              </Breadcrumb.List>
            </Breadcrumb>
          )}
        </Sheet.Title>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant={isLocked ? 'default' : 'secondary'}
          size="sm"
          onClick={handleToggleLock}
          disabled={toggling}
        >
          {isLocked ? <IconLock /> : <IconLockOpen />}
          {isLocked ? 'Unlock' : 'Lock'}
        </Button>
      </div>

      <Sheet.Close />
    </Sheet.Header>
  );
};

export const UnitDetailSheetContent = () => {
  const [unitId] = useQueryState<string>('unitId');
  const { unit, loading } = useUnit(unitId);

  return (
    <>
      <UnitDetailHeader />

      <FocusSheet.Content className="flex flex-auto overflow-hidden">
        <FocusSheet.SideBar>
          <UnitSidebar />
        </FocusSheet.SideBar>

        <UnitContext.Provider value={{ unit }}>
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-auto">
              {loading ? (
                <Spinner containerClassName="h-full" />
              ) : (
                !!unitId && <UnitTabs />
              )}
            </div>
          </div>
        </UnitContext.Provider>
      </FocusSheet.Content>

      <ContractDetailSheetMount />
      <OpptyDetailSheetMount />
    </>
  );
};
