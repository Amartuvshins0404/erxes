import {
  EnumCursorDirection,
  ICursorListResponse,
  mergeCursorData,
  validateFetchMore,
} from 'erxes-ui';
import {
  GET_CV_RISK_GROUP_DETAIL,
  GET_CV_RISK_GROUPS,
} from '../graphql/cvRiskGroupsQueries';
import { QueryHookOptions, useQuery } from '@apollo/client';
import { ICVRiskGroup, ICVRiskGroupDetail } from '../riskGroupTypes';
import { useEffect } from 'react';
import { riskGroupsTotalCountAtom } from '../states/riskGroupsTotalCountAtom';
import { useSetAtom } from 'jotai';
import { useFilters } from '~/hooks/useFilters';
import { RISK_GROUPS_FILTERS } from '../components/RiskGroupsFilter';

export const useRiskGroupDetail = ({ id }: { id: string }) => {
  const { data, loading, error } = useQuery<{ cvGetRiskGroup: ICVRiskGroupDetail }>(
    GET_CV_RISK_GROUP_DETAIL,
    {
      variables: { id },
    },
  );
  return {
    riskGroupDetail: data?.cvGetRiskGroup,
    loading,
    error,
  };
};

export const useRiskGroups = (
  options?: QueryHookOptions<ICursorListResponse<ICVRiskGroup>>,
) => {
  const setRiskGroupsTotalCount = useSetAtom(riskGroupsTotalCountAtom);
  const { queries } = useFilters(RISK_GROUPS_FILTERS);

  const { data, loading, error, fetchMore } = useQuery<
    ICursorListResponse<ICVRiskGroup>
  >(GET_CV_RISK_GROUPS, {
    variables: {
      ...options?.variables,
      filter: {
        ...queries,
        ...options?.variables?.filter,
      },
    },
  });
  const { list: riskGroups, pageInfo, totalCount } = data?.cvGetRiskGroups || {};

  useEffect(() => {
    if (!totalCount) return;
    setRiskGroupsTotalCount(totalCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCount]);

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
        limit: 30,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          cvGetRiskGroups: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.cvGetRiskGroups,
            prevResult: prev.cvGetRiskGroups,
          }),
        });
      },
    });
  };

  return {
    riskGroups,
    pageInfo,
    totalCount,
    loading,
    error,
    handleFetchMore,
  };
};

