import { Skeleton, useMultiQueryState } from 'erxes-ui';
import { AgenciesFilterVars, useAgencies } from '../hooks/useAgencies';
import { useTranslation } from 'react-i18next';

export const AgenciesTotalCount = () => {
  const { t } = useTranslation();
  const [queries] = useMultiQueryState<AgenciesFilterVars>([
    'searchValue',
    'city',
    'district',
  ]);
  const { totalCount, loading } = useAgencies(queries as AgenciesFilterVars);

  if (loading) {
    return <Skeleton className="h-5 w-4" />;
  }

  return (
    <span className="text-muted-foreground font-medium text-sm whitespace-nowrap h-7 leading-7">
      {totalCount} {t('records-found')}
    </span>
  );
};
