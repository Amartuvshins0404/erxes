import { useEffect, useState } from 'react';
import {
  IconMicrophone,
  IconMicrophoneFilled,
  IconFileText,
  IconX,
} from '@tabler/icons-react';
import { Button, Tooltip } from 'erxes-ui';
import { VoiceConversation } from '~/modules/chat/voice/hooks/useVoiceConversation';
import { VoiceOrb } from '~/modules/chat/voice/components/VoiceOrb';
import { VoiceTranscript } from '~/modules/chat/voice/components/VoiceTranscript';

// Full-screen, hands-free voice surface that replaces the message list while
// voice mode is on. One big iridescent blob floats centre-stage on a dark field,
// alive and audio-reactive; the controls, status line, and spoken transcript
// echo float over it. The assistant speaks its replies; the full transcript is
// hidden behind a toggle. The status line, detail subtitle, and mic affordance
// always agree with the conversation phase — the granular wait copy (per-tool
// labels, server activity, streamed read-along) is derived in the hook (status).

export const VoiceOverlay = ({
  agentName,
  voice,
  onExit,
}: {
  agentName: string;
  voice: VoiceConversation;
  onExit: () => void;
}) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const {
    phase,
    supported,
    error,
    messages,
    lastTranscript,
    analyser,
    status,
    toggleRecording,
  } = voice;

  // Esc leaves voice mode, matching the composer's stop-on-Esc muscle memory.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  const listening = phase === 'listening';
  // While the agent is thinking or speaking, the mic stays live so a tap barges
  // in (stops playback + opens the mic). Only transcribing the user's own take
  // blocks a new one.
  const interruptible = phase === 'thinking' || phase === 'speaking';
  const busy = phase === 'transcribing';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Voice conversation with ${agentName}`}
      className="ea-voice-surface absolute inset-0 z-30 flex overflow-hidden"
    >
      <div className="relative flex-1 flex flex-col min-w-0">
        {/* ── The living blob, full-bleed behind everything ── */}
        {supported && <VoiceOrb phase={phase} analyser={analyser} />}
        {/* Bottom scrim keeps the status + controls legible over the blob. */}
        <div className="ea-voice-scrim" aria-hidden />

        {/* ── Brand mark, low-key in the corner: the real erxes logo asset ── */}
        <div className="pointer-events-none absolute left-4 top-4 z-20 flex items-center gap-2">
          <img
            src="/assets/erxes-logo.svg"
            alt="erxes"
            className="ea-voice-logo h-5 w-auto"
          />
          <span className="text-[11px] font-medium tracking-wide text-white/40">
            agent
          </span>
        </div>

        {/* ── Top controls ── */}
        <div className="relative z-20 flex items-center justify-end gap-1 p-3">
          <Tooltip.Provider>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <Button
                  size="icon"
                  variant={showTranscript ? 'secondary' : 'ghost'}
                  aria-label="Toggle transcript"
                  aria-pressed={showTranscript}
                  className="size-9 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={() => setShowTranscript((v) => !v)}
                >
                  <IconFileText className="size-4" />
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>
                {showTranscript ? 'Hide transcript' : 'Show transcript'}
              </Tooltip.Content>
            </Tooltip>
          </Tooltip.Provider>
          <Tooltip.Provider>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Exit voice mode"
                  className="size-9 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={onExit}
                >
                  <IconX className="size-4" />
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>Exit voice mode (Esc)</Tooltip.Content>
            </Tooltip>
          </Tooltip.Provider>
        </div>

        {/* ── Stage: status + mic float over the lower third ── */}
        <div className="relative z-10 mt-auto flex flex-col items-center gap-6 px-6 pb-14 text-center">
          {supported ? (
            <>
              <div className="flex flex-col items-center gap-2 min-h-16">
                <p
                  key={status.label}
                  aria-live="polite"
                  className={`ea-voice-line text-lg font-medium tracking-tight ${
                    phase === 'error'
                      ? 'text-red-300'
                      : phase === 'idle'
                        ? 'text-white/60'
                        : 'ea-voice-status'
                  }`}
                >
                  {status.label}
                </p>
                {/* While the agent works/speaks, a calm subtitle shows concrete
                    progress: the server activity line, then the streamed reply
                    read-along. At rest it echoes what the user just said. */}
                {status.detail ? (
                  <p
                    key={status.detail}
                    className="ea-voice-line max-w-md text-sm text-white/60 line-clamp-2"
                  >
                    {status.detail}
                  </p>
                ) : (
                  lastTranscript &&
                  phase !== 'error' && (
                    <p className="max-w-md text-sm text-white/55 line-clamp-2">
                      “{lastTranscript}”
                    </p>
                  )
                )}
              </div>

              <div className="flex flex-col items-center gap-3">
                <Button
                  size="icon"
                  aria-label={
                    listening
                      ? 'Stop and send'
                      : interruptible
                        ? 'Interrupt and talk'
                        : 'Start talking'
                  }
                  aria-pressed={listening}
                  disabled={busy}
                  onClick={toggleRecording}
                  className={`ea-voice-mic size-16 rounded-full transition-transform hover:scale-105 active:scale-95 disabled:opacity-60 ${
                    listening ? 'is-listening' : ''
                  }`}
                >
                  {listening ? (
                    <IconMicrophoneFilled className="size-6" />
                  ) : (
                    <IconMicrophone className="size-6" />
                  )}
                </Button>
                <p className="text-[11px] text-white/50">
                  {listening
                    ? 'Tap to stop and send'
                    : busy
                      ? 'One moment…'
                      : interruptible
                        ? 'Tap to interrupt'
                        : 'Tap to speak'}
                </p>
              </div>
            </>
          ) : (
            <div className="max-w-sm text-center text-sm text-white/60">
              Voice mode needs microphone support, which this browser doesn’t
              provide. Switch back to typing to keep chatting.
            </div>
          )}
        </div>
      </div>

      {/* ── Transcript drawer ── */}
      {showTranscript && (
        <aside className="ea-expand relative z-20 w-80 shrink-0 border-l border-white/10 bg-black/40 backdrop-blur-md overflow-y-auto p-4 text-white">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-white/60">
            Transcript
          </h2>
          <VoiceTranscript messages={messages} />
        </aside>
      )}
    </div>
  );
};
