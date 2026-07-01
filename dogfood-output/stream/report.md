# erxes AI Agent — Chat Streaming & Generation Dogfood Report (CODE-GROUNDED)

- **Target:** http://localhost:3001/erxes-agent/chat
- **Agent used (this pass):** **Amaraa testttt** (kimi-for-coding) — all repros below re-run with the assigned agent
- **Date:** 2026-07-01
- **Focus:** streaming, generation, stop/cancel, concurrent sends, race conditions, ordering
- **Grounding:** every finding cites the responsible code (running app source):
  - frontend: `frontend/plugins/erxes-agent_ui/src`
  - backend:  `backend/plugins/erxes-agent_api/src`
  - gateway:  `backend/gateway/src`

## Severity counts
- critical: 0
- high: 1
- medium: 1
- low: 1
- investigated / not-a-bug: 2

---

## Issues

### STREAM-001 — Stop button does NOT stop backend generation; reload reveals the full response [high]  ✅ CONFIRMED (kimi)
- **Category:** Functional
- **What happens:** Clicking **Stop** mid-stream halts only the *client-side* render. The backend keeps generating to completion and persists the FULL reply. After a reload the "stopped" message shows the complete response, not the on-screen partial.
- **Definitive repro (this pass, Amaraa testttt / kimi):**
  1. Sent: *"List the numbers from 1 to 200 with a fun fact for each, one per line."*
  2. Polled the live stream — numbers grew 9 → 13 → 16 → 18 → 26 → (…) — then clicked **Stop**. Client froze at **#59** (`screenshots/stream-001-D-frozen-at-stop.png`).
  3. Waited 10 s — on-screen value stayed **59** (client display halted; `onscreen_after_10s = 59`).
  4. Reloaded the thread → message now runs to **#200** (`screenshots/stream-001-E-reload-full-200.png`; `N_reload_persisted = 200`, 200 facts).
  - Reproduced a 2nd time: a 2000-word "Byzantine Empire" essay was **Stopped during the Thinking phase** yet the backend generated & persisted the *entire* essay (`screenshots/stream-002-ex-4-reload.png`, 05:21 PM block).
- **Root cause (grounded):**
  - Frontend **Stop** → `handleStop` → `chatStore.stop()` → AI-SDK `Chat.stop()`, i.e. it only aborts the *browser fetch reader*. `frontend/plugins/erxes-agent_ui/src/modules/chat/ChatPage.tsx:363` (`handleStop`) → `frontend/plugins/erxes-agent_ui/src/modules/chat/store/chatStore.ts:488` (`stop`) → `chat.stop()`.
  - The backend can only cancel the model run when the plugin request emits `close`: `backend/plugins/erxes-agent_api/src/routes.ts:293` (`req.on('close', … controller.abort())`) feeding `agent.stream(convo, { abortSignal: controller.signal })` at `routes.ts:389`.
  - That `close` never fires in practice — the client disconnect is **not propagated to the plugin** through the gateway proxy (`backend/gateway/src/main.ts:199` `createProxyMiddleware`, `http-proxy-middleware ^3.0.3`, `timeout: 60000` in `backend/gateway/src/proxy/middleware.ts:17`). A transient `data-heartbeat` is even written every 10 s to *keep the proxy socket warm* (`routes.ts` heartbeat block; consumed & dropped at `chatStore.ts` `onData`). So `controller.signal.aborted` stays `false`, the stream loop (`routes.ts:~430`) runs to the end, and `persistTurn` (`routes.ts:~485`) writes the complete reply. On reload `MASTRA_THREAD_MESSAGES` returns that full text.
  - Behaviourally proven, not inferred: browser froze at 59 while Mongo received all 200 items.
- **Impact:** The Stop control is misleading; a user cannot actually cancel an expensive/runaway generation. Tokens/compute keep burning after "cancel", and the "discarded" content silently reappears on reload.
- **Video:** `videos/stream-001-repro.webm`
- **Screenshots:** `stream-001-D-frozen-at-stop.png`, `stream-001-E-reload-full-200.png`, `stream-001-step-3-tokens.png`

### STREAM-002 — Stop during the "Thinking" phase: empty assistant bubble, no "stopped" feedback, and the turn silently vanishes on reload [medium]  ✅ CONFIRMED (kimi)
- **Category:** UX / Data
- **What happens:** Pressing **Stop** before any tokens render (while "Working…/Thinking…" shows) leaves an **empty assistant bubble** (avatar + timestamp, no text) with **no "stopped"/"interrupted" indicator**. After reload the whole turn — including the user's own message — is **gone** (not persisted).
- **Repro (this pass, kimi):**
  1. In a thread, sent *"STREAM002TEST … quantum entanglement …"*; at ~450 ms (still Thinking) clicked **Stop**.
  2. Result: empty assistant bubble at 05:24 PM, no body, no "stopped" label (`screenshots/stream-002-ex-3-after-stop.png`; `hasStoppedIndicator=false`).
  3. Reload → the user message **and** any reply are absent (`quantumUserMsg=false`, `quantumAnswer=false`).
- **Root cause (grounded):**
  - A "· stopped" badge exists but only renders from persisted/streamed **metadata**: `frontend/plugins/erxes-agent_ui/src/modules/chat/components/MessageBubble.tsx:192` (`msg.metadata?.interrupted && … "· stopped"`), fed by `messageMapping.ts:158` and the server `finish` chunk's `messageMetadata.interrupted` (`backend/.../routes.ts` finish write).
  - `Chat.stop()` aborts the fetch **reader**, so the client never reads the terminal `finish` chunk → `interrupted` is never set client-side → the badge cannot appear. (And per STREAM-001 the server usually finishes with `interrupted=false` anyway, so even a reloaded row carries no "stopped" flag.)
  - When the interrupt lands before any assistant text/tool output, `reply = acc.text || null` is `null` (`routes.ts:~441`), so nothing meaningful persists; the client's optimistic user+assistant messages aren't in `MASTRA_THREAD_MESSAGES` on reload → the turn disappears.
- **Impact:** No feedback that generation was stopped; the user's question can be silently lost, making the agent look like it ignored them.
- **Video:** `videos/stream-002-existing-thread.webm`, `videos/stream-002-clean.webm`
- **Screenshots:** `stream-002-ex-3-after-stop.png`, `stream-002-clean-4-after-stop.png`

### STREAM-003 — Reload does not restore the open session (bumps to newest; base route → "Select an agent") [low]  ✅ CONFIRMED (kimi)
- **Category:** UX / State
- **What happens:** The active session is not preserved across a reload.
  - On an agent URL (`/erxes-agent/chat/<agentId>`): had **"Initial exchange"** (oldest) open; after reload the app opened **"Sales pitch"** (the *most-recent* session), not the one that was open (`screenshots/stream-003-1-opened-initial-exchange.png` → `stream-003-2-after-reload.png`).
  - On the base route (`/erxes-agent/chat`, no agentId): reload lands on the **"Select an agent"** list (`screenshots/stream-003-3-base-route-reload.png`).
- **Root cause (grounded):**
  - The URL carries only the **agentId** param — never the thread id. The active thread lives in in-memory Zustand (`activeThreadId`, `frontend/.../modules/chat/store/chatStore.ts`), which is not persisted, so it is `undefined` after reload.
  - `useSessionBootstrap` then re-homes: with no `activeThreadId` it selects `threads[0]` (most recent) or opens a draft — `frontend/plugins/erxes-agent_ui/src/modules/chat/hooks/useSessionBootstrap.ts:59-71`. With no `agentId` (base route) `selectedAgent` is null, so the agent-picker shows.
  - Deep-linking a specific session is only possible via `?thread=<id>` (`useSessionBootstrap.ts:43-47`), which the app never writes into the URL itself.
- **Impact:** Refreshing loses the session you were reading; you are dropped onto the newest thread (or the agent list). Minor but constant friction.
- **Screenshots:** `stream-003-1-opened-initial-exchange.png`, `stream-003-2-after-reload.png`, `stream-003-3-base-route-reload.png`

---

## Investigated — NOT a bug

### Rapid double-send / send-while-streaming — correctly guarded (no dupes, no interleave)
- **Test (kimi):** Sent "DUPTEST_A", then immediately typed "DUPTEST_B" and pressed Enter twice while A was still streaming. Result: **only A was sent** (`A_count=1`, `B_count=0`, `streaming=true`); B's text stayed in the composer (`screenshots/stream-doublesend-1.png`, `videos/stream-doublesend.webm`).
- **Grounding:** Two independent guards — `handleSend` early-returns while `chatLoading` (`ChatPage.tsx:296-304`), and the store's `doSend` refuses a second turn with `if (chat.status !== 'ready') return;` (`chatStore.ts:312`). While streaming the composer renders a **Stop** button instead of Send (`Composer.tsx:133-160`). No duplicate turn is possible.
- Minor UX nit (not filed): pressing Enter while streaming silently keeps the typed text in the composer with no toast — expected, since the send affordance is visibly a Stop button.

### Message ordering / attribution — no issue observed
- Across clean exchanges the user bubble precedes its assistant reply in correct chronological order (see the reload screenshots). Apparent "out-of-order" glimpses during the session were an artifact of my own overlapping multi-thread test sends, not a rendering bug. Turn rows are keyed by native message id and reconciled via the `data-message-id` part (`chatStore.ts` `onData` → `reconcileAssistantMessageId`).

---

## Console / errors
- No JS errors during any repro (`errors` clean). Only a benign React-Router warning repeats: `No HydrateFallback element provided to render during initial hydration`.

## Cross-agent hygiene note
- All filed findings were reproduced using only **Amaraa testttt** (kimi-for-coding). Pre-existing sessions/agents (e.g. "Dogfood QA Agent … <script>…", other "Amaraa *" agents) belong to other agents and were ignored, not filed.
</content>
