import { Spinner, useMultiQueryState } from 'erxes-ui';
import { useAgencies, AgenciesFilterVars } from '../hooks/useAgencies';
import { AgencyListItem } from './AgencyListItem';
import { IAgency } from '../types/agencyTypes';

export const AgenciesListView = () => {
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
    <div className="flex flex-col gap-3 m-3">
      {agencies?.map((agency: IAgency) => (
        <AgencyListItem key={agency._id} {...agency} />
      ))}
    </div>
  );
};
