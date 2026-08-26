interface ManagedAssistantAgentCandidate {
  name?: string | null;
  provider?: string | null;
  transferredAt?: string | null;
  transferredFromSubdomain?: string | null;
  provisioning?: {
    stage?: string | null;
    message?: string | null;
    startedAt?: string | null;
    updatedAt?: string | null;
    error?: string | null;
  } | null;
}

const MANAGED_ASSISTANT_NAME_PREFIX = 'assistant-managed-';

export const isManagedAssistantAgent = (
  agent?: ManagedAssistantAgentCandidate | null,
) => {
  if (!agent) {
    return false;
  }

  if (agent.name?.startsWith(MANAGED_ASSISTANT_NAME_PREFIX)) {
    return true;
  }

  // Transferred assistants link an already-provisioned managed runtime, so
  // they carry no provisioning history of their own — recognize them by the
  // transfer markers and the provider connection the transfer bundle set.
  // This mirrors the backend's own managed test (provider || provisioning),
  // which already lets these records through.
  if (agent.provider || agent.transferredAt || agent.transferredFromSubdomain) {
    return true;
  }

  const provisioning = agent.provisioning;

  return !!(
    provisioning?.stage ||
    provisioning?.message ||
    provisioning?.startedAt ||
    provisioning?.updatedAt ||
    provisioning?.error
  );
};
