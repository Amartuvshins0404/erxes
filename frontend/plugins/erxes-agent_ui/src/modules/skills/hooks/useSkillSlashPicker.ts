import { useCallback, useMemo, useState } from 'react';
import { toast } from 'erxes-ui';
import { IMastraInvocableSkill } from '../types';
import { matchSlashQuery } from '../utils';
import { useInvocableSkills } from './useInvocableSkills';
import { useSkillActivate } from './useSkillActivate';
import { useSkillAccess } from './useSkillAccess';

interface SlashPickerArgs {
  // The agent's slug (same value the chat uses for threads/streaming), or
  // undefined when no agent is selected.
  agentId?: string;
  input: string;
  setInput: (value: string) => void;
}

/**
 * Controller for the composer's `/slash` skill picker. Opens when the input is a
 * lone leading `/query`, lists the agent's user-invocable skills, and on pick
 * activates the skill for the next turn (`mastraSkillActivate`) and surfaces a
 * pill. Returns a `handleKeyDown` the composer delegates to FIRST: it returns
 * `true` when it consumed the key (arrow nav / select / dismiss) so the chat's
 * own send/stop handling is skipped.
 */
export const useSkillSlashPicker = ({
  agentId,
  input,
  setInput,
}: SlashPickerArgs) => {
  const query = matchSlashQuery(input);
  // Slash activation requires both skill read and agent chat permissions.
  const { canActivate } = useSkillAccess();
  const isSlashMode = query !== null && canActivate;

  const { skills, loading } = useInvocableSkills(agentId, !isSlashMode);
  const { activateSkill } = useSkillActivate();

  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [prevQuery, setPrevQuery] = useState(query);

  // Each keystroke changes the query: reset the highlight and clear a prior
  // Escape-dismiss so the picker re-opens as the user keeps typing. Adjusting
  // during render (not in an effect) keeps the reset in the same commit.
  if (query !== prevQuery) {
    setPrevQuery(query);
    setActiveIndex(0);
    setDismissed(false);
  }

  const items = useMemo<IMastraInvocableSkill[]>(() => {
    if (!isSlashMode) return [];
    const q = (query ?? '').toLowerCase();
    if (!q) return skills;
    return skills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    );
  }, [isSlashMode, query, skills]);

  const open = isSlashMode && !dismissed && (loading || items.length > 0);

  const onSelect = useCallback(
    async (skill: IMastraInvocableSkill) => {
      if (!agentId) return;
      try {
        await activateSkill(agentId, skill.name);
      } catch {
        // The mutation's onError handler already surfaced the failure toast;
        // bail without the misleading success path.
        return;
      }
      setActiveSkill(skill.name);
      setInput('');
      toast({
        title: 'Skill activated',
        description: `/${skill.name} will apply to your next message.`,
      });
    },
    [agentId, activateSkill, setInput],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
      if (!open) return false;
      if (items.length === 0) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setDismissed(true);
          return true;
        }
        return false;
      }
      const last = items.length - 1;
      const current = Math.min(activeIndex, last);
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((i) => (i + 1) % items.length);
          return true;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((i) => (i - 1 + items.length) % items.length);
          return true;
        case 'Enter':
          if (e.shiftKey) return false;
          e.preventDefault();
          onSelect(items[current]);
          return true;
        case 'Tab':
          e.preventDefault();
          onSelect(items[current]);
          return true;
        case 'Escape':
          e.preventDefault();
          setDismissed(true);
          return true;
        default:
          return false;
      }
    },
    [open, items, activeIndex, onSelect],
  );

  const clearActiveSkill = useCallback(() => setActiveSkill(null), []);

  return {
    open,
    items,
    loading,
    activeIndex,
    setActiveIndex,
    onSelect,
    handleKeyDown,
    activeSkill,
    clearActiveSkill,
  };
};
