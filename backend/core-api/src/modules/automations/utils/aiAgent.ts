import { sendWorkerQueue } from 'erxes-api-shared/utils';

type TObjectWithToObject = {
  toObject?: () => unknown;
};

type TAiAgentConnectionView = {
  connectionId?: string;
  model?: string;
};

export type TAiAgentMutationDoc = Record<string, unknown> & {
  connection?: TAiAgentConnectionView;
};

const toPlainObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const candidate = value as TObjectWithToObject;

  return (
    typeof candidate.toObject === 'function'
      ? candidate.toObject()
      : value
  ) as Record<string, unknown>;
};

export const toAiAgentView = <T extends Record<string, unknown>>(
  agent: unknown,
): T => {
  const plain = toPlainObject(agent);
  const connection = plain.connection as TAiAgentConnectionView | undefined;

  return {
    ...plain,
    connection: {
      connectionId: connection?.connectionId,
      model: connection?.model,
    },
  } as unknown as T;
};

export const scheduleAiAgentKnowledgeIndex = async ({
  subdomain,
  agentId,
  fileId,
}: {
  subdomain: string;
  agentId: string;
  fileId?: string;
}) => {
  try {
    await sendWorkerQueue('automations', 'aiAgent').add(
      'indexAiAgentKnowledge',
      {
        subdomain,
        data: { agentId, fileId },
      },
      {
        attempts: 2,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  } catch (error) {
    console.error(
      `Failed to schedule AI agent knowledge indexing for ${agentId}:`,
      error,
    );
  }
};
