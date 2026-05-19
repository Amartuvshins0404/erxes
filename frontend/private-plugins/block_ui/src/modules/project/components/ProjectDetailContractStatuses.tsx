import { useParams } from 'react-router-dom';
import { ContractStatuses } from '@/contract-status/components/ContractStatuses';

export const ProjectDetailContractStatuses = () => {
  const { id } = useParams();

  if (!id) {
    return null;
  }

  return (
    <div className="p-8">
      <ContractStatuses projectId={id} />
    </div>
  );
};
