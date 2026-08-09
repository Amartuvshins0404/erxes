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
  model?: string;
  provider?: string;
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
