import {
  advanceVoicing,
  initialVoicingState,
  isArmedVoiceReply,
  ReplyFrame,
  VoiceArm,
  VoicingState,
} from './replyVoicing';

// Fold a sequence of assistant-message frames and collect everything spoken.
const runFrames = (frames: ReplyFrame[]): string[] => {
  let state: VoicingState = initialVoicingState;
  const spoken: string[] = [];
  for (const frame of frames) {
    const result = advanceVoicing(state, frame);
    state = result.state;
    spoken.push(...result.speak);
  }
  return spoken;
};

describe('advanceVoicing — M1: only voice-initiated replies are spoken', () => {
  it('does NOT speak a pre-existing reply when voice mode is enabled', () => {
    // Enabling voice on a thread that already has a finished answer.
    const spoken = runFrames([
      {
        clientId: 'old',
        content: 'This is the previous answer. It should stay silent.',
        loading: false,
        isVoiceReply: false,
      },
    ]);
    expect(spoken).toEqual([]);
  });

  it('does NOT re-speak the latest reply after a thread switch', () => {
    const spoken = runFrames([
      {
        clientId: 'threadA',
        content: 'Answer A.',
        loading: false,
        isVoiceReply: false,
      },
      {
        clientId: 'threadB',
        content: 'Answer B from the switched-to thread.',
        loading: false,
        isVoiceReply: false,
      },
    ]);
    expect(spoken).toEqual([]);
  });

  it('does NOT speak the tail when toggled on mid-stream', () => {
    // Non-voice message still streaming when voice is switched on: neither the
    // already-shown prefix nor the post-toggle deltas are voiced.
    const spoken = runFrames([
      {
        clientId: 'm',
        content: 'Half a sentence so',
        loading: true,
        isVoiceReply: false,
      },
      {
        clientId: 'm',
        content: 'Half a sentence so far. And the rest.',
        loading: false,
        isVoiceReply: false,
      },
    ]);
    expect(spoken).toEqual([]);
  });

  it('speaks a voice-initiated reply sentence-by-sentence as it streams', () => {
    const spoken = runFrames([
      {
        clientId: 'v',
        content: 'Hello there. How',
        loading: true,
        isVoiceReply: true,
      },
      {
        clientId: 'v',
        content: 'Hello there. How can I help?',
        loading: true,
        isVoiceReply: true,
      },
      {
        clientId: 'v',
        content: 'Hello there. How can I help?',
        loading: false,
        isVoiceReply: true,
      },
    ]);
    expect(spoken).toEqual(['Hello there.', 'How can I help?']);
  });

  it('flushes the final sentence of a voice reply on turn end', () => {
    const spoken = runFrames([
      {
        clientId: 'v',
        content: 'Only one sentence',
        loading: true,
        isVoiceReply: true,
      },
      {
        clientId: 'v',
        content: 'Only one sentence with no trailing space',
        loading: false,
        isVoiceReply: true,
      },
    ]);
    expect(spoken).toEqual(['Only one sentence with no trailing space']);
  });

  it('strips markdown from spoken sentences', () => {
    const spoken = runFrames([
      {
        clientId: 'v',
        content: 'Use the **dashboard** now. ',
        loading: true,
        isVoiceReply: true,
      },
    ]);
    expect(spoken).toEqual(['Use the dashboard now.']);
  });

  it('does not re-speak across repeated identical frames', () => {
    const frame: ReplyFrame = {
      clientId: 'v',
      content: 'Done here. ',
      loading: true,
      isVoiceReply: true,
    };
    const spoken = runFrames([frame, frame, frame]);
    expect(spoken).toEqual(['Done here.']);
  });

  it('speaks a fresh voice reply that follows a muted previous answer', () => {
    const spoken = runFrames([
      {
        clientId: 'old',
        content: 'Old answer that must stay silent.',
        loading: false,
        isVoiceReply: false,
      },
      {
        clientId: 'new',
        content: 'New spoken answer. ',
        loading: true,
        isVoiceReply: true,
      },
    ]);
    expect(spoken).toEqual(['New spoken answer.']);
  });
});

// One per-render frame as the hook sees it: the latest assistant message of the
// CURRENTLY active thread, plus that active thread id. `arm` is the hook's
// expectVoiceReply/voiceThread/voiceBaseline snapshot.
interface WireFrame {
  activeThreadId: string;
  msgId: string;
  content: string;
  loading: boolean;
}

// Replays the hook's voicing effect purely: derive isVoiceReply from the arm via
// isArmedVoiceReply (the same call the hook makes), then fold through
// advanceVoicing. Models the hook disarming the arm whenever the active thread
// changes (the useEffect on activeThreadId).
const runWired = (arm: VoiceArm, frames: WireFrame[]): string[] => {
  let state: VoicingState = initialVoicingState;
  let armed = arm.armed;
  let prevThread: string | undefined;
  const spoken: string[] = [];
  for (const f of frames) {
    if (prevThread !== undefined && f.activeThreadId !== prevThread) {
      armed = false; // thread switch disarms (hook effect on activeThreadId)
    }
    prevThread = f.activeThreadId;
    const isVoiceReply = isArmedVoiceReply(
      { ...arm, armed },
      f.activeThreadId,
      f.msgId,
    );
    const result = advanceVoicing(state, {
      clientId: f.msgId,
      content: f.content,
      loading: f.loading,
      isVoiceReply,
    });
    state = result.state;
    if (state.clientId === f.msgId && isVoiceReply) armed = false;
    spoken.push(...result.speak);
  }
  return spoken;
};

describe('M1 thread-switch race — arm is scoped to its originating thread', () => {
  it('does NOT speak a switched-to thread’s pre-existing reply mid-arm', () => {
    // Armed in thread A (baseline a0), then the user clicks thread B in the
    // SessionList before A's reply streams. B already has a finished answer.
    const arm: VoiceArm = { armed: true, armThreadId: 'A', baselineId: 'a0' };
    const spoken = runWired(arm, [
      {
        activeThreadId: 'B',
        msgId: 'b1',
        content: 'Thread B pre-existing answer.',
        loading: false,
      },
    ]);
    expect(spoken).toEqual([]);
  });

  it('still speaks A’s real reply when it binds in the originating thread', () => {
    const arm: VoiceArm = { armed: true, armThreadId: 'A', baselineId: 'a0' };
    const spoken = runWired(arm, [
      { activeThreadId: 'A', msgId: 'a1', content: 'Here you go. ', loading: true },
      {
        activeThreadId: 'A',
        msgId: 'a1',
        content: 'Here you go. All done.',
        loading: false,
      },
    ]);
    expect(spoken).toEqual(['Here you go.', 'All done.']);
  });

  it('isArmedVoiceReply: false on thread mismatch, baseline match, or disarmed', () => {
    const base: VoiceArm = { armed: true, armThreadId: 'A', baselineId: 'a0' };
    // thread mismatch
    expect(isArmedVoiceReply(base, 'B', 'b1')).toBe(false);
    // baseline match (the pre-existing reply itself)
    expect(isArmedVoiceReply(base, 'A', 'a0')).toBe(false);
    // disarmed
    expect(isArmedVoiceReply({ ...base, armed: false }, 'A', 'a1')).toBe(false);
    // armed, right thread, new message → the voice reply
    expect(isArmedVoiceReply(base, 'A', 'a1')).toBe(true);
  });
});
