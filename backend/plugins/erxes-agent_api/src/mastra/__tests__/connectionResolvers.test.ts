jest.mock('~/mastra/agentRuntime', () => ({
  invalidateAgentCache: jest.fn(),
}));

import mongoose from 'mongoose';
import { loadClasses } from '~/connectionResolvers';

describe('AI team-member profile storage', () => {
  it('uses the original agent collection', () => {
    const connection = mongoose.createConnection();
    const models = loadClasses(connection);

    expect(models.MastraAgent.modelName).toBe('mastra_agents');
    expect(models.MastraAgent.collection.collectionName).toBe('mastra_agents');
    expect(connection.models.mastra_agent_profiles).toBeUndefined();
  });
});
