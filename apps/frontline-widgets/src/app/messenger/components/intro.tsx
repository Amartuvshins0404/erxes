import { Avatar, readImage, Skeleton, Spinner } from 'erxes-ui';
import { useGetMessengerSupporters } from '../hooks/useGetMessengerSupporters';
import { ConversationMessage } from './conversation/list';
import { useConversations } from '../hooks/useConversations';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  connectionAtom,
  hasTicketConfigAtom,
  selectedTicketConfigAtom,
  ticketConfigsAtom,
  webAppCredentialsUrlAtom,
} from '../states';
import { HeaderIntro } from './header';
import { AvatarGroup } from './avatar-group';
import { useMessenger } from '../hooks/useMessenger';
import { ISupporter } from '../types';
import {
  IconArrowRight,
  IconBookmark,
  IconHelp,
  IconPlus,
  IconSend,
} from '@tabler/icons-react';
import { WelcomeMessage } from '../constants';
import { formatOnlineHoursShort } from '@libs/formatOnlineHours';

export const Intro = () => {
  const { list: supporters, loading: loadingSupporters } =
    useGetMessengerSupporters();
  const [connection] = useAtom(connectionAtom);
  const setWebAppCredentialsUrl = useSetAtom(webAppCredentialsUrlAtom);
  const ticketForms = useAtomValue(ticketConfigsAtom);
  const setSelectedTicketConfig = useSetAtom(selectedTicketConfigAtom);
  const hasTicketConfig = useAtomValue(hasTicketConfigAtom);
  const { widgetsMessengerConnect } = connection || {};
  const { messengerData } = widgetsMessengerConnect || {};
  const { knowledgeBaseTopicId, websiteApps } = messengerData || {};
  const { switchToTab } = useMessenger();

  const handleSwitchWebCall = (url: string) => {
    setWebAppCredentialsUrl(url);
    switchToTab('web-call');
  };

  if (loadingSupporters) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex flex-col justify-center p-4 font-medium text-sm flex-1 min-h-0">
          <div className="flex items-center gap-3">
            <Skeleton className="flex-none size-8 rounded-full" />
            <Skeleton className="flex-1 h-10 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="shrink-0 relative px-2 -mt-8 z-20">
        <button
          type="button"
          className="w-full rounded-2xl bg-card p-4 text-left shadow-md flex items-center justify-between cursor-pointer outline-none transition-colors hover:bg-accent/60 focus-visible:shadow-focus"
          onClick={() => switchToTab('chat')}
        >
          <div>
            <div className="font-medium text-sm text-foreground">
              Ask a question
            </div>
            <div className="text-muted-foreground text-xs font-normal mt-0.5">
              AI Agent and team can help
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AvatarGroup max={2} size="lg" className="outline-background">
              {supporters?.map((supporter: ISupporter) => (
                <Avatar
                  key={supporter._id}
                  className="outline-1 outline-background"
                  size="lg"
                >
                  <Avatar.Image
                    src={readImage(supporter.details.avatar)}
                    alt={
                      supporter.details.fullName || supporter.details.firstName
                    }
                  />
                  <Avatar.Fallback>
                    {supporter.details.firstName?.charAt(0) || 'S'}
                  </Avatar.Fallback>
                </Avatar>
              ))}
            </AvatarGroup>
            <IconArrowRight className="size-4 text-muted-foreground" />
          </div>
        </button>
      </div>

      <div className="flex flex-col gap-2 pt-2 px-2">
        <HeaderIntro />

        {knowledgeBaseTopicId && (
          <button
            type="button"
            className="w-full rounded-2xl bg-card p-4 text-left shadow-card flex items-center gap-3 cursor-pointer outline-none transition-colors hover:bg-accent/60 focus-visible:shadow-focus"
            onClick={() => switchToTab('faq')}
          >
            <div className="bg-primary/10 text-primary rounded-full size-10 flex items-center justify-center flex-none">
              <IconHelp className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                Popular Article
              </div>
              <div className="text-xs text-muted-foreground truncate">
                Browse our help center
              </div>
            </div>
            <IconArrowRight className="size-4 text-muted-foreground flex-none" />
          </button>
        )}

        {hasTicketConfig && (
          <div className="flex flex-col">
            <span className="ps-2 mb-2 text-xs font-medium text-muted-foreground">
              Tickets
            </span>
            <div className="flex flex-col gap-3">
              {ticketForms?.map((form) => (
                <button
                  type="button"
                  key={form._id}
                  onClick={() => {
                    setSelectedTicketConfig(form);
                    switchToTab('ticket');
                  }}
                  className="w-full rounded-2xl bg-card p-4 text-left shadow-card flex items-center gap-3 cursor-pointer outline-none transition-colors hover:bg-accent/60 focus-visible:shadow-focus"
                >
                  <div className="bg-primary/10 text-primary rounded-full size-10 flex items-center justify-center flex-none">
                    <IconSend className="size-5" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {form.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Issue a ticket
                    </div>
                  </div>
                  <IconArrowRight
                    size={16}
                    className="text-muted-foreground flex-none"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {websiteApps && websiteApps?.length > 0 && (
          <div className="flex flex-col">
            <span className="ps-2 mb-2 text-xs font-medium text-muted-foreground">
              Web apps
            </span>
            {websiteApps.map((app) => (
              <button
                type="button"
                key={app._id}
                className="w-full rounded-2xl bg-card p-4 text-left shadow-card flex items-center gap-3 cursor-pointer outline-none transition-colors hover:bg-accent/60 focus-visible:shadow-focus"
                onClick={() => handleSwitchWebCall(app.credentials.url)}
              >
                <div className="bg-primary/10 text-primary rounded-full size-10 flex items-center justify-center flex-none">
                  <IconBookmark className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {app.credentials.buttonText}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {app.credentials.description}
                  </div>
                </div>
                <IconArrowRight className="size-4 text-muted-foreground flex-none" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const Messages = () => {
  const { conversations, loading } = useConversations();
  const [connection] = useAtom(connectionAtom);
  const { messengerData } = connection.widgetsMessengerConnect || {};
  const { onlineHours, showTimezone, timezone, responseRate } =
    messengerData || {};

  const { switchToTab } = useMessenger();

  if (loading) {
    return <Spinner containerClassName="py-32" />;
  }

  return (
    <div className="flex relative flex-col h-full hide-scroll overflow-y-auto flex-1 font-medium text-sm ">
      <div className="sticky top-0 bg-background/80 backdrop-blur-xl z-30 flex-none p-4 pb-2">
        <button
          type="button"
          className="rounded-2xl w-full group p-4 bg-card shadow-card flex text-left items-center gap-3 cursor-pointer outline-none transition-colors hover:bg-accent/60 focus-visible:shadow-focus"
          onClick={() => switchToTab('chat')}
        >
          <span className="size-9 bg-primary flex justify-center items-center rounded-full">
            <IconPlus className="size-5 text-primary-foreground" />
          </span>
          <span className="flex-1">
            <div className="text-foreground text-sm font-medium">
              Start a new conversation
            </div>
            <div className="text-xs text-muted-foreground font-normal">
              Replies in ~ 4 {responseRate} ·{' '}
              {onlineHours
                ? formatOnlineHoursShort({
                    onlineHours,
                    showTimezone,
                    timezone,
                  })
                : WelcomeMessage.AVAILABILITY_MESSAGE}{' '}
            </div>
          </span>
          <IconArrowRight
            size={16}
            className="text-muted-foreground group-hover:translate-x-0.5 transition-transform"
          />
        </button>
      </div>
      <div className="flex-1 flex flex-col gap-2.5 p-4 pt-2">
        {conversations?.map((conversation) => (
          <ConversationMessage
            key={conversation._id}
            conversationId={conversation._id}
            conversation={conversation}
          />
        ))}
      </div>
      <div className="mx-auto text-xs text-muted-foreground font-normal pt-2 pb-1">
        — end of your conversations —
      </div>
    </div>
  );
};
