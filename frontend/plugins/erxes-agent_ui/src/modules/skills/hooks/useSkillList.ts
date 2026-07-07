import { useCallback, useMemo } from 'react';
import { MASTRA_SKILLS } from '../graphql/queries';
import { useAuthedListQuery } from '~/hooks/useAuthedListQuery';
import {
  IMastraSkillRow,
  IMastraSkillsResponse,
  SkillScope,
  SkillStatus,
} from '../types';

export const SKILLS_PER_PAGE = 30;

export interface SkillListFilters {
  scope?: SkillScope;
  status?: SkillStatus;
  searchValue?: string;
}

/**
 * Scroll-paginated skills list for the management table. The backend paginates
 * (`mastraSkills(page, perPage, scope, status, searchValue)`); the table loads
 * the next page when the forward skeleton scrolls into view. `network-only`
 * keeps it fresh so creates / edits / publishes / deletes show without a manual
 * refresh.
 */
export const useSkillList = (filters: SkillListFilters = {}) => {
  const { scope, status, searchValue } = filters;
  const variables = useMemo(
    () => ({
      page: 1,
      perPage: SKILLS_PER_PAGE,
      scope,
      status,
      searchValue: searchValue || undefined,
    }),
    [scope, status, searchValue],
  );

  const { data, loading, rawLoading, error, fetchMore, refetch } =
    useAuthedListQuery<IMastraSkillsResponse>(MASTRA_SKILLS, {
      variables,
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
    });

  const skillsList = useMemo<IMastraSkillRow[]>(
    () => data?.mastraSkills?.list || [],
    [data?.mastraSkills?.list],
  );

  const totalCount = data?.mastraSkills?.totalCount ?? 0;

  const pageInfo = useMemo(
    () => ({
      hasNextPage: skillsList.length < totalCount,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    }),
    [skillsList.length, totalCount],
  );

  const handleFetchMore = useCallback(() => {
    if (rawLoading || skillsList.length >= totalCount) return;

    fetchMore({
      variables: {
        ...variables,
        page: Math.ceil(skillsList.length / SKILLS_PER_PAGE) + 1,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult?.mastraSkills) return prev;
        return {
          mastraSkills: {
            ...fetchMoreResult.mastraSkills,
            list: [
              ...(prev.mastraSkills?.list || []),
              ...(fetchMoreResult.mastraSkills.list || []),
            ],
          },
        };
      },
    });
  }, [rawLoading, skillsList.length, totalCount, fetchMore, variables]);

  return {
    skillsList,
    totalCount,
    loading,
    error,
    pageInfo,
    handleFetchMore,
    refetch,
  };
};
