import type { RequestContext } from '@mastra/core/request-context' with {
  'resolution-mode': 'import',
};

import type { IAgentsThinkingLevel } from '@/agents/modelThinking';
import type { AgentsApprovalMode } from '@/agents/@types/settings';
import type { IAgentsToolContext } from '@/agents/tools';

export interface IAgentsNavigationEntry {
  path: string;
  label: string;
  group?: string;
}

export interface IAgentsRequestContext extends IAgentsToolContext {
  connectionId: string;
  model: string;
  thinkingLevel: IAgentsThinkingLevel;
  codeModeEnabled: boolean;
  approvalMode: AgentsApprovalMode;
  threadId?: string;
  attachmentUrls?: string[];
  navigation?: IAgentsNavigationEntry[];
}

export type IAgentsRequestContextInstance = RequestContext<IAgentsRequestContext>;

export const buildAgentsRequestContext = async (
  values: IAgentsRequestContext,
): Promise<IAgentsRequestContextInstance> => {
  const { RequestContext: RequestContextCtor } = await import(
    '@mastra/core/request-context'
  );

  const requestContext =
    new RequestContextCtor<IAgentsRequestContext>();

  requestContext.set('subdomain', values.subdomain);
  requestContext.set('userId', values.userId);
  requestContext.set('connectionId', values.connectionId);
  requestContext.set('model', values.model);
  requestContext.set('thinkingLevel', values.thinkingLevel);
  requestContext.set('codeModeEnabled', values.codeModeEnabled);
  requestContext.set('approvalMode', values.approvalMode);
  if (values.threadId) {
    requestContext.set('threadId', values.threadId);
  }
  if (values.attachmentUrls) {
    requestContext.set('attachmentUrls', values.attachmentUrls);
  }
  if (values.navigation) {
    requestContext.set('navigation', values.navigation);
  }

  return requestContext;
};
