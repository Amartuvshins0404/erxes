import { DocumentNode, QueryHookOptions, useQuery } from '@apollo/client';
import {
  EnumCursorDirection,
  IRecordTableCursorPageInfo,
  mergeCursorData,
  validateFetchMore,
} from 'erxes-ui';

export type CursorList<TItem> = {
  list: TItem[];
  totalCount: number;
  pageInfo: IRecordTableCursorPageInfo;
};

type CursorResponse<TItem> = Record<string, CursorList<TItem>>;

export const useAdminCursorList = <TItem>({
  document,
  responseKey,
  variables,
  options,
}: {
  document: DocumentNode;
  responseKey: string;
  variables: Record<string, unknown>;
  options?: QueryHookOptions;
}) => {
  const { data, loading, error, fetchMore } = useQuery<CursorResponse<TItem>>(
    document,
    { ...options, variables },
  );

  const { list, totalCount, pageInfo } = data?.[responseKey] || {};

  const handleFetchMore = () => {
    const direction = EnumCursorDirection.FORWARD;

    if (!validateFetchMore({ direction, pageInfo })) {
      return;
    }

    fetchMore({
      variables: { ...variables, cursor: pageInfo?.endCursor, direction },
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
