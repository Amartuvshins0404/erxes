interface ManagedAssistantAgentCandidate {
  name?: string | null;
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

  const provisioning = agent.provisioning;

  return !!(
    provisioning?.stage ||
    provisioning?.message ||
    provisioning?.startedAt ||
    provisioning?.updatedAt ||
    provisioning?.error
  );
};
