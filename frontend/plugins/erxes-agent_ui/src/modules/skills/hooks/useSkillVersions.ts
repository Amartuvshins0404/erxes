import { useLazyQuery, useQuery } from '@apollo/client';
import {
  MASTRA_SKILL_VERSION,
  MASTRA_SKILL_VERSIONS,
} from '../graphql/queries';
import {
  IMastraSkillVersionResponse,
  IMastraSkillVersionRow,
  IMastraSkillVersionsResponse,
} from '../types';

/** Version history (newest first) for a skill, plus a lazy fetch for one
 *  version's full body (instructions/metadata) used by the diff/restore view. */
export const useSkillVersions = (skillId?: string, skip = false) => {
  // 200 covers any realistic edit history without paging; the list renders
  // newest-first so the most relevant versions are always shown.
  const { data, loading, error, refetch } =
    useQuery<IMastraSkillVersionsResponse>(MASTRA_SKILL_VERSIONS, {
      variables: { skillId, perPage: 200 },
      skip: !skillId || skip,
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    });

  const [loadVersion, versionResult] = useLazyQuery<IMastraSkillVersionResponse>(
    MASTRA_SKILL_VERSION,
    { fetchPolicy: 'cache-and-network' },
  );

  const versions: IMastraSkillVersionRow[] = data?.mastraSkillVersions ?? [];

  return {
    versions,
    loading,
    error,
    refetch,
    loadVersion: (_id: string) => loadVersion({ variables: { _id } }),
    version: versionResult.data?.mastraSkillVersion ?? null,
    versionLoading: versionResult.loading,
    versionError: versionResult.error,
  };
};
