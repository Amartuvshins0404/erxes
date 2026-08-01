import type { IChatAgent } from '~/modules/chat/hooks/useChatAgents';

export type AgentVisibilitySection =
  | 'mine'
  | 'shared'
  | 'organization'
  | 'private';

export type AgentVisibilityBadge =
  | 'only-me'
  | 'direct'
  | 'team'
  | 'department'
  | 'everyone'
  | 'private'
  | 'shared';

type VisibleAgent = Pick<
  IChatAgent,
  | 'createdBy'
  | 'visibility'
  | 'audienceUserIds'
  | 'audienceTeamIds'
  | 'audienceDepartmentIds'
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

  const badges: AgentVisibilityBadge[] = [];
  if (agent.audienceUserIds.length) badges.push('direct');
  if (agent.audienceTeamIds.length) badges.push('team');
  if (agent.audienceDepartmentIds.length) badges.push('department');
  return badges.length ? badges : ['shared'];
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
