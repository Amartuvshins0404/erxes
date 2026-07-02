# erxes AI Agent — UI/UX & Visual-Polish QA Report

**Agent:** dedicated UI/UX + visual-polish QA (read-only navigation)
**Assigned chat agent:** "Amaraa testttt"
**Date:** 2026-07-01
**Surfaces covered:** Chat (list, empty, populated, composer, sessions, Files panel empty+populated, new-chat empty), Agents (list + New Agent form), Skills (list + detail + New form), Schedules (empty state). Responsive tested at 1280 / 768 / 375.
**Source of truth (running app):** `frontend/plugins/erxes-agent_ui/src`
**Screenshots:** `./screenshots/` (absolute: `/home/darjs/dev/os/erxes/dogfood-output/uiux/screenshots/`)

Focus is purely visual design, layout, and interaction polish. Pre-existing test data (odd agent/skill names, XSS-payload names, many "New chat" rows) is other agents' noise and is ignored unless the way it *renders* is itself the bug. Contrast of muted text was measured (light-on-dark, readable) and found NOT to be a problem — no false-positive filed.

## Severity counts
- critical: 0
- high: 1
- medium: 1
- low: 4
- **total: 6**

---

### UIUX-001 — Chat layout is non-responsive; collapses to ~1 word per line at narrow widths
**Severity:** high
**Surface:** Chat page
**Screenshot:** `screenshots/chat-375.png` (375px), `screenshots/chat-768.png` (768px, acceptable)

The chat's side panel (AgentRail / SessionList) is a hard-coded `w-60` (240px) with `shrink-0` and no responsive breakpoint. At a 375px viewport it eats 240px of the width, leaving the message column ~135px, so assistant text wraps to roughly one word — sometimes one *character* — per line ("pire / was, / in / ess / enc / e, / the / med / ieva / l …"), which is unreadable. The header action buttons (Files / Make skill / New chat) also overflow off-screen at this width.

**Root cause / fix:** `modules/chat/ChatPage.tsx:452`
```tsx
<div className="relative shrink-0 border-r overflow-hidden w-60">
```
The panel never collapses or converts to an overlay on small screens. Add a responsive rule (e.g. hide the side panel below `md` and expose it via the existing sidebar-toggle, or `w-0`/off-canvas below a breakpoint) so the message column keeps a usable width. There is already a collapse mechanism (`showAgentRail`, `ChatSidebarCollapse`) — wiring the panel to collapse under a width breakpoint would resolve it.

---

### UIUX-002 — LaTeX / math is rendered as raw source in assistant messages
**Severity:** medium
**Surface:** Chat page (assistant markdown)
**Screenshot:** `screenshots/chat-thought-expanded.png`, `screenshots/chat-hover-actions.png`, `screenshots/chat-files-panel.png`

Assistant replies containing math show the literal LaTeX delimiters instead of rendered equations — e.g. `$\mathcal{H}$`, `$$\langle \phi | \psi \rangle = \sum_{i=1}^{d} \phi_i^* \psi_i.$$`, `$\hat{A} = \hat{A}^\dagger$`. The `$$…$$` and `$…$` strings appear verbatim in the bubble, which reads as broken output for any math-capable agent.

**Root cause / fix:** `modules/chat/components/ChatMarkdown.tsx:218`
```tsx
<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} …>
```
Only `remark-gfm` is registered; there is no `remark-math` + `rehype-katex` (confirmed: no `katex`/`remark-math`/`mathjax` anywhere in the plugin source). Add `remarkMath` to `remarkPlugins` and `rehypeKatex` to `rehypePlugins` (import the KaTeX stylesheet), or explicitly strip/escape `$…$` if math rendering is out of scope — but leaving raw `$$` in the UI is the worst of both.

---

### UIUX-003 — Icon-only controls lack accessible names; the primary Send button has neither aria-label nor tooltip
**Severity:** low
**Surface:** Chat composer + message action row
**Screenshot:** `screenshots/chat-new-empty.png` (composer), `screenshots/chat-hover-actions.png` (message actions)

Several icon-only buttons expose no accessible name to the accessibility tree (they render as bare `button` nodes with no name). Most rely on a Radix `Tooltip` for a *visual* hover label but never set `aria-label`, so screen-reader users hear "button" with no context. The **Send button is the worst case — it has no `aria-label` and no tooltip at all**, unlike the sibling Stop button (which has a "Stop generating" tooltip) and Attach button (which has an "Attach files…" tooltip).

**Root cause / fix:**
- Send button, no label + no tooltip: `modules/chat/components/Composer.tsx:150-161` (`<Button size="icon" onClick={onSend}>` → add `aria-label="Send message"` and/or a tooltip to match Stop/Attach).
- Message feedback buttons, tooltip-only, no `aria-label`: `modules/chat/components/FeedbackButtons.tsx:20-32`.
- Message Edit/Resend/Regenerate/Copy buttons: `modules/chat/components/MessageBubble.tsx` (tooltip-only). Add `aria-label` to each icon `button` for parity with the visual tooltip text.

---

### UIUX-004 — "Latest" jump-to-bottom pill is centered over the message column and occludes text
**Severity:** low
**Surface:** Chat page
**Screenshot:** `screenshots/chat-hover-actions.png`, `screenshots/chat-files-panel.png`

The scroll-to-bottom "Latest" pill is positioned centered over the message column, and its 95%-opaque background sits directly on top of the last visible lines of the conversation ("…come fro**[Latest]** if a measurement…"), hiding a word or two of content behind it. A jump-to-latest affordance should not overlap readable content — it typically sits bottom-right or pinned just above the composer, out of the text flow.

**Root cause / fix:** `modules/chat/ChatPage.tsx:567`
```tsx
className="ea-pop absolute bottom-28 left-1/2 -translate-x-1/2 z-10 … bg-background/95 backdrop-blur …"
```
`left-1/2 -translate-x-1/2` centers it over the text column. Move it out of the reading column (e.g. anchor bottom-right within the message area, or reduce it so it clears the last line) so it never covers message text.

---

### UIUX-005 — Inconsistent empty-state treatment across surfaces
**Severity:** low
**Surface:** Schedules vs Chat vs Files
**Screenshot:** `screenshots/schedules.png`, `screenshots/chat-empty-clean.png`, `screenshots/chat-files-empty.png`

The plugin uses at least three visually different empty states for the same "nothing here yet" idea: Schedules renders a **bounded dashed-border card** ("No schedules yet"); the Chat "Select an agent" state and the Files panel ("No charts or documents yet") use a **borderless, centered** treatment; the new-chat state is a custom centered block. The dashed-card vs borderless inconsistency makes the surfaces feel like they came from different design systems. Standardize on one empty-state pattern (the erxes-ui `Empty` component is already used in ChatPage — reuse it for Schedules too).

---

### UIUX-006 — Files panel empty state is vertically off-center (sits low in the panel)
**Severity:** low
**Surface:** Chat → Files preview panel (empty)
**Screenshot:** `screenshots/chat-files-empty.png`

When a thread has no artifacts, the "No charts or documents yet." message renders low in the panel (~57% of panel height) rather than centered, leaving a large empty gap above it and a cramped margin below. Minor, but it reads as unbalanced next to the crisply centered empty states elsewhere. Center the empty block vertically within the Files panel body for consistency with the chat/agent empty states.

---

## Notes on things investigated and dropped (not bugs)
- **Agent chat avatar shows an "X" glyph** — investigated: it is the erxes brand mark (`ErxesLogoIcon`) rendered by `modules/chat/components/Avatars.tsx:33`, intentional and consistent across chat/empty/rail. Not a broken initial. Dropped.
- **Model badge `kimi-for-coding · kimi-for-coding`** — provider and model fields both legitimately equal "kimi-for-coding" (test-data provider). Render is correct; test-data artifact. Dropped.
- **Skills SLASH badge appears cut at the column edge** — measured: badge is not internally clipped and only overflows its cell by ~10px with `overflow: visible`; no visible truncation in-viewport. Dropped.
- **Muted/helper text contrast** — measured (light `oklch(0.71…)` on dark `oklch(0.20…)` panel); readable across forms, empty states, and session list. No contrast finding.
- **Console** — only benign dev warnings ("No HydrateFallback element…", React/Apollo devtools hints); no runtime errors surfaced during navigation.
