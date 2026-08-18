import { InfoCardContent } from '@/block/components/card';
import { StatusGroup } from '@/status/components/StatusGroup';
import { useBlockStatusTypes } from '@/status/hooks/useGetBlockStatusTypes';
import { InfoCard, Skeleton } from 'erxes-ui';

export const Statuses = ({ projectId }: { projectId: string }) => {
  const { statusTypes, loading } = useBlockStatusTypes(projectId);

  return (
    <InfoCard
      title="Block statuses"
      description="Manage statuses for this project"
    >
      <InfoCardContent>
        {loading ? (
          <Skeleton className="h-32 w-full rounded" />
        ) : (
          statusTypes.map((statusType) => (
            <StatusGroup
              key={statusType.type}
              statusType={statusType.type.toLowerCase()}
              statusTypeLabel={statusType.name}
              statusTypeColor={statusType.color}
              projectId={projectId}
            />
          ))
        )}
      </InfoCardContent>
    </InfoCard>
  );
};
