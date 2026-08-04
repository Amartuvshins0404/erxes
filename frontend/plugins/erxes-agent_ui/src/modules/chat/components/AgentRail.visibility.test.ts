import { InMemoryCache } from '@apollo/client';
import { MASTRA_AGENTS } from '~/graphql/queries';
import type { IChatAgent } from '~/modules/chat/hooks/useChatAgents';
import { updateAgentRailCache } from './AgentRail.cache';
import {
  getAgentVisibilityBadges,
  getAgentVisibilitySection,
} from './AgentRail.visibility';

interface CachedChatAgent extends IChatAgent {
  __typename: 'MastraAgent';
  skills: string[];
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
  audienceTeamIds: [],
  audienceDepartmentIds: [],
  permissionGroupIds: [],
  instructions: '',
  provider: 'openai',
  model: 'gpt-4.1',
  skills: [],
  additionalTools: [],
  destructiveOps: 'ask',
  memoryEnabled: true,
  debug: false,
  maxSteps: 10,
  temperature: null,
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

  it('shows each configured audience for a shared agent', () => {
    const sharedAgent: CachedChatAgent = {
      ...ownedAgent,
      createdBy: 'another-user',
      visibility: 'shared',
      audienceUserIds: ['current-user'],
      audienceTeamIds: ['team-1'],
      audienceDepartmentIds: ['department-1'],
    };

    expect(getAgentVisibilitySection(sharedAgent, 'current-user')).toBe(
      'shared',
    );
    expect(getAgentVisibilityBadges(sharedAgent, 'current-user')).toEqual([
      'direct',
      'team',
      'department',
    ]);
  });

  it('moves an edited agent from Everyone to Shared immediately', () => {
    const cache = new InMemoryCache();
    const visibleAgent: CachedChatAgent = {
      ...ownedAgent,
      createdBy: 'another-user',
    };
    cache.writeQuery<{ mastraAgents: CachedChatAgent[] }>({
      query: MASTRA_AGENTS,
      data: { mastraAgents: [visibleAgent] },
    });

    const sharedAgent: CachedChatAgent = {
      ...visibleAgent,
      visibility: 'shared',
      audienceTeamIds: ['team-1'],
      updatedAt: '2026-08-01T00:01:00.000Z',
    };
    updateAgentRailCache(cache, sharedAgent);

    const result = cache.readQuery<{ mastraAgents: CachedChatAgent[] }>({
      query: MASTRA_AGENTS,
    });
    const updatedAgent = result?.mastraAgents[0];
    expect(updatedAgent).toBeDefined();
    if (!updatedAgent) throw new Error('Updated agent was not cached');
    expect(getAgentVisibilitySection(updatedAgent, 'current-user')).toBe(
      'shared',
    );
    expect(getAgentVisibilityBadges(updatedAgent, 'current-user')).toEqual([
      'team',
    ]);
  });
});
