import {
  Breadcrumb,
  Button,
  Sheet,
  FocusSheet,
  Spinner,
  toast,
  useMultiQueryState,
  useQueryState,
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
import { IconLock, IconLockOpen } from '@tabler/icons-react';

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
      <FocusSheet.View className="sm:w-full sm:max-w-7xl">
        {unitId && <UnitDetailSheetContent />}
      </FocusSheet.View>
    </FocusSheet>
  );
};

export const UnitDetailSheetContent = () => {
  const [unitId] = useQueryState<string>('unitId');

  const { unit, loading } = useUnit(unitId);
  const [toggleLock, { loading: toggling }] = useMutation(
    BLOCK_TOGGLE_UNIT_LOCK,
  );

  if (loading) {
    return <Spinner containerClassName="h-full" />;
  }

  const zoneFloor = unit?.zoningData?.floor;
  const isLocked = !!unit?.locked;

  const handleToggleLock = () => {
    if (!unit?._id) return;
    toggleLock({
      variables: { id: unit._id, locked: !isLocked },
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
    <>
      <FocusSheet.Header title={''}>
        <div className="flex items-center justify-between w-full">
          <Breadcrumb>
            <Breadcrumb.List>
              {unit?.projectData && (
                <>
                  <Button variant="ghost" asChild>
                    <Breadcrumb.Item>{unit?.projectData?.name}</Breadcrumb.Item>
                  </Button>
                  <Breadcrumb.Separator />
                </>
              )}
              {unit?.buildingData && (
                <>
                  <Button variant="ghost" asChild>
                    <Breadcrumb.Item>{unit?.buildingData?.name}</Breadcrumb.Item>
                  </Button>
                  <Breadcrumb.Separator />
                </>
              )}

              {unit?.zoningData?.floor && (
                <>
                  <Button variant="ghost" asChild>
                    <Breadcrumb.Item>
                      {zoneFloor !== undefined
                        ? `Floor ${zoneFloor < 0 ? `B${-zoneFloor}` : zoneFloor}`
                        : 'Floor N/A'}
                    </Breadcrumb.Item>
                  </Button>
                  <Breadcrumb.Separator />
                </>
              )}

              <Button variant="ghost" asChild>
                <Breadcrumb.Page>{unit?.number}</Breadcrumb.Page>
              </Button>
            </Breadcrumb.List>
          </Breadcrumb>
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
      </FocusSheet.Header>

      <FocusSheet.Content className="flex flex-auto overflow-hidden">
        <FocusSheet.SideBar>
          <UnitSidebar />
        </FocusSheet.SideBar>

        <UnitContext.Provider value={{ unit }}>
          <div className='flex-1'>
            {!!unitId && <UnitTabs />}
          </div>
        </UnitContext.Provider>
      </FocusSheet.Content>

      <ContractDetailSheetMount />
      <OpptyDetailSheetMount />
    </>
  );
};
