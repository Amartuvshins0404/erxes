import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useToast } from 'erxes-ui';
import { useParams, useSearchParams } from 'react-router-dom';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useAISDKRuntime } from '@assistant-ui/react-ai-sdk';
import type {
  ChatAttachment,
  ApprovedOp,
  ReasoningEffort,
} from '~/modules/chat/types';
import { chatStore } from '~/modules/chat/store/chatStore';
import {
  useChatAgents,
  useAttachmentsEnabled,
} from '~/modules/chat/hooks/useChatAgents';
import { useAgentChatView } from '~/modules/chat/hooks/useChatView';
import { useMastraThreads } from '~/modules/chat/hooks/useMastraThreads';
import { useRemoveMastraThread } from '~/modules/chat/hooks/useRemoveMastraThread';
import { useAttachments } from '~/modules/chat/hooks/useAttachments';
import { useThreadArtifacts } from '~/modules/chat/hooks/useThreadArtifacts';
import { useSessionBootstrap } from '~/modules/chat/hooks/useSessionBootstrap';
import { withThreadParam } from '~/modules/chat/lib/threadParam';
import { ChatPageHeader } from '~/modules/chat/components/ChatPageHeader';
import { DeleteSessionDialog } from '~/modules/chat/components/DeleteSessionDialog';
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

export const ChatPage = () => {
  const { t } = useTranslation('mastra');
  const { toast } = useToast();
  const { agentId } = useParams<{ agentId: string }>();
  // The active conversation is addressable via ?thread=<id>. Selecting a session
  // writes it (push, so browser Back walks between conversations); reload/deep-
  // link restores it (useSessionBootstrap). An agent-only URL keeps the old
  // behavior — bootstrap opens the most-recent thread or a fresh draft.
  const [, setSearchParams] = useSearchParams();
  const setThreadParam = useCallback(
    (threadId: string | undefined, replace = false) =>
      setSearchParams((prev) => withThreadParam(prev, threadId), { replace }),
    [setSearchParams],
  );
  // Thread id awaiting delete confirmation — drives the styled AlertDialog that
  // replaced the native window.confirm().
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [pendingMessageDelete, setPendingMessageDelete] =
    useState<PendingMessagePairDelete | null>(null);
  const [messageDeleteLoading, setMessageDeleteLoading] = useState(false);
  const apolloClient = useApolloClient();

  const { agents } = useChatAgents();
  const attachmentsEnabled = useAttachmentsEnabled();

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent._id === agentId) ?? null,
    [agents, agentId],
  );
  const view = useAgentChatView(selectedAgent?._id);

  const {
    activeThreadId,
    reasoningEffort,
    messages,
    loading: chatLoading,
    messagesLoading,
    error: chatError,
    retry,
    chatHelpers,
  } = view;

  // The assistant-ui runtime wraps the active thread's AI SDK chat; primitives
  // below (thread, composer) read it via context.
  const runtime = useAISDKRuntime(chatHelpers);

  // The persisted session list lives in the Apollo cache, not the chat store.
  // Paginated: older sessions load on demand as the sidebar scrolls.
  const {
    threads,
    loading: threadsLoading,
    refetch: refetchThreads,
  } = useMastraThreads(selectedAgent?._id);
  const sessionsLoaded = !!selectedAgent && !threadsLoading;
  const { removeThread, loading: sessionDeleteLoading } = useRemoveMastraThread(
    selectedAgent?._id,
  );

  // The chat↔preview split row — PreviewResizer sets --ea-preview-w on it.
  const splitRef = useRef<HTMLDivElement>(null);

  const attachments = useAttachments(attachmentsEnabled);

  // Session state-machine (slug→id redirect, ?thread= deep-link, current-agent
  // tracking, bootstrap/re-home) lives in the hook.
  useSessionBootstrap(selectedAgent, threads, sessionsLoaded);

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

  // Sidebar handlers are wrapped in useCallback so their identities stay stable
  // across streamed-token / keystroke re-renders.
  const handleNewThread = useCallback(() => {
    if (!agentId || !selectedAgent) return;
    chatStore.newDraft(apolloClient, agentId, selectedAgent._id);
    // A draft isn't persisted yet, so it has nothing to address — drop ?thread=
    // and let reload/back fall back to the agent's default (most-recent/draft).
    setThreadParam(undefined);
  }, [apolloClient, agentId, selectedAgent, setThreadParam]);

  const confirmDelete = useCallback(async () => {
    if (!agentId || !pendingDelete) return;
    const result = await removeThread(pendingDelete).catch(() => null);
    if (!result?.data?.mastraThreadRemove) return;

    // The cached list filter (hook) + local state teardown (store); the
    // bootstrap effect re-selects the next session if this one was active.
    const wasActive = pendingDelete === activeThreadId;
    chatStore.discardThread(agentId, pendingDelete);
    setPendingDelete(null);
    // Drop the deleted thread from the URL so it doesn't point at a dead session
    // and the bootstrap effect is free to re-home to the next one.
    if (wasActive) setThreadParam(undefined, true);
  }, [agentId, pendingDelete, activeThreadId, removeThread, setThreadParam]);

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
        void refetchThreads().catch(() => undefined);
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
    refetchThreads,
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
      if (!selectedAgent || !agentId) return;
      // Fire-and-forget: the store holds the Apollo client reference so the
      // request continues even if the user navigates away before it completes.
      chatStore.sendMessage(
        apolloClient,
        agentId,
        selectedAgent._id,
        message,
        atts,
        approvedOperations,
        hidden,
      );
    },
    [apolloClient, agentId, selectedAgent],
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
      if (
        !message.trim() ||
        !selectedAgent ||
        chatLoading ||
        !agentId ||
        attachments.uploadsInFlight
      )
        return;
      const { attachments: atts, ok } = await attachments.uploadAll();
      if (!ok) return;
      attachments.clear();
      sendMessage(message.trim(), atts);
    },
    [agentId, selectedAgent, chatLoading, attachments, sendMessage],
  );

  // Re-ask the question that produced the last reply (with its attachments).
  const handleRegenerate = useCallback(() => {
    if (!agentId || !selectedAgent || chatLoading) return;
    chatStore.regenerate(apolloClient, agentId, selectedAgent._id);
  }, [apolloClient, agentId, selectedAgent, chatLoading]);

  // Send a past user message again as a fresh turn (carries its attachments).
  const handleResendMessage = useCallback(
    (value: string, atts: ChatAttachment[]) => {
      if (chatLoading) return;
      sendMessage(value, atts);
    },
    [sendMessage, chatLoading],
  );

  const handleStop = () => {
    if (agentId) chatStore.stop(apolloClient, agentId);
  };

  const handleReasoningEffortChange = useCallback(
    (effort?: ReasoningEffort) => {
      if (agentId) chatStore.setReasoningEffort(agentId, effort);
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
    <div className="flex flex-col h-full">
      <ChatPageHeader
        hasAgent={!!selectedAgent}
        agentName={selectedAgent?.accountName}
        agentId={selectedAgent?._id}
        onNewThread={handleNewThread}
      />

      <div ref={splitRef} className="flex flex-1 overflow-hidden relative">
        {/* ── Chat area ── */}
        <div
          className="flex-1 flex flex-col overflow-hidden relative"
          onDragEnter={attachments.onDragEnter}
          onDragOver={attachments.onDragOver}
          onDragLeave={attachments.onDragLeave}
          onDrop={attachments.onDrop}
        >
          {attachments.isDragging && selectedAgent && <DropOverlay />}

          {selectedAgent && chatLoading && <AmbientBackdrop />}

          {!selectedAgent ? (
            <SelectAgentEmpty />
          ) : (
            <AssistantRuntimeProvider runtime={runtime}>
              <MessageExtrasContext.Provider value={messageExtras}>
                <ChatMessageActionsContext.Provider value={messageActions}>
                  <AgentThread
                    agent={selectedAgent}
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
                agentName={selectedAgent.accountName}
                reasoningEffort={reasoningEffort}
                onReasoningEffortChange={handleReasoningEffortChange}
              />
            </AssistantRuntimeProvider>
          )}
        </div>

        {/* ── Artifact Preview panel (charts / generated documents) ── */}
        {previewOpen && selectedAgent && !previewFullscreen && (
          <PreviewResizer splitRef={splitRef} />
        )}
        {previewOpen && selectedAgent && (
          <PreviewPanel threadId={activeThreadId} />
        )}
      </div>

      <DeleteSessionDialog
        loading={sessionDeleteLoading}
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        onConfirm={confirmDelete}
      />

      <DeleteMessagePairDialog
        open={!!pendingMessageDelete}
        loading={messageDeleteLoading}
        onOpenChange={(open) => !open && setPendingMessageDelete(null)}
        onConfirm={confirmDeleteMessage}
      />
    </div>
  );
};
