import { memo } from 'react';
import { IconMessageCircle, IconSitemap } from '@tabler/icons-react';
import { cn } from 'erxes-ui';
import type { ChatMode } from '~/modules/chat/lib/chatMode';

// Segmented Chat | Workflow control for the selected agent.
const MODES: { mode: ChatMode; label: string; icon: typeof IconMessageCircle }[] =
  [
    { mode: 'chat', label: 'Chat', icon: IconMessageCircle },
    { mode: 'workflow', label: 'Workflow', icon: IconSitemap },
  ];

export const SessionModeToggle = memo(
  ({ mode, onChange }: { mode: ChatMode; onChange: (mode: ChatMode) => void }) => (
    <div
      role="tablist"
      aria-label="Sessions mode"
      className="flex items-center gap-0.5 rounded-md bg-muted p-0.5"
    >
      {MODES.map(({ mode: m, label, icon: Icon }) => {
        const active = m === mode;
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  ),
);
SessionModeToggle.displayName = 'SessionModeToggle';
