import type { AgentListItem } from '../hooks/useAgentsList';
import { Button, cn } from 'erxes-ui';
import { IconSparkles } from '@tabler/icons-react';

export const AgentItem = ({
  id,
  identity,
  selectedId,
  setSelectedId,
}: AgentListItem & {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}) => {
  const isActive = selectedId === id;

  const name =
    (identity && typeof identity === 'object' && 'botName' in identity
      ? (identity as { botName?: string }).botName
      : null) || id;
  const emoji =
    identity &&
    typeof identity === 'object' &&
    'emoji' in identity &&
    (identity as { emoji?: string }).emoji;

  const handleClick = () => {
    setSelectedId(id);
  };

  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        'justify-start h-auto rounded-lg p-2 items-start overflow-hidden',
        isActive && 'bg-primary/10 hover:bg-primary/10',
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-2 w-full text-left">
        <div
          className={cn(
            'size-8 bg-foreground/5 rounded-full flex-none flex items-center justify-center shrink-0',
            isActive && 'text-primary',
          )}
        >
          {emoji ? (
            <span className="text-lg leading-none" aria-hidden>
              {emoji}
            </span>
          ) : (
            <IconSparkles className="size-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-auto min-w-0 space-y-1 overflow-hidden">
          <h4
            className={cn(
              'line-clamp-1 truncate text-sm',
              isActive
                ? 'font-medium text-foreground'
                : 'text-muted-foreground',
            )}
          >
            {name}
          </h4>
          <p className="text-xs text-muted-foreground truncate">{id}</p>
        </div>
      </div>
    </Button>
  );
};
