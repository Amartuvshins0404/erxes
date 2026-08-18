import { IconTarget } from '@tabler/icons-react';
import { useUnitOpptysCount } from '@/unit/hooks/useUnitStats';
import { UnitStatCard } from './UnitStatCard';

export const UnitOpptysStats = ({
  unitId,
  projectId,
}: {
  unitId?: string;
  projectId?: string;
}) => {
  const { count, loading } = useUnitOpptysCount(unitId, projectId);
  return (
    <UnitStatCard
      label="Total Opportunities"
      count={count}
      loading={loading}
      icon={IconTarget}
      color="#f59e0b"
    />
  );
};
