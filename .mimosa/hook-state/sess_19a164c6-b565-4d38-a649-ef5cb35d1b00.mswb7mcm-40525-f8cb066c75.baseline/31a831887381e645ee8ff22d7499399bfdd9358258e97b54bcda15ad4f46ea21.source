import { Spinner, useMultiQueryState } from 'erxes-ui';
import { useAgencies, AgenciesFilterVars } from '../hooks/useAgencies';
import { AgencyCard } from './AgencyCard';
import { IAgency } from '../types/agencyTypes';

export const Agencies = () => {
  const [queries] = useMultiQueryState<AgenciesFilterVars>([
    'searchValue',
    'city',
    'district',
  ]);
  const { agencies, loading } = useAgencies(queries as AgenciesFilterVars);

  if (loading) {
    return <Spinner containerClassName="ba:py-32" />;
  }

  return (
    <div className="grid grid-cols-1 ba:lg:grid-cols-2 ba:xl:grid-cols-3 ba:2xl:grid-cols-4 gap-6 m-3">
      {agencies?.map((agency: IAgency) => (
        <AgencyCard key={agency._id} {...agency} />
      ))}
    </div>
  );
};
