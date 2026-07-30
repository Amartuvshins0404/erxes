import { useState } from 'react';
import { Collapsible } from 'erxes-ui';
import { AgentUIMessage } from '~/modules/chat/types';
import { asToolPart } from '~/modules/chat/lib/uiParts';
import { ThinkingSection } from '~/modules/chat/components/ThinkingSection';
import { ToolCallRow } from '~/modules/chat/components/ToolCallRow';

type MessagePart = AgentUIMessage['parts'][number];

// The assistant's reasoning + tool calls rendered as one vertical run timeline:
// a rail with a status node per step. Open while the turn streams so the user
// watches progress live; folds to the one-line summary once it settles, and
// stays user-toggleable in between.
export const AgentTrace = ({
  parts,
  streaming,
}: {
  parts: MessagePart[];
  streaming: boolean;
}) => {
  // Open while the turn streams so the user watches each step append downward;
  // it then stays as the user left it (no auto-collapse — folding N steps back
  // to one line on finish was itself a jump). A reloaded, settled turn mounts
  // with streaming=false, so history starts tidy and collapsed.
  const [open, setOpen] = useState(streaming);

  const stepCount = parts.length;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-3">
      <Collapsible.TriggerButton className="h-auto w-auto gap-1.5 px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground">
        <Collapsible.TriggerIcon className="size-3 shrink-0" />
        {streaming ? (
          <span className="ea-shimmer-text font-medium">Working…</span>
        ) : (
          <span>Thought process</span>
        )}
        {stepCount > 0 && (
          <span className="font-mono opacity-50">
            · {stepCount} step{stepCount !== 1 ? 's' : ''}
          </span>
        )}
      </Collapsible.TriggerButton>
      <Collapsible.Content>
        <ol className="ea-trace mt-1.5">
          {parts.map((part, i) => {
            const tool = asToolPart(part);
            if (tool) {
              const running = tool.pending && streaming;
              return (
                <li className="ea-step" key={tool.toolCallId ?? `tool-${i}`}>
                  <span className="ea-step-rail" aria-hidden>
                    <span
                      className={`ea-node ea-node-tool ${running ? 'is-running' : ''} ${
                        tool.isError ? 'is-error' : ''
                      }`}
                    />
                  </span>
                  <div className="ea-step-body">
                    <ToolCallRow call={tool} streaming={streaming} />
                  </div>
                </li>
              );
            }
            if (part.type === 'reasoning') {
              const live = streaming && part.state === 'streaming';
              return (
                <li className="ea-step" key={`reasoning-${i}`}>
                  <span className="ea-step-rail" aria-hidden>
                    <span className="ea-node ea-node-reason" />
                  </span>
                  <div className="ea-step-body">
                    <ThinkingSection text={part.text} live={live} />
                  </div>
                </li>
              );
            }
            return null;
          })}
        </ol>
      </Collapsible.Content>
    </Collapsible>
  );
};
