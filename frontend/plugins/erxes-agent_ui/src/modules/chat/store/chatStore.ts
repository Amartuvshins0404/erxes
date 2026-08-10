import { ApolloClient } from '@apollo/client';
import { Chat } from '@ai-sdk/react';
import type { ChatStatus } from 'ai';
import { create } from 'zustand';
import { MASTRA_THREAD_MESSAGES } from '~/graphql/queries';
import { MASTRA_CHAT_CANCEL } from '~/graphql/mutations';
import {
  AgentChatState,
  AgentUIMessage,
  ApprovedOp,
  ChatAttachment,
  DbThreadMessage,
  EMPTY_AGENT,
  ReasoningEffort,
  REASONING_EFFORT_OPTIONS,
} from '~/modules/chat/types';
import { generateThreadId } from '~/modules/chat/lib/ids';
import { messageText } from '~/modules/chat/lib/uiParts';
import { metaToUIMessages } from '~/modules/chat/lib/messageMapping';
import { createChatTransport } from '~/modules/chat/lib/chatTransport';
import {
  prependThreadToCache,
  refetchThreadArtifactsIntoCache,
  refetchThreadsIntoCache,
  setThreadTitleInCache,
} from '~/modules/chat/threadsCache';

type Client = ApolloClient<object>;

interface MastraThreadMessagesResponse {
  mastraThreadMessages?: DbThreadMessage[];
}

const threadKey = (agentKey: string, threadId: string) =>
  `${agentKey}:${threadId}`;

const isWorkingStatus = (status?: ChatStatus): boolean =>
  status === 'submitted' || status === 'streaming';

const REASONING_EFFORT_VALUES: readonly string[] = REASONING_EFFORT_OPTIONS.map(
  (o) => o.value,
);

const isReasoningEffort = (v: unknown): v is ReasoningEffort =>
  typeof v === 'string' && REASONING_EFFORT_VALUES.includes(v);

/** localStorage key holding the persisted reasoning choice for one agent. */
const reasoningEffortStorageKey = (agentKey: string) =>
  `erxes-agent:reasoningEffort:${agentKey}`;

// Best-effort read of the persisted choice — localStorage may be unavailable
// (private mode / SSR) and may hold stale values from an older enum.
const loadReasoningEffort = (agentKey: string): ReasoningEffort | undefined => {
  try {
    const raw = localStorage.getItem(reasoningEffortStorageKey(agentKey));
    return isReasoningEffort(raw) ? raw : undefined;
  } catch {
    return undefined;
  }
};

// Status-subscription teardowns, keyed by `${agentKey}:${threadId}`. Kept out of
// zustand (no reactivity needed) so the Chat refs in state stay opaque.
const statusUnsubs = new Map<string, () => void>();

// A stable, transport-less Chat the view binds to whenever no thread is active,
// so `useChat({ chat })` always has a defined instance (hooks can't be skipped).
const EMPTY_CHAT = new Chat<AgentUIMessage>({});

// Registry-backed chat store. The active turn's message state is owned by AI SDK
// `Chat` instances (one per agent+thread); this store keeps only the registry of
// those refs, the agent-level shell state, and a couple of lightweight signals
// (per-thread status + activity) mirrored so the sidebar badges stay reactive for
// agents whose conversation view is NOT mounted (background streaming). The heavy
// `messages` array is never mirrored here — it lives in the Chat.
interface ChatStoreState {
  agents: Record<string, AgentChatState>;
  chats: Record<string, Chat<AgentUIMessage>>;
  threadStatus: Record<string, ChatStatus>;
  threadActivity: Record<string, string | undefined>;
  threadHydrating: Record<string, boolean>;
  // The turn's `finish` chunk has arrived, but the stream is still open for the
  // server's reconcile tail (turn summary, message id, title). The reply is done
  // writing — the UI must leave "working" mode even though status is still
  // 'streaming' (the AI SDK only flips it back when the stream closes).
  threadSettled: Record<string, boolean>;
  unreadAgents: string[];
  currentViewedAgentId?: string;

  setCurrentAgent: (agentId: string | undefined) => void;
  markRead: (agentKey: string) => void;
  setReasoningEffort: (
    agentKey: string,
    effort: ReasoningEffort | undefined,
  ) => void;
  newDraft: (client: Client, agentKey: string, mastraAgentId: string) => void;
  selectSession: (
    client: Client,
    agentKey: string,
    mastraAgentId: string,
    threadId: string,
  ) => Promise<void>;
  // Drop a removed thread's Chat + signals. The cached session list is filtered
  // by useRemoveMastraThread; this only clears store-side state.
  discardMessagePair: (
    agentKey: string,
    threadId: string,
    uiMessageId: string,
    deletedIds: string[],
  ) => void;
  discardThread: (agentKey: string, threadId: string) => void;
  stop: (client: Client, agentKey: string) => void;
  sendMessage: (
    client: Client,
    agentKey: string,
    mastraAgentId: string,
    message: string,
    attachments?: ChatAttachment[],
    approvedOperations?: ApprovedOp[],
    // Don't render a user bubble for this send (approve/deny — the turn
    // continues without a visible "Approved" message).
    hidden?: boolean,
  ) => void;
  // Re-ask the question that produced the last reply (with its attachments).
  regenerate: (client: Client, agentKey: string, mastraAgentId: string) => void;
}

export const useChatStore = create<ChatStoreState>((set, get) => {
  const patchAgent = (agentKey: string, partial: Partial<AgentChatState>) =>
    set((s) => ({
      agents: {
        ...s.agents,
        [agentKey]: { ...(s.agents[agentKey] ?? EMPTY_AGENT), ...partial },
      },
    }));

  const setThreadActivity = (key: string, text: string | undefined) =>
    set((s) => ({ threadActivity: { ...s.threadActivity, [key]: text } }));

  const setThreadSettled = (key: string, settled: boolean) =>
    set((s) => ({ threadSettled: { ...s.threadSettled, [key]: settled } }));

  // Resolves once the chat's request loop is idle (status left submitted /
  // streaming) — used to hand off cleanly from a cut reconcile tail to the
  // next turn without racing the SDK's own teardown.
  const statusIdle = (chat: Chat<AgentUIMessage>): Promise<void> =>
    new Promise((resolve) => {
      if (!isWorkingStatus(chat.status)) return resolve();
      const unsub = chat['~registerStatusCallback'](() => {
        if (isWorkingStatus(chat.status)) return;
        unsub();
        resolve();
      });
    });

  // Patch the metadata of a thread's most recent assistant message. Reassigning
  // chat.messages makes a post-`finish` reconcile render without a reload.
  const patchLastAssistantMeta = (
    key: string,
    metaPatch: Partial<NonNullable<AgentUIMessage['metadata']>>,
  ) => {
    const chat = get().chats[key];
    if (!chat) return;
    const msgs = chat.messages;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'assistant') {
        chat.messages = msgs.map((m, idx) =>
          idx === i ? { ...m, metadata: { ...m.metadata, ...metaPatch } } : m,
        );
        return;
      }
    }
  };

  // Stamp the reconciled native id (sent via a transient `data-message-id` part
  // after `finish`) onto the latest assistant message for artifact links and
  // persisted message-pair deletion.
  const reconcileAssistantMessageId = (key: string, messageId: string) => {
    if (!messageId) return;
    patchLastAssistantMeta(key, { messageId });
  };

  // Stamp the latest assistant message of a thread as `interrupted` so the
  // "stopped" badge shows the instant the user clicks Stop — even mid-Thinking,
  // before any text streamed and before the aborted stream could send `finish`.
  // Mirrors reconcileAssistantMessageId: reassigning chat.messages re-renders.
  const markLastAssistantInterrupted = (key: string) => {
    const chat = get().chats[key];
    if (!chat) return;
    const msgs = chat.messages;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'assistant') {
        chat.messages = msgs.map((m, idx) =>
          idx === i
            ? { ...m, metadata: { ...m.metadata, interrupted: true } }
            : m,
        );
        return;
      }
    }
  };

  // Mark the turn persisted: clear activity, reconcile the cached session list
  // (titles/ordering/counts + the real _id), and flag unread when the user is
  // looking at another agent.
  const finishTurn = (
    client: Client,
    agentKey: string,
    mastraAgentId: string,
    threadId: string,
  ) => {
    const key = threadKey(agentKey, threadId);
    setThreadActivity(key, undefined);
    if (get().currentViewedAgentId !== agentKey) {
      set((s) =>
        s.unreadAgents.includes(agentKey)
          ? s
          : { unreadAgents: [...s.unreadAgents, agentKey] },
      );
    }
    const agent = get().agents[agentKey];
    if (agent?.activeThreadId === threadId && agent.isDraft) {
      patchAgent(agentKey, { isDraft: false });
    }
    void refetchThreadsIntoCache(client, mastraAgentId);
    // Surface any file the turn produced in the Files panel without a reload.
    void refetchThreadArtifactsIntoCache(client, threadId);
  };

  // Create + register a Chat for one agent+thread, wiring the transport and the
  // signal bridge (status → threadStatus, data-activity → threadActivity,
  // data-thread-title → cache). Returns the existing ref when already present so
  // a background-streaming thread is never recreated.
  const ensureChat = (
    client: Client,
    agentKey: string,
    mastraAgentId: string,
    threadId: string,
    initialMessages: AgentUIMessage[],
  ): Chat<AgentUIMessage> => {
    const key = threadKey(agentKey, threadId);
    const existing = get().chats[key];
    if (existing) return existing;

    const chat = new Chat<AgentUIMessage>({
      id: threadId,
      messages: initialMessages,
      // The `finish` chunk marks the reply done writing; the stream stays open
      // for the reconcile tail, so flag the thread settled to end "working"
      // mode now instead of at stream close (seconds later).
      transport: createChatTransport(mastraAgentId, threadId, () =>
        setThreadSettled(key, true),
      ),
      onData: (part) => {
        if (part.type === 'data-activity') {
          setThreadActivity(key, part.data.text);
        } else if (part.type === 'data-thread-title') {
          setThreadTitleInCache(
            client,
            mastraAgentId,
            part.data.threadId || threadId,
            part.data.title,
          );
        } else if (part.type === 'data-message-id') {
          // Reconcile the native id onto the latest assistant message after the
          // off-critical-path persistence finishes. A reload also restores it.
          reconcileAssistantMessageId(key, part.data.messageId);
        }
        // data-heartbeat is dropped — it only keeps the proxy socket warm.
      },
      onFinish: () => finishTurn(client, agentKey, mastraAgentId, threadId),
      onError: () => setThreadActivity(key, undefined),
    });

    // Mirror the Chat's status into the store so background threads keep the
    // sidebar badges reactive even when their conversation view is unmounted.
    const unsub = chat['~registerStatusCallback'](() =>
      set((s) => ({ threadStatus: { ...s.threadStatus, [key]: chat.status } })),
    );
    statusUnsubs.set(key, unsub);

    set((s) => ({
      chats: { ...s.chats, [key]: chat },
      threadStatus: { ...s.threadStatus, [key]: chat.status },
    }));
    return chat;
  };

  // Shared send path used by sendMessage + regenerate.
  const doSend = async (
    client: Client,
    agentKey: string,
    mastraAgentId: string,
    message: string,
    attachments?: ChatAttachment[],
    approvedOperations?: ApprovedOp[],
    hidden?: boolean,
  ) => {
    let agent = get().agents[agentKey] ?? EMPTY_AGENT;
    if (!agent.activeThreadId) {
      get().newDraft(client, agentKey, mastraAgentId);
      agent = get().agents[agentKey] ?? EMPTY_AGENT;
    }
    const threadId = agent.activeThreadId;
    if (!threadId) return;

    const chat = ensureChat(client, agentKey, mastraAgentId, threadId, []);
    const key = threadKey(agentKey, threadId);
    // Never start a second turn on a thread whose reply is still being written
    // — a concurrent send (regenerate, suggestion, double Enter) would
    // interleave two replies. After the `finish` chunk the reply is complete
    // but the stream stays open for the reconcile tail: a send there is
    // legitimate, so cut the tail and hand off (the persist already runs
    // server-side; the title self-heals on the next session-list load).
    if (isWorkingStatus(chat.status)) {
      if (!get().threadSettled[key]) return;
      setThreadSettled(key, false); // claim the send — a second Enter drops above
      void chat.stop();
      await statusIdle(chat);
    } else {
      setThreadSettled(key, false); // clear the previous turn's stale flag
    }

    // Surface the session in the sidebar the instant the first message is sent.
    prependThreadToCache(client, mastraAgentId, threadId);
    if (agent.isDraft) patchAgent(agentKey, { isDraft: false });

    // Attachments ride in the message metadata too (not only the request
    // body): the user bubble renders sent images from metadata immediately,
    // exactly as messageMapping restores them on reload.
    const metadata = {
      ...(hidden ? { hidden: true } : {}),
      ...(attachments?.length ? { attachments } : {}),
    };
    void chat.sendMessage(
      { text: message, ...(Object.keys(metadata).length ? { metadata } : {}) },
      {
        body: {
          ...(agent.reasoningEffort
            ? { reasoningEffort: agent.reasoningEffort }
            : {}),
          ...(attachments?.length ? { attachments } : {}),
          ...(approvedOperations?.length ? { approvedOperations } : {}),
        },
      },
    );
  };

  return {
    agents: {},
    chats: {},
    threadStatus: {},
    threadActivity: {},
    threadHydrating: {},
    threadSettled: {},
    unreadAgents: [],
    currentViewedAgentId: undefined,

    setCurrentAgent: (agentId) => {
      set({ currentViewedAgentId: agentId });
      if (agentId) {
        get().markRead(agentId);
        // Hydrate the persisted reasoning choice exactly once, when this agent's
        // slice first comes into view.
        if (!get().agents[agentId]) {
          patchAgent(agentId, {
            reasoningEffort: loadReasoningEffort(agentId),
          });
        }
      }
    },

    markRead: (agentKey) =>
      set((s) =>
        s.unreadAgents.includes(agentKey)
          ? { unreadAgents: s.unreadAgents.filter((a) => a !== agentKey) }
          : s,
      ),

    setReasoningEffort: (agentKey, effort) => {
      try {
        const key = reasoningEffortStorageKey(agentKey);
        if (effort) localStorage.setItem(key, effort);
        else localStorage.removeItem(key);
      } catch {
        // localStorage unavailable — the in-memory patch below still applies.
      }
      patchAgent(agentKey, { reasoningEffort: effort });
    },

    newDraft: (client, agentKey, mastraAgentId) => {
      const threadId = generateThreadId();
      ensureChat(client, agentKey, mastraAgentId, threadId, []);
      patchAgent(agentKey, {
        activeThreadId: threadId,
        isDraft: true,
        mastraAgentId,
      });
    },

    selectSession: async (client, agentKey, mastraAgentId, threadId) => {
      patchAgent(agentKey, {
        activeThreadId: threadId,
        isDraft: false,
        mastraAgentId,
      });

      const key = threadKey(agentKey, threadId);
      // An existing Chat (revisited, or streaming in the background) keeps its
      // live state — never reload over it.
      if (get().chats[key]) return;

      const chat = ensureChat(client, agentKey, mastraAgentId, threadId, []);
      set((s) => ({ threadHydrating: { ...s.threadHydrating, [key]: true } }));
      try {
        const { data } = await client.query<MastraThreadMessagesResponse>({
          query: MASTRA_THREAD_MESSAGES,
          variables: { threadId },
          fetchPolicy: 'network-only',
        });
        chat.messages = metaToUIMessages(data?.mastraThreadMessages ?? []);
      } catch {
        // leave the chat empty — the composer still works
      } finally {
        set((s) => ({
          threadHydrating: { ...s.threadHydrating, [key]: false },
        }));
      }
    },

    discardMessagePair: (agentKey, threadId, uiMessageId, deletedIds) => {
      const chat = get().chats[threadKey(agentKey, threadId)];
      if (!chat) return;
      const removed = new Set(deletedIds);
      chat.messages = chat.messages.filter(
        (message) =>
          message.id !== uiMessageId &&
          !removed.has(message.id) &&
          !removed.has(message.metadata?.messageId ?? ''),
      );
    },

    discardThread: (agentKey, threadId) => {
      const key = threadKey(agentKey, threadId);
      void get().chats[key]?.stop();
      statusUnsubs.get(key)?.();
      statusUnsubs.delete(key);
      set((s) => {
        const chats = { ...s.chats };
        const threadStatus = { ...s.threadStatus };
        const threadActivity = { ...s.threadActivity };
        const threadHydrating = { ...s.threadHydrating };
        const threadSettled = { ...s.threadSettled };
        delete chats[key];
        delete threadStatus[key];
        delete threadActivity[key];
        delete threadHydrating[key];
        delete threadSettled[key];
        return {
          chats,
          threadStatus,
          threadActivity,
          threadHydrating,
          threadSettled,
        };
      });
      // Drop the active selection so the view's bootstrap re-selects the next
      // session (or opens a fresh draft) from the now-filtered cached list.
      if (get().agents[agentKey]?.activeThreadId === threadId) {
        patchAgent(agentKey, { activeThreadId: undefined, isDraft: false });
      }
    },

    stop: (client, agentKey) => {
      const agent = get().agents[agentKey];
      if (!agent?.activeThreadId) return;
      const threadId = agent.activeThreadId;
      const key = threadKey(agentKey, threadId);
      // Abort the client reader (stops the incoming stream) and stamp the
      // partial reply as stopped so the badge shows immediately.
      void get().chats[key]?.stop();
      markLastAssistantInterrupted(key);
      // Explicit server-side cancel — the gateway proxy never forwards the
      // client disconnect, so aborting the reader alone leaves the backend
      // generating. Best-effort: the reader is already stopped regardless.
      void client
        .mutate({ mutation: MASTRA_CHAT_CANCEL, variables: { threadId } })
        .catch(() => {
          // ignore — the client stream is already stopped
        });
    },

    sendMessage: (
      client,
      agentKey,
      mastraAgentId,
      message,
      attachments,
      approvedOperations,
      hidden,
    ) =>
      doSend(
        client,
        agentKey,
        mastraAgentId,
        message,
        attachments,
        approvedOperations,
        hidden,
      ),

    regenerate: (client, agentKey, mastraAgentId) => {
      const agent = get().agents[agentKey];
      if (!agent?.activeThreadId) return;
      const key = threadKey(agentKey, agent.activeThreadId);
      const chat = get().chats[key];
      // Blocked only while the reply is still being written — a settled thread
      // (reconcile tail still open) may regenerate; doSend cuts the tail.
      if (!chat || (isWorkingStatus(chat.status) && !get().threadSettled[key]))
        return;
      // Skip hidden approve/deny replies — re-ask the real question.
      const lastUser = [...chat.messages]
        .reverse()
        .find((m) => m.role === 'user' && !m.metadata?.hidden);
      if (!lastUser) return;
      doSend(
        client,
        agentKey,
        mastraAgentId,
        messageText(lastUser),
        lastUser.metadata?.attachments,
      );
    },
  };
});

// ── Selectors (granular reactive reads) ─────────────────────────────────────

export const selectAgentShell = (
  s: ChatStoreState,
  agentKey: string,
): AgentChatState => s.agents[agentKey] ?? EMPTY_AGENT;

export const selectActiveChat = (
  s: ChatStoreState,
  agentKey: string,
): Chat<AgentUIMessage> => {
  const threadId = s.agents[agentKey]?.activeThreadId;
  return (threadId && s.chats[threadKey(agentKey, threadId)]) || EMPTY_CHAT;
};

export const selectThreadHydrating = (
  s: ChatStoreState,
  agentKey: string,
): boolean => {
  const threadId = s.agents[agentKey]?.activeThreadId;
  return threadId ? !!s.threadHydrating[threadKey(agentKey, threadId)] : false;
};

// A thread is "working" while a reply is being produced: in-flight status AND
// the `finish` chunk hasn't landed yet. Once settled, the still-open reconcile
// tail must not read as working.
const threadWorking = (s: ChatStoreState, key: string): boolean =>
  isWorkingStatus(s.threadStatus[key]) && !s.threadSettled[key];

export const selectIsAgentWorking = (
  s: ChatStoreState,
  agentKey: string,
): boolean => {
  const prefix = `${agentKey}:`;
  return Object.keys(s.threadStatus).some(
    (key) => key.startsWith(prefix) && threadWorking(s, key),
  );
};

export const selectThreadWorking = (
  s: ChatStoreState,
  agentKey: string,
  threadId: string,
): boolean => threadWorking(s, threadKey(agentKey, threadId));

// Whether the active thread's turn has settled (finish chunk arrived) while
// its stream is still open — the view's "done writing" override.
export const selectActiveThreadSettled = (
  s: ChatStoreState,
  agentKey: string,
): boolean => {
  const threadId = s.agents[agentKey]?.activeThreadId;
  return threadId ? !!s.threadSettled[threadKey(agentKey, threadId)] : false;
};

// One-line summary of what the agent is doing right now: the server-pushed
// activity for any working thread of this agent, or a coarse fallback.
export const selectAgentActivity = (
  s: ChatStoreState,
  agentKey: string,
): string | undefined => {
  const prefix = `${agentKey}:`;
  for (const key of Object.keys(s.threadStatus)) {
    if (!key.startsWith(prefix) || !threadWorking(s, key)) continue;
    return s.threadActivity[key] ?? 'Working…';
  }
  return undefined;
};

export const selectHasUnread = (s: ChatStoreState, agentKey: string): boolean =>
  s.unreadAgents.includes(agentKey);

// Imperative facade so call sites keep reading `chatStore.x(...)`. Each action
// delegates to the live store; reactive reads use the hooks in ./hooks.
type StoreActionKey =
  | 'setCurrentAgent'
  | 'markRead'
  | 'setReasoningEffort'
  | 'newDraft'
  | 'selectSession'
  | 'discardMessagePair'
  | 'discardThread'
  | 'stop'
  | 'sendMessage'
  | 'regenerate';

type StoreActions = Pick<ChatStoreState, StoreActionKey>;

const ACTION_KEYS: StoreActionKey[] = [
  'setCurrentAgent',
  'markRead',
  'setReasoningEffort',
  'newDraft',
  'selectSession',
  'discardMessagePair',
  'discardThread',
  'stop',
  'sendMessage',
  'regenerate',
];

export const chatStore = Object.fromEntries(
  ACTION_KEYS.map((key) => [
    key,
    (...args: unknown[]) =>
      (useChatStore.getState()[key] as (...a: unknown[]) => unknown)(...args),
  ]),
) as StoreActions;
