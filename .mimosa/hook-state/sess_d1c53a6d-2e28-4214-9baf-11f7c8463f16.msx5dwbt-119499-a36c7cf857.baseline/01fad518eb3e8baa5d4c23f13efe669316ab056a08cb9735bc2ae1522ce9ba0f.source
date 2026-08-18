import { BuildingZoneList } from '@/building/components/BuildingZoneList';
import { useProjectDetail } from '../hooks/useProjectDetail';

export const ProjectDetailZoning = () => {
  const { project } = useProjectDetail();

  if (!project) return null;

  return (
    <div className="p-8">
      <BuildingZoneList project={project} />
    </div>
  );
};
