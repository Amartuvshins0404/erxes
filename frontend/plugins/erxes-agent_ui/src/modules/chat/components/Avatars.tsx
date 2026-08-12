import { cn, ErxesLogoIcon } from 'erxes-ui';

type MarkSize = 'sm' | 'md' | 'lg';

const SIZE: Record<MarkSize, { box: string; logo: string }> = {
  sm: { box: 'size-7', logo: 'h-3.5' },
  md: { box: 'size-8', logo: 'h-4' },
  lg: { box: 'size-16', logo: 'h-8' },
};

// The one agent mark. The same erxes glyph, flat fill, and "thinking" ring in
// every place the agent shows up — chat avatar, empty state, agent rail — so
// they're a single recognizable thing, not three look-alikes that drift apart.
// `active` deepens the flat tint (selected row); `working` sweeps the ring.
export const AgentMark = ({
  size = 'md',
  active,
  working,
  className = '',
}: {
  size?: MarkSize;
  active?: boolean;
  working?: boolean;
  className?: string;
}) => {
  const s = SIZE[size];
  return (
    <div
      className={cn(
        'relative shrink-0 rounded-full border flex items-center justify-center ea-mark',
        s.box,
        active && 'ea-mark-active',
        className,
      )}
    >
      <ErxesLogoIcon className={cn(s.logo, 'w-auto')} />
      {working && <span className="ea-spin-ring" aria-hidden />}
    </div>
  );
};

// One component per file: re-exported here so existing `Avatars` imports keep
// working.
export { AgentAvatar } from '~/modules/chat/components/AgentAvatar';
