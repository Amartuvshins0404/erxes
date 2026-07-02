import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import {
  chatStore,
  selectActiveChat,
  useChatStore,
} from '~/modules/chat/store/chatStore';
import { useAgentChatView, useAgentActivity } from '~/modules/chat/hooks/useChatView';
import { AgentUIMessage } from '~/modules/chat/types';
import { asToolPart, messageText } from '~/modules/chat/lib/uiParts';
import {
  deriveVoiceStatus,
  VoiceStatusView,
} from '~/modules/chat/voice/lib/voiceStatus';
import { useVoiceRecorder } from '~/modules/chat/voice/hooks/useVoiceRecorder';
import { useSpeechQueue } from '~/modules/chat/voice/hooks/useSpeechQueue';
import { SpeechAnalyser } from '~/modules/chat/voice/lib/speechAnalyser';
import {
  advanceVoicing,
  initialVoicingState,
  isArmedVoiceReply,
  VoicingState,
} from '~/modules/chat/voice/lib/replyVoicing';
import { transcribeAudio } from '~/modules/chat/voice/lib/voiceTransport';

// Hands-free voice loop wired onto the existing AI SDK chat path: record →
// Whisper STT → chatStore.sendMessage (the normal agent + SSE flow) → speak the
// streamed reply sentence-by-sentence. The agent brain, transport, and message
// mapping are untouched; this only adds a microphone in front and a speaker
// behind, reading the streaming assistant message straight off useChat's
// `messages`. Only replies initiated through this voice path are spoken — see
// replyVoicing.ts for the contract.

export type VoicePhase =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'thinking'
  | 'speaking'
  | 'error';

export interface VoiceConversation {
  phase: VoicePhase;
  supported: boolean;
  error?: string;
  messages: AgentUIMessage[];
  // The user's last spoken-and-sent transcript (for a subtle on-screen echo).
  lastTranscript?: string;
  // Web Audio tap on the spoken reply, for the audio-reactive blob visual.
  analyser: SpeechAnalyser;
  // Granular wait-window copy derived from the live turn (status label + detail).
  status: VoiceStatusView;
  toggleRecording: () => void;
}

const lastAssistant = (
  messages: AgentUIMessage[],
): AgentUIMessage | undefined => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') return messages[i];
  }
  return undefined;
};

// Name of the tool whose call is in flight (input sent, no result yet) on the
// latest assistant message — drives the per-tool wait label. The last pending
// tool wins, so a fresh call supersedes one whose result already landed.
const activeToolName = (
  message: AgentUIMessage | undefined,
): string | undefined => {
  if (!message) return undefined;
  let name: string | undefined;
  for (const part of message.parts) {
    const tool = asToolPart(part);
    if (tool?.pending && tool.toolName) name = tool.toolName;
  }
  return name;
};

// The authoritative live messages of this agent's active Chat (un-throttled),
// used to snapshot the baseline assistant id at send time.
const activeMessages = (agentId: string | undefined): AgentUIMessage[] =>
  agentId ? selectActiveChat(useChatStore.getState(), agentId).messages : [];

export const useVoiceConversation = (
  agentId: string | undefined,
  mastraAgentId: string | undefined,
  enabled: boolean,
): VoiceConversation => {
  const client = useApolloClient();
  const recorder = useVoiceRecorder();
  const speech = useSpeechQueue();
  const view = useAgentChatView(agentId);
  const { messages, loading, activeThreadId } = view;
  // Server-pushed "what the agent is doing now" line for the working thread.
  const serverActivity = useAgentActivity(agentId ?? '');

  const [transcribing, setTranscribing] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string>();
  const [localError, setLocalError] = useState<string>();

  // Pure voicing state machine progress for the current message.
  const voicingRef = useRef<VoicingState>(initialVoicingState);
  // Armed in sendTranscript; the next NEW assistant message (id different from
  // the one present at send time) is the voice reply and is spoken.
  const expectVoiceReplyRef = useRef(false);
  const voiceBaselineRef = useRef<string | undefined>(undefined);
  // The thread the arm belongs to. If the user switches sessions (SessionList is
  // outside the overlay, still clickable) before the reply binds, the active
  // thread no longer matches — so we must NOT treat thread B's existing reply as
  // the voice reply. Scopes M1 to the originating thread.
  const voiceThreadRef = useRef<string | undefined>(undefined);

  const { enqueue, reset: resetSpeech, analyser: speechAnalyser } = speech;

  // Feed newly-streamed reply text into the speech queue as whole sentences,
  // but only for a voice-initiated reply (the rest is seeded/skipped). `messages`
  // is a fresh array on every throttled streaming update, so this re-runs as the
  // reply grows — no separate stream tick needed.
  useEffect(() => {
    if (!enabled) return;
    const msg = lastAssistant(messages);
    if (!msg) return;

    const isNewMessage = voicingRef.current.clientId !== msg.id;
    const isVoiceReply = isArmedVoiceReply(
      {
        armed: expectVoiceReplyRef.current,
        armThreadId: voiceThreadRef.current,
        baselineId: voiceBaselineRef.current,
      },
      activeThreadId,
      msg.id,
    );

    const { state, speak } = advanceVoicing(voicingRef.current, {
      clientId: msg.id,
      content: messageText(msg),
      loading,
      isVoiceReply,
    });
    voicingRef.current = state;

    // The voice reply has now bound — disarm so a later thread switch can't be
    // mistaken for it.
    if (isNewMessage && isVoiceReply) expectVoiceReplyRef.current = false;

    speak.forEach((sentence) => enqueue(sentence));
  }, [enabled, messages, loading, activeThreadId, enqueue]);

  // Switching the active thread disarms a pending voice reply: an arm only ever
  // applies to the thread it was issued from (M1 thread scope).
  useEffect(() => {
    expectVoiceReplyRef.current = false;
  }, [activeThreadId]);

  const sendTranscript = useCallback(
    async (audio: Blob) => {
      setTranscribing(true);
      setLocalError(undefined);
      try {
        const text = await transcribeAudio(audio);
        if (!text) {
          setLocalError("Didn't catch that — try again.");
          return;
        }
        setLastTranscript(text);
        // Fresh reply incoming: stop any lingering playback before it streams,
        // and arm voicing for the NEXT new assistant message (the one whose id
        // differs from the latest assistant present on the live Chat right now).
        resetSpeech();
        if (agentId && mastraAgentId) {
          voiceBaselineRef.current = lastAssistant(activeMessages(agentId))?.id;
          voiceThreadRef.current = activeThreadId;
          expectVoiceReplyRef.current = true;
          chatStore.sendMessage(client, agentId, mastraAgentId, text);
        }
      } catch (err) {
        setLocalError((err as Error).message || 'Transcription failed.');
      } finally {
        setTranscribing(false);
      }
    },
    [client, agentId, mastraAgentId, activeThreadId, resetSpeech],
  );

  // Barge-in: silence the agent mid-reply. Stops playback and clears the queue
  // (resetSpeech), then cancels the in-flight reply's voicing so the streaming
  // effect can't re-enqueue audio after the interrupt. Disarming covers a 'thinking'
  // interrupt (the reply message may not exist yet); muting the current voicing
  // entry covers a 'speaking' interrupt (advanceVoicing then swallows every
  // remaining delta for that same message instead of speaking it).
  const interrupt = useCallback(() => {
    resetSpeech();
    expectVoiceReplyRef.current = false;
    voicingRef.current = { ...voicingRef.current, mute: true };
  }, [resetSpeech]);

  // Click-to-toggle push-to-talk with barge-in: a tap while recording stops and
  // sends; a tap while the agent is thinking/speaking interrupts it and opens the
  // mic; a tap at rest just opens the mic.
  const toggleRecording = useCallback(() => {
    if (recorder.recording) {
      void recorder.stop().then((blob) => {
        if (blob) void sendTranscript(blob);
      });
      return;
    }
    // A take is still being transcribed into text — can't start another yet.
    if (transcribing) return;
    interrupt();
    void recorder.start();
  }, [recorder, transcribing, sendTranscript, interrupt]);

  // Leaving voice mode tears down the mic, any in-flight playback, and the Web
  // Audio tap (AnalyserNode + AudioContext) — not just on unmount. It is rebuilt
  // lazily on the next spoken clip when voice mode reopens.
  const { cancel: cancelRecorder } = recorder;
  useEffect(() => {
    if (!enabled) {
      cancelRecorder();
      resetSpeech();
      speechAnalyser.close();
      voicingRef.current = initialVoicingState;
      expectVoiceReplyRef.current = false;
      voiceThreadRef.current = undefined;
    }
  }, [enabled, cancelRecorder, resetSpeech, speechAnalyser]);

  const error = localError || recorder.error || speech.error;

  let phase: VoicePhase = 'idle';
  if (error) phase = 'error';
  else if (recorder.recording) phase = 'listening';
  else if (transcribing) phase = 'transcribing';
  else if (speech.speaking) phase = 'speaking';
  else if (loading) phase = 'thinking';

  // Granular wait copy: the active tool drives the thinking label, the server
  // activity adds concrete detail, and the streamed reply becomes a read-along
  // subtitle while speaking. Recomputed each streaming tick off `messages`.
  const status = useMemo(() => {
    const msg = lastAssistant(messages);
    return deriveVoiceStatus({
      phase,
      error,
      activeToolName: activeToolName(msg),
      serverActivity,
      partialText: msg ? messageText(msg) : '',
    });
  }, [phase, error, messages, serverActivity]);

  return useMemo(
    () => ({
      phase,
      supported: recorder.supported,
      error,
      messages,
      lastTranscript,
      analyser: speech.analyser,
      status,
      toggleRecording,
    }),
    [
      phase,
      recorder.supported,
      error,
      messages,
      lastTranscript,
      speech.analyser,
      status,
      toggleRecording,
    ],
  );
};
