import { InfoCardContent } from '@/block/components/card';
import { ContractStatusGroup } from '@/contract-status/components/ContractStatusGroup';
import { useBlockContractStatusTypes } from '@/contract-status/hooks/useGetBlockContractStatusTypes';
import { InfoCard, Skeleton } from 'erxes-ui';

export const ContractStatuses = ({ projectId }: { projectId: string }) => {
  const { statusTypes, loading } = useBlockContractStatusTypes();

  return (
    <InfoCard
      title="Contract statuses"
      description="Manage contract statuses for this project"
    >
      <InfoCardContent>
        {loading ? (
          <Skeleton className="h-32 w-full rounded" />
        ) : (
          statusTypes.map((statusType) => (
            <ContractStatusGroup
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
