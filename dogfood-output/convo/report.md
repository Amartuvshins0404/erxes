# Dogfood QA Report — erxes Agent Chat: Conversation Management

- **App:** erxes Agent UI — Chat (`http://localhost:3001/erxes-agent/chat`)
- **Agent under test (ISOLATION):** `Amaraa testaa` (_id `AoQowEfZwkJUxlPMUdebq`, model `kimi-for-coding`)
- **Date:** 2026-07-01
- **Method:** Every finding reproduced in an isolated headless Chrome (`/tmp/abw-convo`) AND grounded in the running-app source:
  - frontend `frontend/plugins/erxes-agent_ui/src`
  - backend `backend/plugins/erxes-agent_api/src`
- **Contamination control:** Only `Amaraa testaa` used for ground truth; other agents' sessions ignored; my chat messages prefixed `[convo] `.

> NOTE: This file replaced a **prior, non-code-grounded, contaminated** report (it tested test-agent-4 / "Amaraa test", and filed the "wall of New chat rows / never auto-titles" finding the brief flagged as contaminated). Those claims are corrected below with code + isolated evidence.

## Summary counts
- **critical: 0**
- **high: 0**
- **medium: 1** (CONVO-003)
- **low: 2** (CONVO-001, FRESH-001)
- Investigated — NOT a bug (dropped, code-grounded): CONVO-002, CONVO-005

---

## CONVO-003 [medium] — CONFIRMED: conversation is not reflected in the URL; switch/reload has no deep-link and loses the viewed conversation

**Behavior:** The `/erxes-agent/chat/:agentId` path segment is the **agent** id, not the conversation. Switching between conversations never changes the URL, there is no shareable per-conversation link from the UI, and on reload the app always re-opens the **most-recent** conversation, not the one you were viewing.

**Repro (my own conversations only):**
1. Open `Amaraa testaa`. URL → `/erxes-agent/chat/AoQowEfZwkJUxlPMUdebq`.
2. Click conversation "Listing the primary colors" → URL unchanged.
3. Click conversation "Capital of Mongolia" → URL still unchanged (`…/AoQowEfZwkJUxlPMUdebq`).
4. While viewing "Capital of Mongolia", reload the page.
5. **Result:** app opens "Listing the primary colors" (most-recent), NOT "Capital of Mongolia".
   - Screenshots: `screenshots/convo003-before-reload-capital.png`, `screenshots/convo003-after-reload.png`

**Code grounding (root cause):**
- Route param is the agent id: `modules/MastraMain.tsx:73` — `<Route path="/chat/:agentId" element={<ChatPage />} />`.
- Session switch calls `onSelect(threadId)` (`modules/chat/components/SessionList.tsx:69`) → `chatStore.selectSession(...)`; it **never navigates / writes the thread to the URL**. The only `navigate` in `useSessionBootstrap` normalizes the *agent* id/slug (`hooks/useSessionBootstrap.ts:32-40`).
- A `?thread=<id>` deep-link IS read on load (`hooks/useSessionBootstrap.ts:42-48`) but the UI never *writes* it, so normal navigation yields no shareable URL.
- On load with no active thread, bootstrap selects `threads[0]` — the most recent — not the previously-viewed conversation (`hooks/useSessionBootstrap.ts:58-73`).

**Impact:** No shareable/bookmarkable conversation links; back/forward can't move between conversations; reload silently drops the conversation you were reading. Medium.

---

## CONVO-001 [low] — CONFIRMED (severity downgraded from the brief's "high"): auto-title works, but the sidebar does NOT update live — the row stays "New chat" until a manual reload

**The brief's premise ("conversations never auto-title") is FALSE.** Auto-title is fully implemented front-to-back and works (existing sessions on this agent are titled, e.g. "Generate PDF with Mongolian text", "Orange heart emoji exchange"). The real, reproducible defect is narrower: the generated title never lands in the sidebar during/after the turn; the just-created session's row keeps showing "New chat" until a full session-list reload.

**Repro (isolated, single new chat, watching ONLY that row):**
1. `Amaraa testaa` → New chat (draft "New chat" row appears — `screenshots/issue-001-step-1-draft.png`).
2. Send `[convo] What is the capital of Mongolia? One short sentence please.`
3. Assistant replies "Ulaanbaatar is the capital of Mongolia."; polled the row for ~30 s → **stays "New chat"** (`issue-001-step-4-replied.png`, `issue-001-poll-final.png`).
4. Reload → row becomes **"Capital of Mongolia"** (`issue-001-after-reload-titled.png`).
5. Repeated with a 2nd new chat ("Name three primary colors…"), tight-poll ~21 s live → stayed "New chat"; after reload → **"Listing the primary colors"**. Consistent across 2 trials.
   - Video: `videos/convo-001-autotitle.webm`

**Code grounding:**
- Auto-title IS configured: Mastra native `generateTitle` on the shared Memory with erxes' multilingual instructions — `mastra/memory/mastraMemory.ts:115` (`generateTitle: { instructions: TITLER_INSTRUCTIONS }`); helpers in `mastra/titler.ts`.
- Title is streamed as a **transient** `data-thread-title` event AFTER `finish`, bounded by an 8 s race — `routes.ts:507-534`.
- Frontend applies it: `store/chatStore.ts:232-238` → `setThreadTitleInCache` (`threadsCache.ts:89-98`).
- **Root cause of the live-update failure:** on `finish` the client immediately runs `finishTurn` → `refetchThreadsIntoCache` (`store/chatStore.ts:207-208, 248`), which re-fetches the session list `no-cache` and lets fresh **server** rows take precedence (`threadsCache.ts:107-128`). At that instant the title is not yet persisted server-side, so the optimistic `title:'New chat'` row (`threadsCache.ts:79`) is re-asserted; and because titling is 8 s-bounded/transient, a slow title (kimi-for-coding is slow) is never re-pushed to the open sidebar. Net effect: the generated title appears only on the *next* session-list load (reload). No console errors observed.

**Impact:** Low — cosmetic; self-heals on reload. But every fresh conversation looks untitled ("New chat") for the rest of the live session.

---

## CONVO-002 [DROPPED] — Investigated, NOT a bug: badge "kimi-for-coding · kimi-for-coding" is a test-data artifact

**Observation:** Empty-state badge shows `kimi-for-coding · kimi-for-coding` (`screenshots/issue-001-step-1-draft.png`).

**Code grounding:** The badge template is correct and prints two *distinct* fields: `modules/chat/components/MessageList.tsx:71-73` — `{agent.provider} · {agent.model}`. `provider` is a real, separate, required field on the agent document (`backend .../modules/agent/db/definitions/agent.ts:11`). This agent simply has `provider === model === "kimi-for-coding"`. A correctly-configured agent renders two different values. **Not a code bug — test-data artifact.** (Minor nice-to-have: collapse the badge when `provider === model`.)

---

## CONVO-005 [DROPPED] — Investigated, NOT a bug: full-screen Voice mode on test-agent-4 is a persisted per-agent localStorage toggle, not a forced default

**Observation:** Opening `test-agent-4` immediately shows full-screen Voice mode ("Микрофоныг дараад яриагаа эхлүүлээрэй / Tap to speak") — `screenshots/convo-005-voice-testagent4.png`.

**Code grounding (root cause = persisted client toggle):**
- `voiceMode` defaults to **false** (`modules/chat/types.ts:255,263`); voice renders only when `voiceMode && voiceEnabled && selectedAgent` (`ChatPage.tsx:92`).
- On agent init the store **restores the toggle from localStorage** per agent: `store/chatStore.ts:364` → `loadVoiceMode(agentId)` reads key `erxes-agent:voiceMode:<agentId>` (`store/chatStore.ts:71-79`); `setVoiceMode` persists it (`store/chatStore.ts:389-397`).
- **Direct proof:** localStorage in the test browser contained `erxes-agent:voiceMode:7jbIfnRlJACLenx4zhgh0=on` (that id = test-agent-4). Voice auto-opened because it was previously toggled ON and persisted — NOT a forced default and NOT per-agent server config.
- `useVoiceEnabled` is a global capability gate (backend resolved an OpenAI key), `hooks/useChatAgents.ts:59-64`.

**Not a bug** — intended per-agent preference persistence. My assigned agent `Amaraa testaa` never had the key set, so it never force-opened voice.

---

## Additional testing (rename / delete / empty states / persistence) — all on my own conversations

- **Rename (works, persists):** Double-click a session row → inline edit field (`SessionList.tsx:99-108, 75-95`). Renamed "Capital of Mongolia" → "[convo] Renamed Capital Test"; persisted across reload. Screenshots `rename-step1-editing.png`, `rename-step2-typed.png`. Mutation `mastraThreadRename` (`backend .../modules/session/graphql/resolvers/mutations/session.ts:14`). Correct: a manual title sets `titleSource:'manual'`, which permanently disables auto-retitle (`mastra/titler.ts:33`).
- **Delete (works, confirms, re-homes):** Hover row → trash → native confirm "Delete this session and all its messages?" → accept → row removed, view cleanly re-homed to the next session and loaded its messages. No errors. Screenshots `delete-step1-before.png`, `delete-step2-clicked.png`, `delete-step3-after.png`. Video `videos/convo-rename-delete.webm`.
- **Empty state (per-conversation):** New-chat draft shows agent avatar, name, description, model badge, and 3 suggestion chips (`MessageList.tsx:60-90`). Screenshot `issue-001-step-1-draft.png`. (Did not force the all-sessions-empty state — would require deleting sessions I did not create.)
- **Reload persistence:** Rename and delete both persist (authoritative GraphQL mutations). Which *conversation* is shown does NOT persist — see CONVO-003.
- **Contamination cross-check (refutes prior "wall of New chat"):** Clicking the top-bar "New chat" button 3× in a row produced exactly **1** "New chat" draft row (each `newDraft` replaces the single draft via one `isDraft` flag — `chatStore.ts:400-406`, `SessionList.tsx:214-227`). A user's own actions cannot pile up "New chat" rows; the prior report's wall was other agents' sessions on a shared agent.

---

## FRESH-001 [low] — Delete uses an unstyled native `window.confirm()` instead of an in-app dialog

**Behavior:** Deleting a conversation triggers a browser-native `confirm()` popup, inconsistent with the rest of erxes' styled UI (and it renders differently per browser/OS, can't be themed, and blocks the JS thread).

**Code grounding:** `modules/chat/ChatPage.tsx:243` — `if (!window.confirm('Delete this session and all its messages?')) return;`.

**Impact:** Low — cosmetic/consistency. Functionally correct (it does confirm before an irreversible delete). Screenshot `delete-step2-clicked.png`.

---

## Minor observation (not a conversation-management bug)

- Console logs repeated React-Router warning `No `HydrateFallback` element provided to render during initial hydration` on every load. Global router config, not chat code; no functional impact. Noted for completeness only.

