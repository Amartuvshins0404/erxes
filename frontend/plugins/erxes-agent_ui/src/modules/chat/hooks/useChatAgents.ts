import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import {
  MASTRA_AGENTS,
  MASTRA_ATTACHMENT_STORAGE_STATUS,
  MASTRA_VOICE_STATUS,
} from '~/graphql/queries';

export interface IChatAgent {
  _id: string;
  agentId: string;
  name: string;
  model?: string;
  provider?: string;
  description?: string;
  isEnabled?: boolean;
  // Full settings — present on the MASTRA_AGENTS payload, used by the in-chat
  // "Edit agent" modal so it can populate without a second fetch.
  instructions?: string;
  toolPolicy?: string;
  allowedTools?: string[];
  destructiveOps?: 'allow' | 'ask';
  memoryEnabled?: boolean;
  // When on, the chat shows this agent's full tool-call trace; off (default)
  // shows only the turn summary that expands to the short thoughts.
  debug?: boolean;
  maxSteps?: number;
  temperature?: number | null;
  visibility?: 'private' | 'team' | 'department' | 'unit' | 'org';
  teamId?: string | null;
  departmentId?: string | null;
  unitId?: string | null;
}

interface MastraAgentsResponse {
  mastraAgents?: IChatAgent[];
}

interface AttachmentStorageStatusResponse {
  mastraAttachmentStorageStatus?: { enabled?: boolean };
}

interface VoiceStatusResponse {
  mastraVoiceStatus?: { enabled?: boolean };
}

// Enabled agents for the chat rail.
export const useChatAgents = () => {
  const { data, loading } = useQuery<MastraAgentsResponse>(MASTRA_AGENTS);
  // Memoized so the array keeps a stable identity across streamed-token
  // re-renders — the memoized AgentRail depends on it not changing per chunk.
  const agents = useMemo(
    () => (data?.mastraAgents ?? []).filter((a) => a.isEnabled),
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

// Whether voice mode is usable: the backend resolved an OpenAI key and the
// feature isn't disabled. When off, the chat hides the voice mode entry point.
export const useVoiceEnabled = (): boolean => {
  const { data } = useQuery<VoiceStatusResponse>(MASTRA_VOICE_STATUS);
  return !!data?.mastraVoiceStatus?.enabled;
};
