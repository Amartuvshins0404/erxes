import { useBuildings } from '@/building/hooks/useBuildings';
import { Button, Empty, Select, Skeleton } from 'erxes-ui';
import { useEffect } from 'react';

export const SelectBuilding = ({
  value,
  onValueChange,
  projectId,
}: {
  value: string;
  onValueChange: (value: string) => void;
  projectId: string;
}) => {
  const { buildings, loading } = useBuildings({ projectId: projectId });

  useEffect(() => {
    if (buildings?.length && !value) {
      onValueChange(buildings[0]._id);
    }
  }, [buildings, value, onValueChange]);

  if (loading)
    return (
      <Button variant="outline" disabled>
        <Skeleton className="w-32 h-4" />
      </Button>
    );

  if (!buildings?.length) {
    return (
      <Empty>
        <Empty.Header>
          <Empty.Title>No buildings found</Empty.Title>
          <Empty.Description>
            There are no buildings added yet for this project.
          </Empty.Description>
        </Empty.Header>
      </Empty>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <Select.Trigger className="bg-background w-auto blk:min-w-40">
        <Select.Value />
      </Select.Trigger>
      <Select.Content>
        {buildings?.map((building) => (
          <Select.Item key={building._id} value={building._id}>
            {building.name}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
};
