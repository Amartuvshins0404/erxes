import { IconCheck } from '@tabler/icons-react';
import { Button, cn, SkeletonArray, useQueryState } from 'erxes-ui';
import { useBuildings } from '@/building/hooks/useBuildings';
import { IBuilding } from '@/building/types/buildingTypes';
import { useEffect } from 'react';

export const BuildingList = () => {
  const [projectId] = useQueryState<string>('projectId');
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
