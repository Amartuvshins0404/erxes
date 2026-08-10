import type { IChatAgent } from '~/modules/chat/hooks/useChatAgents';
import {
  getAgentVisibilityBadges,
  getAgentVisibilitySection,
} from './AgentRail.visibility';

interface CachedChatAgent extends IChatAgent {
  __typename: 'MastraAgent';
  additionalTools: string[];
  createdAt: string;
  updatedAt: string;
}

const ownedAgent: CachedChatAgent = {
  __typename: 'MastraAgent',
  _id: 'agent-1',
  accountName: 'Finance assistant',
  accountDescription: '',
  createdBy: 'current-user',
  visibility: 'organization',
  audienceUserIds: [],
  permissionGroupIds: [],
  instructions: '',
  provider: 'openai',
  model: 'gpt-4.1',
  additionalTools: [],
  isActive: true,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

describe('agent rail visibility', () => {
  it('keeps owned agents under Mine while showing who can use them', () => {
    expect(getAgentVisibilitySection(ownedAgent, 'current-user')).toBe('mine');
    expect(getAgentVisibilityBadges(ownedAgent, 'current-user')).toEqual([
      'everyone',
    ]);
  });

  it('shows direct people for a shared agent', () => {
    const sharedAgent: CachedChatAgent = {
      ...ownedAgent,
      createdBy: 'another-user',
      visibility: 'shared',
      audienceUserIds: ['current-user'],
    };

    expect(getAgentVisibilitySection(sharedAgent, 'current-user')).toBe(
      'shared',
    );
    expect(getAgentVisibilityBadges(sharedAgent, 'current-user')).toEqual([
      'direct',
    ]);
  });
});
