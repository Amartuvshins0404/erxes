import { useEffect } from 'react';
import { useApolloClient } from '@apollo/client';
import { useParams, useSearchParams } from 'react-router-dom';
import { IMastraThread } from '~/modules/chat/types';
import { chatStore, useChatStore } from '~/modules/chat/store/chatStore';

// Owns the session state-machine that used to live in ChatPage's effects: slug→id
// redirect, ?thread= deep-link, current-agent tracking, and bootstrapping /
// re-homing the active session ("pick the most-recent thread or open a draft").
// Keeps that business logic out of the view; ChatPage retains only view-local
// effects (scroll-pin, focus, textarea autogrow).
export const useSessionBootstrap = (
  selectedAgent: { _id: string; agentId: string } | null,
  threads: IMastraThread[],
  sessionsLoaded: boolean,
): string | null => {
  const { agentId } = useParams<{ agentId: string }>();
  const apolloClient = useApolloClient();
  const [searchParams] = useSearchParams();

  const activeThreadId = useChatStore((s) =>
    agentId ? s.agents[agentId]?.activeThreadId : undefined,
  );
  const threadParam = searchParams.get('thread');
  const mastraAgentId = selectedAgent?.agentId;
  const selectedId = selectedAgent?._id;

  // Slug routes normalize to the _id route so the chat store stays keyed by _id.
  // Returned as a redirect target (rendered via <Navigate replace/> by the view)
  // rather than fired from an effect, so the normalization isn't a faked handler.
  const search = searchParams.toString();
  const slugRedirect =
    selectedId && agentId && selectedId !== agentId
      ? `/erxes-agent/chat/${selectedId}${search ? `?${search}` : ''}`
      : null;

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

  return slugRedirect;
};
