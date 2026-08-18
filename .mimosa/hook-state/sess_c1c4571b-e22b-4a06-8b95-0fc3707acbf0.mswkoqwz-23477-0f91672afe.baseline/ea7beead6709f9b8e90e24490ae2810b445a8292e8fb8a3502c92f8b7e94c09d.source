import { InfoCard, InfoCardContent } from '@/block/components/card';
import {
  AddBuildingZone,
  GenerateByFloorRange,
} from '@/building/components/AddBuildingZone';
import { BLOCK_GET_BUILDING_ZONINGS } from '@/building/graphql/buildingQueries';
import {
  useBuildings,
  useBuildingZonings,
} from '@/building/hooks/useBuildings';
import { useBuildingZoningUpdate } from '@/building/hooks/useBuildingUpdate';
import { useBuildingZoningRemove } from '@/building/hooks/useBuildingZoningRemove';
import { IBuilding, IZoning } from '@/building/types/buildingTypes';
import { IProject } from '@/project/types/projectTypes';
import { SelectTenureType } from '@/unit/components/SelectTenureType';
import { SelectUsageTypes } from '@/unit/components/SelectUsageType';
import { IconTrash } from '@tabler/icons-react';
import { Button, CurrencyField, Spinner, toast, useConfirm } from 'erxes-ui';
import { useEffect, useState } from 'react';

export const BuildingZoneList = ({ project }: { project: IProject }) => {
  const { buildings, loading } = useBuildings({ projectId: project._id });

  if (loading) {
    return <Spinner containerClassName="py-32" />;
  }

  return (
    <div className="flex flex-col gap-6">
      {buildings?.map((building) => (
        <BuildingZoneCard key={building._id} building={building} />
      ))}
    </div>
  );
};

export const BuildingZoneCard = ({ building }: { building: IBuilding }) => {
  const { buildingZonings, loading } = useBuildingZonings({
    buildingId: building._id,
  });
  return (
    <InfoCard
      title={`${building.name} • ${building.types?.join(' | ')} • ${
        buildingZonings?.length
      } floors`}
    >
      <InfoCardContent className='space-y-3'>
        {loading ? (
          <Spinner containerClassName="py-32" />
        ) : (
          <div className="gap-3 grid md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {buildingZonings?.map((zoning) => (
              <BuildingZone key={zoning._id} zoning={zoning} />
            ))}
          </div>
        )}
        <div className="gap-4 grid grid-cols-2">
          <AddBuildingZone building={building} />
          <GenerateByFloorRange building={building} />
        </div>
      </InfoCardContent>
    </InfoCard>
  );
};

export const BuildingZone = ({ zoning }: { zoning: IZoning }) => {
  const { updateBuildingZoning } = useBuildingZoningUpdate({ id: zoning._id });
  const [zoningSize, setZoningSize] = useState(zoning.size);
  const { deleteBuildingZoning } = useBuildingZoningRemove();
  const { confirm } = useConfirm();

  useEffect(() => {
    if (zoning.size !== zoningSize) {
      setZoningSize(zoning.size);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoning.size]);

  return (
    <div className="bg-primary/10 p-4 border border-primary/20 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="font-medium text-left">
          {zoning.floor < 0 ? `B${zoning.floor * -1}` : zoning.floor}
        </div>
        <Button
          variant="secondary"
          size="icon"
          className="bg-destructive/10 hover:bg-destructive/20 text-destructive"
          onClick={() =>
            confirm({
              message: `Are you sure you want to delete the zoning on floor '${zoning.floor}'?`,
            }).then(() =>
              deleteBuildingZoning({
                variables: { id: zoning._id },
                onCompleted: () => {
                  toast({
                    title: 'Success',
                    description: `Zoning on floor '${
                      zoning.floor < 0 ? `B${zoning.floor * -1}` : zoning.floor
                    }' deleted successfully`,
                  });
                },
                onError: (e) => {
                  toast({
                    title: 'Error',
                    description: e.message,
                    variant: 'destructive',
                  });
                },
                refetchQueries: [
                  {
                    query: BLOCK_GET_BUILDING_ZONINGS,
                    variables: { building: zoning.building },
                  },
                ],
              }),
            )
          }
        >
          <IconTrash />
        </Button>
      </div>
      <div className="gap-2 grid grid-cols-2">
        <SelectUsageTypes
          value={zoning.usageTypes}
          onValueChange={(value) => updateBuildingZoning({ usageTypes: value })}
        />
        <SelectTenureType
          value={{ areaType: zoning.areaType, tenureTypes: zoning.tenureTypes }}
          onValueChange={(areaType, tenureTypes) => {
            if (areaType === 'private' && tenureTypes?.length) {
              tenureTypes = [];
            }
            updateBuildingZoning({ areaType, tenureTypes });
          }}
        />
        <CurrencyField.ValueInput
          value={zoningSize}
          className="col-span-2"
          placeholder="Size in m²"
          onChange={(value) => setZoningSize(value)}
          onBlur={() =>
            zoningSize !== zoning.size &&
            updateBuildingZoning({ size: zoningSize })
          }
        />
      </div>
    </div>
  );
};
