import { useQuery } from '@apollo/client';
import { useCallback } from 'react';
import {
  EnumCursorDirection,
  mergeCursorData,
  useRecordTableCursor,
  validateFetchMore,
} from 'erxes-ui';
import { REGISTRATIONS_CURSOR_SESSION_KEY } from '@/registration/constants/registrationsCursorSessionKey';
import { MTO_REGISTRATION_APPLICATIONS } from '@/registration/graphql/registrationQueries';
import { RegistrationFilters } from '@/registration/types/registrationFilters';

const REGISTRATIONS_PER_PAGE = 20;

export function useRegistrations(filters?: RegistrationFilters) {
  const { cursor } = useRecordTableCursor({
    sessionKey: REGISTRATIONS_CURSOR_SESSION_KEY,
  });

  const { data, loading, error, fetchMore, refetch } = useQuery(
    MTO_REGISTRATION_APPLICATIONS,
    {
      variables: {
        ...filters,
        cursor,
      },
    },
  );

  const {
    list: registrations,
    totalCount,
    pageInfo,
  } = data?.mtoRegistrationApplications || {};

  const handleFetchMore = ({
    direction,
  }: {
    direction: EnumCursorDirection;
  }) => {
    if (
      !validateFetchMore({
        direction,
        pageInfo,
      })
    ) {
      return;
    }

    fetchMore({
      variables: {
        ...filters,
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        limit: REGISTRATIONS_PER_PAGE,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          mtoRegistrationApplications: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.mtoRegistrationApplications,
            prevResult: prev.mtoRegistrationApplications,
          }),
        });
      },
    });
  };

  const handleRefetch = useCallback(() => {
    return refetch({
      ...filters,
      cursor,
    });
  }, [refetch, filters, cursor]);

  return {
    registrations,
    loading,
    error,
    pageInfo,
    totalCount,
    handleFetchMore,
    refetch: handleRefetch,
  };
}
