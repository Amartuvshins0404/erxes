# Dogfood Report — erxes Agent Creation + Skills CRUD (manage)

- Target: http://localhost:3001/erxes-agent/agents , /skills
- Session start: 2026-07-01
- Scope: Agent CRUD, Skills CRUD, stored-XSS check, skills nav-shell hard-reload
- IDs: MANAGE-###

## Summary
Filed issues: 5 (medium: 1, low: 4). Security checks passed: 1 (XSS escaping). Happy-path areas verified clean: Agent CRUD, Skills CRUD.

| ID | Severity | Title |
|----|----------|-------|
| MANAGE-001 | N/A (passed) | Agent-name stored-XSS — safely escaped, not a vuln (code-grounded + firsthand) |
| MANAGE-002 | medium | Skills deep-link hard-reload loses AI-Agents module sidebar |
| MANAGE-003 | low | Agent form: no global feedback on validation failure; no success toast |
| MANAGE-004 | low | No max-length validation on agent Name / Agent ID |
| MANAGE-005 | low | "New Agent" / edit jumps from AI-Agents console into Settings shell |
| MANAGE-006 | low | Delete confirm dialog missing accessible description (a11y) |

---

## Findings

### MANAGE-001 — Stored-XSS check: agent names are SAFELY ESCAPED (not a vuln) [investigated — not a bug]
**Severity:** N/A (security check passed)
The pre-existing agent literally named `Dogfood QA Agent ✨ <script>alert(1)</script>` and my own test agent `zzq-<img src=x onerror=alert('zzq')>` both render the payload as **literal text**, never as HTML. No dialog fired, no console alert, DOM has 0 injected `<img>`/`<script>` elements (verified: `{maliciousImgCount:0, literalTextPresent:true}`). Escaped in list cell, chat sidebar, AND the delete-confirm dialog title.
**Code grounding (React text interpolation, auto-escaped):**
- List table cell: `pages/agents/AgentsIndexPage.tsx:237` → `{name}`
- Chat sidebar: `modules/chat/components/AgentRail.tsx:79` → `<span className="truncate">{agent.name}</span>`
- Edit dialog title: `modules/chat/components/EditAgentDialog.tsx:73` → `Edit {agent.name}`
- Only `dangerouslySetInnerHTML` in the whole tree is `modules/chat/components/PanZoomSvg.tsx:372`, fed by Mermaid-rendered SVG only — never an agent/skill name.
Conclusion: no XSS path from agent names. Firsthand + code-grounded.
Screenshots: `screenshots/xss-escaped-list.png`, `screenshots/xss-delete-confirm.png`

### MANAGE-002 — Skills deep-link hard-reload loses the AI-Agents module sidebar [medium]
**Severity:** medium
Hard-loading `http://localhost:3001/erxes-agent/skills` renders a **generic host shell**: the left nav shows a collapsed "erxes AI Agents" button under a generic "Plugins" group instead of the expanded AI-Agents module nav (Chat / Agents / Workflows / Skills / Schedules / Agent Learnings). By contrast, hard-loading `/erxes-agent/agents` DOES expand the module nav. User must manually click "erxes AI Agents" to reveal the sub-nav.
Repro: 1) open `/erxes-agent/skills` fresh (hard load) 2) observe sidebar = only generic Plugins list, no Chat/Agents/Workflows/Schedules/Agent Learnings links. Clicking the "erxes AI Agents" button expands them (SPA restores nav).
Screenshot: `screenshots/skills-hardload.png` vs `screenshots/initial-agents.png`

**Root cause (code-grounded):** The expanded AI-Agents nav renders only when the jotai atom `activePluginState === 'erxes AI Agents'` — `core-ui/src/modules/navigation/components/NavigationPlugins.tsx:106-108` (`if (activePlugin && navigationGroups[activePlugin]) return <NavigationPluginModules .../>`; else falls through to the generic flat plugin list at 110-116). That atom is `atomWithStorage('activePlugin', null, …)` (`libs/erxes-ui/src/modules/navigation-menu/states/activePluginState.tsx:3-10`) and is set **only by clicking** the plugin group (`NavigationPlugins.tsx:63-70`, `setActivePlugin(name)`). The erxes-agent plugin has **no effect that derives `activePluginState` from the URL** — unlike `car_ui` which syncs it in `private-plugins/car_ui/src/modules/MainNavigation.tsx:42-48`. Its nav component `modules/MastraNavigation.tsx:31-59` (registered as group `'erxes AI Agents'` in `src/config.tsx:35-43`) relies purely on the click + persisted atom. Both `/erxes-agent/agents` and `/erxes-agent/skills` are registered identically in the same `PluginRoutesShell` (`modules/MastraMain.tsx:74,81`) — so this is **not** a route-registration inconsistency; it is stateful. On a hard load, `activePlugin` comes solely from localStorage: if it is `null`/`''` (fresh session, cleared storage, or after a Home click which sets it to `''` — `Organization.tsx:38`), the route content still renders (`SkillsIndexPage`) but the sidebar shows the generic plugin list. (This is why `/agents` showed the nav earlier in my session — the atom was still `'erxes AI Agents'` from a prior click — while a later hard `/skills` load did not.)
**Fix direction:** add a URL→`activePluginState` sync for `/erxes-agent/*` (mirror `car_ui/src/modules/MainNavigation.tsx:42-48`).

### MANAGE-003 — Agent form: no global feedback on validation failure; no success toast [low]
**Severity:** low
`ResourceFormLayout` submits via `form.handleSubmit(onSubmit)` with **no onInvalid handler** (`components/ResourceFormLayout.tsx`). Fields `maxSteps` and `temperature` render WITHOUT a `<Form.Message/>` (`pages/agents/components/AgentFormFields.tsx:305-386`), so a zod failure on those (`validations.ts:14-15`, `maxSteps` int 1..50) yields a fully silent no-op — no toast, no navigation, no inline error. On success there is also no toast (`useSaveAgent.ts:16` only `navigate(...)`). In practice `ClampedNumberInput` clamps `maxSteps` on blur (`ClampedNumberInput.tsx:56-64`) so the silent path is hard to hit via normal clicking, but the missing invalid-handler + missing success toast is a real feedback gap.
Note: one create attempt (video `videos/manage-create-agent.webm`) produced exactly this symptom (clicked Create → stayed on /new, no feedback, agent not created); could NOT be reproduced on retry, so filed as low, not critical.

### MANAGE-004 — No max-length validation on agent Name / Agent ID [low]
**Severity:** low
A 300-character name was accepted with no error; Agent ID auto-slugs to a 300-char string. `validations.ts:4-9` constrains name/agentId with `.min(1)` only — no `.max()`. Emoji names are handled gracefully (slug strips them → `zzq-emoji`).

### MANAGE-005 — "New Agent" / agent edit jumps from AI-Agents console into Settings shell [low]
**Severity:** low
The agent LIST is at `/erxes-agent/agents` (AI-Agents console shell), but "New Agent" and row → Edit navigate to `/settings/erxes-agent/agents/new|edit/...` which swaps the entire left sidebar to the **Settings** nav (Profile, Team Member, Brands, …), losing AI-Agents context. Jarring context switch for a core create/edit flow. (Same console-vs-settings route split underlies MANAGE-002.)

### Skills CRUD — works correctly [investigated — no bug]
Create `zzq-skill` ✓, edit description persists across reload ✓, delete with confirm dialog ("Delete "zzq-skill" and all its versions? This cannot be undone.") ✓. Empty-required validation shows inline errors ("Name is required", "Description is required", "Instructions are required") ✓. Invalid metadata JSON caught inline ("Metadata must be valid JSON") ✓. Skills form has the proper feedback that the agent form (MANAGE-003) lacks.

### Agent CRUD happy-path — works [investigated — no bug]
Create (name/desc/system-prompt+markdown, provider Kimi, live model dropdown "K2.7 Code"), persists in Agents list AND chat sidebar ✓. Edit (description + system prompt) persists across reload; Agent ID field correctly disabled on edit ✓. Delete: confirm dialog ✓, removed from list ✓, no stale ref in chat sidebar (fresh load) ✓.

### MANAGE-006 — Delete confirm dialog missing accessible description (a11y) [low]
**Severity:** low
Every delete-confirmation (agent delete, skill delete) logs a Radix warning: "`AlertDialogContent` requires a description for the component to be accessible for screen reader users. Missing `Description` or `aria-describedby={undefined}`." The confirm text is only in the title/heading; there is no `AlertDialog.Description`, so screen-reader users get no described body. Observed in console on each delete confirm. Fix: add an `AlertDialog.Description` (or `aria-describedby`) to the shared confirm dialog.
