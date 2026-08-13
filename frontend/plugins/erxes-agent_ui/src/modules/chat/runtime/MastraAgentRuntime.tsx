import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useApolloClient, type ApolloClient } from '@apollo/client';
import { useChat } from '@ai-sdk/react';
import {
  AssistantRuntimeProvider,
  unstable_useRemoteThreadListRuntime as useRemoteThreadListRuntime,
  useThreadListItem,
  type AssistantRuntime,
} from '@assistant-ui/react';
import { useAISDKRuntime } from '@assistant-ui/react-ai-sdk';
import type { AgentUIMessage } from '~/modules/chat/types';
import { chatStore } from '~/modules/chat/store/chatStore';
import { createMastraThreadListAdapter } from '~/modules/chat/runtime/mastraThreadListAdapter';

type Client = ApolloClient<object>;

interface MastraAgentRuntimeContextValue {
  client: Client;
  agentKey: string;
  mastraAgentId: string;
}

const MastraAgentRuntimeContext =
  createContext<MastraAgentRuntimeContextValue | null>(null);

export const useMastraAgentRuntimeContext =
  (): MastraAgentRuntimeContextValue => {
    const value = useContext(MastraAgentRuntimeContext);
    if (!value) {
      throw new Error(
        'useMastraAgentRuntimeContext must be used inside MastraAgentRuntimeProvider',
      );
    }
    return value;
  };

// The per-thread runtime: one hook instance per alive thread (mounted by the
// remote-thread-list runtime under a ThreadListItem provider). Binds the
// thread's registry Chat to an assistant-ui runtime and hydrates persisted
// history for already-initialized threads.
const useMastraThreadRuntime = (): AssistantRuntime => {
  const { client, agentKey, mastraAgentId } = useMastraAgentRuntimeContext();
  const item = useThreadListItem();
  // The adapter initializes with remoteId === local id, so this is stable
  // across the new → regular transition.
  const threadId = item.remoteId ?? item.id;

  // Synchronous by design: the hook instance must hand a bound Chat to
  // useChat on its very first render. ensureThreadChat is idempotent and
  // returns the live ref for an already-streaming thread.
  const chat = useMemo(
    () => chatStore.ensureThreadChat(client, agentKey, mastraAgentId, threadId),
    [client, agentKey, mastraAgentId, threadId],
  );

  // Persisted threads load their history once per mount; drafts skip this.
  useEffect(() => {
    if (item.status === 'regular') {
      void chatStore.hydrateThread(client, agentKey, mastraAgentId, threadId);
    }
  }, [client, agentKey, mastraAgentId, threadId, item.status]);

  const chatHelpers = useChat<AgentUIMessage>({
    chat,
    experimental_throttle: 50,
  });
  return useAISDKRuntime(chatHelpers);
};

// Module-level so its identity is stable across streamed-token re-renders —
// the remote list runtime re-binds every alive thread when the hook identity
// changes. It reads the agent context instead of closing over props.
const useRuntimeHook = (): AssistantRuntime => useMastraThreadRuntime();

// Owns the assistant-ui runtime for one agent: a remote-thread-list runtime
// whose threads are the agent's mastra sessions (GraphQL via the adapter) and
// whose per-thread runtimes wrap the registry Chats. Remount per agent (key)
// so each agent gets a fresh thread list.
export const MastraAgentRuntimeProvider = ({
  agentKey,
  mastraAgentId,
  children,
}: {
  agentKey: string;
  mastraAgentId: string;
  children: ReactNode;
}) => {
  const client = useApolloClient();
  const adapter = useMemo(
    () => createMastraThreadListAdapter(client, agentKey, mastraAgentId),
    [client, agentKey, mastraAgentId],
  );
  const runtime = useRemoteThreadListRuntime({ runtimeHook: useRuntimeHook, adapter });
  const contextValue = useMemo(
    () => ({ client, agentKey, mastraAgentId }),
    [client, agentKey, mastraAgentId],
  );

  return (
    <MastraAgentRuntimeContext.Provider value={contextValue}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </MastraAgentRuntimeContext.Provider>
  );
};
