import { useMutation } from '@apollo/client';
import {
  MASTRA_SKILL_CREATE,
  MASTRA_SKILL_UPDATE,
} from '../graphql/mutations';
import {
  IMastraSkill,
  IMastraSkillCreateInput,
  IMastraSkillUpdateInput,
} from '../types';
import { skillMutationError } from './useSkillAccess';
import { skillCacheUpdate } from './skillCacheUpdate';

interface SaveSkillResult {
  mastraSkillCreate?: IMastraSkill;
  mastraSkillUpdate?: IMastraSkill;
}

/**
 * Create/update mutations for the skill editor. On success it routes back to the
 * editor for the saved skill (so the author can keep editing / publish) via the
 * `onSaved` callback the caller provides.
 */
export const useSaveSkill = (
  id: string | undefined,
  onSaved: (skill: IMastraSkill) => void,
) => {
  const [createSkill, { loading: creating }] = useMutation<SaveSkillResult>(
    MASTRA_SKILL_CREATE,
    {
      update: skillCacheUpdate,
      onCompleted: (res) => {
        if (res.mastraSkillCreate) onSaved(res.mastraSkillCreate);
      },
      onError: skillMutationError('create'),
    },
  );

  const [updateSkill, { loading: updating }] = useMutation<SaveSkillResult>(
    MASTRA_SKILL_UPDATE,
    {
      update: skillCacheUpdate,
      onCompleted: (res) => {
        if (res.mastraSkillUpdate) onSaved(res.mastraSkillUpdate);
      },
      onError: skillMutationError('edit'),
    },
  );

  const createSkillDoc = (doc: IMastraSkillCreateInput) =>
    createSkill({ variables: { doc } });

  const updateSkillDoc = (doc: IMastraSkillUpdateInput) => {
    if (!id) return Promise.resolve(null);
    return updateSkill({ variables: { _id: id, doc } });
  };

  return {
    createSkillDoc,
    updateSkillDoc,
    saving: creating || updating,
  };
};
