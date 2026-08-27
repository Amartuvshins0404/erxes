import { QueryHookOptions } from '@apollo/client';
import { parseDateRangeFromString, useMultiQueryState } from 'erxes-ui';

import { useAdminCursorList } from '@/shared/hooks/useAdminCursorList';
import { ADMIN_PROFILES_PER_PAGE } from '../constants/profileConstants';
import { OROLTSOO_ADMIN_PROFILES } from '../graphql/queries/profileQueries';
import { IAdminProfile } from '../types/profile';

export const useAdminProfileVariables = (
  variables?: QueryHookOptions['variables'],
) => {
  const [{ searchValue, reviewStatus, subdomain, synced }] =
    useMultiQueryState<{
      searchValue: string;
      reviewStatus: string;
      subdomain: string;
      synced: string;
    }>(['searchValue', 'reviewStatus', 'subdomain', 'synced']);

  const syncedRange = synced ? parseDateRangeFromString(synced) : undefined;

  return {
    limit: ADMIN_PROFILES_PER_PAGE,
    ...variables,
    searchValue,
    reviewStatus,
    subdomain,
    syncedFrom: syncedRange?.from,
    syncedTo: syncedRange?.to,
  };
};

export const useAdminProfiles = (options?: QueryHookOptions) => {
  const variables = useAdminProfileVariables(options?.variables);

  const { list, ...rest } = useAdminCursorList<IAdminProfile>({
    document: OROLTSOO_ADMIN_PROFILES,
    responseKey: 'oroltsooAdminProfiles',
    variables,
    options,
  });

  return { profiles: list, ...rest };
};
