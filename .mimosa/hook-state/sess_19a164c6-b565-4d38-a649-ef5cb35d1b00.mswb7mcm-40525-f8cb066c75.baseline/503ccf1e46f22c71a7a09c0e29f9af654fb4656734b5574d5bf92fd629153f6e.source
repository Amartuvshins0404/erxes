import { BuildingUnitsByZones } from '@/building/components/BuildingZones';
import { UnitDetailSheet } from '@/unit/components/UnitDetailSheet';
import { useParams } from 'react-router-dom';

export const ProjectDetailUnits = () => {
  const { id: projectId } = useParams();
  return (
    <>
      <BuildingUnitsByZones projectId={projectId} />
      <UnitDetailSheet />
    </>
  );
};
