import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';
import {
  IconArrowDown,
  IconFiles,
  IconFileUpload,
  IconMessageCircle,
  IconPlus,
  IconSparkles,
} from '@tabler/icons-react';
import { Breadcrumb, Button, Empty } from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { ChatAttachment, ApprovedOp } from '~/modules/chat/types';
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
import { AgentRail } from '~/modules/chat/components/AgentRail';
import { SessionList } from '~/modules/chat/components/SessionList';
import { MessageList } from '~/modules/chat/components/MessageList';
import { Composer } from '~/modules/chat/components/Composer';
import { ApprovalBar } from '~/modules/chat/components/ApprovalBar';
import { PreviewPanel } from '~/modules/chat/preview/PreviewPanel';
import { previewStore } from '~/modules/chat/preview/previewStore';
import { pendingApproval } from '~/modules/chat/lib/uiParts';
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
import { VoiceStageTakeover } from '~/modules/chat/voice/components/VoiceStageTakeover';
import { useVoiceConversation } from '~/modules/chat/voice/hooks/useVoiceConversation';
import '~/modules/chat/chat.css';

// Distance (px) from the bottom under which we keep following streamed output.
const SCROLL_PIN_THRESHOLD = 120;
// Distance (px) from the bottom past which the "Latest" jump button appears.
const SCROLL_BUTTON_THRESHOLD = 280;

export const ChatPage = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [railOpen, setRailOpen] = useState(!agentId);
  const apolloClient = useApolloClient();

  const { agents, loading: agentsLoading } = useChatAgents();
  const attachmentsEnabled = useAttachmentsEnabled();
  const voiceEnabled = useVoiceEnabled();

  // The route is keyed by the agent record _id, but inbound links (e.g.
  // Schedules → View output) may carry the agent slug — accept both.
  const selectedAgent = useMemo(
    () =>
      agentId
        ? (agents.find((a) => a._id === agentId || a.agentId === agentId) ??
          null)
        : null,
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
  } = view;

  // Hands-free voice loop (mic → STT → existing send flow → spoken reply).
  // Active only when this agent's voice mode is on AND the backend has voice
  // configured; otherwise the hook is fully inert (no mic, no listeners).
  const voiceActive = !!voiceMode && voiceEnabled && !!selectedAgent;
  const voice = useVoiceConversation(
    agentId,
    selectedAgent?.agentId,
    voiceActive,
  );

  // The persisted session list lives in the Apollo cache, not the chat store.
  const { threads, loading: threadsLoading } = useMastraThreads(
    selectedAgent?.agentId,
  );
  const sessionsLoaded = !!selectedAgent && !threadsLoading;
  const { renameThread } = useRenameMastraThread();
  const { removeThread } = useRemoveMastraThread(selectedAgent?.agentId);

  const [input, setInput] = useState('');
  const [showScrollDown, setShowScrollDown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesBoxRef = useRef<HTMLDivElement>(null);
  // Whether the view is pinned to the bottom. Gates streaming auto-scroll so a
  // user who scrolled up to read history isn't yanked back on every token.
  const atBottomRef = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const attachments = useAttachments(attachmentsEnabled);

  // ── Skills: composer /slash picker + make_skill draft preview ──
  const { canCreate: canCreateSkill } = useSkillAccess();
  const slash = useSkillSlashPicker({
    agentId: selectedAgent?.agentId,
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
    makeSkill({ agentId: selectedAgent.agentId, threadId: activeThreadId });
  };

  // Activation is per-turn: drop the pill and any banner when the thread changes.
  useEffect(() => {
    slash.clearActiveSkill();
    setDraftDismissed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId]);

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

  const handleNewThread = () => {
    if (agentId && selectedAgent)
      chatStore.newDraft(apolloClient, agentId, selectedAgent.agentId);
  };

  const handleSelectSession = (threadId: string) => {
    if (!agentId || !selectedAgent || threadId === activeThreadId) return;
    chatStore.selectSession(
      apolloClient,
      agentId,
      selectedAgent.agentId,
      threadId,
    );
  };

  const handleDeleteSession = (
    e: React.MouseEvent | React.KeyboardEvent,
    threadId: string,
  ) => {
    e.stopPropagation();
    if (!agentId || !selectedAgent) return;
    if (!window.confirm('Delete this session and all its messages?')) return;
    // The cached list filter (hook) + local state teardown (store); the
    // bootstrap effect re-selects the next session if this one was active.
    removeThread(threadId);
    chatStore.discardThread(agentId, threadId);
  };

  const handleRenameSession = (id: string, threadId: string, title: string) => {
    renameThread(id, threadId, title);
  };

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
        selectedAgent.agentId,
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
    sendMessage('Cancelled — do not delete or merge anything.', [], undefined, true);
  };

  const handleSend = () => {
    if (
      !input.trim() ||
      !selectedAgent ||
      chatLoading ||
      !agentId ||
      attachments.uploadsInFlight
    )
      return;
    const message = input.trim();
    const atts = attachments.collectReady();
    // Carry the /slash-activated skill into this turn's request (names only —
    // the server force-loads their instructions). Consumed on send.
    const activeSkillNames = slash.activeSkill ? [slash.activeSkill] : undefined;
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
    chatStore.regenerate(apolloClient, agentId, selectedAgent.agentId);
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
    if (agentId) chatStore.stop(agentId);
  };

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
  };

  const scrollToBottom = () => {
    atBottomRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showAgentRail = !selectedAgent || railOpen;

  return (
    <div className="flex flex-col h-full">
      {voiceActive && <VoiceStageTakeover />}
      {!voiceActive && (
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" size="sm">
                  <IconMessageCircle />
                  Chat
                </Button>
              </Breadcrumb.Item>
              {selectedAgent && (
                <>
                  <Breadcrumb.Separator />
                  <Breadcrumb.Item>
                    <span className="text-muted-foreground text-sm">
                      {selectedAgent.name}
                    </span>
                  </Breadcrumb.Item>
                </>
              )}
            </Breadcrumb.List>
          </Breadcrumb>
        </PageHeader.Start>
        {selectedAgent && !voiceActive && (
          <PageHeader.End>
            <Button
              variant="outline"
              size="sm"
              onClick={() => previewStore.getState().openList()}
            >
              <IconFiles className="size-3.5" />
              Files
            </Button>
            {activeThreadId && !isDraft && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMakeSkill}
                disabled={making || chatLoading}
              >
                <IconSparkles className="size-3.5" />
                {making ? 'Distilling…' : 'Make skill'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleNewThread}>
              <IconPlus className="size-3.5" />
              New chat
            </Button>
          </PageHeader.End>
        )}
      </PageHeader>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* ── Side panel: AgentRail ↔ SessionList slide (hidden in voice mode) ── */}
        {!voiceActive && (
        <div className="relative shrink-0 border-r overflow-hidden w-60">
          <div
            className="absolute inset-0 transition-transform duration-200 ease-in-out"
            style={{
              transform: showAgentRail ? 'translateX(0)' : 'translateX(-100%)',
            }}
          >
            <AgentRail
              agents={agents}
              loading={agentsLoading}
              activeAgentId={agentId}
              onSelect={(id) => {
                navigate(`/erxes-agent/chat/${id}`);
                setRailOpen(false);
              }}
            />
          </div>
          {selectedAgent && agentId && (
            <div
              className="absolute inset-0 transition-transform duration-200 ease-in-out"
              style={{
                transform: showAgentRail ? 'translateX(100%)' : 'translateX(0)',
              }}
            >
              <SessionList
                agentId={agentId}
                sessions={threads}
                sessionsLoaded={sessionsLoaded}
                isDraft={isDraft}
                activeThreadId={activeThreadId}
                onSelect={handleSelectSession}
                onNew={handleNewThread}
                onDelete={handleDeleteSession}
                onRename={handleRenameSession}
                onBack={() => setRailOpen(true)}
              />
            </div>
          )}
        </div>
        )}

        {/* ── Chat area ── */}
        <div
          className="flex-1 flex flex-col overflow-hidden relative"
          onDragEnter={attachments.onDragEnter}
          onDragOver={attachments.onDragOver}
          onDragLeave={attachments.onDragLeave}
          onDrop={attachments.onDrop}
        >
          {attachments.isDragging && selectedAgent && (
            <div className="ea-pop absolute inset-3 z-20 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/6 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 pointer-events-none">
              <IconFileUpload className="size-9 text-primary" />
              <p className="text-sm font-medium text-primary">
                Drop files to attach
              </p>
              <p className="text-xs text-muted-foreground">
                images · PDF · Excel · Word · CSV
              </p>
            </div>
          )}

          {selectedAgent && chatLoading && (
            <div
              aria-hidden
              className="ea-ambient pointer-events-none absolute inset-0 z-0 overflow-hidden"
            >
              <span className="ea-ambient-blob ea-ambient-blob-1" />
              <span className="ea-ambient-blob ea-ambient-blob-2" />
            </div>
          )}

          {!selectedAgent ? (
            <div className="flex-1 flex items-center justify-center">
              <Empty>
                <Empty.Header>
                  <Empty.Media variant="icon">
                    <IconMessageCircle />
                  </Empty.Media>
                  <Empty.Title>Select an agent</Empty.Title>
                  <Empty.Description>
                    Choose an agent from the sidebar to start a conversation.
                  </Empty.Description>
                </Empty.Header>
              </Empty>
            </div>
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
                storeArtifactsByMessage={storeArtifactsByMessage}
              />

              {showScrollDown && (
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="ea-pop absolute bottom-28 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full border border-border bg-background/95 backdrop-blur px-3 py-1.5 text-xs shadow-md hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <IconArrowDown className="size-3.5" />
                  Latest
                </button>
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
                <div className="max-w-3xl mx-auto w-full px-3 pb-1.5">
                  <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/8 px-3 py-1.5 text-xs">
                    <IconSparkles className="size-4 text-primary" />
                    <span className="flex-1 text-primary">
                      A draft skill
                      {detectedDraft.name ? (
                        <span className="font-mono"> /{detectedDraft.name}</span>
                      ) : null}{' '}
                      was created from this conversation.
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6"
                      onClick={() => openDraft(detectedDraft._id)}
                    >
                      Review
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6"
                      onClick={() => setDraftDismissed(true)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
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
                agentName={selectedAgent.name}
                reasoningEffort={reasoningEffort}
                onReasoningEffortChange={(effort) =>
                  chatStore.setReasoningEffort(agentId!, effort)
                }
                voiceEnabled={voiceEnabled}
                voiceMode={!!voiceMode}
                onVoiceModeToggle={() =>
                  chatStore.setVoiceMode(agentId!, !voiceMode)
                }
                onVoiceSetup={() => navigate('/settings/erxes-agent/voice')}
                textareaRef={textareaRef}
                fileInputRef={fileInputRef}
              />

              {voiceActive && (
                <VoiceOverlay
                  agentName={selectedAgent.name}
                  voice={voice}
                  onExit={() => chatStore.setVoiceMode(agentId!, false)}
                />
              )}
            </>
          )}
        </div>

        {/* ── Artifact Preview panel (charts / generated documents) ── */}
        {previewOpen && selectedAgent && (
          <PreviewPanel threadId={activeThreadId} />
        )}
      </div>

      <SkillDraftPreviewDialog
        skillId={draftSkillId}
        open={draftOpen}
        onOpenChange={setDraftOpen}
        onDone={() => setDraftDismissed(true)}
      />
    </div>
  );
};
