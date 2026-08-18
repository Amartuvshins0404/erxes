import { Spinner, useMultiQueryState } from 'erxes-ui';
import { InfoCard, InfoCardContent } from '@/block/components/card';
import { SelectBuilding } from '@/building/components/SelectBuilding';
import { useBuildingZonings } from '@/building/hooks/useBuildings';
import { IZoning } from '@/building/types/buildingTypes';
import { UnitsList } from '@/unit/components/UnitsList';
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

  return (
    <div className="p-8 flex flex-col gap-6 w-auto">
      <div className="flex gap-3 items-center justify-between">
        <SelectBuilding
          value={queries.buildingId ?? ''}
          onValueChange={(value) => setQueries({ buildingId: value })}
          projectId={projectId ?? ''}
        />
      </div>
      {loading ? (
        <Spinner containerClassName="py-32" />
      ) : (
        buildingZonings?.map((zone) => (
          <BuildingZone key={zone._id} zone={zone} />
        ))
      )}
    </div>
  );
};

export const BuildingZone = ({ zone }: { zone: IZoning }) => {
  const [unitsCount, setUnitsCount] = useState(0);
  return (
    <InfoCard
      title={`${zone.floor < 0 ? `B${zone.floor * -1}` : zone.floor} Floor • ${
        unitsCount || 0
      } units ${zone.usageTypes?.length ? `• ${zone.usageTypes.join(', ')}` : ''} ${
        zone.tenureTypes?.length ? `• ${zone.tenureTypes.join(', ')}` : ''
      }`}
    >
      <InfoCardContent>
        <UnitsList zone={zone} setUnitsCount={setUnitsCount} />
      </InfoCardContent>
    </InfoCard>
  );
};
