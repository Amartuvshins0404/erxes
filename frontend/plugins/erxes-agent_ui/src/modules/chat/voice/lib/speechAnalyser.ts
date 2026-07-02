// A tiny Web Audio tap the speech queue routes its TTS playback through, so the
// voice visual can react to what the agent is actually saying. Each played
// <audio> element is wired source → analyser → destination (the analyser is a
// pass-through, audio still reaches the speakers). Created lazily on the first
// attach — AudioContext needs a user gesture, which the mic tap already
// provided — and fully torn down on close so nothing leaks between sessions.

export interface SpeechAnalyser {
  // The live frequency analyser the blob samples each frame; null until the
  // first clip plays or after close().
  readonly node: AnalyserNode | null;
  attach: (el: HTMLAudioElement) => void;
  close: () => void;
}

export const createSpeechAnalyser = (): SpeechAnalyser => {
  let ctx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  // A media element may only ever have ONE MediaElementSource; track them so a
  // re-attach (shouldn't happen — each clip is a fresh element) is a no-op.
  const sources = new WeakSet<HTMLAudioElement>();

  const ensure = (): AnalyserNode | null => {
    if (analyser) return analyser;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.78;
    analyser.connect(ctx.destination);
    return analyser;
  };

  return {
    get node() {
      return analyser;
    },
    attach(el) {
      const a = ensure();
      if (!ctx || !a || sources.has(el)) return;
      // Browsers may start the context suspended; resume on play.
      void ctx.resume().catch(() => undefined);
      try {
        const src = ctx.createMediaElementSource(el);
        src.connect(a);
        sources.add(el);
      } catch {
        // If routing fails the element still plays directly; we just lose the
        // visualisation for this clip rather than dropping audio.
      }
    },
    close() {
      analyser?.disconnect();
      analyser = null;
      const closing = ctx;
      ctx = null;
      void closing?.close().catch(() => undefined);
    },
  };
};
