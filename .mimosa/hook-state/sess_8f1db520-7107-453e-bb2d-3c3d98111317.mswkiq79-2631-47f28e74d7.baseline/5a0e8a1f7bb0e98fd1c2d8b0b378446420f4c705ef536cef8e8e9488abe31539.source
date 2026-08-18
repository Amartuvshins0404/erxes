import { IconFileText } from '@tabler/icons-react';
import { useUnitContractsCount } from '@/unit/hooks/useUnitStats';
import { UnitStatCard } from './UnitStatCard';

export const UnitContractsStats = ({ unitId }: { unitId?: string }) => {
  const { count, loading } = useUnitContractsCount(unitId);
  return (
    <UnitStatCard
      label="Total Contracts in Progress"
      count={count}
      loading={loading}
      icon={IconFileText}
      color="#10b981"
    />
  );
};
