import { cleanForSpeech, splitSentences } from './sentences';

// Pure state machine that decides which streamed assistant text to speak.
//
// Contract: voice mode speaks ONLY a reply whose turn was initiated through the
// voice path (`isVoiceReply`). Anything already on screen when voice mode is
// enabled — the previous answer, the latest reply of a thread the user switched
// to, an in-progress reply when toggled on mid-stream — is seeded as
// already-consumed and never spoken. Keeping this logic pure and React-free
// makes the "speak the streamed reply" contract directly unit-testable.

export interface VoicingState {
  // _clientId of the message currently being voiced (or seeded/skipped).
  clientId?: string;
  // How many chars of that message have been pushed to the speech queue.
  consumed: number;
  // Unspoken trailing partial (not yet a complete sentence).
  buffer: string;
  // Whether the final tail has been flushed for this message.
  flushed: boolean;
  // True for a non-voice message: every delta is swallowed and nothing is ever
  // spoken, even text that streams in after voice mode was toggled on.
  mute: boolean;
}

export const initialVoicingState: VoicingState = {
  consumed: 0,
  buffer: '',
  flushed: false,
  mute: false,
};

// The "arm" the conversation hook sets when a transcript is sent: the next NEW
// assistant message of the SAME thread is the voice reply to speak. Kept pure so
// the thread-scope wiring (which the state machine alone can't cover) is testable
// without rendering the hook.
export interface VoiceArm {
  // expectVoiceReplyRef — a send is awaiting its spoken reply.
  armed: boolean;
  // voiceThreadRef — the active thread the arm was issued from.
  armThreadId?: string;
  // voiceBaselineRef — last assistant id present when the transcript was sent.
  baselineId?: string;
}

/**
 * Whether the latest assistant message of the ACTIVE thread is the voice reply
 * this arm was issued for. Thread-scoped: an arm only applies to the thread it
 * was created in, so switching sessions before the reply binds never voices the
 * switched-to thread's pre-existing reply (the M1 thread-switch race).
 */
export function isArmedVoiceReply(
  arm: VoiceArm,
  activeThreadId: string | undefined,
  messageId: string,
): boolean {
  return (
    arm.armed &&
    arm.armThreadId === activeThreadId &&
    messageId !== arm.baselineId
  );
}

export interface ReplyFrame {
  // The latest assistant message in the active thread.
  clientId: string;
  content: string;
  // Whether the turn is still active (streaming / awaiting).
  loading: boolean;
  // Whether THIS message's turn was initiated via the voice path. Only such a
  // reply is spoken from its start; everything else is seeded as consumed.
  isVoiceReply: boolean;
}

export interface VoicingResult {
  state: VoicingState;
  // Cleaned, speakable sentences to enqueue (already markdown-stripped).
  speak: string[];
}

/**
 * Fold one assistant-message frame into the voicing state, returning any newly
 * complete sentences to speak. Idempotent across repeated identical frames (no
 * new text → empty `speak`).
 */
export function advanceVoicing(
  prev: VoicingState,
  frame: ReplyFrame,
): VoicingResult {
  let { clientId, consumed, buffer, flushed, mute } = prev;
  const speak: string[] = [];

  // First time this message is seen: a voice-initiated reply speaks from the
  // start; anything else (previous answer, switched-to thread, mid-stream
  // toggle) is muted so it is never voiced.
  if (clientId !== frame.clientId) {
    clientId = frame.clientId;
    buffer = '';
    mute = !frame.isVoiceReply;
    consumed = frame.isVoiceReply ? 0 : frame.content.length;
    flushed = !frame.isVoiceReply;
  }

  // A muted message swallows every further delta and never speaks.
  if (mute) {
    consumed = frame.content.length;
    return {
      state: { clientId, consumed, buffer, flushed, mute },
      speak,
    };
  }

  // Pull any newly-streamed complete sentences out of the growing content.
  if (frame.content.length > consumed) {
    buffer += frame.content.slice(consumed);
    consumed = frame.content.length;
    const { sentences, rest } = splitSentences(buffer);
    buffer = rest;
    for (const sentence of sentences) {
      const cleaned = cleanForSpeech(sentence);
      if (cleaned) speak.push(cleaned);
    }
  }

  // Turn finished — voice whatever sentence remained in the tail buffer.
  if (!frame.loading && !flushed) {
    flushed = true;
    const tail = cleanForSpeech(buffer);
    buffer = '';
    if (tail) speak.push(tail);
  }

  return { state: { clientId, consumed, buffer, flushed, mute }, speak };
}
