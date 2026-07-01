import { lazy, Suspense, useEffect, useState } from 'react';
import type { VoicePhase } from '~/modules/chat/voice/hooks/useVoiceConversation';
import type { SpeechAnalyser } from '~/modules/chat/voice/lib/speechAnalyser';

// The voice overlay's living centrepiece. This is just the lazy boundary: the
// canvas spectrum visualiser is code-split so none of it ships until voice mode
// opens. Behind the canvas sits a pure-CSS glow that covers the gap while the
// chunk loads and the calm pose honored under prefers-reduced-motion.

const VoiceWave = lazy(() =>
  import('~/modules/chat/voice/components/VoiceWave').then((m) => ({
    default: m.VoiceWave,
  })),
);

const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
};

export const VoiceOrb = ({
  phase,
  analyser,
}: {
  phase: VoicePhase;
  analyser: SpeechAnalyser;
}) => {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className={`ea-voice-stage ea-voice-${phase}`}>
      {/* Always-present CSS glow: load fallback + WebGL-unsupported fallback. */}
      <div className="ea-voice-fallback" aria-hidden />
      <Suspense fallback={null}>
        <VoiceWave
          phase={phase}
          analyser={analyser}
          reducedMotion={reducedMotion}
        />
      </Suspense>
    </div>
  );
};
