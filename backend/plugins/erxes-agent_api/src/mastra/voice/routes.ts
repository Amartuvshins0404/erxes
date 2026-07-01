// ---------------------------------------------------------------------------
// Voice HTTP routes, mounted onto the plugin's express router by routes.ts.
// Kept in its own module so the main chat-stream router stays focused.
//
//   POST /chat/voice/stt — raw WAV body (browser-encoded) → { text } transcript
//   POST /chat/voice/tts — { text, voice? } JSON → audio bytes (audio/mpeg)
//
// Both share the chat path's gateway contract: the gateway authenticates the
// request and forwards the user as a base64 header, and both are gated by the
// same `agentsChat` permission as /chat/stream. The discrete STT→chat→TTS
// pipeline keeps the existing Mastra agent + SSE flow untouched: STT only
// produces text the client feeds into the normal send-message path, and TTS
// only voices text the client already streamed back.
// ---------------------------------------------------------------------------

import express, { Router } from 'express';
import { extractUserFromHeader, getSubdomain } from 'erxes-api-shared/utils';
import { checkPermissionGroup } from 'erxes-api-shared/core-modules';
import { makeIpRateLimiter } from '~/utils/rateLimit';
import { VoiceConfig } from '~/mastra/voice/config';
import { resolveVoiceConfigForTenant } from '~/mastra/voice/resolveConfig';
import { CHIMEGE_VOICE_IDS } from '~/mastra/voice/voices';
import {
  isLikelyWav,
  MAX_WAV_BYTES,
  synthesize,
  transcribe,
} from '~/mastra/voice/chimegeVoice';

// Outer upload cap (express.raw limit). The body is a browser-encoded WAV; the
// real bound is Chimege's 3MB cap (MAX_WAV_BYTES), enforced below before we
// forward. This just stops an unauthenticated/oversized stream early.
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
// The client voices one sentence per call; long text is chunked into Chimege's
// 300-char windows inside synthesize(). This is the outer request bound.
const MAX_TTS_CHARS = 4000;

// Shared per-IP throttle (same shape as /chat/stream).
const voiceRouteLimiter = makeIpRateLimiter();

// The plugin mounts cors() with no options, so the cors package defaults to
// `Access-Control-Allow-Origin: *` on every response. Browsers reject `*` on a
// credentialed fetch (credentials:'include'), so the gateway's exact-origin
// header must stand alone — drop the wildcard on EVERY voice response (success
// AND error), or both the STT/TTS bodies and their error JSON become unreadable
// to the client. Same precedent as /chat/stream.
function dropWildcardCors(res: express.Response) {
  res.removeHeader('Access-Control-Allow-Origin');
}

// Cheap auth+permission gate, run BEFORE any body parsing so an unauthenticated
// request never buffers a 25MB upload. Resolves { ok, subdomain }; on failure
// it has already written the matching response. Runs first on both routes, so
// dropping the wildcard CORS header here covers every downstream exit path too.
async function authorizeVoice(
  req: express.Request,
  res: express.Response,
): Promise<{ ok: boolean; subdomain: string }> {
  dropWildcardCors(res);
  const user = extractUserFromHeader(req.headers);
  if (!user?._id) {
    res.status(401).json({ error: 'Login required' });
    return { ok: false, subdomain: '' };
  }
  const subdomain = getSubdomain(req);
  try {
    await checkPermissionGroup(subdomain, user)('agentsChat');
  } catch {
    res.status(403).json({ error: 'Permission required' });
    return { ok: false, subdomain: '' };
  }
  return { ok: true, subdomain };
}

// Reject before doing work when the requested direction is unconfigured (no
// token for it / globally disabled). Resolution is per-tenant: the tenant's
// stored Chimege tokens win, falling back to env. STT and TTS use separate
// tokens, so each is gated independently.
async function ensureConfigured(
  res: express.Response,
  subdomain: string,
  direction: 'stt' | 'tts',
): Promise<VoiceConfig | null> {
  const voice = await resolveVoiceConfigForTenant(subdomain);
  const ready = direction === 'stt' ? voice.sttEnabled : voice.ttsEnabled;
  if (!ready) {
    res.status(503).json({ error: 'Voice mode is not configured.' });
    return null;
  }
  return voice;
}

export function registerVoiceRoutes(router: Router): void {
  // ─── Speech-to-text ───────────────────────────────────────────────────────
  // Auth runs first; only then does express.raw buffer the audio body — an
  // unauthenticated caller is rejected before any upload is read into memory.
  router.post(
    '/chat/voice/stt',
    voiceRouteLimiter,
    async (req, res, next) => {
      const auth = await authorizeVoice(req, res);
      if (!auth.ok) return;
      const voice = await ensureConfigured(res, auth.subdomain, 'stt');
      if (!voice) return;
      // Stash the resolved per-tenant config so the body handler reuses it
      // without a second DB read.
      res.locals.voice = voice;
      next();
    },
    express.raw({ type: () => true, limit: MAX_AUDIO_BYTES }),
    async (req, res) => {
      const voice = res.locals.voice as VoiceConfig;

      const audio = req.body;
      if (!Buffer.isBuffer(audio) || audio.length === 0) {
        return res.status(400).json({ error: 'No audio data received.' });
      }
      // Don't trust the client: bound the WAV at Chimege's cap and sanity-check
      // the header before forwarding. A bad/oversized body is a clean 400 (the
      // client sent junk), never a 502 (upstream fault).
      if (audio.length > MAX_WAV_BYTES) {
        return res.status(400).json({
          error: 'Recording is too long. Please keep it under ~90 seconds.',
        });
      }
      if (!isLikelyWav(audio)) {
        return res.status(400).json({ error: 'Invalid audio format.' });
      }

      try {
        const text = await transcribe({
          token: voice.sttToken,
          audio,
          punctuate: voice.punctuate,
        });
        return res.json({ text });
      } catch (err) {
        console.error('[voice stt error]', err);
        return res
          .status(502)
          .json({ error: (err as Error).message || 'Transcription failed.' });
      }
    },
  );

  // ─── Text-to-speech ───────────────────────────────────────────────────────
  // One sentence of text in, audio bytes out. The client buffers the streamed
  // reply into sentences and calls this per sentence for low latency.
  router.post('/chat/voice/tts', voiceRouteLimiter, async (req, res) => {
    const auth = await authorizeVoice(req, res);
    if (!auth.ok) return;
    const voice = await ensureConfigured(res, auth.subdomain, 'tts');
    if (!voice) return;

    const body = (req.body ?? {}) as { text?: unknown; voice?: unknown };
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return res.status(400).json({ error: 'text is required.' });
    }
    if (text.length > MAX_TTS_CHARS) {
      return res.status(400).json({ error: 'text is too long.' });
    }
    let selectedVoice = voice.ttsVoice;
    if (typeof body.voice === 'string' && body.voice.trim()) {
      const requested = body.voice.trim();
      if (!CHIMEGE_VOICE_IDS.has(requested)) {
        return res.status(400).json({ error: 'Unknown voice.' });
      }
      selectedVoice = requested;
    }

    try {
      const { audio, contentType } = await synthesize({
        token: voice.ttsToken,
        voice: selectedVoice,
        text,
        sampleRate: voice.ttsSampleRate,
      });
      // Wildcard CORS already dropped in authorizeVoice; let the gateway's
      // exact-origin headers stand on this credentialed audio response.
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', audio.length);
      res.setHeader('Cache-Control', 'no-store');
      return res.end(audio);
    } catch (err) {
      console.error('[voice tts error]', err);
      return res
        .status(502)
        .json({ error: (err as Error).message || 'Speech synthesis failed.' });
    }
  });
}
