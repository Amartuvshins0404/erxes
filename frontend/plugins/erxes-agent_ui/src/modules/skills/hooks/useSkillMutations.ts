import { useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import {
  MASTRA_SKILL_ACTIVATE_VERSION,
  MASTRA_SKILL_DEMOTE,
  MASTRA_SKILL_PROMOTE,
  MASTRA_SKILL_PUBLISH,
  MASTRA_SKILL_REMOVE,
} from '../graphql/mutations';
import { IMastraSkill } from '../types';
import { skillMutationError } from './useSkillAccess';
import { skillCacheUpdate } from './skillCacheUpdate';

interface RemoveResult {
  mastraSkillRemove?: unknown;
}
interface PublishResult {
  mastraSkillPublish?: IMastraSkill;
}
interface PromoteResult {
  mastraSkillPromote?: IMastraSkill;
}
interface DemoteResult {
  mastraSkillDemote?: IMastraSkill;
}
interface ActivateVersionResult {
  mastraSkillActivateVersion?: IMastraSkill;
}

const swallow = () => undefined;

/**
 * Lifecycle mutations shared by the skills table, editor and history dialog:
 * delete, publish (draft → published), promote (private → global, admin-only),
 * demote (global → private, author-or-admin — the inverse of promote), and
 * activate-version (rollback/restore). Each invalidates the skill caches,
 * toasts on success from `onCompleted`, and runs `onChanged` (refetch/close) —
 * so call sites can fire-and-forget without dangling rejections (failures are
 * surfaced by the shared `onError` handler).
 */
export const useSkillMutations = (onChanged?: () => void) => {
  const done = (title: string) => () => {
    toast({ title });
    onChanged?.();
  };

  const [removeSkill, { loading: removing }] = useMutation<RemoveResult>(
    MASTRA_SKILL_REMOVE,
    {
      update: skillCacheUpdate,
      onCompleted: done('Skill deleted'),
      onError: skillMutationError('delete'),
    },
  );

  const [publishSkill, { loading: publishing }] = useMutation<PublishResult>(
    MASTRA_SKILL_PUBLISH,
    {
      update: skillCacheUpdate,
      onCompleted: done('Skill published'),
      onError: skillMutationError('publish'),
    },
  );

  const [promoteSkill, { loading: promoting }] = useMutation<PromoteResult>(
    MASTRA_SKILL_PROMOTE,
    {
      update: skillCacheUpdate,
      onCompleted: done('Skill promoted'),
      onError: skillMutationError('promote'),
    },
  );

  const [demoteSkill, { loading: demoting }] = useMutation<DemoteResult>(
    MASTRA_SKILL_DEMOTE,
    {
      update: skillCacheUpdate,
      onCompleted: done('Skill demoted'),
      onError: skillMutationError('demote'),
    },
  );

  const [activateVersionMut, { loading: activatingVersion }] =
    useMutation<ActivateVersionResult>(MASTRA_SKILL_ACTIVATE_VERSION, {
      update: skillCacheUpdate,
      onCompleted: done('Version restored'),
      onError: skillMutationError('edit'),
    });

  return {
    remove: (_id: string) =>
      removeSkill({ variables: { _id } }).catch(swallow),
    publish: (_id: string) =>
      publishSkill({ variables: { _id } }).catch(swallow),
    promote: (_id: string) =>
      promoteSkill({ variables: { _id } }).catch(swallow),
    demote: (_id: string) =>
      demoteSkill({ variables: { _id } }).catch(swallow),
    activateVersion: (_id: string, versionId: string) =>
      activateVersionMut({ variables: { _id, versionId } }).catch(swallow),
    loading:
      removing || publishing || promoting || demoting || activatingVersion,
  };
};
