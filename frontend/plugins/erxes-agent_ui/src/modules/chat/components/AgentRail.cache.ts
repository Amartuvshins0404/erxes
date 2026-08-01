import type { ApolloCache } from '@apollo/client';
import { MASTRA_AGENTS } from '~/graphql/queries';
import type { IChatAgent } from '~/modules/chat/hooks/useChatAgents';
interface AgentsResponse {
  mastraAgents?: IChatAgent[];
}
export const updateAgentRailCache = (
  cache: ApolloCache<unknown>,
  updatedAgent: IChatAgent,
) => {
  cache.updateQuery<AgentsResponse>({ query: MASTRA_AGENTS }, (current) => {
    if (!current?.mastraAgents) return current;
    return {
      mastraAgents: current.mastraAgents.map((agent) =>
        agent._id === updatedAgent._id ? updatedAgent : agent,
      ),
    };
  });
  cache.evict({ fieldName: 'mastraAgentsMain' });
};
