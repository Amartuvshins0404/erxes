import { IconPlus, IconSettings, IconSparkles } from '@tabler/icons-react';
import { Breadcrumb, Button, Separator } from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { Link } from 'react-router-dom';

import { ChatPanel } from '@/agents/components/ChatPanel';
import { ThreadList } from '@/agents/components/ThreadList';
import { useAgentsChat } from '@/agents/hooks/useAgentsChat';
import { useAgentsThreads } from '@/agents/hooks/useAgentsThreads';

/**
 * Full-page agents chat: conversation history on the left, live chat with
 * destructive-action approval prompts on the right.
 */
export const IndexPage = () => {
  const chat = useAgentsChat();
  const threadsState = useAgentsThreads();

  const handleSelectThread = (threadId: string) => {
    void chat.openThread(threadId);
  };

  const handleNewConversation = () => {
    chat.startNewConversation();
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <PageHeader.Start>
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
        <PageHeader.End>
          <Button variant="outline" asChild>
            <Link to="/settings/erxes-agent/connection">
              <IconSettings />
              Settings
            </Link>
          </Button>
          <Button variant="outline" onClick={handleNewConversation}>
            <IconPlus />
            New conversation
          </Button>
        </PageHeader.End>
      </PageHeader>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="w-64 flex-none border-r">
          <ThreadList
            threadsState={threadsState}
            activeThreadId={chat.threadId}
            onSelectThread={handleSelectThread}
            onNewConversation={handleNewConversation}
            onThreadDeleted={(threadId) => {
              if (chat.threadId === threadId) {
                chat.startNewConversation();
              }
            }}
          />
        </aside>
        <main className="min-w-0 flex-1">
          <ChatPanel chat={chat} />
        </main>
      </div>
    </div>
  );
};
