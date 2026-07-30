jest.mock('~/mastra/agentRuntime', () => ({
  invalidateAgentCache: jest.fn(),
}));

import mongoose from 'mongoose';
import { loadClasses } from '~/connectionResolvers';

describe('AI team-member profile storage', () => {
  it('isolates canonical account profiles from the legacy agent collection', () => {
    const connection = mongoose.createConnection();
    const models = loadClasses(connection);

    expect(models.MastraAgent.modelName).toBe('mastra_agent_profiles');
    expect(models.MastraAgent.collection.collectionName).toBe(
      'mastra_agent_profiles',
    );
    expect(connection.models.mastra_agents).toBeUndefined();
  });
});
