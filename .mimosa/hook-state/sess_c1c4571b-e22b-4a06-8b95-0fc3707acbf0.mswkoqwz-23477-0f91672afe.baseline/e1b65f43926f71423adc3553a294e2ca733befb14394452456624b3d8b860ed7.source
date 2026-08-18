import {
  Breadcrumb,
  Button,
  Sheet,
  Spinner,
  useMultiQueryState,
  useQueryState,
} from 'erxes-ui';
import { UnitSidebar } from '@/unit/components/UnitSidebar';
import { UnitTabs } from '@/unit/components/UnitTabs';
import { UnitContext } from '@/unit/context/unitContext';
import { useUnit } from '@/unit/hooks/useUnit';

export const UnitDetailSheet = () => {
  const [{ unitId }, setQueries] = useMultiQueryState<{
    unitId: string;
    activeUnitTab: string;
  }>(['unitId', 'activeUnitTab']);

  return (
    <Sheet
      open={!!unitId}
      onOpenChange={() => setQueries({ unitId: null, activeUnitTab: null })}
    >
      <Sheet.View className="sm:max-w-screen-lg md:w-[calc(100vw-theme(spacing.4))]">
        {unitId && <UnitDetailSheetContent />}
      </Sheet.View>
    </Sheet>
  );
};

export const UnitDetailSheetContent = () => {
  const [unitId] = useQueryState<string>('unitId');

  const { unit, loading } = useUnit(unitId);

  if (loading) {
    return <Spinner containerClassName="h-full" />;
  }

  const zoneFloor = unit?.zoning?.floor;

  return (
    <>
      <Sheet.Header>
        <Breadcrumb>
          <Breadcrumb.List>
            {unit?.project && (
              <>
                <Button variant="ghost" asChild>
                  <Breadcrumb.Item>{unit?.project?.name}</Breadcrumb.Item>
                </Button>
                <Breadcrumb.Separator />
              </>
            )}
            {unit?.building && (
              <>
                <Button variant="ghost" asChild>
                  <Breadcrumb.Item>{unit?.building?.name}</Breadcrumb.Item>
                </Button>
                <Breadcrumb.Separator />
              </>
            )}

            {unit?.zoning?.floor && (
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

        <Sheet.Close tabIndex={-1} />
      </Sheet.Header>
      <div className="flex-auto flex">
        <UnitSidebar />
        <Sheet.Content className="p-0 rounded-b-none border-b-0">
          <UnitContext.Provider value={{ unit }}>
            {!!unitId && <UnitTabs />}
          </UnitContext.Provider>
        </Sheet.Content>
      </div>
    </>
  );
};
