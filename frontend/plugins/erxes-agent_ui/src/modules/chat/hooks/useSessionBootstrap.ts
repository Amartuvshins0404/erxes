import { useEffect } from 'react';
import { useApolloClient } from '@apollo/client';
import { useParams, useSearchParams } from 'react-router-dom';
import { IMastraThread } from '~/modules/chat/types';
import { chatStore, useChatStore } from '~/modules/chat/store/chatStore';

// Owns addressable thread selection, current-agent tracking, and session
// bootstrapping/re-homing for one canonical AI team-member account id.
export const useSessionBootstrap = (
  selectedAgent: { _id: string } | null,
  threads: IMastraThread[],
  sessionsLoaded: boolean,
): void => {
  const { agentId } = useParams<{ agentId: string }>();
  const apolloClient = useApolloClient();
  const [searchParams] = useSearchParams();

  const activeThreadId = useChatStore((s) =>
    agentId ? s.agents[agentId]?.activeThreadId : undefined,
  );
  const threadParam = searchParams.get('thread');
  const mastraAgentId = selectedAgent?._id;

  // ?thread=<id> is the addressable active conversation: this opens it once
  // sessions have loaded, and re-fires whenever the value changes — a deep-link,
  // a reload, a sidebar selection (ChatPage pushes the new id), or browser Back
  // walking between conversations. selectSession is idempotent for an already-
  // loaded thread, so re-runs are cheap and never reload over live state.
  useEffect(() => {
    if (!agentId || !mastraAgentId || !threadParam || !sessionsLoaded) return;
    chatStore.selectSession(apolloClient, agentId, mastraAgentId, threadParam);
  }, [agentId, mastraAgentId, threadParam, sessionsLoaded, apolloClient]);

  // Track the viewed agent (clears its unread badge); clear on navigate away.
  useEffect(() => {
    chatStore.setCurrentAgent(agentId);
    return () => chatStore.setCurrentAgent(undefined);
  }, [agentId]);

  // Bootstrap / re-home the active session: once the cached list has loaded and
  // nothing is selected (first open of this agent, or after deleting the active
  // session), open the most recent session or a fresh draft. A ?thread= deep-link
  // owns the initial selection, so skip auto-homing while one is present —
  // otherwise it would race the deep-link effect and override the linked thread.
  useEffect(() => {
    if (!agentId || !mastraAgentId || !sessionsLoaded || activeThreadId) return;
    if (threadParam) return;
    if (threads.length > 0) {
      chatStore.selectSession(
        apolloClient,
        agentId,
        mastraAgentId,
        threads[0].threadId,
      );
    } else {
      chatStore.newDraft(apolloClient, agentId, mastraAgentId);
    }
  }, [
    agentId,
    mastraAgentId,
    sessionsLoaded,
    activeThreadId,
    threadParam,
    threads,
    apolloClient,
  ]);
};
