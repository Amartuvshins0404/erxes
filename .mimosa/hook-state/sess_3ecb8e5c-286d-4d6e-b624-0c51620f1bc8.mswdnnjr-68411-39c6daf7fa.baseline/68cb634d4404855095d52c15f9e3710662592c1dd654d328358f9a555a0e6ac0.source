import { IconFileDescription } from '@tabler/icons-react';
import { useUnitOffersCount } from '@/unit/hooks/useUnitStats';
import { UnitStatCard } from './UnitStatCard';

export const UnitOffersStats = ({ unitId }: { unitId?: string }) => {
  const { count, loading } = useUnitOffersCount(unitId);
  return (
    <UnitStatCard
      label="Total Offers"
      count={count}
      loading={loading}
      icon={IconFileDescription}
      color="#6366f1"
    />
  );
};
