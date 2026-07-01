import { useMutation } from '@apollo/client';
import { MASTRA_SKILL_ACTIVATE } from '../graphql/mutations';
import { IMastraSkillActivation } from '../types';
import { skillMutationError } from './useSkillAccess';

interface ActivateResult {
  mastraSkillActivate?: IMastraSkillActivation;
}

/**
 * Activate a user-invocable skill for the next turn of a thread (the /slash
 * command). Idempotent — returns the instructions the server will inject.
 */
export const useSkillActivate = () => {
  const [activate, { loading }] = useMutation<ActivateResult>(
    MASTRA_SKILL_ACTIVATE,
    { onError: skillMutationError('activate') },
  );

  const activateSkill = (agentId: string, name: string) =>
    activate({ variables: { agentId, name } });

  return { activateSkill, activating: loading };
};
