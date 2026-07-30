import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  downsample,
  encodeWav,
  mergeChunks,
} from '~/modules/chat/voice/lib/wavEncoder';

// Push-to-talk microphone capture over the Web Audio API. The caller starts and
// stops a take; stop() resolves the recording as a 16-bit PCM WAV Blob (or null
// when nothing usable was captured). The WAV is encoded IN THE BROWSER so the
// backend can relay it straight to Chimege — no MediaRecorder, no server-side
// ffmpeg transcode. No always-listening / VAD in v1.

// Chimege STT wants 16kHz mono PCM. We ask the AudioContext for it directly so
// no resample is needed; if the browser ignores the hint we decimate on stop.
const TARGET_SAMPLE_RATE = 16000;

// The AudioWorkletProcessor that ships each render quantum of mono samples to
// the main thread. Loaded from a Blob URL because this app is rspack + module
// federation — a separately-bundled worklet asset wouldn't resolve at runtime.
const WORKLET_NAME = 'erxes-voice-recorder';
const WORKLET_SRC = `
class RecorderProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel && channel.length) {
      this.port.postMessage(channel.slice(0));
    }
    return true;
  }
}
registerProcessor('${WORKLET_NAME}', RecorderProcessor);
`;

type AudioContextCtor = typeof AudioContext;

const getAudioContextCtor = (): AudioContextCtor | undefined =>
  typeof window === 'undefined'
    ? undefined
    : window.AudioContext ||
      (window as unknown as { webkitAudioContext?: AudioContextCtor })
        .webkitAudioContext;

export interface VoiceRecorder {
  recording: boolean;
  supported: boolean;
  error?: string;
  start: () => Promise<void>;
  stop: () => Promise<Blob | null>;
  cancel: () => void;
}

export const useVoiceRecorder = (): VoiceRecorder => {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string>();

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const workletUrlRef = useRef<string | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);

  const supported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    !!getAudioContextCtor();

  // Tear down the whole graph: stop the mic, disconnect nodes, close the
  // context, and revoke the worklet Blob URL. Safe to call repeatedly.
  const teardown = useCallback(() => {
    const node = nodeRef.current;
    if (node) {
      if ('port' in node) node.port.onmessage = null;
      else (node as ScriptProcessorNode).onaudioprocess = null;
      node.disconnect();
    }
    nodeRef.current = null;

    sourceRef.current?.disconnect();
    sourceRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    const ctx = ctxRef.current;
    ctxRef.current = null;
    if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => undefined);

    if (workletUrlRef.current) {
      URL.revokeObjectURL(workletUrlRef.current);
      workletUrlRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (!supported) {
      setError('Your browser does not support voice recording.');
      return;
    }
    setError(undefined);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const Ctor = getAudioContextCtor() as AudioContextCtor;
      let ctx: AudioContext;
      try {
        ctx = new Ctor({ sampleRate: TARGET_SAMPLE_RATE });
      } catch {
        // Some browsers reject a forced rate; capture native and decimate later.
        ctx = new Ctor();
      }
      ctxRef.current = ctx;
      // getUserMedia may resolve after a tab switch suspends the context.
      if (ctx.state === 'suspended') await ctx.resume().catch(() => undefined);

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const collect = (samples: Float32Array) => {
        chunksRef.current.push(samples);
      };

      if (ctx.audioWorklet) {
        const blob = new Blob([WORKLET_SRC], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        workletUrlRef.current = url;
        await ctx.audioWorklet.addModule(url);
        const node = new AudioWorkletNode(ctx, WORKLET_NAME);
        node.port.onmessage = (e) => collect(e.data as Float32Array);
        nodeRef.current = node;
        source.connect(node);
        // The processor writes no output, so the destination only ever hears
        // silence — but the node must be in the graph to be pulled.
        node.connect(ctx.destination);
      } else {
        // Fallback for browsers without AudioWorklet support.
        const node = ctx.createScriptProcessor(4096, 1, 1);
        node.onaudioprocess = (e) =>
          collect(e.inputBuffer.getChannelData(0).slice(0));
        nodeRef.current = node;
        source.connect(node);
        node.connect(ctx.destination);
      }

      setRecording(true);
    } catch (err) {
      teardown();
      setRecording(false);
      setError(
        (err as Error)?.name === 'NotAllowedError'
          ? 'Microphone access was denied.'
          : 'Could not start recording.',
      );
    }
  }, [supported, teardown]);

  const stop = useCallback((): Promise<Blob | null> => {
    if (!ctxRef.current) {
      setRecording(false);
      return Promise.resolve(null);
    }
    const captureRate = ctxRef.current.sampleRate;
    const chunks = chunksRef.current;
    chunksRef.current = [];
    teardown();
    setRecording(false);

    const merged = mergeChunks(chunks);
    if (merged.length === 0) return Promise.resolve(null);

    const samples = downsample(merged, captureRate, TARGET_SAMPLE_RATE);
    const rate = Math.min(captureRate, TARGET_SAMPLE_RATE);
    const wav = encodeWav(samples, rate);
    return Promise.resolve(new Blob([wav], { type: 'audio/wav' }));
  }, [teardown]);

  // Drop the current take without producing a blob (mode closed mid-record).
  const cancel = useCallback(() => {
    chunksRef.current = [];
    teardown();
    setRecording(false);
  }, [teardown]);

  // Safety net: free the mic if the component unmounts mid-take.
  useEffect(() => () => teardown(), [teardown]);

  return useMemo(
    () => ({ recording, supported, error, start, stop, cancel }),
    [recording, supported, error, start, stop, cancel],
  );
};
