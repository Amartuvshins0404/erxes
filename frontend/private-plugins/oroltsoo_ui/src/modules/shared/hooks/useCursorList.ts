import { DocumentNode, QueryHookOptions, useQuery } from '@apollo/client';
import {
  EnumCursorDirection,
  IRecordTableCursorPageInfo,
  isUndefinedOrNull,
  mergeCursorData,
  useRecordTableCursor,
  validateFetchMore,
} from 'erxes-ui';

export type CursorList<TItem> = {
  list: TItem[];
  totalCount: number;
  pageInfo: IRecordTableCursorPageInfo;
};

type CursorResponse<TItem> = Record<string, CursorList<TItem>>;

export const useCursorList = <TItem>({
  document,
  responseKey,
  sessionKey,
  perPage,
  options,
}: {
  document: DocumentNode;
  responseKey: string;
  sessionKey: string;
  perPage: number;
  options?: QueryHookOptions;
}) => {
  const { cursor } = useRecordTableCursor({ sessionKey });

  const { data, loading, error, fetchMore } = useQuery<CursorResponse<TItem>>(
    document,
    {
      ...options,
      skip: options?.skip || isUndefinedOrNull(cursor),
      variables: { limit: perPage, cursor, ...options?.variables },
    },
  );

  const { list, totalCount, pageInfo } = data?.[responseKey] || {};

  const handleFetchMore = ({
    direction,
  }: {
    direction: EnumCursorDirection;
  }) => {
    if (!validateFetchMore({ direction, pageInfo })) {
      return;
    }

    fetchMore({
      variables: {
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        limit: perPage,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;

        return {
          ...prev,
          [responseKey]: {
            ...mergeCursorData({
              direction,
              fetchMoreResult: fetchMoreResult[responseKey],
              prevResult: prev[responseKey],
            }),
            totalCount:
              fetchMoreResult[responseKey].totalCount ??
              prev[responseKey].totalCount,
          },
        };
      },
    });
  };

  return { list, totalCount, pageInfo, loading, error, handleFetchMore };
};
