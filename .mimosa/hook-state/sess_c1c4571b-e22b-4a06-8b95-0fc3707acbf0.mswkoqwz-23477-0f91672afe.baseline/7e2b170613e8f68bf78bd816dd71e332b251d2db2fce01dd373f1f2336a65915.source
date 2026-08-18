import { useQuery } from '@apollo/client';
import { EnumCursorDirection, EnumCursorMode } from 'erxes-ui';
import { ONE_FIT_PROVIDERS } from '~/modules/provider/graphql/providerQueries';
import { ONE_FIT_ACTIVITY_TYPES } from '~/modules/activity-type/graphql/activityTypeQueries';

export function useProviders() {
  const { data, loading } = useQuery(ONE_FIT_PROVIDERS, {
    variables: {
      isActive: true,
      limit: 100,
      cursor: undefined,
      cursorMode: EnumCursorMode.INCLUSIVE,
      direction: EnumCursorDirection.FORWARD,
    },
  });

  return {
    providers: data?.oneFitProviders?.list || [],
    loading,
  };
}

export function useActivityTypes(providerId?: string) {
  const { data, loading } = useQuery(ONE_FIT_ACTIVITY_TYPES, {
    variables: {
      providerId: providerId || undefined,
      isActive: true,
      limit: 100,
      cursor: undefined,
      cursorMode: EnumCursorMode.INCLUSIVE,
      direction: EnumCursorDirection.FORWARD,
    },
    skip: !providerId,
  });

  return {
    activityTypes: data?.oneFitActivityTypes?.list || [],
    loading,
  };
}
