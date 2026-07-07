import { MASTRA_WORKFLOWS } from '~/graphql/queries';
import { useResourceList } from '~/components/useResourceList';
import { IWorkflow, IWorkflowsQueryResponse } from '../types';

/**
 * All workflows for the list page. Network-only so the table reflects edits.
 * `agentId` scopes the list to a single agent (the per-agent Workflows tab).
 */
export const useWorkflows = (agentId?: string) => {
  const { items, loading, error, refetch } = useResourceList<
    IWorkflowsQueryResponse,
    IWorkflow
  >(
    MASTRA_WORKFLOWS,
    (data) => data?.mastraWorkflows ?? [],
    agentId ? { agentId } : undefined,
  );

  return { workflows: items, loading, error, refetch };
};
