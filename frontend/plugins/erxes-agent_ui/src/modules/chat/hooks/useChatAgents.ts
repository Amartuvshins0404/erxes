import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import {
  MASTRA_AGENTS,
  MASTRA_ATTACHMENT_STORAGE_STATUS,
} from '~/graphql/queries';

export interface IChatAgent {
  _id: string;
  accountName: string;
  accountDescription?: string;
  createdBy?: string | null;
  visibility?: 'private' | 'shared' | 'organization';
  audienceUserIds: string[];
  audienceTeamIds: string[];
  audienceDepartmentIds: string[];
  model?: string;
  provider?: string;
  // Full settings — present on the MASTRA_AGENTS payload, used by the in-chat
  // "Edit agent" modal so it can populate without a second fetch.
  instructions?: string;
  permissionGroupIds: string[];
  additionalTools?: string[] | null;
  destructiveOps?: 'allow' | 'ask';
  memoryEnabled?: boolean;
  // When on, the chat shows this agent's full tool-call trace; off (default)
  // shows only the turn summary that expands to the short thoughts.
  debug?: boolean;
  temperature?: number | null;
  isActive: boolean;
}

interface MastraAgentsResponse {
  mastraAgents?: IChatAgent[];
}

interface AttachmentStorageStatusResponse {
  mastraAttachmentStorageStatus?: { enabled?: boolean };
}

// Enabled agents for the chat rail.
export const useChatAgents = () => {
  const { data, loading } = useQuery<MastraAgentsResponse>(MASTRA_AGENTS);
  // Memoized so the array keeps a stable identity across streamed-token
  // re-renders — the memoized AgentRail depends on it not changing per chunk.
  const agents = useMemo(
    () => (data?.mastraAgents ?? []).filter((agent) => agent.isActive),
    [data],
  );
  return { agents, loading };
};

// Whether file attachments are usable: instance storage configured AND the
// plugin toggle on. When off, the chat is text-only (no attach button).
export const useAttachmentsEnabled = (): boolean => {
  const { data } = useQuery<AttachmentStorageStatusResponse>(
    MASTRA_ATTACHMENT_STORAGE_STATUS,
  );
  return !!data?.mastraAttachmentStorageStatus?.enabled;
};
