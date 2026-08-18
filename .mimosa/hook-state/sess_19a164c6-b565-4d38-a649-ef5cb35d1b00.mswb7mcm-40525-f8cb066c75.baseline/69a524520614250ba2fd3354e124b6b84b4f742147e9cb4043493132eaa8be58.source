import { InfoCard, InfoCardContent } from '@/block/components/card';
import { SelectBuilding } from '@/building/components/SelectBuilding';
import { useBuildingZonings } from '@/building/hooks/useBuildings';
import { IZoning } from '@/building/types/buildingTypes';
import { UnitsList } from '@/unit/components/UnitsList';
import { UnitsProvider, useUnitsContext } from '@/unit/context/unitsContext';
import { BLOCK_GET_UNITS } from '@/unit/graphql/unitQueries';
import { useUnitRemove } from '@/unit/hooks/useUnitRemove';
import { IconTrash } from '@tabler/icons-react';
import {
  Button,
  CommandBar,
  Separator,
  Spinner,
  useConfirm,
  useMultiQueryState,
  useToast,
} from 'erxes-ui';
import { useState } from 'react';

export const BuildingUnitsByZones = ({ projectId }: { projectId?: string }) => {
  const [queries, setQueries] = useMultiQueryState<{
    buildingId: string;
    unitId: string;
  }>(['buildingId', 'unitId']);
  const { buildingZonings, loading } = useBuildingZonings({
    buildingId: queries.buildingId ?? '',
    skip: !!queries.unitId,
  });

  if (loading) return <Spinner containerClassName="blk:py-32" />;

  return (
    <div className="p-8 flex flex-col gap-6 w-auto">
      <div className="flex gap-3 items-center justify-between">
        <SelectBuilding
          value={queries.buildingId ?? ''}
          onValueChange={(value) => setQueries({ buildingId: value })}
          projectId={projectId ?? ''}
        />
      </div>

      <UnitsProvider>
        {loading ? (
          <Spinner containerClassName="py-32" />
        ) : (
          buildingZonings?.map((zone) => (
            <BuildingZone key={zone._id} zone={zone} />
          ))
        )}
        <UnitsCommandBar />
      </UnitsProvider>
    </div>
  );
};

export const BuildingZone = ({ zone }: { zone: IZoning }) => {
  const [unitsCount, setUnitsCount] = useState(0);
  return (
    <InfoCard
      title={`${zone.floor < 0 ? `B${zone.floor * -1}` : zone.floor} Floor • ${
        unitsCount || 0
      } units ${
        zone.usageTypes?.length ? `• ${zone.usageTypes.join(', ')}` : ''
      } ${zone.tenureTypes?.length ? `• ${zone.tenureTypes.join(', ')}` : ''}`}
    >
      <InfoCardContent className='space-y-3'>
        <UnitsList zone={zone} setUnitsCount={setUnitsCount} />
      </InfoCardContent>
    </InfoCard>
  );
};

export const UnitsCommandBar = () => {
  const { selected, setSelected } = useUnitsContext();

  const { removeUnits } = useUnitRemove();
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const unitIds = Object.keys(selected).filter((id) => selected[id]);

  return (
    <CommandBar open={unitIds.length > 0}>
      <CommandBar.Bar>
        <CommandBar.Value>{unitIds.length} selected</CommandBar.Value>
        <Separator.Inline />
        <Button
          variant="secondary"
          className="text-destructive"
          onClick={() =>
            confirm({
              message: `Are you sure you want to remove ${unitIds.length} units`,
            }).then(() =>
              removeUnits({
                variables: { _ids: unitIds },
                refetchQueries: [BLOCK_GET_UNITS],
                onCompleted: () => {
                  toast({
                    title: 'Units removed successfully',
                    variant: 'success',
                  });

                  setSelected({});
                },
              }),
            )
          }
        >
          <IconTrash />
          Delete
        </Button>
      </CommandBar.Bar>
    </CommandBar>
  );
};
