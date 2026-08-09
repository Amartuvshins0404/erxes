import type { IChatAgent } from '~/modules/chat/hooks/useChatAgents';

export type AgentVisibilitySection =
  | 'mine'
  | 'shared'
  | 'organization'
  | 'private';

export type AgentVisibilityBadge =
  | 'only-me'
  | 'direct'
  | 'everyone'
  | 'private'
  | 'shared';

type VisibleAgent = Pick<
  IChatAgent,
  'createdBy' | 'visibility' | 'audienceUserIds'
>;

export const getAgentVisibilitySection = (
  agent: VisibleAgent,
  currentUserId?: string,
): AgentVisibilitySection => {
  if (currentUserId && agent.createdBy === currentUserId) return 'mine';
  if (agent.visibility === 'shared') return 'shared';
  if (!agent.visibility || agent.visibility === 'organization') {
    return 'organization';
  }
  return 'private';
};

export const getAgentVisibilityBadges = (
  agent: VisibleAgent,
  currentUserId?: string,
): AgentVisibilityBadge[] => {
  if (!agent.visibility || agent.visibility === 'organization') {
    return ['everyone'];
  }
  if (agent.visibility === 'private') {
    return currentUserId && agent.createdBy === currentUserId
      ? ['only-me']
      : ['private'];
  }

  return agent.audienceUserIds.length ? ['direct'] : ['shared'];
};

export const groupAgentsByVisibility = <TAgent extends VisibleAgent>(
  agents: readonly TAgent[],
  currentUserId?: string,
): Record<AgentVisibilitySection, TAgent[]> => {
  const groups: Record<AgentVisibilitySection, TAgent[]> = {
    mine: [],
    shared: [],
    organization: [],
    private: [],
  };
  agents.forEach((agent) => {
    groups[getAgentVisibilitySection(agent, currentUserId)].push(agent);
  });
  return groups;
};
