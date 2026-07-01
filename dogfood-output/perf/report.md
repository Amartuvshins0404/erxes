# erxes Agent Chat — React Performance Report

Agent under test: **"Amaraa testttt"** (`/erxes-agent/chat/gB-Xd7a8mD-6LICLAofXj`)
Running app source:
- frontend: `/home/darjs/dev/os/erxes/frontend/plugins/erxes-agent_ui/src`
- core-ui (router / notifications): `/home/darjs/dev/os/erxes/frontend/core-ui/src`

Browser: isolated headless Chrome via `/tmp/abw-perf` (session `perf`), authed with `--state /tmp/erxes-auth.json`.

> This report supersedes the earlier failed run (which concluded react-scan / react-doctor were unusable). Both tools were made to work — see Tooling.

---

## Tooling — react-scan & react-doctor (how they were made to work)

Both tools are real and were used. Exact commands + results:

### react-scan (runtime render scanner) — **v0.5.7**
- `npm view react-scan version` → `0.5.7`; homepage `https://react-scan.million.dev`.
- `npx react-scan@latest --help` → in 0.5.7 the CLI only exposes `init` (adds it to a project). There is **no** `npx react-scan <url>` browser launcher anymore, and the old launcher hit the erxes login wall — this is why the prior attempt failed.
- Runtime-injection method (from the README, confirmed): inject the global auto-build
  `//unpkg.com/react-scan/dist/auto.global.js` **before any app script**, then optionally call `scan(options)`.
  - CDN probe: `curl -sI https://unpkg.com/react-scan@0.5.7/dist/auto.global.js` → **200** (correct path; `dist/index.global.js` / `dist/react-scan.global.js` → 404).

**Why naive injection fails (the core problem):** react-scan instruments React through
`window.__REACT_DEVTOOLS_GLOBAL_HOOK__`. React only registers its reconciler with that hook **if the hook already exists when React's module first runs**. Injecting react-scan with `eval` *after* the app has mounted gives `__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.size === 0` — react-scan sees no fiber renderer and never fires. Verified: after post-mount `eval` inject, `rendererCount: 0`.

**The fix that works:** register react-scan as a **page init-script that runs before the first navigation**, so the hook is installed before React loads:
1. `curl -sL https://unpkg.com/react-scan/dist/auto.global.js -o /tmp/react-scan-init.js` (388 KB).
2. Append a config call: `reactScan({ enabled:true, showToolbar:false, log:false, dangerouslyForceRunInProduction:true })`.
3. **Relaunch** the browser (init-scripts bind only at browser launch, not on an already-running/reconnected session):
   `/tmp/abw-perf close`
   `/tmp/abw-perf --state /tmp/erxes-auth.json --init-script /tmp/react-scan-init.js open <chatUrl>`
4. Verify: `__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.size` → **1**, `reactScan` → `function`. ✅ react-scan is live; overlay + FPS meter render (screenshot `03`).

**Gotchas discovered (documented so this is reproducible):**
- `agent-browser --enable react-devtools` and `--init-script` are **ignored when reconnecting** to the persistent session browser; they only apply on a fresh launch (`close` first).
- react-scan with `log:true` (a `console.log` **per render**) **crashes the headless renderer** under heavy streaming (page → `about:blank`, `eval` hangs 2 min). Measure with `log:false, showToolbar:false`; enable the toolbar only for a low-load overlay screenshot.

### react-doctor (static React linter) — **v0.5.8**
- `npm view react-doctor` → real package (`millionco/react-doctor`, same author as react-scan; oxlint-based).
- `npx --yes react-doctor@latest src/modules/chat` → **score 49/100 "Critical"**, 58 issues:
  Security 1 · Bugs 5 errors + 19 warnings · **Performance 16 warnings** · Accessibility 9 · Maintainability 8.
  Full verbose output saved to `/tmp/react-doctor-verbose.txt`.
- **Key limitation observed:** react-doctor did **not** flag the dominant runtime issue below (chrome re-rendering per token). Static analysis can't know that `ChatPage` holds streaming state at the top of the tree — that class of bug is only visible at runtime via react-scan. The two tools are complementary.

### Measurement instrumentation (corroborates react-scan)
- A `MutationObserver` on `document.body` counting DOM mutations per stream.
- A **fiber-commit counter**: wraps `onCommitFiberRoot` and tallies fibers whose `flags & PerformedWork` bit is set per commit → exact per-component render counts (script `/tmp/rs-instrument.js`).

---

## PERF-001 — Whole sidebar re-renders on every streamed token & every keystroke (HIGH)

**Reproduce:** open the agent chat, send a long-output prompt (`"Count from 1 to 25, one number per line…"`).

**Evidence (react-scan overlay, screenshot `03-react-scan-overlay-typing.png`):** typing a *single word* in the composer paints render-highlight labels across the entire left sidebar and top chrome:
`SessionList ×8`, **every** `SessionItem ×8`, **every** `IconTrash ×8`, `MessageList ×7`, `Composer ×7`, `ChatPage _c4 ×16`. None of that relates to the composer input.

**Evidence (fiber counter, one ~25-line reply — 146 React commits):**

| Component | Renders / reply |
|---|---|
| SessionList | **146** (every commit) |
| SessionItem / IconTrash (per row) | ~every commit |
| ChatPage | 68 |
| AgentRail | 68 |
| MessageList | 68 |
| **Total fiber renders** | **82,785** |

DOM mutations for the same reply stayed low (~139) — React bails out of most DOM writes, so this is **pure wasted reconciliation on the main thread**, i.e. streaming jank on mid/low-end devices, not visible layout thrash.

**Root cause (grounded):**
`ChatPage.tsx` holds `input` (`ChatPage.tsx:112`) and the streaming `messages` array (`useAgentChatView`, `ChatPage.tsx:78-87`) at the top of a large component. Its sibling subtrees are rendered inline with **no memoization and no state isolation**:
- `SessionList` — **not** `memo` (`SessionList.tsx:144`); rendered at `ChatPage.tsx:476`.
- `SessionItem` — **not** `memo` (`SessionList.tsx:34`) → all rows + their `IconTrash` buttons re-render whenever `SessionList` does.
- `AgentRail` — **not** `memo` (`AgentRail.tsx:97`).
- Handlers passed to `SessionList` are **plain functions, not `useCallback`**: `handleNewThread` (`ChatPage.tsx:222`), `handleSelectSession` (`:227`), `handleDeleteSession` (`:237`), `handleRenameSession` (`:250`). So even wrapping `SessionList`/`SessionItem` in `memo` would **not** help until these are stabilized.

Note the message *content* IS carefully memoized (`MessageBubble` `memo` `MessageBubble.tsx:27`; `MarkdownBlock`/`ChatMarkdown` `memo` `ChatMarkdown.tsx:211,231`; streaming split at `StreamingMarkdown` `:249`) — the optimization work went into the bubbles but skipped the surrounding chrome, which is what actually dominates the wasted renders.

**Fix:** wrap `SessionList`, `SessionItem`, `AgentRail` in `React.memo`; convert the four `ChatPage` session handlers to `useCallback`; or lift the streaming `messages`/`input` into a child so the sidebar/rail sit outside the re-rendering subtree.

---

## PERF-002 — Composer & ReasoningEffortControl re-render on every streamed token (MEDIUM)

**Evidence (fiber counter, same reply):** `Composer` 68 renders, `ReasoningEffortControl` 68 renders — once per streamed token batch, though the composer's own state (`input`) does not change while the assistant streams. Overlay `03` shows `Composer ×7` from a single keystroke.

**Root cause (grounded):** `Composer` is rendered inline in `ChatPage.tsx:631` and is **not** `memo` (`Composer.tsx:17`); `ReasoningEffortControl` is **not** `memo` (`ReasoningEffortControl.tsx:63`). Several props are freshly created each `ChatPage` render — e.g. `onReasoningEffortChange={(effort) => …}` (`ChatPage.tsx:642`), `onVoiceModeToggle={() => …}` (`:647`), and the `attachments` object — so the composer re-renders on every parent render. Same root cause as PERF-001.

**Fix:** memoize `Composer`, stabilize its inline callback props with `useCallback`, memoize the `attachments` bundle.

---

## PERF-003 — Router logs "No HydrateFallback element provided" on every load (MEDIUM)

**Evidence:** console on initial load (and every reload) emits
`[warning] No \`HydrateFallback\` element provided to render during initial hydration` (captured via `/tmp/abw-perf console`, reproduced on a fresh `open http://localhost:3001/`).

**Root cause (grounded):** `useCreateAppRouter.tsx:59-65` — the root data route has a loader (`loader={async () => null}`, `:63`) but the router defines **no** `HydrateFallback` / `hydrateFallbackElement`. React Router's data router has nothing to render during the initial hydration/loader phase and warns. The `async () => null` loader also forces the router to await a microtask before first paint on cold load.

**Fix:** provide a `hydrateFallbackElement` (app splash/spinner) on the root route, and drop the no-op `async () => null` loader if it serves no purpose.

---

## PERF-004 — /my-inbox notification list is not virtualized — unbounded DOM at scale (MEDIUM)

**Evidence:** on `/my-inbox` the list renders every loaded notification with a plain `.map()` and no windowing. Pages load 24 at a time (`useNotifications.ts:16` `NOTIFICATIONS_LIMIT = 24`), cursor-**merged/appended** (`useNotifications.ts:45-55`) via infinite scroll (`Notifications.tsx:24-30`, `handleFetchMore` on `inView`). Off-screen rows are never unmounted. `grep` for `virtual|react-window|react-virtual|useVirtualizer` across the notification module → **no matches**.

**Grounded at:** `Notifications.tsx:56` `filteredNotifications.map((n) => <NotificationItem key={n._id} {...n} />)`; each `NotificationItem` is ~104 lines (`NotificationItem.tsx`) and is **not** `memo` (`NotificationItem.tsx:9`), so each `fetchMore` also re-renders all previously-mounted items. At 400+ notifications every item stays mounted → large DOM, heavy scroll, O(n) re-render per page.

**Caveat (honest):** the test account currently has only ~15 notifications (`/my-inbox` DOM = 557 nodes total, 15 rows), so I could **not** reproduce the 400-row DOM live. Reported as a **code-grounded scalability finding**, not a live repro. Fix: virtualize the list (e.g. `@tanstack/react-virtual`) and `memo` `NotificationItem`.

---

## PERF-005 — react-doctor static findings in the chat module (LOW, batch)

From `npx react-doctor@latest --verbose src/modules/chat` (`/tmp/react-doctor-verbose.txt`). Reported as-is from the linter (starting hypotheses; the high-impact items are the runtime findings above):
- **Bugs (5 errors): "State synced to a prop inside an effect ×5"** — e.g. `preview/DocumentViewer.tsx:72` (`setPhase('loading')` in an effect reacting to a prop) → an extra render with a stale UI between commits.
- Performance: index keys instead of stable ids; non-passive scroll listener; `array.find()` / array lookup inside a loop ×4; **ref initializer runs on every render ×2**; permanent `will-change` wastes GPU; `useMemo` on a cheap value.
- Maintainability: large inline style object rebuilt every render ×3.

Minor next to PERF-001/002, but worth a cleanup pass.

---

## Web-vitals baseline (`/tmp/abw-perf vitals --json`)
- FCP **1400 ms**, LCP **3008 ms** (element `<p>`), CLS **0.001** (good), TTFB 3.3 ms, INP n/a.
- LCP ~3 s is slow but this is a **dev server** (unminified, on-demand transform) — not a production signal on its own. `hydratedComponents: []`, `hydration: null` (client-only SPA; relates to PERF-003).

## Summary

| Severity | ID | Finding |
|---|---|---|
| HIGH | PERF-001 | Whole sidebar (SessionList + all SessionItems + AgentRail) re-renders per token/keystroke — no memo + unstable handlers |
| MEDIUM | PERF-002 | Composer + ReasoningEffortControl re-render per token — not isolated from streaming state |
| MEDIUM | PERF-003 | Router: no HydrateFallback → warning every load + microtask before first paint |
| MEDIUM | PERF-004 | /my-inbox notification list not virtualized — unbounded DOM at scale (code-grounded, not live-repro'd) |
| LOW | PERF-005 | react-doctor static findings (state-in-effect ×5, index keys, ref init per render, will-change, etc.) |

## Screenshots
- `screenshots/00-initial-my-inbox.png` — landing (authed).
- `screenshots/01-react-scan-active.png` — react-scan hooked (rendererCount 1).
- `screenshots/03-react-scan-overlay-typing.png` — **key evidence:** overlay showing whole-sidebar re-render on one keystroke.
- `screenshots/04-my-inbox.png` — notification list.

## Not-a-bug / investigated
- Other agents in the rail ("Dogfood QA Agent ✨ `<script>`…", "Amaraa another test", etc.) and their sessions are **other agents' noise** — ignored, not filed.
- `[React Scan] react-grab … outdated` console warnings are **my injected tool's** output, not an app issue.
- MessageBubble / ChatMarkdown / MarkdownBlock re-renders during streaming are **expected** (the live bubble legitimately shows new text) — not filed.
