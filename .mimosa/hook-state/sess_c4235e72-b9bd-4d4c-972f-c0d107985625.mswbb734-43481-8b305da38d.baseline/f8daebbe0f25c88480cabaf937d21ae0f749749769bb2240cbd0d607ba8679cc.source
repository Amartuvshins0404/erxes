import { useBuildings } from '@/building/hooks/useBuildings';
import { IBuilding } from '@/building/types/buildingTypes';
import { IconCheck } from '@tabler/icons-react';
import { cn, Button, useQueryState, SkeletonArray } from 'erxes-ui';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

export const BuildingList = () => {
  const { projectId } = useParams();
  const [buildingId, setBuildingId] = useQueryState<string>('buildingId');
  const { buildings, loading } = useBuildings({ projectId: projectId ?? '' });

  useEffect(() => {
    if (!buildingId && buildings && buildings.length > 0) {
      setBuildingId(buildings[0]._id);
    }
  }, [buildingId, buildings, setBuildingId]);

  if (loading) {
    return (
      <div className="space-y-2 ml-4">
        <SkeletonArray className="w-32 h-4" count={4} />
      </div>
    );
  }
  return buildings?.map((building) => (
    <BuildingItem key={building._id} {...building} />
  ));
};

export const BuildingItem = ({ _id, name }: IBuilding) => {
  const [buildingId, setBuildingId] = useQueryState<string>('buildingId');
  const isActive = buildingId === _id;

  const handleClick = () => setBuildingId(_id === buildingId ? null : _id);

  return (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      className={cn(
        'justify-start pl-7 relative overflow-hidden text-left flex-auto ml-1',
        isActive && 'bg-primary/10 hover:bg-primary/10',
      )}
      onClick={handleClick}
    >
      {isActive && <IconCheck className="absolute left-1.5" />}
      {name}
    </Button>
  );
};
