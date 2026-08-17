import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useToast } from 'erxes-ui';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssistantRuntime } from '@assistant-ui/react';
import type {
  ChatAttachment,
  ApprovedOp,
  ReasoningEffort,
} from '~/modules/chat/types';
import type { IChatAgent } from '~/modules/chat/hooks/useChatAgents';
import { chatStore } from '~/modules/chat/store/chatStore';
import {
  useChatAgents,
  useAttachmentsEnabled,
} from '~/modules/chat/hooks/useChatAgents';
import { useAgentChatView } from '~/modules/chat/hooks/useChatView';
import { useAttachments } from '~/modules/chat/hooks/useAttachments';
import { useThreadArtifacts } from '~/modules/chat/hooks/useThreadArtifacts';
import { ChatPageHeader } from '~/modules/chat/components/ChatPageHeader';
import { DeleteMessagePairDialog } from '~/modules/chat/components/DeleteMessagePairDialog';
import {
  AmbientBackdrop,
  ChatErrorBanner,
  DropOverlay,
  SelectAgentEmpty,
} from '~/modules/chat/components/ChatNotices';
import { ApprovalBar } from '~/modules/chat/components/ApprovalBar';
import { PreviewResizer } from '~/modules/chat/components/PreviewResizer';
import { PreviewPanel } from '~/modules/chat/preview/PreviewPanel';
import { previewStore } from '~/modules/chat/preview/previewStore';
import { pendingApproval } from '~/modules/chat/lib/uiParts';
import { MASTRA_MESSAGE_PAIR_REMOVE } from '~/graphql/mutations';
import { refetchThreadArtifactsIntoCache } from '~/modules/chat/threadsCache';
import { associateArtifacts } from '~/modules/chat/lib/artifacts';
import { AgentThread } from '~/modules/chat/assistant/AgentThread';
import { AgentComposer } from '~/modules/chat/assistant/AgentComposer';
import {
  ChatMessageActionsContext,
  MessageExtrasContext,
} from '~/modules/chat/assistant/chatContexts';
import { buildMessageExtras } from '~/modules/chat/assistant/messageExtras';
import { MastraAgentRuntimeProvider } from '~/modules/chat/runtime/MastraAgentRuntime';
import { ChatRuntimeSync } from '~/modules/chat/runtime/ChatRuntimeSync';
import { AgentChatSidebar } from '~/modules/chat/sidebar/AgentChatSidebar';
import '~/modules/chat/chat.css';

interface PendingMessagePairDelete {
  threadId: string;
  uiMessageId: string;
  persistedMessageId: string;
}

interface MastraMessagePairRemoveResponse {
  mastraMessagePairRemove?: {
    deletedIds?: unknown;
  };
}
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.every((item: unknown) => typeof item === 'string');

// One agent's chat workspace: header, session sidebar, conversation, and the
// artifact preview — all under the agent's remote-thread-list runtime.
const AgentChatWorkspace = ({
  agent,
  agents,
  attachmentsEnabled,
}: {
  agent: IChatAgent;
  agents: IChatAgent[];
  attachmentsEnabled: boolean;
}) => {
  const { t } = useTranslation('mastra');
  const { toast } = useToast();
  const agentId = agent._id;
  const runtime = useAssistantRuntime();
  const apolloClient = useApolloClient();

  const view = useAgentChatView(agentId);

  const {
    activeThreadId,
    reasoningEffort,
    messages,
    loading: chatLoading,
    messagesLoading,
    error: chatError,
    retry,
  } = view;

  const [pendingMessageDelete, setPendingMessageDelete] =
    useState<PendingMessagePairDelete | null>(null);
  const [messageDeleteLoading, setMessageDeleteLoading] = useState(false);

  // The chat↔preview split row — PreviewResizer sets --ea-preview-w on it.
  const splitRef = useRef<HTMLDivElement>(null);

  const attachments = useAttachments(attachmentsEnabled);

  // Artifact Preview panel (charts / generated documents). Switching agent or
  // thread clears any open preview — it belongs to the prior conversation.
  const previewOpen = previewStore((s) => s.open);
  // The split handle only makes sense while the panel is docked beside the
  // chat — in fullscreen the panel is a fixed overlay with nothing to resize.
  const previewFullscreen = previewStore((s) => s.fullscreen);
  useEffect(() => {
    previewStore.getState().close();
  }, [agentId, activeThreadId]);

  // Persisted artifacts for this thread — re-renders the inline chat cards on
  // reload (live tool parts don't survive). Apollo dedupes with the Files panel.
  const { byMessageId, groups: artifactGroups } =
    useThreadArtifacts(activeThreadId);
  const storeArtifactsByMessage = useMemo(
    () => associateArtifacts(messages, byMessageId, artifactGroups),
    [messages, byMessageId, artifactGroups],
  );

  // Per-message extras for the assistant-ui rows (streaming flag, pair ids,
  // merged live+store artifact outcomes).
  const messageExtras = useMemo(
    () => buildMessageExtras(messages, chatLoading, storeArtifactsByMessage),
    [messages, chatLoading, storeArtifactsByMessage],
  );

  // New chat = a fresh draft thread owned by the runtime (synced to the store
  // and URL by ChatRuntimeSync).
  const handleNewThread = useCallback(() => {
    void runtime.threads.switchToNewThread();
  }, [runtime]);

  const handleDeleteMessage = useCallback(
    (uiMessageId: string, persistedMessageId: string) => {
      if (!activeThreadId || chatLoading) return;
      setPendingMessageDelete({
        threadId: activeThreadId,
        uiMessageId,
        persistedMessageId,
      });
    },
    [activeThreadId, chatLoading],
  );

  const confirmDeleteMessage = useCallback(() => {
    if (!agentId || !pendingMessageDelete || messageDeleteLoading) return;
    setMessageDeleteLoading(true);
    void apolloClient
      .mutate<MastraMessagePairRemoveResponse>({
        mutation: MASTRA_MESSAGE_PAIR_REMOVE,
        variables: {
          threadId: pendingMessageDelete.threadId,
          messageId: pendingMessageDelete.persistedMessageId,
        },
      })
      .then(({ data }) => {
        const deletedIds = data?.mastraMessagePairRemove?.deletedIds;
        if (!isStringArray(deletedIds)) {
          throw new Error(t('delete-failed-description'));
        }
        chatStore.discardMessagePair(
          agentId,
          pendingMessageDelete.threadId,
          pendingMessageDelete.uiMessageId,
          deletedIds,
        );
        void refetchThreadArtifactsIntoCache(
          apolloClient,
          pendingMessageDelete.threadId,
        );
        setPendingMessageDelete(null);
        toast({ title: t('prompt-reply-deleted') });
      })
      .catch((error: unknown) => {
        toast({
          title: t('delete-failed'),
          description:
            error instanceof Error
              ? error.message
              : t('delete-failed-description'),
          variant: 'destructive',
        });
      })
      .finally(() => setMessageDeleteLoading(false));
  }, [
    agentId,
    apolloClient,
    messageDeleteLoading,
    pendingMessageDelete,
    t,
    toast,
  ]);

  // Retry a turn that errored mid-stream (drives the error banner's action).
  const handleRetry = useCallback(() => {
    if (chatLoading) return;
    retry();
  }, [retry, chatLoading]);

  const sendMessage = useCallback(
    (
      message: string,
      atts: ChatAttachment[],
      approvedOperations?: ApprovedOp[],
      hidden?: boolean,
    ) => {
      if (!agentId) return;
      // Fire-and-forget: the store holds the Apollo client reference so the
      // request continues even if the user navigates away before it completes.
      chatStore.sendMessage(
        apolloClient,
        agentId,
        agentId,
        message,
        atts,
        approvedOperations,
        hidden,
      );
    },
    [apolloClient, agentId],
  );

  // A destructive op the agent is waiting on (derived from the last turn) — drives
  // the approval bar above the composer. Both actions continue the turn without a
  // visible user bubble (hidden send): Approve replays the gated op, Deny cancels.
  const approval = pendingApproval(messages, chatLoading);

  const handleApprove = () => {
    if (chatLoading || !approval) return;
    sendMessage('Approved.', [], approval.operations, true);
  };

  const handleDeny = () => {
    if (chatLoading) return;
    sendMessage(
      'Cancelled — do not delete or merge anything.',
      [],
      undefined,
      true,
    );
  };

  // The composer's send: upload staged files first, then fire the turn. On any
  // upload failure nothing is sent — the composer keeps its text and chips.
  const handleSend = useCallback(
    async (message: string) => {
      if (!message.trim() || chatLoading || attachments.uploadsInFlight) return;
      const { attachments: atts, ok } = await attachments.uploadAll();
      if (!ok) return;
      attachments.clear();
      sendMessage(message.trim(), atts);
    },
    [chatLoading, attachments, sendMessage],
  );

  // Re-ask the question that produced the last reply (with its attachments).
  const handleRegenerate = useCallback(() => {
    if (chatLoading) return;
    chatStore.regenerate(apolloClient, agentId, agentId);
  }, [apolloClient, agentId, chatLoading]);

  // Send a past user message again as a fresh turn (carries its attachments).
  const handleResendMessage = useCallback(
    (value: string, atts: ChatAttachment[]) => {
      if (chatLoading) return;
      sendMessage(value, atts);
    },
    [sendMessage, chatLoading],
  );

  const handleStop = () => {
    chatStore.stop(apolloClient, agentId);
  };

  const handleReasoningEffortChange = useCallback(
    (effort?: ReasoningEffort) => {
      chatStore.setReasoningEffort(agentId, effort);
    },
    [agentId],
  );

  const messageActions = useMemo(
    () => ({
      onRegenerate: handleRegenerate,
      onDeleteMessage: handleDeleteMessage,
      onResendMessage: handleResendMessage,
    }),
    [handleRegenerate, handleDeleteMessage, handleResendMessage],
  );

  return (
    <>
      <ChatRuntimeSync agentId={agentId} />
      <ChatPageHeader
        hasAgent
        agentName={agent.accountName}
        agentId={agentId}
        onNewThread={handleNewThread}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <AgentChatSidebar agents={agents} activeAgentId={agentId} />

        <div ref={splitRef} className="flex flex-1 overflow-hidden relative">
          {/* ── Chat area ── */}
          <div
            className="flex-1 flex flex-col overflow-hidden relative"
            onDragEnter={attachments.onDragEnter}
            onDragOver={attachments.onDragOver}
            onDragLeave={attachments.onDragLeave}
            onDrop={attachments.onDrop}
          >
            {attachments.isDragging && <DropOverlay />}

            {chatLoading && <AmbientBackdrop />}

            <MessageExtrasContext.Provider value={messageExtras}>
              <ChatMessageActionsContext.Provider value={messageActions}>
                <AgentThread
                  agent={agent}
                  messagesLoading={messagesLoading}
                  attachmentsEnabled={attachmentsEnabled}
                />
              </ChatMessageActionsContext.Provider>
            </MessageExtrasContext.Provider>

            {chatError && !chatLoading && (
              <ChatErrorBanner
                message={chatError.message}
                onRetry={handleRetry}
              />
            )}

            {approval && !chatLoading && (
              <ApprovalBar
                prompt={approval.prompt}
                busy={chatLoading}
                onApprove={handleApprove}
                onDeny={handleDeny}
              />
            )}

            <AgentComposer
              onSend={handleSend}
              onStop={handleStop}
              chatLoading={chatLoading}
              attachmentsEnabled={attachmentsEnabled}
              attachments={attachments}
              agentName={agent.accountName}
              reasoningEffort={reasoningEffort}
              onReasoningEffortChange={handleReasoningEffortChange}
            />
          </div>

          {/* ── Artifact Preview panel (charts / generated documents) ── */}
          {previewOpen && !previewFullscreen && (
            <PreviewResizer splitRef={splitRef} />
          )}
          {previewOpen && <PreviewPanel threadId={activeThreadId} />}
        </div>
      </div>

      <DeleteMessagePairDialog
        open={!!pendingMessageDelete}
        loading={messageDeleteLoading}
        onOpenChange={(open) => !open && setPendingMessageDelete(null)}
        onConfirm={confirmDeleteMessage}
      />
    </>
  );
};

export const ChatPage = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { agents } = useChatAgents();
  const attachmentsEnabled = useAttachmentsEnabled();

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent._id === agentId) ?? null,
    [agents, agentId],
  );

  // Track the viewed agent (clears its unread badge); clear on navigate away.
  useEffect(() => {
    chatStore.setCurrentAgent(agentId);
    return () => chatStore.setCurrentAgent(undefined);
  }, [agentId]);

  // An agent-less /chat URL lands on the first available agent.
  useEffect(() => {
    if (!agentId && agents.length > 0) {
      navigate(`/erxes-agent/chat/${agents[0]._id}`, { replace: true });
    }
  }, [agentId, agents, navigate]);

  return (
    <div className="flex flex-col h-full">
      {selectedAgent ? (
        <MastraAgentRuntimeProvider
          key={selectedAgent._id}
          agentKey={selectedAgent._id}
          mastraAgentId={selectedAgent._id}
        >
          <AgentChatWorkspace
            agent={selectedAgent}
            agents={agents}
            attachmentsEnabled={attachmentsEnabled}
          />
        </MastraAgentRuntimeProvider>
      ) : (
        <>
          <ChatPageHeader hasAgent={false} />
          <div className="flex flex-1 overflow-hidden relative">
            <SelectAgentEmpty />
          </div>
        </>
      )}
    </div>
  );
};
