import {
  ThreadPrimitive,
  useComposerRuntime,
  useThread,
} from '@assistant-ui/react';
import { IconArrowDown } from '@tabler/icons-react';
import { Badge, Skeleton } from 'erxes-ui';
import { AgentAvatar, AgentMark } from '~/modules/chat/components/Avatars';
import { AgentMessage } from '~/modules/chat/assistant/AgentMessage';
import { focusAgentComposer } from '~/modules/chat/assistant/chatContexts';
import type { IChatAgent } from '~/modules/chat/hooks/useChatAgents';

// Dots row shown while the turn runs but no assistant message exists yet —
// once the assistant message streams, its inline parts carry the status.
const ThinkingRow = () => {
  const lastRole = useThread(
    (s) => s.messages[s.messages.length - 1]?.role,
  );
  if (lastRole === 'assistant') return null;
  return (
    <div className="flex justify-start items-start gap-3">
      <AgentAvatar live />
      <div className="flex items-center gap-1.5 py-2">
        <span className="ea-typing-dot" />
        <span className="ea-typing-dot" />
        <span className="ea-typing-dot" />
      </div>
    </div>
  );
};

const ThreadEmptyState = ({
  agent,
  attachmentsEnabled,
}: {
  agent: IChatAgent;
  attachmentsEnabled: boolean;
}) => {
  const composerRuntime = useComposerRuntime();
  // A suggestion fills the composer instead of sending — the user can edit
  // first; the send path (attachment staging, body extras) stays single.
  const pick = (text: string) => {
    composerRuntime.setText(text);
    focusAgentComposer();
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] text-center gap-3 ea-msg-in">
      <AgentMark size="lg" />
      <div className="space-y-1">
        <p className="text-xl font-semibold tracking-tight">
          {agent.accountName}
        </p>
        {agent.accountDescription && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {agent.accountDescription}
          </p>
        )}
      </div>
      <Badge variant="secondary" className="font-mono text-xs mt-1">
        {agent.provider === agent.model
          ? agent.model
          : `${agent.provider} · ${agent.model}`}
      </Badge>
      <div className="mt-3 flex flex-wrap justify-center gap-2 max-w-md">
        {[
          'What can you do?',
          'Summarize my open tickets',
          attachmentsEnabled
            ? 'Read the file I attach and summarize it'
            : 'List the latest customers',
        ].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => pick(s)}
            className="ea-pop ea-suggestion"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

// The assistant-ui thread: viewport (auto-scroll), messages with our renderers,
// a jump-to-latest affordance — all stock primitives, no custom scroll math.
export const AgentThread = ({
  agent,
  messagesLoading,
  attachmentsEnabled,
}: {
  agent: IChatAgent;
  messagesLoading: boolean;
  attachmentsEnabled: boolean;
}) => (
  <ThreadPrimitive.Root className="relative flex-1 flex flex-col min-h-0">
    <ThreadPrimitive.Viewport className="ea-scroll flex-1 overflow-y-auto p-4">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {messagesLoading ? (
          <div className="p-2 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-2/3 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <ThreadPrimitive.Empty>
              <ThreadEmptyState
                agent={agent}
                attachmentsEnabled={attachmentsEnabled}
              />
            </ThreadPrimitive.Empty>
            <ThreadPrimitive.Messages components={{ Message: AgentMessage }} />
            <ThreadPrimitive.If running>
              <ThinkingRow />
            </ThreadPrimitive.If>
          </>
        )}
      </div>
    </ThreadPrimitive.Viewport>
    <ThreadPrimitive.ScrollToBottom asChild>
      <button
        type="button"
        className="ea-pop absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-full border border-border bg-background/95 backdrop-blur px-3 py-1.5 text-xs shadow-md hover:border-primary/40 hover:text-primary transition-colors"
      >
        <IconArrowDown className="size-3.5" />
        Latest
      </button>
    </ThreadPrimitive.ScrollToBottom>
  </ThreadPrimitive.Root>
);
