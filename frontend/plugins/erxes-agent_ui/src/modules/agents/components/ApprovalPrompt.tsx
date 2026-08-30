import { IconCheck, IconX } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { useState } from 'react';

import { BloubBot } from './BloubBot';
import { ChatInput } from './ChatInput';
import { describeToolCall, type IToolCallView } from './ToolCallCard';

export interface IApprovalPromptProps {
  tool: IToolCallView;
  busy: boolean;
  onRespond: (decision: { approved: boolean; reason?: string }) => void;
}

/**
 * Inline confirmation for a destructive tool call. The run is suspended
 * server-side until the user decides; approving or declining records the
 * decision on the tool part, and the framework automatically resumes the run
 * through the transport's approval endpoint.
 */
export const ApprovalPrompt = ({ tool, busy, onRespond }: IApprovalPromptProps) => {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const { label, args } = describeToolCall(tool.toolName, tool.input);

  const argsText = (() => {
    try {
      const text = JSON.stringify(args, null, 2);
      return text && text !== '{}' ? text : null;
    } catch {
      return null;
    }
  })();

  return (
    <div className="my-1 rounded-xl border bg-destructive/5 p-3 text-foreground">
      <div className="flex items-start gap-2">
        {/* The bot raises its "!" state: the run is held until you decide. */}
        <BloubBot size={32} state="alert" className="-mt-1 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Confirm this action</p>
          <p className="mt-0.5 break-all text-xs font-semibold">{label}</p>
          {argsText && (
            <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-black/5 p-2 text-xs dark:bg-white/10">
              {argsText}
            </pre>
          )}

          {declining ? (
            <div className="mt-2 space-y-2">
              <div className="rounded-lg border bg-card px-3 py-2">
                <ChatInput
                  value={reason}
                  onChange={setReason}
                  placeholder="Optional reason (shared with the assistant)"
                  disabled={busy}
                  maxHeight={96}
                  className="text-xs md:text-xs"
                  ariaLabel="Decline reason"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={() =>
                    onRespond({
                      approved: false,
                      reason: reason.trim() || undefined,
                    })
                  }
                >
                  <IconX />
                  Decline
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setDeclining(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                disabled={busy}
                onClick={() => onRespond({ approved: true })}
              >
                <IconCheck />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => setDeclining(true)}
              >
                <IconX />
                Decline
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
