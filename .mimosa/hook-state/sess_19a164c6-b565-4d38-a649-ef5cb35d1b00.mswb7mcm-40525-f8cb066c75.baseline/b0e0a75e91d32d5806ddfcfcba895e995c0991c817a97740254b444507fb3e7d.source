import { useQuery } from '@apollo/client';
import {
  EnumCursorDirection,
  mergeCursorData,
  useRecordTableCursor,
  validateFetchMore,
} from 'erxes-ui';
import { useParams } from 'react-router';
import { SUBMISSIONS_CURSOR_SESSION_KEY } from '../constants/submissionCursorSessionKey';
import { BLOCK_GET_SUBMISSIONS } from '../graphql/queries';

const SUBMISSIONS_PER_PAGE = 20;

export const useSubmissions = () => {
  const { id } = useParams();

  const { cursor } = useRecordTableCursor({
    sessionKey: SUBMISSIONS_CURSOR_SESSION_KEY,
  });

  const { data, loading, fetchMore } = useQuery(BLOCK_GET_SUBMISSIONS, {
    variables: {
      formId: Number(id),
      cursor,
    },
  });

  const {
    list: submissions,
    totalCount,
    pageInfo,
  } = data?.blockAdminGetSubmissions || {};

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
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        limit: SUBMISSIONS_PER_PAGE,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          blockAdminGetSubmissions: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.blockAdminGetSubmissions,
            prevResult: prev.blockAdminGetSubmissions,
          }),
        });
      },
    });
  };

  return {
    submissions,
    loading,
    totalCount,
    pageInfo,
    handleFetchMore,
  };
};
