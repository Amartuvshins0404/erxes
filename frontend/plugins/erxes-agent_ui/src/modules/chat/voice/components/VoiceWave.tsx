import { useEffect, useRef } from 'react';
import type { VoicePhase } from '~/modules/chat/voice/hooks/useVoiceConversation';
import type { SpeechAnalyser } from '~/modules/chat/voice/lib/speechAnalyser';
import {
  createVoiceVisual,
  type VoiceVisual,
} from '~/modules/chat/voice/lib/voiceVisual';

// The voice-mode centrepiece: an "aurora well" of liquid light. All the maths
// lives in lib/voiceVisual.ts; this is just the lifecycle shell — it owns the
// rAF loop, samples the agent's live TTS each frame, and tears everything down
// on unmount. Under prefers-reduced-motion it warms a calm still frame and stops.

export const VoiceWave = ({
  phase,
  analyser,
  reducedMotion,
}: {
  phase: VoicePhase;
  analyser: SpeechAnalyser;
  reducedMotion: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let visual: VoiceVisual | null = null;
    try {
      visual = createVoiceVisual(canvas, reducedMotion);
    } catch {
      visual = null;
    }
    if (!visual) return;

    const freq = new Uint8Array(128);
    let raf = 0;
    const t0 = performance.now();
    let prev = t0;

    const sample = (): Uint8Array | null => {
      const node = analyser.node;
      if (phaseRef.current === 'speaking' && node) {
        node.getByteFrequencyData(freq);
        return freq;
      }
      return null;
    };

    if (reducedMotion) {
      // No ongoing animation: prime a lush still composition, then freeze.
      for (let i = 0; i < 70; i++) {
        visual.render({
          phase: phaseRef.current,
          freq: null,
          dt: 1 / 60,
          time: i / 60,
        });
      }
      return () => visual?.dispose();
    }

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      visual!.render({
        phase: phaseRef.current,
        freq: sample(),
        dt,
        time: (now - t0) / 1000,
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      visual?.dispose();
    };
  }, [analyser, reducedMotion]);

  return <canvas ref={canvasRef} className="ea-voice-canvas" aria-hidden />;
};
