import { Avatar, Button, cn, Empty } from 'erxes-ui';
import {
  IconBellOff,
  IconCheck,
  IconChecks,
  IconVolume,
} from '@tabler/icons-react';
import { useMutation } from '@apollo/client';
import { useAtomValue, useSetAtom } from 'jotai';
import { notificationsAtom, setConversationIdAtom } from '../states';
import { useMessenger } from '../hooks/useMessenger';
import { MARK_NOTIFICATIONS_READ } from '../graphql/notificationOperations';
import { formatMessageDate } from '@libs/formatDate';
import { useNotificationSound } from '@libs/useNotificationSound';

export const NotificationsPanel = () => {
  const notifications = useAtomValue(notificationsAtom);
  const { switchToTab } = useMessenger();
  const setConversationId = useSetAtom(setConversationIdAtom);
  const { play: playSound } = useNotificationSound();

  const [markRead, { loading: markingRead }] = useMutation(
    MARK_NOTIFICATIONS_READ,
  );
  const markConversationRead = (conversationId: string) =>
    markRead({ variables: { conversationId } });

  const handleNotificationClick = (conversationId: string) => {
    markConversationRead(conversationId);
    setConversationId(conversationId);
    switchToTab('chat');
  };

  const handleMarkAllRead = () => {
    const unread = notifications.filter((n) => !n.isRead);
    const convIds = [...new Set(unread.map((n) => n.conversationId))];
    convIds.forEach((id) => markConversationRead(id));
  };

  if (!notifications.length) {
    return (
      <Empty className="h-full">
        <Empty.Header>
          <Empty.Media variant="icon">
            <IconBellOff />
          </Empty.Media>
          <Empty.Title>No notifications yet</Empty.Title>
          <Empty.Description>
            You'll see messages from the support team here.
          </Empty.Description>
        </Empty.Header>
      </Empty>
    );
  }

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center px-3 pt-3 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full text-muted-foreground"
          onClick={playSound}
          title="Test notification sound"
        >
          <IconVolume className="size-3.5" />
          Test sound
        </Button>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground"
            onClick={handleMarkAllRead}
            disabled={markingRead}
          >
            <IconChecks className="size-3.5" />
            Mark all as read
          </Button>
        )}
      </div>

      <ul className="flex flex-col gap-2 p-3 overflow-y-auto styled-scroll flex-1 min-h-0">
        {notifications.map((item) => (
          <li key={item.message._id}>
            <button
              type="button"
              onClick={() => handleNotificationClick(item.conversationId)}
              className={cn(
                'w-full text-left flex items-start gap-3 rounded-2xl p-3 outline-none transition-colors focus-visible:shadow-focus',
                item.isRead
                  ? 'text-muted-foreground hover:bg-accent/60'
                  : 'bg-card shadow-card hover:bg-accent/60',
              )}
            >
              <div className="relative shrink-0 mt-0.5">
                <Avatar size="xl" className={item.isRead ? 'grayscale' : ''}>
                  {item.agentAvatar && (
                    <Avatar.Image src={item.agentAvatar} alt={item.agentName} />
                  )}
                  <Avatar.Fallback>
                    {(item.agentName ?? 'S').charAt(0).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar>
                {!item.isRead && (
                  <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary ring-2 ring-card" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span
                    className={cn(
                      'text-sm truncate',
                      item.isRead
                        ? 'font-normal'
                        : 'font-medium text-foreground',
                    )}
                  >
                    {item.agentName}
                  </span>
                  <span
                    className={cn(
                      'text-xs shrink-0',
                      item.isRead
                        ? 'text-muted-foreground'
                        : 'text-primary font-medium',
                    )}
                  >
                    {formatMessageDate(item.message.createdAt)}
                  </span>
                </div>
                <p
                  className={cn(
                    'text-xs line-clamp-2',
                    item.isRead
                      ? 'text-muted-foreground'
                      : 'text-foreground/80',
                  )}
                >
                  {item.message.content}
                </p>
              </div>

              {item.isRead && (
                <IconCheck className="size-3.5 text-muted-foreground shrink-0 mt-1" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
