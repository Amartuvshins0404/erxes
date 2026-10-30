import { useState } from 'react';
import { Avatar, Button, readImage } from 'erxes-ui';
import {
  IconArrowLeft,
  IconArrowsDiagonal2,
  IconArrowsDiagonalMinimize,
  IconSparkles,
} from '@tabler/icons-react';
import { useMessenger } from '../../hooks/useMessenger';
import { CloseButton, HERO_ICON_BUTTON_CLASS } from '../CloseButton';

type ConversationDetailsHeaderProps = {
  agentName: string;
  agentAvatar?: string;
  isLastMessageFromBot: boolean;
  isOnline?: boolean;
  aiAgentLabel?: string;
  subtitle: string;
  onBack: () => void;
};

export function ConversationDetailsHeader({
  agentName,
  agentAvatar,
  isLastMessageFromBot,
  isOnline,
  aiAgentLabel,
  subtitle,
  onBack,
}: ConversationDetailsHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-(--color-hero) shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        className={HERO_ICON_BUTTON_CLASS}
        aria-label="Back to conversations"
      >
        <IconArrowLeft />
      </Button>
      <div className="relative shrink-0">
        {isLastMessageFromBot ? (
          <div className="size-9 rounded-full bg-primary-foreground/15 flex items-center justify-center">
            <IconSparkles className="size-5 text-primary-foreground" />
          </div>
        ) : (
          <Avatar className="size-9">
            {agentAvatar && (
              <Avatar.Image
                src={readImage(agentAvatar)}
                alt={agentName}
                className="object-cover"
              />
            )}
            <Avatar.Fallback className="bg-primary-foreground/15 text-primary-foreground font-medium text-sm">
              {agentName.charAt(0).toUpperCase()}
            </Avatar.Fallback>
          </Avatar>
        )}
        {isOnline && !isLastMessageFromBot && (
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-success ring-2 ring-(--color-hero)" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-primary-foreground font-semibold text-sm flex items-center gap-1.5 truncate">
          {isLastMessageFromBot ? (
            <>
              {aiAgentLabel}
              <span className="inline-flex items-center rounded-full px-2 text-xs font-medium h-5 bg-primary-foreground/15 text-primary-foreground shrink-0">
                AI
              </span>
            </>
          ) : (
            agentName
          )}
        </div>
        <div className="text-primary-foreground/70 text-xs truncate">
          {isLastMessageFromBot ? 'Automated · replies instantly' : subtitle}
        </div>
      </div>
      <span className="flex items-center">
        <ConversationDetailsDropdown />
        <CloseButton />
      </span>
    </div>
  );
}

const ConversationDetailsDropdown = () => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const { resetExpand, expandWindow } = useMessenger();
  const handleExpanded = () => {
    if (expanded) {
      resetExpand();
    } else {
      expandWindow();
    }
    setExpanded(!expanded);
  };
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleExpanded}
      className={HERO_ICON_BUTTON_CLASS}
      aria-label={expanded ? 'Collapse messenger' : 'Expand messenger'}
    >
      {expanded ? <IconArrowsDiagonalMinimize /> : <IconArrowsDiagonal2 />}
    </Button>
  );
};
