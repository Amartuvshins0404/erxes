import { useQuery } from '@apollo/client';
import { AGENT_ASSISTANT_LIMIT } from '../graphql/queries';

export interface AgentAssistantLimit {
  limited: boolean;
  allowed: boolean;
  limit?: number | null;
  used: number;
  remaining?: number | null;
  hasActivePlan: boolean;
  source?: string | null;
  upgradeUrl?: string | null;
  billingWarning?: AgentAssistantBillingWarning | null;
  billingOverview?: AgentAssistantBillingOverview | null;
}

export interface AgentAssistantBillingWarning {
  active: boolean;
  deletionDue: boolean;
  gracePeriodDays: number;
  daysUntilDeletion: number;
  unpaidSince?: string | null;
  deletionDate?: string | null;
  message: string;
}

export interface AgentAssistantBillingOverviewItem {
  identifierId: string;
  name: string;
  slug: string;
  description?: string | null;
  memberIds: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
  planStartDate?: string | null;
  planEndDate?: string | null;
  paymentStatus: string;
  blocked: boolean;
  overdueDays: number;
  message: string;
}

export interface AgentAssistantBillingOverview {
  active: boolean;
  blocked: boolean;
  overdueCount: number;
  billingUrl?: string | null;
  message: string;
  items: AgentAssistantBillingOverviewItem[];
}

interface AgentAssistantLimitQuery {
  agentAssistantLimit: AgentAssistantLimit | null;
}

export const useAgentAssistantLimit = (enabled: boolean) => {
  const { data, loading, refetch } = useQuery<AgentAssistantLimitQuery>(
    AGENT_ASSISTANT_LIMIT,
    {
      skip: !enabled,
      fetchPolicy: 'network-only',
    },
  );

  return {
    limit: data?.agentAssistantLimit || null,
    loading,
    refetch,
  };
};
