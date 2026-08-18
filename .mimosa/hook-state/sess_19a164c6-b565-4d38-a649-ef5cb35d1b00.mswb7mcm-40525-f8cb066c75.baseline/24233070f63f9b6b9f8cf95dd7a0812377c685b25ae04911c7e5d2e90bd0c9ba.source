import { InfoCard, InfoCardContent } from '@/block/components/card';
import {
  useBuildings,
  useBuildingZonings,
} from '@/building/hooks/useBuildings';
import { IBuilding, IZoning } from '@/building/types/buildingTypes';
import { IProject } from '@/project/types/projectTypes';
import { SelectTenureType, SelectTenureTypes } from '@/unit/components/SelectTenureType';
import { SelectUsageType, SelectUsageTypes } from '@/unit/components/SelectUsageType';
import { CurrencyField, Spinner } from 'erxes-ui';
import { useEffect, useState } from 'react';

export const BuildingZoneList = ({ project }: { project: IProject }) => {
  const { buildings, loading } = useBuildings({ projectId: project._id });
  if (loading) {
    return <Spinner containerClassName="py-32" />;
  }

  if (!buildings?.length) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center text-sm text-muted-foreground">
          No buildings found
        </div>
      </div>
    );
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
      <InfoCardContent>
        {loading ? (
          <Spinner containerClassName="py-32" />
        ) : (
          <div className="grid lg:grid-cols-3 md:grid-cols-2  2xl:grid-cols-4 gap-3">
            {buildingZonings?.map((zoning) => (
              <BuildingZone key={zoning._id} zoning={zoning} />
            ))}
          </div>
        )}
      </InfoCardContent>
    </InfoCard>
  );
};

export const BuildingZone = ({ zoning }: { zoning: IZoning }) => {
  const [zoningSize, setZoningSize] = useState(zoning.size);

  useEffect(() => {
    if (zoning.size !== zoningSize) {
      setZoningSize(zoning.size);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoning.size]);

  return (
    <div className="p-4 rounded-lg bg-primary/10 border-primary/20 border">
      <div className="flex justify-between mb-4 items-center">
        <div className="font-medium text-left">
          {zoning.floor < 0 ? `B${zoning.floor * -1}` : zoning.floor}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SelectUsageTypes value={zoning.usageTypes} />
        <SelectTenureTypes value={{areaType: zoning.areaType, tenureTypes: zoning.tenureTypes}} />
        <CurrencyField.ValueInput
          value={zoningSize}
          className="col-span-2"
          placeholder="Size in m²"
        />
      </div>
    </div>
  );
};
