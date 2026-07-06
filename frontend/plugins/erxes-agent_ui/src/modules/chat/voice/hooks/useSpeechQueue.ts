import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchSpeech } from '~/modules/chat/voice/lib/voiceTransport';
import {
  createSpeechAnalyser,
  SpeechAnalyser,
} from '~/modules/chat/voice/lib/speechAnalyser';

// Sequential text-to-speech playback. The orchestrator enqueues speakable
// sentences as the reply streams; this hook synthesizes each via tts-1 and
// plays them back in order through a single <audio> element. One sentence is
// prefetched while the current one plays, so gaps between sentences stay small.

export interface SpeechQueue {
  speaking: boolean;
  error?: string;
  // A stable Web Audio tap on the TTS playback, for the voice visual to react
  // to. Its `.node` is null until the first clip plays.
  analyser: SpeechAnalyser;
  enqueue: (text: string) => void;
  reset: () => void;
}

export const useSpeechQueue = (): SpeechQueue => {
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string>();

  // Append-only list of sentences + a cursor, so a one-ahead prefetch can look
  // past the item currently playing without losing queue order.
  const itemsRef = useRef<string[]>([]);
  const cursorRef = useRef(0);
  const prefetchRef = useRef<Map<number, Promise<Blob>> | null>(null);
  if (!prefetchRef.current) prefetchRef.current = new Map();
  const prefetch = prefetchRef.current;
  const pumpingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  if (!abortRef.current) abortRef.current = new AbortController();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // One audio tap for the hook's lifetime — survives reset() (turn interrupts)
  // and is only torn down on unmount, so we don't churn AudioContexts per turn.
  const analyserRef = useRef<SpeechAnalyser | null>(null);
  if (!analyserRef.current) analyserRef.current = createSpeechAnalyser();
  const analyser = analyserRef.current;

  // Fetch (or reuse the prefetched) audio for one sentence. `signal` is the
  // pump run's snapshotted controller signal so the prefetch binds to the same
  // abort generation as its consumer (reset() reassigns abortRef between runs).
  const synthesizeAt = useCallback(
    (index: number, signal: AbortSignal): Promise<Blob> => {
      const cached = prefetch.get(index);
      if (cached) return cached;
      const promise = fetchSpeech(itemsRef.current[index], signal);
      // A one-ahead prefetch may never be awaited (reset/abort drops it). Attach
      // a detached handler so its AbortError can't surface as an
      // unhandledrejection; the stored promise still rejects for whoever awaits.
      promise.catch(() => undefined);
      prefetch.set(index, promise);
      return promise;
    },
    [prefetch],
  );

  const playBlob = useCallback((blob: Blob): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      // Route this clip through the analyser so the blob reacts to it speaking.
      analyser.attach(audio);
      const cleanup = () => URL.revokeObjectURL(url);
      audio.onended = () => {
        cleanup();
        resolve();
      };
      audio.onerror = () => {
        cleanup();
        reject(new Error('Audio playback failed.'));
      };
      void audio.play().catch(reject);
    });
  }, [analyser]);

  const pump = useCallback(async () => {
    if (pumpingRef.current) return;
    pumpingRef.current = true;
    // Snapshot this run's controller. reset() aborts THEN reassigns
    // abortRef.current, so reading the ref after an await would see the fresh
    // (non-aborted) controller and fire a spurious error on every interrupt.
    const controller = abortRef.current!;
    try {
      while (cursorRef.current < itemsRef.current.length) {
        // Skip the fetch/await entirely once the run is aborted.
        if (controller.signal.aborted) return;
        const index = cursorRef.current;
        // Warm the next sentence in the background so it's ready for the next
        // loop, but only gate playback on the current clip's synthesis.
        if (index + 1 < itemsRef.current.length) {
          void synthesizeAt(index + 1, controller.signal);
        }
        const blob = await synthesizeAt(index, controller.signal);
        if (controller.signal.aborted) return;
        setSpeaking(true);
        await playBlob(blob);
        prefetch.delete(index);
        cursorRef.current += 1;
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError((err as Error).message || 'Speech playback failed.');
      }
    } finally {
      pumpingRef.current = false;
      if (cursorRef.current >= itemsRef.current.length) setSpeaking(false);
    }
  }, [synthesizeAt, playBlob, prefetch]);

  const enqueue = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setError(undefined);
      itemsRef.current.push(trimmed);
      void pump();
    },
    [pump],
  );

  // Stop playback and drop everything queued (turn cancelled / mode closed).
  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    itemsRef.current = [];
    cursorRef.current = 0;
    prefetch.clear();
    pumpingRef.current = false;
    setSpeaking(false);
  }, [prefetch]);

  // reset() stops playback between turns; the audio tap is closed only when the
  // hook unmounts (voice mode fully torn down).
  useEffect(
    () => () => {
      reset();
      analyser.close();
    },
    [reset, analyser],
  );

  return useMemo(
    () => ({ speaking, error, analyser, enqueue, reset }),
    [speaking, error, analyser, enqueue, reset],
  );
};
