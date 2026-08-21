import { useQuery } from '@apollo/client';
import { useCallback } from 'react';
import {
  EnumCursorDirection,
  mergeCursorData,
  useNonNullMultiQueryState,
  useRecordTableCursor,
  validateFetchMore,
} from 'erxes-ui';
import { REGISTRATIONS_CURSOR_SESSION_KEY } from '@/registration/constants/registrationsCursorSessionKey';
import { MTO_REGISTRATION_APPLICATIONS } from '@/registration/graphql/registrationQueries';
import { MtoRegistrationApplication } from '@/registration/types/registration';

const REGISTRATIONS_PER_PAGE = 20;

const parseBooleanQuery = (value?: string): boolean | undefined => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

export function useRegistrationsFilterVariables() {
  const queries = useNonNullMultiQueryState<{
    membershipTypeId: string;
    status: string;
    cpUserId: string;
    name: string;
    registrationNumber: string;
    email: string;
    createdAtFrom: string;
    createdAtTo: string;
    activityCategory: string;
    archived: string;
  }>([
    'membershipTypeId',
    'status',
    'cpUserId',
    'name',
    'registrationNumber',
    'email',
    'createdAtFrom',
    'createdAtTo',
    'activityCategory',
    'archived',
  ]);

  return {
    membershipTypeId: queries.membershipTypeId || undefined,
    status: queries.status || undefined,
    cpUserId: queries.cpUserId || undefined,
    name: queries.name || undefined,
    registrationNumber: queries.registrationNumber || undefined,
    email: queries.email || undefined,
    createdAtFrom: queries.createdAtFrom || undefined,
    createdAtTo: queries.createdAtTo || undefined,
    activityCategory: queries.activityCategory || undefined,
    archived: parseBooleanQuery(queries.archived),
  };
}

export function useRegistrations() {
  const { cursor } = useRecordTableCursor({
    sessionKey: REGISTRATIONS_CURSOR_SESSION_KEY,
  });
  const filters = useRegistrationsFilterVariables();

  const { data, loading, error, fetchMore, refetch } = useQuery(
    MTO_REGISTRATION_APPLICATIONS,
    {
      variables: {
        ...filters,
        cursor,
        limit: REGISTRATIONS_PER_PAGE,
      },
      fetchPolicy: 'cache-and-network',
    },
  );

  const {
    list: registrations,
    totalCount,
    pageInfo,
  }: {
    list?: MtoRegistrationApplication[];
    totalCount?: number;
    pageInfo?: {
      hasNextPage?: boolean;
      hasPreviousPage?: boolean;
      startCursor?: string;
      endCursor?: string;
    };
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
