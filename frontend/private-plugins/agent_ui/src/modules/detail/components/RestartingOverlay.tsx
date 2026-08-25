import { Spinner } from 'erxes-ui';
import { useEffect, useState } from 'react';

interface RestartingOverlayProps {
  visible: boolean;
  // Skip the brief "stopping" phase and open straight into the loading state —
  // used when gating the chat iframe on runtime health (nothing is stopping,
  // we are only waiting for the pod to answer).
  immediate?: boolean;
  stoppingTitle?: string;
  stoppingDescription?: string;
  loadingTitle?: string;
  loadingDescription?: string;
  footerText?: string;
}

export const RestartingOverlay = ({
  visible,
  immediate = false,
  stoppingTitle = 'Stopping...',
  stoppingDescription = 'Please wait while your assistant is being stopped',
  loadingTitle = '✨ Almost Ready!',
  loadingDescription = 'erxes Assistant is restarting',
  footerText = "This may take 1–2 minutes. You won't be able to chat during this time.",
}: RestartingOverlayProps) => {
  const [phase, setPhase] = useState<'stopping' | 'loading'>(
    immediate ? 'loading' : 'stopping',
  );

  useEffect(() => {
    if (!visible) {
      setPhase(immediate ? 'loading' : 'stopping');
      return;
    }

    if (immediate) {
      setPhase('loading');
      return;
    }

    const stopTimer = setTimeout(() => setPhase('loading'), 3000);
    return () => clearTimeout(stopTimer);
  }, [visible, immediate]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
      {phase === 'stopping' ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <Spinner size="lg" containerClassName="flex-none h-auto" />
          <h3 className="text-lg font-semibold">{stoppingTitle}</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            {stoppingDescription}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 text-center max-w-sm w-full px-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-bold">{loadingTitle}</span>
            <p className="text-muted-foreground text-sm">
              {loadingDescription}
            </p>
          </div>

          <Spinner size="lg" containerClassName="flex-none h-auto" />

          <p className="text-xs text-muted-foreground">{footerText}</p>
        </div>
      )}
    </div>
  );
};
