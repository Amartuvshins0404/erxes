import { useMutation } from '@apollo/client';
import { MASTRA_SKILL_FROM_THREAD } from '../graphql/mutations';
import { IMastraSkill } from '../types';
import { skillMutationError } from './useSkillAccess';
import { skillCacheUpdate } from './skillCacheUpdate';

interface FromThreadResult {
  mastraSkillFromThread?: IMastraSkill;
}

interface FromThreadArgs {
  agentId: string;
  threadId: string;
  nameHint?: string;
  scopeHint?: string;
}

/**
 * The makeSkill tool, invoked from the UI: distill the current thread into a
 * SKILL.md DRAFT. Returns the draft skill for review/edit/publish — the caller
 * opens it in the preview panel.
 */
export const useSkillFromThread = (onCreated: (skill: IMastraSkill) => void) => {
  const [run, { loading }] = useMutation<FromThreadResult>(
    MASTRA_SKILL_FROM_THREAD,
    {
      update: skillCacheUpdate,
      onCompleted: (res) => {
        if (res.mastraSkillFromThread) onCreated(res.mastraSkillFromThread);
      },
      onError: skillMutationError('create'),
    },
  );

  const makeSkill = (args: FromThreadArgs) => run({ variables: args });

  return { makeSkill, making: loading };
};
