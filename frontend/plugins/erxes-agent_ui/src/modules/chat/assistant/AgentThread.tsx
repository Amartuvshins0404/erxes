import {
  ThreadPrimitive,
  useComposerRuntime,
  useThread,
} from '@assistant-ui/react';
import { IconChevronDown } from '@tabler/icons-react';
import { ThinkingOrb } from 'thinking-orbs';
import { Badge, Skeleton } from 'erxes-ui';
import { AgentMark } from '~/modules/chat/components/Avatars';
import { AgentMessage } from '~/modules/chat/assistant/AgentMessage';
import { focusAgentComposer } from '~/modules/chat/assistant/chatContexts';
import type { IChatAgent } from '~/modules/chat/hooks/useChatAgents';

// Thinking orb shown while the turn runs but no assistant message exists yet —
// once the assistant message streams, its inline parts (reasoning, tool status
// rows) carry the live status.
const ThinkingRow = () => {
  const lastRole = useThread((s) => s.messages[s.messages.length - 1]?.role);
  if (lastRole === 'assistant') return null;
  return (
    <div className="mx-auto flex w-full max-w-3xl items-center gap-3 py-2">
      <ThinkingOrb state="working" size={64} aria-label="Thinking" />
      <span className="ea-shimmer-text text-sm font-medium">Thinking…</span>
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
    <div className="ea-thread-bottom flex grow flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4">
        <AgentMark size="lg" />
        <h1 className="text-2xl leading-7 font-normal">
          {agent.accountName}
        </h1>
        {agent.accountDescription && (
          <p className="max-w-sm text-sm text-muted-foreground">
            {agent.accountDescription}
          </p>
        )}
        <Badge variant="secondary" className="font-mono text-xs">
          {agent.provider === agent.model
            ? agent.model
            : `${agent.provider} · ${agent.model}`}
        </Badge>
        <div className="mt-2 flex flex-wrap justify-center gap-2 max-w-md">
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
    </div>
  );
};

// The assistant-ui thread in the ChatGPT-clone layout: centered max-w-3xl
// column, generous gaps, a floating jump-to-latest pill — all stock
// primitives, no custom scroll math.
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
    <ThreadPrimitive.Viewport className="ea-scroll flex grow flex-col gap-8 overflow-y-auto px-4 pt-8 pb-4">
      {messagesLoading ? (
        <div className="mx-auto w-full max-w-3xl space-y-3 p-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 ea-w-2-3 rounded-2xl" />
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
    </ThreadPrimitive.Viewport>
    <ThreadPrimitive.ScrollToBottom asChild>
      <button
        type="button"
        aria-label="Scroll to bottom"
        className="absolute bottom-4 right-4 z-10 flex items-center justify-center rounded-full border border-border bg-background p-2 shadow-sm transition-colors ea-hover-border-primary-40 hover:text-primary"
      >
        <IconChevronDown className="size-4" />
      </button>
    </ThreadPrimitive.ScrollToBottom>
  </ThreadPrimitive.Root>
);
