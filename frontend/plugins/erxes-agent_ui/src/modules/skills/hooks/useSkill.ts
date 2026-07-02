import { useQuery } from '@apollo/client';
import { MASTRA_SKILL } from '../graphql/queries';
import { IMastraSkillResponse } from '../types';

/** Load one skill (resolved with its active/latest version) for the editor. */
export const useSkill = (id?: string) => {
  const { data, loading, error } = useQuery<IMastraSkillResponse>(MASTRA_SKILL, {
    variables: { _id: id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  return { skill: data?.mastraSkill ?? null, loading, error };
};
