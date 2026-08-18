import { Select } from 'erxes-ui';
import { useBuildings } from '@/building/hooks/useBuildings';
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
  const { buildings } = useBuildings({ projectId: projectId });

  useEffect(() => {
    if (buildings?.length && !value) {
      onValueChange(buildings[0]._id);
    }
  }, [buildings, value, onValueChange]);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <Select.Trigger className="bg-background w-auto min-w-40">
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
