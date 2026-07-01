# Edgechat Adversarial QA Report

Agent under test: **Amaraa another test**
App: http://localhost:3001/erxes-agent/chat
Date: 2026-07-01
Tester: adversarial edge-case QA (edgechat)

Source ground truth:
- frontend: /home/darjs/dev/os/erxes/frontend/plugins/erxes-agent_ui/src
- backend:  /home/darjs/dev/os/erxes/backend/plugins/erxes-agent_api/src

## Summary
| Severity | Count |
|----------|-------|
| critical | 0 |
| high     | 0 |
| medium   | 2 |
| low      | 4 |

**6 findings** (EDGECHAT-002…007). EDGECHAT-001 was investigated and **retracted** as a false positive after deeper testing.
Medium: EDGECHAT-004 (stream errors swallowed), EDGECHAT-006 (0-byte upload blocks send).
Low: 002 (reload no reconnect), 003 (voice i18n), 005 (native confirm), 007 (no per-thread URL).

---

## Findings

### Investigated — NOT a bug: "reload mid-stream loses the user message"
Initially suspected data loss. **Retracted.** The server keeps generating after the client disconnects and persists the full turn (user + assistant) off the critical path (`routes.ts:483-506`). After reload the complete conversation is present. My false 0-count was MessageList **virtualization** — off-screen (scrolled-out) message bubbles unmount from the DOM, so a scrolled-to-top snapshot doesn't contain the bottom bubbles. Verified the UNIQUEMARKER77 user bubble + full ocean reply are stably present after multiple fresh reloads (screenshots/edgechat-001-orphaned-reply.png).

---
### EDGECHAT-002 — Reloading mid-stream shows a confusing empty/blank thread; no live-stream reconnect
**Severity:** low
**Category:** ux

**What happens:** When you reload (or the tab reconnects) while a reply is still streaming, the client does **not** reconnect to the in-flight stream. It fetches the last *persisted* state via `MASTRA_THREAD_MESSAGES` (network-only). Because the turn is persisted by Mastra only when generation finishes (off critical path, `routes.ts:483-506`), a reload during generation hydrates to an **empty welcome screen or a thread missing the in-progress turn**, with no "generating…" indicator. The user's message and reply appear to have vanished.

**It is NOT data loss:** the server keeps generating after the client disconnects and persists the full turn. The completed turn shows up as a new titled session (e.g. my "RESUMETEST …" prompt reappeared as session "Detailed History of the Roman…") — but only after the server finishes and the user re-navigates/re-reloads. There is just no live feedback in the gap.

**Repro:** New chat → send a long-reply prompt → reload within ~2-4s → observe empty welcome / hydrating skeletons with no streaming indicator (screenshots/edgechat-003-step2-afterreload.png, -step3-hydrated.png) → wait ~25s, reload again → the finished turn is present as a new session (screenshots/edgechat-003-step4-final.png).

**Root cause:** in-memory-only chat store (chatStore.ts, zustand, not persisted); on reload `useSessionBootstrap` re-homes to `threads[0]` or a fresh draft and `selectSession` does a network-only fetch — there is no mechanism to re-attach to a still-open SSE stream. URL holds only `agentId`, never the thread id (`useSessionBootstrap.ts`), so the exact in-flight thread can't even be re-targeted after reload until it appears in the refetched list.

**Fix direction:** show a "reconnecting / still generating" state for threads known to be working, or implement resumable streams; and/or reflect the active thread id in the URL so reload re-targets it.

---
### EDGECHAT-003 — Voice-mode overlay ships hardcoded Mongolian strings mixed with English (i18n)
**Severity:** low
**Category:** ux / i18n

**What happens:** Enabling voice mode (mic button, or a persisted `erxes-agent:voiceMode:<agentId>=on` in localStorage) shows a full-screen overlay whose status text is **hardcoded Mongolian** — "Микрофоныг дараад яриагаа эхлүүлээрэй" (idle), "Сонсож байна…" (listening), "Бодож байна…" (thinking), "Хариулж байна…" (speaking) — while the action button right below it is **English "Tap to speak"**, and the entire rest of the app UI is English. No locale switch changes this; the strings are literals, not i18n keys.

**Evidence:** screenshots/edgechat-009-voicemode-tamper.png (mixed-language overlay).

**Root cause (code-grounded):**
- `frontend/.../modules/chat/voice/lib/voiceStatus.ts:42-49` — `PHASE_LABELS` are hardcoded Mongolian literals; also `GENERIC_TOOL_LABEL` (line 40) and `toolStatusLabel()` return Mongolian.
- `frontend/.../modules/chat/voice/components/VoiceOverlay.tsx:190` — button label hardcoded English `'Tap to speak'`.
- Neither path uses `useTranslation`/i18n, so the language mix is fixed regardless of user locale.

**Impact:** English-locale users see Mongolian voice prompts; a shipped feature reads as half-translated/unfinished.

**Fix direction:** route all voice-overlay copy through the app's i18n layer (or at minimum make them consistently one language).

---
### EDGECHAT-004 — Chat/stream errors are silently swallowed — no error UI, no retry (user sees only a stopped spinner)
**Severity:** medium
**Category:** functional / error-handling

**What happens:** If a chat turn fails (network drop, gateway 5xx, provider/model error, or a stream that errors mid-flight), nothing is shown to the user. The working spinner simply stops and the user is left with no reply, **no error message, and no retry affordance.** There is no code path in the chat view that renders an error.

**Root cause (code-grounded):**
- `frontend/.../modules/chat/hooks/useChatView.ts:32-41` — `useAgentChatView` reads `error` from `useChat({ chat })` and returns it on the view object.
- `frontend/.../modules/chat/ChatPage.tsx:78-87` — the view is destructured as `{ …shell, messages, loading: chatLoading, messagesLoading } = view`. **`error` is never destructured or referenced anywhere in ChatPage.** A `grep` for `view.error` / `error` rendering across `MessageList.tsx` / `MessageBubble.tsx` finds no error branch.
- `frontend/.../modules/chat/store/chatStore.ts` (ensureChat) — the Chat's `onError` handler is `onError: () => setThreadActivity(key, undefined)`, i.e. it only clears the "working…" activity text and **discards the error** — it never sets any user-visible error state.
- Backend actually produces a user-facing error string (`routes.ts:305-309` `createUIMessageStream.onError → toUserFacingError(err).message`), so the information exists on the wire but the client throws it away.

**Repro note (honest):** Live network-fault injection could not be triggered from the isolated test browser — its request routing did not intercept the cross-origin gateway calls to `http://localhost:4000/pl:erxes-agent/chat/stream` (verified: aborted/500 routes still returned 200, see edgechat-011/012). The finding is therefore grounded in code rather than a captured broken screenshot; the swallow path is unambiguous.

**Impact:** Any failed turn is indistinguishable from "the agent gave no answer." Users cannot tell a transient network error from a real empty reply and have no one-click way to retry.

**Fix direction:** consume `view.error` in ChatPage and render an error bubble/toast with a Retry (the store already has `regenerate`).

---
### EDGECHAT-005 — Destructive "delete session" uses a raw native window.confirm() instead of the app's styled dialog
**Severity:** low
**Category:** ux / consistency

**What happens:** Deleting a chat session pops a browser-native `confirm()` ("Delete this session and all its messages?") — unstyled, OS-chrome, and it blocks the JS thread — whereas the rest of the plugin uses the design-system `Dialog` (e.g. `components/EditAgentDialog.tsx`). Inconsistent and lower-quality for a *destructive, irreversible* action.

**Evidence:** `frontend/.../modules/chat/ChatPage.tsx:243` — `if (!window.confirm('Delete this session and all its messages?')) return;`.

**Note (positive):** the delete itself is handled well — deleting a *currently-streaming* session cleanly stops the stream, removes it, and re-homes to the next session with no orphaned "Working…" spinner or console errors (screenshots/edgechat-015-step3-deleted.png). Only the confirm UX is the issue.

**Fix direction:** replace with the styled AlertDialog/Dialog used elsewhere.

---
### EDGECHAT-006 — Attaching a 0-byte file leaks a raw backend parser error and blocks the whole message send
**Severity:** medium
**Category:** functional / error-handling / attachments

**What happens:** Attach an empty (0-byte) file — e.g. `touch note.txt`, or a download that produced an empty file — and send. The upload is rejected by the server's multipart parser, and the chip shows the **raw internal error string**: *"File upload parsing error: options.allowEmptyFiles is false, file size should be greater than 0."* Because `uploadAll()` returns `ok:false` when *any* attachment fails, the **entire message send is aborted** (`ChatPage.tsx:313 if (!ok) return;`) — even other valid attachments in the same send uploaded fine. The typed message just sits in the composer with no toast/explanation; the only clue is a small red icon whose tooltip is a stack-trace-ish backend message.

**Repro (verified):**
1. Create files: `touch zerobyte.txt`, plus any normal small file.
2. Attach both, type a message, press Send. (screenshots/edgechat-017-attachments.png, -send-with-errored.png)
3. Nothing sends; `zerobyte.txt` chip tooltip = the raw formidable error (verified via DOM `title` attribute). The valid file uploaded (`done`, no error) but is held back too.

**Root cause (code-grounded):**
- `frontend/.../modules/chat/hooks/useAttachments.ts:56-68` guards **only** `file.size > MAX_ATTACHMENT_BYTES` (25 MB) — there is **no lower-bound / zero-size check** (grep for `size === 0`/`empty`/`> 0` → none). So 0-byte files are staged `ready` and uploaded.
- The upload target's multipart parser (formidable) runs with `allowEmptyFiles:false` (its default), so it rejects the empty file and the raw error is surfaced straight onto the chip (`components/ComposerAttachmentChip.tsx` uses `att.error` as the `title`).
- `uploadAll` sets `ok=false` on any failure; `ChatPage.tsx:312-313` aborts the send on `!ok`.

**Contrast:** the oversize case (>25 MB) is caught client-side with a friendly *"File exceeds the 25 MB limit"*. The empty-file case has no equivalent guard and leaks internals.

**Impact:** A realistic, easy-to-produce input (empty file) silently blocks sending a message + its other attachments, with a confusing developer-facing error and no clear recovery hint.

**Fix direction:** add a client-side `file.size === 0` guard in `addFiles` with a friendly message (mirroring the oversize path), and/or set `allowEmptyFiles: true` server-side; never surface the raw parser error to users.

---
### EDGECHAT-007 — Conversations aren't reflected in the URL: no deep-linking, Back/Forward can't move between chats (Back exits the app)
**Severity:** low
**Category:** ux / navigation

**What happens:** Switching between chat sessions never changes the URL — it stays `/erxes-agent/chat/<agentId>` regardless of which conversation is open (verified across 3 different sessions, all showing the same URL). Consequences:
- Browser **Back** does not return to the previously-viewed conversation; it leaves the chat entirely (in the test browser it went to `about:blank`; in a real browser it would go to whatever page preceded the chat).
- A conversation **cannot be deep-linked / shared** via URL by normal navigation. (There is a `?thread=` handler in `useSessionBootstrap.ts`, but it is never written to the URL when the user clicks a session, so it's effectively dead for sharing.)
- Combined with EDGECHAT-002, a reload can't re-target the exact thread you were viewing.

**Root cause (code-grounded):** `frontend/.../modules/chat/hooks/useSessionBootstrap.ts` — the route only ever carries `agentId`; the active thread lives in the in-memory zustand store (`chatStore.ts`) and `selectSession` does not push a history entry or update the URL. So there is one history entry for the whole agent, not one per conversation.

**Fix direction:** encode the active thread in the URL (e.g. `/chat/<agentId>/<threadId>` or keep `?thread=` in sync) and navigate on session select so history + deep-links work.

---

---

## Investigated — NOT bugs (verified robust or environment/test-data artifacts)
- **Boundary inputs** — 5000-char single word (composer wraps, no overflow), 800-char word + mixed RTL Arabic/Hebrew + emoji in a sent bubble (break-word wrapping, renders fine). Whitespace-only send is blocked by `!input.trim()` guard (Composer.tsx:154). Not a bug.
- **Triple-click Stop** — idempotent; controls re-enable, no errors (`chat.stop()` is safe to call repeatedly).
- **Spam-send (5× Enter fast)** — exactly one turn created; guarded by `if (chat.status !== 'ready') return` in chatStore `doSend`. No duplicates.
- **Delete session while it streams** — cleanly stops the stream, removes the session, re-homes to the next; no orphaned "Working…" badge (chatStore `discardThread`). (Only the native confirm is a nit → EDGECHAT-005.)
- **New chat / navigate away mid-stream** — background stream keeps running server-side and persists; no orphaned bubble or leaked spinner. (The confusing transient blank state on reload is EDGECHAT-002.)
- **Bogus deep-links** — `/chat/DOESNOTEXIST` → graceful "Select an agent" empty state; `?thread=BOGUS` → falls back to a real recent thread. No crash.
- **localStorage tamper** — garbage `reasoningEffort` is safely ignored (`isReasoningEffort` guard); `voiceMode=on` just enables the real voice UI. No crash. (Surfaced the i18n issue → EDGECHAT-003.)
- **Files (artifacts) panel** — rapid open/close causes no errors; clean empty state.
- **graphql 500 on reload** — app still renders from Apollo cache (resilient).
- **`.exe` / wrong-type attachment** — accepted and uploaded (12-byte file uploaded fine); no client type allowlist. Noted, not filed (general file attach; may be intended).
- **Multiple untitled "New chat" sessions** stacking in the sidebar was observed but is muddied by heavy interrupted test sends + off-critical-path async title generation (routes.ts titling, 8s race) — not cleanly attributable, not filed.

## Tooling limitation
Live network-fault injection against the cross-origin gateway (`http://localhost:4000/pl:erxes-agent/chat/stream`, `/graphql`) could not be achieved — the isolated browser's request routing did not intercept those cross-origin fetches (abort/500 routes still returned 200). EDGECHAT-004 is therefore code-grounded rather than captured live.
