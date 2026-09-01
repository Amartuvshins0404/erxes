import { IconCheck, IconLoader2, IconTool, IconX } from '@tabler/icons-react';
import { Badge, Collapsible, Spinner } from 'erxes-ui';
import { useState } from 'react';

import type { ICallToolInput } from '../types';

/** Normalized view of any tool UI part (live stream or mapped history). */
export interface IToolCallView {
  toolCallId: string;
  toolName: string;
  state: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  approval?: { id: string; approved?: boolean; reason?: string };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/**
 * The agents' executable tool is `callTool`, whose input wraps the real
 * platform tool id and arguments. Surface the inner tool id as the label so
 * the user sees the actual action, not the generic bridge name.
 */
export const describeToolCall = (
  toolName: string,
  input: unknown,
): { label: string; args: unknown } => {
  if (toolName === 'callTool' && isRecord(input)) {
    const callInput = input as ICallToolInput;

    if (typeof callInput.toolId === 'string' && callInput.toolId) {
      return { label: callInput.toolId, args: callInput.input ?? {} };
    }
  }

  return { label: toolName, args: input };
};

const formatJson = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2) ?? '';
  } catch {
    return String(value);
  }
};

const JsonBlock = ({ value }: { value: unknown }) => {
  const text = formatJson(value);

  if (!text || text === '{}' || text === '""') {
    return null;
  }

  return (
    <pre className="mt-1 max-h-48 overflow-auto rounded-md bg-muted p-2 text-xs">
      {text}
    </pre>
  );
};

/**
 * Renders one tool invocation inside an assistant message. Approval states
 * are rendered by `ApprovalPrompt`; this card covers execution states.
 */
export const ToolCallCard = ({ tool }: { tool: IToolCallView }) => {
  const [open, setOpen] = useState(false);
  const { label, args } = describeToolCall(tool.toolName, tool.input);

  const isRunning =
    tool.state === 'input-streaming' || tool.state === 'input-available';
  const isDone = tool.state === 'output-available';
  const isError = tool.state === 'output-error';
  const isDenied = tool.state === 'output-denied';
  const isApproved = tool.state === 'approval-responded';

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="my-1 rounded-md border bg-muted/40 text-foreground">
        <Collapsible.Trigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs"
          >
            {isRunning ? (
              <Spinner className="size-3.5" />
            ) : isError || isDenied ? (
              <IconX className="size-3.5 shrink-0 text-destructive" />
            ) : isDone || isApproved ? (
              <IconCheck className="size-3.5 shrink-0 text-emerald-600" />
            ) : (
              <IconTool className="size-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate font-medium">{label}</span>
            {isRunning && (
              <span className="ml-auto flex items-center gap-1 text-muted-foreground">
                <IconLoader2 className="size-3 animate-spin" />
              </span>
            )}
            {isDenied && <Badge variant="destructive">Declined</Badge>}
            {isError && <Badge variant="destructive">Failed</Badge>}
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content className="px-3 pb-2">
          <JsonBlock value={args} />
          {isDone && <JsonBlock value={tool.output} />}
          {isError && (
            <p className="mt-1 text-xs text-destructive">
              {tool.errorText ?? 'Tool execution failed.'}
            </p>
          )}
          {isDenied && tool.approval?.reason && (
            <p className="mt-1 text-xs text-muted-foreground">
              {tool.approval.reason}
            </p>
          )}
        </Collapsible.Content>
      </div>
    </Collapsible>
  );
};
