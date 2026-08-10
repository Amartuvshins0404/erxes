# erxes AI Agent Plugin — Prod-Readiness Dogfood Report

- **Target:** http://localhost:3001/erxes-agent (chat, agents, skills, artifacts)
- **Date:** 2026-07-01
- **Method:** 10 orchestrated agents, each in an isolated headless Chrome. Every finding was **reproduced in-browser AND grounded in source** (`file:line`), with false positives investigated and dropped. Contamination-safe (distinct assigned agents / `zzq-` prefixes; shared-account noise ignored).
- **Scope:** main chat, streaming, rendering, conversation mgmt, previews/artifacts (pptx/docx/pdf/xlsx/chart/mermaid), agent & skill CRUD, UI/UX, React perf, adversarial edge cases. **Excluded:** Workflows, Agent Learnings.
- **Evidence:** per-area folders under `dogfood-output/<area>/` (report.md + screenshots/ + videos/).

## Severity summary (deduped)

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 9 |
| Security | 1 |
| Medium | 12 |
| Low | 15 |
| Cleared (false positives) | 9 |

Overall: solid happy-path (docx/pdf/xlsx/pptx all generate + download; charts/mermaid render; skills CRUD robust; XSS in names safely escaped), but **not production-ready** — several data-integrity, data-loss, and crash paths, plus a cancel control that doesn't cancel and a chat that's unusable on mobile.

---

## HIGH

### H1 — Stop button doesn't actually stop generation `[stream/STREAM-001]`
Clicking Stop halts only the client display; the backend generates the full reply and persists it — after reload the "cancelled" message shows complete. Wastes model tokens/compute; users can't cancel a runaway/expensive turn.
**Root cause:** `chat.stop()` only aborts the browser fetch reader; the gateway proxy (`backend/gateway/src/.../main.ts:199`, http-proxy-middleware) doesn't propagate client disconnect, so the plugin's `req.on('close')` abort (`erxes-agent_api/.../routes.ts:293`) never fires → `signal.aborted` stays false. Evidence: `stream/` (video + reload screenshots).

### H2 — Agent update bypasses ALL server validation `[edgecrud/EDGECRUD-001]`
`mastraAgentUpdate` uses `findOneAndUpdate` without `runValidators`, so invalid enum/temperature/maxSteps persist and the required model can be stripped. Root of the crash in H3 and the runaway config in M9. **`Agent.ts:148-152`.**

### H3 — Invalid `visibility` crashes the entire Agents list `[edgecrud/EDGECRUD-004]`
A single bad `visibility` value (persistable via H2) makes the whole Agents page throw to the error boundary via `VISIBILITY_META[bad].label`. **`AgentsIndexPage.tsx:301`** (no defensive enum lookup).

### H4 — Agent delete orphans threads; slug reuse resurrects old conversations `[edgecrud/EDGECRUD-005]`
Deleting an agent doesn't cascade to its threads/messages; because threads are keyed by the mutable `agentId` slug (not `_id`), creating a new agent with the same slug **resurrects the deleted agent's conversation**. Data-integrity/privacy risk. `Agent.ts:160-164`; session queries `:33-39`; `prepare.ts:50`.

### H5 — Second artifact in a conversation silently fails `[artifacts/ART-003]`
After one tool-produced artifact, the next chart/doc/diagram request renders nothing while the agent falsely says "the chart is ready." Reproduced 3/3. **Root cause:** `ToolCallFilter` strips tool-call frames from recalled history for Kimi models → the model stops calling render tools. `agentRuntime.ts:226-228,251`.

### H6 — PPTX Present mode + slide images lost after reload `[edgeart/EDGEART-007]`
A live pptx deck has a Present button and server-rendered slide PNGs; after page reload it silently drops to the OOXML fallback, loses Present and the "N slides" subtitle — permanent, every deck. **Root cause:** `artifactStore.ts:28-35` persists documents but drops `slides`/`slideCount`, so `canPresent` (`PreviewPanel.tsx:26-27`) and `DocumentViewer.tsx:55` fail their gate. (Regresses the recent pptx-preview work.)

### H7 — Generated PDF silently drops emoji & corrupts CJK/Arabic `[edgeart/EDGEART-003]`
PDFs with emoji/中文/عربى come out with emoji dropped and CJK/Arabic mojibake (confirmed via `pdftotext`); tool reports success → silent data loss in a downloadable deliverable. **Root cause:** `pdf.ts:23-35,56` embeds only Noto Sans (Latin+Cyrillic), forced document-wide, no `@react-pdf` fallback.

### H8 — Chat UI is non-responsive / unusable on small screens `[uiux/UIUX-001]`
Fixed `w-60` sessions sidebar never collapses; at 375px the message column becomes ~1 word (sometimes 1 char) per line and header buttons overflow off-screen. **`ChatPage.tsx:452`** (a collapse mechanism `showAgentRail`/`ChatSidebarCollapse` exists but isn't wired to a width breakpoint).

### H9 — Entire sidebar re-renders on every streamed token & keystroke `[perf/PERF-001]`
146 `SessionList` renders and **82,785 total fiber renders** per ~25-line reply; one keystroke re-renders `SessionList/SessionItem/IconTrash/MessageList/Composer`. Jank + battery/CPU cost that scales with session count. **Root cause:** components not `memo` (`SessionList.tsx:144`, `AgentRail.tsx:97`), handlers not `useCallback` (`ChatPage.tsx:222-250`), streaming state held too high (`ChatPage.tsx:112`). Proven with **react-scan v0.5.7** overlay (`perf/screenshots/03-react-scan-overlay-typing.png`).

## SECURITY

### S1 — Unsanitized artifact SVG injected via `dangerouslySetInnerHTML` `[edgecrud secondary]`
`PanZoomSvg.tsx:102-107,372` renders artifact/diagram SVG through `dangerouslySetInnerHTML` without sanitization — a latent stored-XSS vector if a model/tool can emit SVG containing script. (Contrast: agent/skill **names** ARE safely escaped — see cleared list.) Recommend DOMPurify on SVG artifacts.

---

## MEDIUM

- **M1 — Failed tool calls show a green success ✓** `[edgeart/EDGEART-001]`: a soft `{error:true}` tool output stays `output-available`, so the trace paints a success check and no artifact/error appears. Affects any tool returning `{error:true}`. `lib/uiParts.ts:60`, `ToolCallRow.tsx:45-49`.
- **M2 — Stream/network errors silently swallowed** `[edgechat/EDGECHAT-004]`: any failed turn (5xx/provider/network) just stops the spinner; `view.error` is computed but never rendered; no retry. `useChatView.ts:32-41`, `ChatPage.tsx:78-87`.
- **M3 — Files panel stale until reload** `[edgeart/EDGEART-005]`: artifacts made this session render inline but the Files panel shows "No charts or documents yet." until reload (no Apollo refetch on creation). `useThreadArtifacts.ts:44-51`.
- **M4 — Code blocks have no syntax highlighting** `[render/RENDER-002]`: language label shown but `<code>` has zero token spans; no highlighter dep. `ChatMarkdown.tsx:139-141,218`.
- **M5 — LaTeX/math rendered as raw source** `[render/RENDER-003 = uiux/UIUX-002]`: `$…$`/`$$…$$` shown verbatim; pipeline is only `remarkGfm+rehypeSanitize`, no `remark-math`/`rehype-katex`. `ChatMarkdown.tsx:217-218`.
- **M6 — Markdown heading levels have no size hierarchy** `[render/RENDER-001]`: h1/h2/h3 all 14px; h2 and h3 pixel-identical. `ChatMarkdown.tsx:171-177,237`.
- **M7 — 0-byte attachment leaks raw parser error + blocks send** `[edgechat/EDGECHAT-006]`: an empty file surfaces a raw formidable error and blocks the whole message (oversize path has a friendly message; empty path has no guard). `useAttachments.ts:56-68`.
- **M8 — Mongoose errors leak as INTERNAL_SERVER_ERROR + stacktrace + DB name** `[edgecrud/EDGECRUD-002]`: ValidationError/E11000 on agent create leak internals to the client. `mutations/agent.ts:28`.
- **M9 — `maxSteps` unbounded server-side** `[edgecrud/EDGECRUD-007]`: create accepts `999999999` / `-5` → runaway-loop/cost risk. `definitions/agent.ts:39`.
- **M10 — Conversation not addressable in URL** `[convo/CONVO-003 (+stream/STREAM-003, edgechat/EDGECHAT-007)]`: `/chat/:agentId` is the agent id; switching conversations never changes the URL; reload reopens the most-recent thread, not the viewed one; no deep-link/bookmark; Back exits the app. `MastraMain.tsx:73`, `useSessionBootstrap.ts:32-73`.
- **M11 — Skills hard-reload loses the AI-Agents nav shell** `[manage/MANAGE-002 (+skills)]`: reloading `/erxes-agent/skills` renders a generic plugin shell (no Chat/Agents/Skills nav). No URL→`activePluginState` sync. `NavigationPlugins.tsx:106-116`.
- **M12 — New-session sidebar row doesn't live-update its title** `[convo/CONVO-001, reframed]`: auto-title DOES work (`mastraMemory.ts:115`) but a refetch race re-asserts the optimistic "New chat" row until reload. `routes.ts:507-534`, `chatStore.ts:207-208,248`. *(Downgraded from the contaminated "never auto-titles / wall of New chat" claim.)*

Also medium (perf): **M13** composer re-renders per token (`Composer.tsx:17` not memo); **M14** "No HydrateFallback element" warning + pre-paint microtask (`useCreateAppRouter.tsx:63`); **M15** `/my-inbox` notification list unvirtualized (`Notifications.tsx:56`).

---

## LOW (grouped)

- **Stop UX:** stopping during "Thinking" leaves an empty assistant bubble, no "stopped" feedback, whole turn vanishes on reload `[STREAM-002]`; reload doesn't restore the open session `[STREAM-003]`.
- **Destructive confirms use native `window.confirm()`** instead of the app's styled dialog `[convo/FRESH-001 = edgechat/EDGECHAT-005]` (`ChatPage.tsx:243`); delete dialog missing a11y description `[manage/MANAGE-006]`.
- **Agent form polish:** no validation-fail feedback / no success toast `[MANAGE-003]`; no max-length on name/ID (5004-char accepted) `[MANAGE-004 = EDGECRUD-003]`; create/edit jumps to the Settings shell `[MANAGE-005]`; duplicate agent names allowed `[EDGECRUD-006]`.
- **Icon-only controls lack accessible names** — Send button has no `aria-label`/tooltip `[UIUX-003]`.
- **Visual polish:** "Latest" pill occludes message text `[UIUX-004]`; inconsistent empty-state treatment `[UIUX-005]`; Files empty-state vertically off-center `[UIUX-006]`; model badge shows model twice for some agents `[CONVO-002 — test-data]`.
- **Voice overlay mixes hardcoded Mongolian + English, no i18n** `[edgechat/EDGECHAT-003]` (`voiceStatus.ts:42-49`).
- **Reload mid-stream shows a confusing blank thread** (no live-stream reconnect; not data loss) `[EDGECHAT-002]`.
- **react-doctor (49/100):** state-synced-in-effect ×5 (`DocumentViewer.tsx:72`), index keys, ref-init-per-render, permanent `will-change` `[PERF-005]`.
- **Mermaid error detail truncated** to "Parse error on line 1:" `[edgeart note]`.

---

## Cleared — investigated, NOT bugs (code-grounded)

1. **Agent/skill name XSS** — safely escaped; names render as plain `{name}` (`AgentsIndexPage.tsx:237`, `AgentRail.tsx:79`). The `<script>`-named test agent is inert.
2. **Injection in name/description** (`</script><img onerror>`, `{{7*7}}`, SQL) — neutralized by React escaping / inert on Mongo.
3. **Skills CRUD** — validated on create AND update (`skillContent.ts:34-61`); name regex blocks XSS; no bypass.
4. **Delete-in-use (frontend)** — graceful "Select an agent" empty state, no crash.
5. **Malformed Mermaid** — graceful "Diagram syntax error" + show-source (`MermaidViewer.tsx:198-213`).
6. **Rapid artifact switching / reload** — handled (fetch cancel, viewer destroy, blob revoke).
7. **Empty/degenerate artifacts** — rejected by backend `.min(1)` schemas.
8. **Rapid double-send / send-while-streaming** — correctly blocked by `chatLoading`/status guards (`ChatPage.tsx:296`, `chatStore.ts:312`).
9. **Voice mode on select** — a persisted per-agent localStorage toggle, not a forced default (proved via `erxes-agent:voiceMode:<id>=on`); **CONVO-005 dropped**. Also `edgechat` retracted EDGECHAT-001 after deeper digging.

---

## Notes / methodology

- **react-scan v0.5.7 + react-doctor v0.5.8 were made to work** (the user's explicit ask): react-scan needs its devtools hook installed *before React loads* — post-mount `eval` injection fails; the fix is registering `auto.global.js` as an `--init-script` and relaunching the browser. `react-doctor` exists and ran (static, 49/100).
- **Contamination was real and handled:** the first (black-box) pass produced false positives from agents sharing one account (e.g. "wall of New chat"). The code-grounded re-run isolated each agent to a dedicated test agent and dropped/reframed those. Two false positives killed, one severity corrected.
- **Dev-server caveat:** vitals were measured on the dev server (FCP ~1.4s, LCP ~3.0s) — prod build will be faster; treat H9/perf as render-count evidence, not absolute timings.
- **Cross-cutting themes for fixing:** (a) a shared **font-fallback gap** in the server document pipeline drives H7 + the pptx-emoji issue (bundle Noto CJK/Arabic + an emoji font, enable fallback); (b) **client trust** in the agent-update path drives H2→H3→M9 (add `runValidators:true` + schema bounds + defensive enum lookups); (c) **thread identity by mutable slug** drives H4 + M10 (key by `_id`, put the conversation in the URL).
