// Chat is the default sidebar mode; Workflow browses definitions owned by the
// selected agent. Both mode and selected workflow are deep-linkable.
export type ChatMode = 'chat' | 'workflow';

const MODE_PARAM = 'mode';
const WORKFLOW_PARAM = 'workflow';

export const readChatMode = (params: URLSearchParams): ChatMode =>
  params.get(MODE_PARAM) === 'workflow' ? 'workflow' : 'chat';

export const readWorkflowParam = (
  params: URLSearchParams,
): string | undefined => params.get(WORKFLOW_PARAM) || undefined;

export const withChatMode = (
  prev: URLSearchParams,
  mode: ChatMode,
): URLSearchParams => {
  const next = new URLSearchParams(prev.toString());
  if (mode === 'workflow') {
    next.set(MODE_PARAM, 'workflow');
  } else {
    next.delete(MODE_PARAM);
    next.delete(WORKFLOW_PARAM);
  }
  return next;
};

export const withWorkflowParam = (
  prev: URLSearchParams,
  workflowId: string | undefined,
): URLSearchParams => {
  const next = new URLSearchParams(prev.toString());
  if (workflowId) next.set(WORKFLOW_PARAM, workflowId);
  else next.delete(WORKFLOW_PARAM);
  return next;
};
