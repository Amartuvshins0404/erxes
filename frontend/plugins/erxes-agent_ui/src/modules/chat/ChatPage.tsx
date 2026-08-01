import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useToast } from 'erxes-ui';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { IconArrowDown } from '@tabler/icons-react';
import type {
  ChatAttachment,
  ApprovedOp,
  ReasoningEffort,
} from '~/modules/chat/types';
import { chatStore } from '~/modules/chat/store/chatStore';
import {
  useChatAgents,
  useAttachmentsEnabled,
  useVoiceEnabled,
} from '~/modules/chat/hooks/useChatAgents';
import { useAgentChatView } from '~/modules/chat/hooks/useChatView';
import { useMastraThreads } from '~/modules/chat/hooks/useMastraThreads';
import { useRenameMastraThread } from '~/modules/chat/hooks/useRenameMastraThread';
import { useRemoveMastraThread } from '~/modules/chat/hooks/useRemoveMastraThread';
import { useAttachments } from '~/modules/chat/hooks/useAttachments';
import { useThreadArtifacts } from '~/modules/chat/hooks/useThreadArtifacts';
import { useSessionBootstrap } from '~/modules/chat/hooks/useSessionBootstrap';
import { withThreadParam } from '~/modules/chat/lib/threadParam';
import {
  readChatMode,
  readWorkflowParam,
  withChatMode,
  withWorkflowParam,
  type ChatMode,
} from '~/modules/chat/lib/chatMode';
import { useWorkflows } from '~/pages/workflows/hooks/useWorkflows';
import { useIsNarrow } from '~/modules/chat/hooks/useIsNarrow';
import { ChatPageHeader } from '~/modules/chat/components/ChatPageHeader';
import { ChatSidePanel } from '~/modules/chat/components/ChatSidePanel';
import { DeleteSessionDialog } from '~/modules/chat/components/DeleteSessionDialog';
import { DeleteMessagePairDialog } from '~/modules/chat/components/DeleteMessagePairDialog';
import {
  AmbientBackdrop,
  ChatErrorBanner,
  DropOverlay,
  SelectAgentEmpty,
  SkillDraftBanner,
} from '~/modules/chat/components/ChatNotices';
import { WorkflowChatView } from '~/modules/chat/components/WorkflowChatView';
import { MessageList } from '~/modules/chat/components/MessageList';
import { Composer } from '~/modules/chat/components/Composer';
import { ApprovalBar } from '~/modules/chat/components/ApprovalBar';
import { PreviewResizer } from '~/modules/chat/components/PreviewResizer';
import { PreviewPanel } from '~/modules/chat/preview/PreviewPanel';
import { previewStore } from '~/modules/chat/preview/previewStore';
import { pendingApproval } from '~/modules/chat/lib/uiParts';
import { MASTRA_MESSAGE_PAIR_REMOVE } from '~/graphql/mutations';
import { refetchThreadArtifactsIntoCache } from '~/modules/chat/threadsCache';
import { associateArtifacts } from '~/modules/chat/lib/artifacts';
import { useSkillSlashPicker } from '~/modules/skills/hooks/useSkillSlashPicker';
import { useSkillFromThread } from '~/modules/skills/hooks/useSkillFromThread';
import {
  showSkillPermissionError,
  useSkillAccess,
} from '~/modules/skills/hooks/useSkillAccess';
import { SkillSlashPicker } from '~/modules/skills/components/SkillSlashPicker';
import { SkillActivePill } from '~/modules/skills/components/SkillActivePill';
import { SkillDraftPreviewDialog } from '~/modules/skills/components/SkillDraftPreviewDialog';
import { findDraftSkillFromMessages } from '~/modules/skills/utils';
import { VoiceOverlay } from '~/modules/chat/voice/components/VoiceOverlay';
import { useVoiceConversation } from '~/modules/chat/voice/hooks/useVoiceConversation';
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

// Distance (px) from the bottom under which we keep following streamed output.
const SCROLL_PIN_THRESHOLD = 120;
// Distance (px) from the bottom past which the "Latest" jump button appears.
const SCROLL_BUTTON_THRESHOLD = 280;

export const ChatPage = () => {
  const { t } = useTranslation('mastra');
  const { toast } = useToast();
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  // The active conversation is addressable via ?thread=<id>. Selecting a session
  // writes it (push, so browser Back walks between conversations); reload/deep-
  // link restores it (useSessionBootstrap). An agent-only URL keeps the old
  // behavior — bootstrap opens the most-recent thread or a fresh draft.
  const [searchParams, setSearchParams] = useSearchParams();
  const setThreadParam = useCallback(
    (threadId: string | undefined, replace = false) =>
      setSearchParams((prev) => withThreadParam(prev, threadId), { replace }),
    [setSearchParams],
  );
  // Chat | Workflow is deep-linkable alongside the active thread.
  const chatMode = readChatMode(searchParams);
  const workflowParam = readWorkflowParam(searchParams);
  const setChatMode = useCallback(
    (mode: ChatMode) =>
      setSearchParams((prev) => withChatMode(prev, mode), { replace: false }),
    [setSearchParams],
  );
  const setWorkflowParam = useCallback(
    (workflowId: string | undefined, replace = false) =>
      setSearchParams((prev) => withWorkflowParam(prev, workflowId), {
        replace,
      }),
    [setSearchParams],
  );
  const [railOpen, setRailOpen] = useState(!agentId);
  // Below `md` the sessions side panel becomes an off-canvas drawer; closed by
  // default so the message column keeps full width. Desktop ignores this.
  const isNarrow = useIsNarrow();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Thread id awaiting delete confirmation — drives the styled AlertDialog that
  // replaced the native window.confirm().
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [pendingMessageDelete, setPendingMessageDelete] =
    useState<PendingMessagePairDelete | null>(null);
  const [messageDeleteLoading, setMessageDeleteLoading] = useState(false);
  const apolloClient = useApolloClient();

  const { agents, loading: agentsLoading } = useChatAgents();
  const attachmentsEnabled = useAttachmentsEnabled();
  const voiceEnabled = useVoiceEnabled();

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent._id === agentId) ?? null,
    [agents, agentId],
  );

  const view = useAgentChatView(agentId);
  const {
    activeThreadId,
    isDraft,
    reasoningEffort,
    voiceMode,
    messages,
    loading: chatLoading,
    messagesLoading,
    error: chatError,
    retry,
  } = view;

  // Hands-free voice loop (mic → STT → existing send flow → spoken reply).
  // Active only when this agent's voice mode is on AND the backend has voice
  // configured; otherwise the hook is fully inert (no mic, no listeners).
  const voiceActive = !!voiceMode && voiceEnabled && !!selectedAgent;
  const voice = useVoiceConversation(agentId, selectedAgent?._id, voiceActive);

  // The persisted session list lives in the Apollo cache, not the chat store.
  // Paginated: older sessions load on demand as the sidebar scrolls.
  const {
    threads,
    loading: threadsLoading,
    error: threadsError,
    refetch: refetchThreads,
    hasMore: hasMoreSessions,
    loadingMore: loadingMoreSessions,
    loadMore: loadMoreSessions,
  } = useMastraThreads(selectedAgent?._id);
  const sessionsLoaded = !!selectedAgent && !threadsLoading;
  const retrySessions = useCallback(() => {
    void refetchThreads().catch(() => undefined);
  }, [refetchThreads]);
  const { renameThread } = useRenameMastraThread();
  const { removeThread, loading: sessionDeleteLoading } = useRemoveMastraThread(
    selectedAgent?._id,
  );

  // Workflow mode lists only definitions owned by the selected agent.
  const {
    workflows,
    loading: workflowsLoading,
    error: workflowsError,
    refetch: refetchWorkflows,
  } = useWorkflows(selectedAgent?._id, chatMode !== 'workflow');
  const retryWorkflows = useCallback(() => {
    void refetchWorkflows().catch(() => undefined);
  }, [refetchWorkflows]);
  const selectedWorkflow = useMemo(
    () => workflows.find(({ _id }) => _id === workflowParam) ?? null,
    [workflows, workflowParam],
  );
  const handleSelectWorkflow = useCallback(
    (workflowId: string) => {
      setSidebarOpen(false);
      setWorkflowParam(workflowId);
    },
    [setWorkflowParam],
  );
  useEffect(() => {
    if (chatMode !== 'workflow' || workflowsLoading || selectedWorkflow) return;
    if (workflows.length === 0) {
      if (workflowParam) setWorkflowParam(undefined, true);
      return;
    }
    setWorkflowParam(workflows[0]._id, true);
  }, [
    chatMode,
    workflowsLoading,
    selectedWorkflow,
    workflows,
    workflowParam,
    setWorkflowParam,
  ]);

  const [input, setInput] = useState('');
  const [showScrollDown, setShowScrollDown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesBoxRef = useRef<HTMLDivElement>(null);
  // The chat↔preview split row — PreviewResizer sets --ea-preview-w on it.
  const splitRef = useRef<HTMLDivElement>(null);
  // Decays the ghost scrollbar's `.is-scrolling` state after scrolling stops.
  const scrollFadeTimer = useRef<ReturnType<typeof setTimeout>>();
  // Whether the view is pinned to the bottom. Gates streaming auto-scroll so a
  // user who scrolled up to read history isn't yanked back on every token.
  const atBottomRef = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const attachments = useAttachments(attachmentsEnabled);

  // ── Skills: composer /slash picker + make_skill draft preview ──
  const { canCreate: canCreateSkill } = useSkillAccess();
  const slash = useSkillSlashPicker({
    agentId: selectedAgent?._id,
    input,
    setInput,
  });

  const [draftSkillId, setDraftSkillId] = useState<string | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);
  const [draftDismissed, setDraftDismissed] = useState(false);

  const openDraft = useCallback((skillId: string) => {
    setDraftSkillId(skillId);
    setDraftOpen(true);
    setDraftDismissed(false);
  }, []);

  const { makeSkill, making } = useSkillFromThread((skill) =>
    openDraft(skill._id),
  );

  // A draft the makeSkill tool produced mid-conversation — surface a banner so
  // the user can review/publish it. Dismissable until a new one appears. Memoized
  // so the reverse scan doesn't re-walk messages on every streamed-token render.
  const detectedDraft = useMemo(
    () => findDraftSkillFromMessages(messages),
    [messages],
  );

  const handleMakeSkill = () => {
    if (!selectedAgent || !activeThreadId) return;
    if (!canCreateSkill) return showSkillPermissionError('create');
    makeSkill({ agentId: selectedAgent._id, threadId: activeThreadId });
  };

  // Activation is per-turn: drop the /slash pill and any dismissed-draft banner
  // when the thread changes. A render-time reset (store the last thread, adjust
  // when it differs) rather than an effect, so it lands in the same render.
  const { clearActiveSkill } = slash;
  const [resetThread, setResetThread] = useState(activeThreadId);
  if (resetThread !== activeThreadId) {
    setResetThread(activeThreadId);
    clearActiveSkill();
    setDraftDismissed(false);
  }

  // Session state-machine (slug→id redirect, ?thread= deep-link, current-agent
  // tracking, bootstrap/re-home) lives in the hook so the view keeps only its
  // own scroll/focus/autogrow effects.
  useSessionBootstrap(selectedAgent, threads, sessionsLoaded);

  // Keep the view pinned to the bottom — also while a reply streams (the last
  // message grows in place). `messages` is a fresh array on every throttled
  // streaming update, so following it re-fires this effect as the reply grows.
  useEffect(() => {
    if (atBottomRef.current) {
      // Instant while a reply streams: smooth-following every throttled token
      // re-fires the animation before it settles, which reads as the view
      // bouncing up and down. A one-shot smooth scroll is fine once it's idle.
      messagesEndRef.current?.scrollIntoView({
        behavior: chatLoading ? 'auto' : 'smooth',
      });
    }
  }, [messages, chatLoading]);

  // Switching threads re-pins to the bottom of the freshly loaded conversation.
  useEffect(() => {
    atBottomRef.current = true;
  }, [activeThreadId]);

  useEffect(() => {
    if (!chatLoading) textareaRef.current?.focus();
  }, [chatLoading, activeThreadId]);

  // Artifact Preview panel (charts / generated documents). Switching agent or
  // thread clears any open preview — it belongs to the prior conversation.
  const previewOpen = previewStore((s) => s.open);
  // The split handle only makes sense while the panel is docked beside the
  // chat — in fullscreen the panel is a fixed overlay with nothing to resize.
  const previewFullscreen = previewStore((s) => s.fullscreen);
  // Agents/sessions column auto-collapse — driven by PreviewResizer when a
  // drag squeezes the chat column; always restored once the preview closes.
  const [sideCollapsed, setSideCollapsed] = useState(false);
  useEffect(() => {
    if (!previewOpen) setSideCollapsed(false);
  }, [previewOpen]);
  useEffect(() => {
    previewStore.getState().close();
  }, [agentId, activeThreadId]);

  // Persisted artifacts for this thread — re-renders the inline chat cards on
  // reload (live tool parts don't survive). Apollo dedupes with the Files panel.
  // Backend-linked groups attach by messageId; any unlinked group (legacy rows /
  // a turn whose id recovery failed) is matched to its assistant bubble by the
  // originating prompt + chat order so its cards still reappear.
  const { byMessageId, groups: artifactGroups } =
    useThreadArtifacts(activeThreadId);
  const storeArtifactsByMessage = useMemo(
    () => associateArtifacts(messages, byMessageId, artifactGroups),
    [messages, byMessageId, artifactGroups],
  );

  // Auto-grow the textarea with its content (capped via max-h on the element).
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  // Sidebar handlers are wrapped in useCallback so their identities stay stable
  // across streamed-token / keystroke re-renders — that's what lets the memoized
  // SessionList / AgentRail skip re-rendering while a reply streams.
  const handleNewThread = useCallback(() => {
    if (!agentId || !selectedAgent) return;
    chatStore.newDraft(apolloClient, agentId, selectedAgent._id);
    // A draft isn't persisted yet, so it has nothing to address — drop ?thread=
    // and let reload/back fall back to the agent's default (most-recent/draft).
    setThreadParam(undefined);
  }, [apolloClient, agentId, selectedAgent, setThreadParam]);

  const handleSelectSession = useCallback(
    (threadId: string) => {
      // On narrow screens the sidebar is a drawer over the chat — close it.
      setSidebarOpen(false);
      if (!agentId || !selectedAgent || threadId === activeThreadId) return;
      chatStore.selectSession(
        apolloClient,
        agentId,
        selectedAgent._id,
        threadId,
      );
      // Make the conversation addressable: push ?thread= so reload restores it
      // and browser Back returns to the previously viewed conversation.
      setThreadParam(threadId);
    },
    [apolloClient, agentId, selectedAgent, activeThreadId, setThreadParam],
  );

  // Open the confirmation dialog; the teardown itself runs in confirmDelete once
  // the user confirms (replaces the native window.confirm()).
  const handleDeleteSession = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent, threadId: string) => {
      e.stopPropagation();
      if (!agentId || !selectedAgent) return;
      setPendingDelete(threadId);
    },
    [agentId, selectedAgent],
  );

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

  const handleRenameSession = useCallback(
    (id: string, threadId: string, title: string) => {
      renameThread(id, threadId, title);
    },
    [renameThread],
  );

  const handleRailOpen = useCallback(() => setRailOpen(true), []);

  const handleAgentSelect = useCallback(
    (id: string) => {
      navigate(`/erxes-agent/chat/${id}`);
      setRailOpen(false);
      setSidebarOpen(false);
    },
    [navigate],
  );

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
      activeSkillNames?: string[],
    ) => {
      if (!selectedAgent || !agentId) return;
      // Sending re-pins to the bottom so the user follows their own message.
      atBottomRef.current = true;
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
        activeSkillNames,
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

  const handleSend = async () => {
    if (
      !input.trim() ||
      !selectedAgent ||
      chatLoading ||
      !agentId ||
      attachments.uploadsInFlight
    )
      return;
    const message = input.trim();
    // Carry the /slash-activated skill into this turn's request (names only —
    // the server force-loads their instructions). Consumed on send.
    const activeSkillNames = slash.activeSkill
      ? [slash.activeSkill]
      : undefined;
    // Files are staged, not uploaded, until now — upload them as part of sending.
    // If any upload fails, abort: keep the composer's text + chips so the user
    // can retry (send again) or remove the offending file. Nothing is sent.
    const { attachments: atts, ok } = await attachments.uploadAll();
    if (!ok) return;
    attachments.clear();
    setInput('');
    sendMessage(message, atts, undefined, undefined, activeSkillNames);
    // The activated skill applied to this turn; drop the reminder pill.
    slash.clearActiveSkill();
  };

  // Re-ask the question that produced the last reply (with its attachments).
  // The store reads the last user message off the active Chat, so this callback
  // stays referentially stable across streamed tokens — the memoized message
  // rows depend on it not changing every chunk.
  const handleRegenerate = useCallback(() => {
    if (!agentId || !selectedAgent || chatLoading) return;
    chatStore.regenerate(apolloClient, agentId, selectedAgent._id);
  }, [apolloClient, agentId, selectedAgent, chatLoading]);

  // Stable rating handler so the memoized message rows don't re-render per token.
  const handleRate = useCallback(
    (messageId: string, rating: 1 | -1) => {
      if (!agentId) return;
      chatStore.rateMessage(apolloClient, agentId, messageId, rating);
    },
    [apolloClient, agentId],
  );

  // Load a past user message back into the composer to tweak before sending.
  const handleEditMessage = useCallback((value: string) => {
    setInput(value);
    // Focus and drop the caret at the end so it's ready to edit immediately.
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }, []);

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

  // Composer callback props, stabilized so the memoized Composer /
  // ReasoningEffortControl don't re-render on every streamed token.
  const handleReasoningEffortChange = useCallback(
    (effort?: ReasoningEffort) => {
      if (agentId) chatStore.setReasoningEffort(agentId, effort);
    },
    [agentId],
  );

  const handleVoiceModeToggle = useCallback(() => {
    if (agentId) chatStore.setVoiceMode(agentId, !voiceMode);
  }, [agentId, voiceMode]);

  const handleVoiceSetup = useCallback(
    () => navigate('/settings/erxes-agent/voice'),
    [navigate],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // The /slash skill picker claims arrow/Enter/Tab/Esc while it's open.
    if (slash.handleKeyDown(e)) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape' && chatLoading) {
      e.preventDefault();
      handleStop();
    }
  };

  const handleMessagesScroll = () => {
    const el = messagesBoxRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    atBottomRef.current = distanceFromBottom < SCROLL_PIN_THRESHOLD;
    setShowScrollDown(distanceFromBottom > SCROLL_BUTTON_THRESHOLD);
    // Ghost scrollbar (chat.css .ea-scroll): visible while scrolling, gone at
    // rest. Class toggled directly on the node — no re-render per scroll tick.
    el.classList.add('is-scrolling');
    clearTimeout(scrollFadeTimer.current);
    scrollFadeTimer.current = setTimeout(
      () => el.classList.remove('is-scrolling'),
      800,
    );
  };

  useEffect(() => () => clearTimeout(scrollFadeTimer.current), []);

  const scrollToBottom = () => {
    atBottomRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showAgentRail = !selectedAgent || railOpen;
  // Below `md`, once an agent is picked the side panel slides in over the chat
  // as a drawer instead of holding a fixed 240px column. Without a selected
  // agent it stays in flow so the AgentRail is always reachable.
  const asDrawer = isNarrow && !!selectedAgent;

  return (
    <div className="flex flex-col h-full">
      {!voiceActive && (
        <ChatPageHeader
          hasAgent={!!selectedAgent}
          agentName={selectedAgent?.accountName}
          agentId={selectedAgent?._id}
          asDrawer={asDrawer}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          chatMode={chatMode}
          activeThreadId={activeThreadId}
          isDraft={isDraft}
          onMakeSkill={handleMakeSkill}
          making={making}
          chatLoading={chatLoading}
          onNewThread={handleNewThread}
        />
      )}

      <div ref={splitRef} className="flex flex-1 overflow-hidden relative">
        {/* ── Side panel: AgentRail ↔ SessionList slide (hidden in voice mode) ── */}
        {!voiceActive && (
          <ChatSidePanel
            asDrawer={asDrawer}
            sidebarOpen={sidebarOpen}
            onCloseSidebar={() => setSidebarOpen(false)}
            showAgentRail={showAgentRail}
            agents={agents}
            agentsLoading={agentsLoading}
            agentId={agentId}
            onAgentSelect={handleAgentSelect}
            hasAgent={!!selectedAgent}
            chatMode={chatMode}
            onChatModeChange={setChatMode}
            threads={threads}
            sessionsLoaded={sessionsLoaded}
            isDraft={isDraft}
            activeThreadId={activeThreadId}
            hasMoreSessions={hasMoreSessions}
            loadingMoreSessions={loadingMoreSessions}
            onLoadMore={loadMoreSessions}
            onSelectSession={handleSelectSession}
            onNewThread={handleNewThread}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            onRailOpen={handleRailOpen}
            sessionsError={!!threadsError}
            onRetrySessions={retrySessions}
            workflows={workflows}
            workflowsLoading={workflowsLoading}
            workflowsError={!!workflowsError}
            onRetryWorkflows={retryWorkflows}
            workflowParam={workflowParam}
            onSelectWorkflow={handleSelectWorkflow}
          />
        )}

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
          ) : chatMode === 'workflow' ? (
            <WorkflowChatView workflow={selectedWorkflow} />
          ) : (
            <>
              <MessageList
                agent={selectedAgent}
                messages={messages}
                messagesLoading={messagesLoading}
                chatLoading={chatLoading}
                attachmentsEnabled={attachmentsEnabled}
                ratingEnabled={!!agentId && !!activeThreadId}
                boxRef={messagesBoxRef}
                endRef={messagesEndRef}
                onScroll={handleMessagesScroll}
                onSuggestion={(text) => {
                  setInput(text);
                  textareaRef.current?.focus();
                }}
                onRegenerate={handleRegenerate}
                onRate={handleRate}
                onEditMessage={handleEditMessage}
                onResendMessage={handleResendMessage}
                onDeleteMessage={handleDeleteMessage}
                storeArtifactsByMessage={storeArtifactsByMessage}
                debug={selectedAgent.debug}
              />

              {showScrollDown && (
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="ea-pop absolute bottom-28 right-4 z-10 flex items-center gap-1.5 rounded-full border border-border bg-background/95 backdrop-blur px-3 py-1.5 text-xs shadow-md hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <IconArrowDown className="size-3.5" />
                  Latest
                </button>
              )}

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

              {detectedDraft && !draftOpen && !draftDismissed && (
                <SkillDraftBanner
                  name={detectedDraft.name}
                  onReview={() => openDraft(detectedDraft._id)}
                  onDismiss={() => setDraftDismissed(true)}
                />
              )}

              {slash.open && (
                <SkillSlashPicker
                  items={slash.items}
                  activeIndex={slash.activeIndex}
                  loading={slash.loading}
                  onSelect={slash.onSelect}
                  onHover={slash.setActiveIndex}
                />
              )}

              {slash.activeSkill && (
                <SkillActivePill
                  name={slash.activeSkill}
                  onClear={slash.clearActiveSkill}
                />
              )}

              <Composer
                input={input}
                onInputChange={setInput}
                onSend={handleSend}
                onStop={handleStop}
                onKeyDown={handleKeyDown}
                chatLoading={chatLoading}
                attachmentsEnabled={attachmentsEnabled}
                attachments={attachments}
                agentName={selectedAgent.accountName}
                reasoningEffort={reasoningEffort}
                onReasoningEffortChange={handleReasoningEffortChange}
                voiceEnabled={voiceEnabled}
                voiceMode={!!voiceMode}
                onVoiceModeToggle={handleVoiceModeToggle}
                onVoiceSetup={handleVoiceSetup}
                textareaRef={textareaRef}
                fileInputRef={fileInputRef}
              />

              {voiceActive && (
                <VoiceOverlay
                  agentName={selectedAgent.accountName}
                  voice={voice}
                  onExit={() => {
                    if (agentId) chatStore.setVoiceMode(agentId, false);
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* ── Artifact Preview panel (charts / generated documents) ── */}
        {previewOpen &&
          selectedAgent &&
          chatMode === 'chat' &&
          !previewFullscreen && (
            <PreviewResizer
              splitRef={splitRef}
              sideCollapsed={sideCollapsed}
              onSideCollapsedChange={setSideCollapsed}
            />
          )}
        {previewOpen && selectedAgent && chatMode === 'chat' && (
          <PreviewPanel threadId={activeThreadId} />
        )}
      </div>

      <SkillDraftPreviewDialog
        skillId={draftSkillId}
        open={draftOpen}
        onOpenChange={setDraftOpen}
        onDone={() => setDraftDismissed(true)}
      />

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
