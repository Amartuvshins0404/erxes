// Browser ↔ agent_api voice transport. Mirrors the chat stream's gateway
// routing (`${REACT_APP_API_URL}/pl:erxes-agent/...`, credentialed) so the same
// authenticated session covers STT and TTS. Keys stay server-side: the browser
// only ever sees transcript text and audio bytes.

import { REACT_APP_API_URL } from 'erxes-ui';

const STT_URL = `${REACT_APP_API_URL}/pl:erxes-agent/chat/voice/stt`;
const TTS_URL = `${REACT_APP_API_URL}/pl:erxes-agent/chat/voice/tts`;

const errorMessage = async (res: Response, fallback: string): Promise<string> => {
  const body = await res.json().catch(() => null);
  return (body as { error?: string } | null)?.error || fallback;
};

/** POST the browser-encoded WAV to Chimege STT; resolves the transcript text. */
export async function transcribeAudio(
  audio: Blob,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(STT_URL, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': audio.type || 'audio/wav' },
    body: audio,
    signal,
  });
  if (!res.ok) {
    throw new Error(await errorMessage(res, 'Could not transcribe the audio.'));
  }
  const data = (await res.json()) as { text?: string };
  return (data.text ?? '').trim();
}

/** POST one sentence to Chimege TTS; resolves the synthesized audio as a Blob.
 *  An optional `voice` overrides the tenant's saved default — used by the
 *  settings page's "Test voice" preview to audition a voice before saving. */
export async function fetchSpeech(
  text: string,
  signal?: AbortSignal,
  voice?: string,
): Promise<Blob> {
  const res = await fetch(TTS_URL, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(voice ? { text, voice } : { text }),
    signal,
  });
  if (!res.ok) {
    throw new Error(await errorMessage(res, 'Could not synthesize speech.'));
  }
  return res.blob();
}
