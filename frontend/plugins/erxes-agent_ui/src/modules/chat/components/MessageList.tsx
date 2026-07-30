import { RefObject } from 'react';
import { Badge, Skeleton } from 'erxes-ui';
import { AgentUIMessage, ChatAttachment } from '~/modules/chat/types';
import { Artifact } from '~/modules/chat/lib/artifacts';
import { IChatAgent } from '~/modules/chat/hooks/useChatAgents';
import { MessageBubble } from '~/modules/chat/components/MessageBubble';
import { AgentMark, WaitingIndicator } from '~/modules/chat/components/Avatars';

export const MessageList = ({
  agent,
  messages,
  messagesLoading,
  chatLoading,
  attachmentsEnabled,
  ratingEnabled,
  boxRef,
  endRef,
  onScroll,
  onSuggestion,
  onRegenerate,
  onRate,
  onEditMessage,
  onResendMessage,
  storeArtifactsByMessage,
  debug,
}: {
  agent: IChatAgent;
  messages: AgentUIMessage[];
  messagesLoading: boolean;
  chatLoading: boolean;
  attachmentsEnabled: boolean;
  ratingEnabled: boolean;
  boxRef: RefObject<HTMLDivElement>;
  endRef: RefObject<HTMLDivElement>;
  onScroll: () => void;
  onSuggestion: (text: string) => void;
  onRegenerate: () => void;
  onRate: (messageId: string, rating: 1 | -1) => void;
  onEditMessage: (text: string) => void;
  onResendMessage: (text: string, attachments: ChatAttachment[]) => void;
  // Persisted artifacts per assistant message id — re-renders inline cards on
  // reload (the live message's own tool parts take priority while streaming).
  storeArtifactsByMessage?: Map<string, Artifact[]>;
  // The agent's debug setting — controls how much of the trace each turn shows.
  debug?: boolean;
}) => {
  // Approve/deny replies are sent hidden — they continue a gated turn without a
  // visible user bubble.
  const visible = messages.filter(
    (m) => !(m.role === 'user' && m.metadata?.hidden),
  );
  const lastMsg = visible[visible.length - 1];

  return (
    <div
      ref={boxRef}
      onScroll={onScroll}
      className="ea-scroll flex-1 overflow-auto p-4"
    >
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {messagesLoading ? (
          <div className="p-2 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-2/3 rounded-2xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
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
                  onClick={() => onSuggestion(s)}
                  className="ea-pop ea-suggestion"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {visible.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isLast={i === visible.length - 1}
                chatLoading={chatLoading}
                ratingEnabled={ratingEnabled}
                onRegenerate={onRegenerate}
                onRate={onRate}
                onEditMessage={onEditMessage}
                onResendMessage={onResendMessage}
                storeArtifacts={
                  msg.metadata?.messageId
                    ? storeArtifactsByMessage?.get(msg.metadata.messageId)
                    : undefined
                }
                debug={debug}
              />
            ))}
            {chatLoading && lastMsg?.role !== 'assistant' && (
              <WaitingIndicator />
            )}
          </>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};
