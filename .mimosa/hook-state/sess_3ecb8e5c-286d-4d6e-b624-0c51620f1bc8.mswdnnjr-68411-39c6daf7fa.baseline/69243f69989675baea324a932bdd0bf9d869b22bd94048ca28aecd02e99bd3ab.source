import { Spinner } from 'erxes-ui';
import { useDevelopers } from '../hooks/useDevelopers';
import { DeveloperCard } from './DeveloperCard';

export const Developers = () => {
  const { developers, loading } = useDevelopers();

  if (loading) {
    return <Spinner containerClassName="ba:py-32" />;
  }

  return (
    <div className="grid grid-cols-1 ba:lg:grid-cols-2 ba:xl:grid-cols-3 gap-6 p-8">
      {developers?.map((developer) => (
        <DeveloperCard key={developer._id} {...developer} />
      ))}
    </div>
  );
};
