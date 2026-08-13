import { cn } from 'erxes-ui';
import { AgentMark } from '~/modules/chat/components/Avatars';

// Agent avatar for list rows and message headers: the agent's initial on a
// primary-tinted disc (the bare erxes glyph reads as a broken image at small
// sizes). `live` sweeps the working ring. Falls back to the brand mark when
// no name is available.
export const AgentAvatar = ({
  live,
  name,
  className,
}: {
  live?: boolean;
  name?: string;
  className?: string;
}) => {
  const initial = name?.trim().charAt(0).toUpperCase();
  if (!initial) return <AgentMark size="md" working={live} />;
  return (
    <div
      className={cn(
        'relative flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium',
        className,
      )}
      style={{
        background: 'color-mix(in oklch, var(--primary) 10%, var(--background))',
        borderColor: 'color-mix(in oklch, var(--primary) 20%, transparent)',
        color: 'var(--primary)',
      }}
    >
      {initial}
      {live && <span className="ea-spin-ring" aria-hidden />}
    </div>
  );
};
