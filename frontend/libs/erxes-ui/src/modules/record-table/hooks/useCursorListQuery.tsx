import {
  DocumentNode,
  OperationVariables,
  QueryHookOptions,
  TypedDocumentNode,
  useQuery,
} from '@apollo/client';
import { useCallback } from 'react';
import {
  EnumCursorDirection,
  IRecordTableCursorPageInfo,
} from '../types/RecordTableCursorTypes';
import { mergeCursorData, validateFetchMore } from '../utils/cursorUtils';
import { useRecordTableCursor } from './useRecordTableCursor';

export const CURSOR_LIST_DEFAULT_LIMIT = 30;

export interface ICursorListResult<TItem> {
  list?: TItem[];
  totalCount?: number;
  pageInfo?: IRecordTableCursorPageInfo;
}

type CursorListData<TItem> = Record<string, ICursorListResult<TItem>>;

export interface UseCursorListQueryOptions<TItem>
  extends Omit<QueryHookOptions<CursorListData<TItem>>, 'variables'> {
  field: string;
  variables?: OperationVariables;
  sessionKey?: string;
  limit?: number;
}

export const useCursorListQuery = <TItem,>(
  query: DocumentNode | TypedDocumentNode,
  {
    field,
    variables,
    sessionKey,
    limit = CURSOR_LIST_DEFAULT_LIMIT,
    ...options
  }: UseCursorListQueryOptions<TItem>,
) => {
  const { cursor } = useRecordTableCursor({ sessionKey });

  const { data, loading, error, fetchMore, refetch, networkStatus } = useQuery<
    CursorListData<TItem>
  >(query, {
    ...options,
    variables: {
      ...variables,
      cursor: sessionKey ? cursor || undefined : undefined,
      limit,
    },
  });

  const result = data?.[field];
  const list = result?.list ?? [];
  const totalCount = result?.totalCount ?? 0;
  const pageInfo = result?.pageInfo;

  const handleFetchMore = useCallback(
    ({ direction }: { direction: EnumCursorDirection }) => {
      if (!validateFetchMore({ direction, pageInfo })) return;

      fetchMore({
        variables: {
          cursor:
            direction === EnumCursorDirection.FORWARD
              ? pageInfo?.endCursor
              : pageInfo?.startCursor,
          limit,
          direction,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult?.[field]) return prev;

          return {
            ...prev,
            [field]: mergeCursorData<TItem>({
              direction,
              fetchMoreResult: fetchMoreResult[field],
              prevResult: prev[field],
            }),
          };
        },
      });
    },
    [fetchMore, field, limit, pageInfo],
  );

  return {
    list,
    totalCount,
    pageInfo,
    hasNextPage: pageInfo?.hasNextPage,
    hasPreviousPage: pageInfo?.hasPreviousPage,
    loading,
    initialLoading: loading && !list.length,
    networkStatus,
    error,
    refetch,
    handleFetchMore,
  };
};
