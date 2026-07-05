import { Router } from 'express';
import { createUIMessageStream, pipeUIMessageStreamToResponse } from 'ai';
import { extractUserFromHeader, getSubdomain } from 'erxes-api-shared/utils';
import { checkPermissionGroup } from 'erxes-api-shared/core-modules';
import { generateModels } from './connectionResolvers';
import { getOrCreateAgent } from './mastra/agentRuntime';
import { isReasoningEffort } from './mastra/providers';
import { runWithAuth, ApprovedOp } from './mastra/requestContext';
import { resolveBackgroundPrincipal } from './mastra/auth/backgroundPrincipal';
import { isAdvancedMemoryEnabled } from './mastra/memory/config';
import { scopedResource } from './mastra/memory/mastraMemory';
import { augmentConvo } from './mastra/memory';
import { readLearnedDigest } from './mastra/learning/digest';
import {
  toUserFacingError,
  runAgentTurn,
  patchNativeTurn,
  TurnAgent,
} from '@/agent/turn';
import { IMastraChatAttachment } from '@/session/@types/session';
import { attachmentStorageStatus } from '@/settings/graphql/resolvers/queries/settings';
import { registerVoiceRoutes } from './mastra/voice/routes';
import {
  streamAgentTurn,
  type ChatStreamRequest,
} from './mastra/streamTurn';
import { makeIpRateLimiter } from './utils/rateLimit';
import { registerActiveRun } from './mastra/runRegistry';

export const router: Router = Router();

// Voice mode (speech-to-text + text-to-speech). Discrete pipeline that reuses
// the existing chat path: STT only produces transcript text the client feeds
// into POST /chat/stream, and TTS only voices text the client streamed back.
registerVoiceRoutes(router);

// Generous per-IP throttle on the LLM-backed endpoints — normal chat traffic
// stays well under it; it only blunts abnormal high-frequency bursts (and the
// LLM/API cost they would incur). Single canonical definition shared with the
// voice routes via makeIpRateLimiter so the limits never drift apart.
const llmRouteLimiter = makeIpRateLimiter();

// ─── Streaming chat (AI SDK UIMessage stream) ────────────────────────────────
//
// POST /chat/stream — the in-app chat UI's transport, proxied through the
// gateway at /pl:erxes-agent/chat/stream. The gateway's userMiddleware has
// already authenticated the request and forwarded the user as a base64 header.
//
// The body is the standard AI SDK v5 UIMessage stream (text / reasoning / tool
// parts), produced by Mastra's `toUIMessageStream` and bridged to the Express
// response with `pipeUIMessageStreamToResponse`. On top of the model parts we
// write three erxes-only transient data parts:
//   data-activity      — LLM one-liner of what the agent is doing right now
//   data-thread-title  — the auto-generated conversation title (after the turn)
//   data-heartbeat     — keeps the gateway proxy socket warm during long tools
// and stamp `messageId` / `interrupted` / `langfuseTraceId` onto the assistant
// message's metadata via the final `finish` chunk.
//
// Interrupt: the client aborts the fetch; the closed connection aborts the
// agent run via AbortSignal. Whatever text already streamed is persisted and
// marked `interrupted` so the partial reply survives reloads.

// Shared skeleton for the untrusted-array shape guards below: an absent value is
// an empty list; anything that isn't an array or overflows the cap is malformed
// (null); otherwise each item is run through `validateItem`, and the first item
// that fails (returns null) rejects the whole payload. Keeps the per-item
// validation of each caller intact — this only owns the outer envelope.
function parseBoundedArray<T>(
  raw: unknown,
  max: number,
  validateItem: (item: unknown) => T | null,
): T[] | null {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw) || raw.length > max) return null;
  const out: T[] = [];
  for (const item of raw) {
    const parsed = validateItem(item);
    if (parsed === null) return null;
    out.push(parsed);
  }
  return out;
}

// Shape-check the attachments array a chat turn may carry. Returns the
// sanitized list, or null when the payload is malformed.
const MAX_ATTACHMENTS_PER_MESSAGE = 10;
function sanitizeAttachments(raw: unknown): IMastraChatAttachment[] | null {
  return parseBoundedArray(raw, MAX_ATTACHMENTS_PER_MESSAGE, (item) => {
    const candidate = item as Record<string, unknown> | null | undefined;
    if (
      !candidate ||
      typeof candidate.url !== 'string' ||
      typeof candidate.name !== 'string'
    )
      return null;
    const url = candidate.url.trim();
    const name = candidate.name.trim();
    if (!url || url.length > 2048 || !name || name.length > 512) return null;
    return {
      url,
      name,
      type:
        typeof candidate.type === 'string'
          ? candidate.type.slice(0, 128)
          : undefined,
      size:
        // skipcq: JS-W1031 — byte size from untrusted input, not a collection length
        typeof candidate.size === 'number' && candidate.size >= 0
          ? candidate.size
          : undefined,
    };
  });
}

// Shape-check the slash-activated skill names the composer echoes on send.
// Returns the sanitized list, or null when malformed. Names are re-resolved
// against the user's reachable skills server-side (prepareChatTurn), so this is
// only a payload-shape guard — it never trusts the names as authorization.
const MAX_ACTIVE_SKILLS = 10;
const MAX_SKILL_NAME_LEN = 64;
function sanitizeActiveSkillNames(raw: unknown): string[] | null {
  return parseBoundedArray(raw, MAX_ACTIVE_SKILLS, (item) => {
    if (typeof item !== 'string') return null;
    const name = item.trim();
    if (!name || name.length > MAX_SKILL_NAME_LEN) return null;
    return name;
  });
}

// Shape-check the per-turn destructive-op approvals the client echoes back when
// the user clicks Approve. Returns the sanitized list, or null when malformed.
const MAX_APPROVED_OPS = 20;
function sanitizeApprovedOperations(raw: unknown): ApprovedOp[] | null {
  return parseBoundedArray(raw, MAX_APPROVED_OPS, (item) => {
    const candidate = item as Record<string, unknown> | null | undefined;
    if (!candidate || typeof candidate.operation !== 'string') return null;
    const args =
      candidate.args && typeof candidate.args === 'object'
        ? (candidate.args as Record<string, unknown>)
        : undefined;
    return { operation: candidate.operation, args };
  });
}

type ParseResult =
  | { ok: true; value: ChatStreamRequest }
  | { ok: false; error: string };

function parseChatStreamBody(raw: unknown): ParseResult {
  const body = (raw ?? {}) as Record<string, unknown>;
  const { agentId, message, threadId, reasoningEffort } = body;

  if (
    typeof agentId !== 'string' ||
    !agentId ||
    typeof message !== 'string' ||
    !message.trim()
  ) {
    return { ok: false, error: 'agentId and message are required' };
  }
  if (threadId !== undefined && typeof threadId !== 'string') {
    return { ok: false, error: 'threadId must be a string' };
  }
  if (reasoningEffort !== undefined && !isReasoningEffort(reasoningEffort)) {
    return {
      ok: false,
      error: 'reasoningEffort must be off | low | medium | high',
    };
  }

  const attachments = sanitizeAttachments(body.attachments);
  if (attachments === null) {
    return { ok: false, error: 'Invalid attachments payload' };
  }

  const approvedOperations = sanitizeApprovedOperations(body.approvedOperations);
  if (approvedOperations === null) {
    return { ok: false, error: 'Invalid approvedOperations payload' };
  }

  const activeSkillNames = sanitizeActiveSkillNames(body.activeSkillNames);
  if (activeSkillNames === null) {
    return { ok: false, error: 'Invalid activeSkillNames payload' };
  }

  return {
    ok: true,
    value: {
      agentId,
      message,
      threadId,
      reasoningEffort,
      attachments,
      approvedOperations,
      activeSkillNames,
      voiceMode: body.voiceMode === true,
    },
  };
}

router.post('/chat/stream', llmRouteLimiter, async (req, res) => {
  const user = extractUserFromHeader(req.headers);
  if (!user?._id) {
    return res.status(401).json({ error: 'Login required' });
  }

  const parsed = parseChatStreamBody(req.body);
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }
  // The validated turn payload (agentId, message, reasoningEffort, attachments,
  // approvedOperations, activeSkillNames, voiceMode …) is handed to
  // streamAgentTurn wholesale; only `attachments` is inspected here for the
  // early storage guard below.
  const { attachments, threadId } = parsed.value;

  const subdomain = getSubdomain(req);

  // Streaming chat is the HTTP twin of the mastraAgentChat resolver, so it is
  // gated by the same `agentsChat` permission. checkPermissionGroup throws on
  // denial (FORBIDDEN) — translate that into a 403 for the SSE client.
  try {
    await checkPermissionGroup(subdomain, user)('agentsChat');
  } catch {
    return res.status(403).json({ error: 'Permission required' });
  }

  const models = await generateModels(subdomain);

  // Attachments require the instance's upload storage — reject early (the UI
  // hides the attach button in this state, so this is defense in depth).
  if (attachments.length) {
    const storage = await attachmentStorageStatus(models, subdomain);
    if (!storage.enabled) {
      return res.status(400).json({
        error:
          'File attachments are not available: no upload storage is configured on this instance. The conversation is text-only.',
      });
    }
  }

  // The plugin's global cors() stamps `Access-Control-Allow-Origin: *` on
  // every response, and the gateway proxy pipes upstream headers over its own
  // whitelist-scoped ones. Browsers reject a wildcard origin on credentialed
  // requests ("Failed to fetch"), so drop it (pipeUIMessageStreamToResponse sets
  // the SSE headers below) and let the gateway's CORS headers stand.
  res.removeHeader('Access-Control-Allow-Origin');

  let clientGone = false;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const controller = new AbortController();
  const stopHeartbeat = () => {
    if (heartbeat) clearInterval(heartbeat);
    heartbeat = undefined;
  };
  req.on('close', () => {
    clientGone = true;
    controller.abort();
    stopHeartbeat();
  });

  // Explicit server-driven cancel: track this run so mastraChatCancel can abort
  // it even when the gateway proxy swallows the client disconnect (req.on close
  // never fires upstream). Only tracked when the client sent its own threadId —
  // the key the cancel mutation carries. Unregistered in the run's finally.
  const unregisterRun = threadId
    ? registerActiveRun(subdomain, user._id, threadId, controller)
    : () => {};

  const stream = createUIMessageStream({
    onError: (err) => {
      console.error('[mastra chat stream error]', err);
      return toUserFacingError(err).message;
    },
    execute: async ({ writer }) => {
      // A transient data part keeps the gateway proxy socket warm during long
      // tool calls: it streams as bytes but is dropped client-side (never added
      // to the message). Replaces the old `: ping` SSE comment.
      heartbeat = setInterval(() => {
        if (!clientGone)
          writer.write({ type: 'data-heartbeat', data: {}, transient: true });
      }, 10000);

      try {
        await streamAgentTurn({
          writer,
          models,
          subdomain,
          user,
          controller,
          clientGone: () => clientGone,
          request: parsed.value,
        });
      } finally {
        stopHeartbeat();
        unregisterRun();
      }
    },
  });

  pipeUIMessageStreamToResponse({
    response: res,
    stream,
    // Keep the gateway proxy from buffering the streamed SSE body.
    headers: { 'X-Accel-Buffering': 'no' },
  });
});

// erxes frontline bot webhook — called by frontline_api when botEndpointUrl is set
router.post('/bot/:conversationId', llmRouteLimiter, async (req, res) => {
  const { conversationId } = req.params;
  const { text, subdomain = 'localhost', customerId } = req.body;

  try {
    const models = await generateModels(subdomain);
    const settings = await models.MastraSettings.getSettings();

    if (!settings?.defaultAgentId) {
      return res.json({
        responses: [
          {
            type: 'text',
            text: 'No default agent configured. Please set one in Mastra Settings.',
          },
        ],
      });
    }

    const agentConfig = await models.MastraAgent.findOne({
      agentId: settings.defaultAgentId,
      isEnabled: true,
    });

    if (!agentConfig) {
      return res.json({
        responses: [
          { type: 'text', text: 'Configured agent not found or disabled.' },
        ],
      });
    }

    const { agent } = await getOrCreateAgent(agentConfig, models, subdomain);

    // The frontline conversation is a Mastra-native thread owned by a synthetic
    // "bot:*" resource (kept out of in-app users' chat lists). Memory replays
    // history + runs recall/working-memory and persists this turn itself.
    const userText = text || '';
    const useMemory =
      isAdvancedMemoryEnabled() &&
      agentConfig.memoryEnabled !== false &&
      Boolean(userText.trim());
    const memoryBinding = useMemory
      ? {
          thread: conversationId,
          resource: scopedResource(
            subdomain,
            `bot:${customerId || conversationId}`,
          ),
        }
      : undefined;

    // Shared learned digest (PII-free agent knowledge), separate from memory.
    const digest = await readLearnedDigest(models, agentConfig.agentId);
    const convo = augmentConvo({
      recentHistory: [],
      userMessage: userText,
      recallBlock: null,
      workingMemoryBlock: null,
      learnedDigestBlock: digest?.block,
    });

    // Bot requests have no user session — run as the agent's bound owner and
    // fail closed when that principal can't be minted. NEVER falls back to the
    // app token: doing so would silently escalate the bot to admin instead of
    // stopping it. The app token (settings.erxesApiToken) is passed only as the
    // CLIENT CREDENTIAL that authenticates to core's mint endpoint — the minted
    // owner token, not the app token, is the acting principal for the run.
    const principal = await resolveBackgroundPrincipal({
      agentConfig,
      subdomain,
      appToken: settings?.erxesApiToken,
      models,
    });
    if (!principal.ok) {
      console.error(`[agent] bot run refused — ${principal.error}`);
      return res.json({
        responses: [
          {
            type: 'text',
            text: 'This bot is temporarily unavailable. Please try again later.',
          },
        ],
      });
    }
    const authCtx = principal.authCtx;
    const reply =
      (await runWithAuth(authCtx, () =>
        runAgentTurn({
          // Structural cast (same idiom as prepareChatTurn): the published
          // Agent generics are wider than the slice runAgentTurn consumes.
          agent: agent as unknown as TurnAgent,
          convo,
          message: userText,
          authCtx,
          memory: memoryBinding,
        }),
      )) ?? '';

    // Native persistence happened in runAgentTurn; stamp agentId + tenant so the
    // bot thread is attributable + sweepable by the learning pass.
    if (memoryBinding) {
      await patchNativeTurn({
        subdomain,
        binding: memoryBinding,
        agentId: agentConfig.agentId,
        reply,
      }).catch(() => null);
    }

    return res.json({ responses: [{ type: 'text', text: reply }] });
  } catch (err) {
    console.error('[mastra bot endpoint error]', err);
    return res.json({
      responses: [
        {
          type: 'text',
          text: `Error: ${(err as { message?: string }).message}`,
        },
      ],
    });
  }
});
