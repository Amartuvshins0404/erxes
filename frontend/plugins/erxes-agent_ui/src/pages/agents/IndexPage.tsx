import { IconHistory, IconPlus, IconSettings, IconSparkles } from '@tabler/icons-react';
import { Breadcrumb, Button, Separator } from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { Link } from 'react-router-dom';
import { useState } from 'react';

import { ChatPanel } from '@/agents/components/ChatPanel';
import { ThreadList } from '@/agents/components/ThreadList';
import { ThreadsDrawer } from '@/agents/components/ThreadsDrawer';
import { useAgentsChat } from '@/agents/hooks/useAgentsChat';
import { useAgentsThreads } from '@/agents/hooks/useAgentsThreads';

/**
 * Full-page agents chat: conversation history beside the live chat, or — below
 * `lg`, where a 256px sidebar would leave the transcript cramped — behind a
 * left drawer opened from the header.
 */
export const IndexPage = () => {
  const chat = useAgentsChat();
  const threadsState = useAgentsThreads();
  const [threadsOpen, setThreadsOpen] = useState(false);

  const handleNewConversation = () => {
    chat.startNewConversation();
    setThreadsOpen(false);
  };

  const handleSelectThread = (threadId: string) => {
    setThreadsOpen(false);
    void chat.openThread(threadId);
  };

  const handleThreadDeleted = (threadId: string) => {
    if (chat.threadId === threadId) {
      chat.startNewConversation();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <PageHeader.Start>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setThreadsOpen(true)}
            aria-label="Open conversations"
            title="Conversations"
          >
            <IconHistory />
          </Button>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/erxes-agent">
                    <IconSparkles />
                    Agents
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton
            breadcrumb={['Agents']}
            icon="IconSparkles"
          />
        </PageHeader.Start>
        <PageHeader.End className="gap-1.5 sm:gap-3">
          {/* Labels fold away first, so the actions never push the breadcrumb
              off a phone-width header. */}
          <Button variant="outline" asChild aria-label="Settings">
            <Link to="/settings/erxes-agent/connection">
              <IconSettings />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={handleNewConversation}
            aria-label="New conversation"
          >
            <IconPlus />
            <span className="hidden sm:inline">New conversation</span>
          </Button>
        </PageHeader.End>
      </PageHeader>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-64 flex-none border-r lg:block xl:w-72">
          <ThreadList
            threadsState={threadsState}
            activeThreadId={chat.threadId}
            onSelectThread={handleSelectThread}
            onNewConversation={handleNewConversation}
            onThreadDeleted={handleThreadDeleted}
          />
        </aside>
        <main className="flex min-w-0 flex-1">
          <ChatPanel chat={chat} />
        </main>
      </div>

      <ThreadsDrawer
        open={threadsOpen}
        onOpenChange={setThreadsOpen}
        threadsState={threadsState}
        activeThreadId={chat.threadId}
        onSelectThread={handleSelectThread}
        onNewConversation={handleNewConversation}
        onThreadDeleted={handleThreadDeleted}
      />
    </div>
  );
};
