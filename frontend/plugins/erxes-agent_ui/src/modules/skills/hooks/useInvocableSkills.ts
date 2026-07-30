import { useQuery } from '@apollo/client';
import { MASTRA_INVOCABLE_SKILLS } from '../graphql/queries';
import {
  IMastraInvocableSkill,
  IMastraInvocableSkillsResponse,
} from '../types';

/**
 * User-invocable skills for the slash-command picker: the agent's glob-scoped
 * GLOBAL invocable skills ∪ the caller's OWN invocable skills. `agentId` is the
 * agent's slug (same value the chat uses for threads/streaming).
 */
export const useInvocableSkills = (agentId?: string, skip = false) => {
  const { data, loading, error } = useQuery<IMastraInvocableSkillsResponse>(
    MASTRA_INVOCABLE_SKILLS,
    {
      variables: { agentId },
      skip: !agentId || skip,
      fetchPolicy: 'cache-and-network',
    },
  );

  const skills: IMastraInvocableSkill[] = data?.mastraInvocableSkills ?? [];

  return { skills, loading, error };
};
