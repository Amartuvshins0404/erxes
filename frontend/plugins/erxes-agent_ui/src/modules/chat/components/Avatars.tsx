import { ErxesLogoIcon } from 'erxes-ui';

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
      className={`relative ${s.box} shrink-0 rounded-full border flex items-center justify-center ea-mark ${
        active ? 'ea-mark-active' : ''
      } ${className}`}
    >
      <ErxesLogoIcon className={`${s.logo} w-auto`} />
      {working && <span className="ea-spin-ring" aria-hidden />}
    </div>
  );
};

// Message avatar — the agent mark at message size; `live` sweeps the ring.
export const AgentAvatar = ({ live }: { live?: boolean }) => (
  <AgentMark size="md" working={live} />
);

// Shown only between sending and the first streamed event — once thinking /
// tool / text events arrive, the live assistant column takes over. Borderless to
// match that column (no bubble), so there's no shape-change on the handoff.
export const WaitingIndicator = () => (
  <div className="flex items-start gap-3 ea-msg-in">
    <AgentAvatar live />
    <div className="flex items-center gap-1.5 pt-2.5">
      <span className="ea-typing-dot" />
      <span className="ea-typing-dot" />
      <span className="ea-typing-dot" />
    </div>
  </div>
);
