import { useParams } from 'react-router-dom';
import { Statuses } from '@/status/components/Statuses';

export const ProjectDetailStatuses = () => {
  const { id } = useParams();

  if (!id) {
    return null;
  }

  return (
    <div className="p-8">
      <Statuses projectId={id} />
    </div>
  );
};
