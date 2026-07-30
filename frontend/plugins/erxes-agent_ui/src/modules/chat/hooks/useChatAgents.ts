import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import {
  MASTRA_AGENTS,
  MASTRA_ATTACHMENT_STORAGE_STATUS,
  MASTRA_VOICE_STATUS,
} from '~/graphql/queries';
import { usePermissionCheck } from 'ui-modules';
import { ERXES_AGENT_ACTIONS } from '~/permissions';
import type { IMastraAgentCapabilities } from '~/pages/agents/types';

export interface IChatAgent {
  _id: string;
  agentId: string;
  name: string;
  model?: string;
  provider?: string;
  description?: string;
  isEnabled?: boolean;
  capabilities?: IMastraAgentCapabilities | null;
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
  const { hasActionPermission, isLoaded } = usePermissionCheck();
  const canReadStatus =
    isLoaded && hasActionPermission(ERXES_AGENT_ACTIONS.settings.statusRead);
  const { data } = useQuery<AttachmentStorageStatusResponse>(
    MASTRA_ATTACHMENT_STORAGE_STATUS,
    { skip: !canReadStatus },
  );
  return !!data?.mastraAttachmentStorageStatus?.enabled;
};

// Whether voice mode is usable: the backend resolved an OpenAI key and the
// feature isn't disabled. When off, the chat hides the voice mode entry point.
export const useVoiceEnabled = (): boolean => {
  const { hasActionPermission, isLoaded } = usePermissionCheck();
  const canReadStatus =
    isLoaded && hasActionPermission(ERXES_AGENT_ACTIONS.settings.statusRead);
  const { data } = useQuery<VoiceStatusResponse>(MASTRA_VOICE_STATUS, {
    skip: !canReadStatus,
  });
  return !!data?.mastraVoiceStatus?.enabled;
};
