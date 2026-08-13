import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useAssistantRuntime,
  useAssistantState,
} from '@assistant-ui/react';
import { chatStore } from '~/modules/chat/store/chatStore';
import { withThreadParam } from '~/modules/chat/lib/threadParam';

// Two-way sync between the remote-thread-list runtime, the addressable
// ?thread= URL param, and the chat store's per-agent active selection.
//
// Ownership: the runtime owns "which conversation is open" (sidebar clicks,
// New chat, delete re-homing); the URL owns deep-links and browser Back; the
// store mirrors the result so the send path and badges keep working.
//
// Loop safety: each direction reacts ONLY to its own source's changes. The
// URL effect reads the runtime via getState() (no reactive dep), and the
// runtime effect reads the param through a ref — otherwise a completed switch
// would re-trigger the opposite direction and ping-pong between two sessions.
export const ChatRuntimeSync = ({ agentId }: { agentId: string }) => {
  const runtime = useAssistantRuntime();
  const [searchParams, setSearchParams] = useSearchParams();
  const threadParam = searchParams.get('thread');

  const isLoading = useAssistantState(({ threads }) => threads.isLoading);
  const mainThreadId = useAssistantState(({ threads }) => threads.mainThreadId);
  const threadIds = useAssistantState(({ threads }) => threads.threadIds);
  const mainStatus = useAssistantState(
    ({ threads }) =>
      threads.threadItems.find((item) => item.id === threads.mainThreadId)
        ?.status,
  );

  // Latest param for the runtime→URL effect without depending on it.
  const threadParamRef = useRef(threadParam);
  useEffect(() => {
    threadParamRef.current = threadParam;
  }, [threadParam]);

  // The initial home (most-recent session) applies exactly once per mounted
  // agent — later "draft" states are user-driven (New chat) and must stick.
  const homedRef = useRef(false);

  // URL → runtime: deep-link / browser Back opens the addressed conversation.
  useEffect(() => {
    if (isLoading || !threadParam) return;
    if (threadParam === runtime.threads.getState().mainThreadId) return;
    void runtime.threads.switchToThread(threadParam).catch(() => {
      // Unknown/dead session — drop the param so the page settles.
      setSearchParams((prev) => withThreadParam(prev, undefined), {
        replace: true,
      });
    });
  }, [isLoading, threadParam, runtime, setSearchParams]);

  // Initial home: with no deep-link, open the most recent session (or stay on
  // the fresh draft when the agent has none).
  useEffect(() => {
    if (isLoading || homedRef.current) return;
    homedRef.current = true;
    if (!threadParam && threadIds.length > 0) {
      void runtime.threads.switchToThread(threadIds[0]);
    }
  }, [isLoading, threadParam, threadIds, runtime]);

  // Runtime → URL + store mirror.
  useEffect(() => {
    if (isLoading || !mainThreadId || !mainStatus) return;
    const param = threadParamRef.current;
    if (mainStatus === 'new') {
      chatStore.setActiveThread(agentId, mainThreadId, true);
      if (param) {
        setSearchParams((prev) => withThreadParam(prev, undefined));
      }
    } else {
      chatStore.setActiveThread(agentId, mainThreadId, false);
      if (param !== mainThreadId) {
        setSearchParams((prev) => withThreadParam(prev, mainThreadId));
      }
    }
  }, [
    isLoading,
    mainThreadId,
    mainStatus,
    agentId,
    setSearchParams,
  ]);

  return null;
};
