import { Skeleton, useMultiQueryState } from 'erxes-ui';
import { useAdminListings } from '../hooks/useAdminListings';
import { AdminListingFilter } from '../types/listingTypes';
import { useTranslation } from 'react-i18next';

export const AgenciesListingsTotalCount = () => {
  const { t } = useTranslation();
  const [queries] = useMultiQueryState<AdminListingFilter>([
    'searchValue',
    'city',
    'district',
    'status',
  ]);
  const { totalCount, loading } = useAdminListings({
    variables: queries as AdminListingFilter,
  });

  if (loading) {
    return <Skeleton className="h-5 w-4" />;
  }

  return (
    <span className="text-muted-foreground font-medium text-sm whitespace-nowrap h-7 leading-7">
      {totalCount} {t('records-found')}
    </span>
  );
};
