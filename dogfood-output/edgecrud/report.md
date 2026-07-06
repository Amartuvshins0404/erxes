# EdgeCRUD — Adversarial QA: erxes Agents + Skills

Scope: CRUD + data-integrity bugs. All test resources prefixed `zzq-`. Ignored other agents' data (Dogfood QA Agent, Amaraa*, other zzq-* not mine).
App: frontend localhost:3001, gateway localhost:4000/graphql. Source: main checkout /home/darjs/dev/os/erxes.

Findings appended as found. IDs EDGECRUD-###.

---

## EDGECRUD-001 — [HIGH] `mastraAgentUpdate` bypasses ALL mongoose schema validators (data corruption)
**Severity:** high (data-integrity)
**Root cause:** `updateAgent` uses `findOneAndUpdate(filter, {$set: doc}, {new: true})` with **no `runValidators: true`**. Mongoose does NOT run schema validators on `findOneAndUpdate` by default, so every constraint in the schema (enum + min/max) is silently skipped on update.
**Code:**
- `backend/plugins/erxes-agent_api/src/modules/agent/db/models/Agent.ts:148-152` (update, no runValidators)
- schema constraints that get bypassed: `agent/db/definitions/agent.ts:43` (`temperature min:0 max:2`), `:16-21` (`toolPolicy enum`), `:32-37` (`destructiveOps enum`), `:46-51` (`visibility enum`)
- mutation entry: `agent/graphql/resolvers/mutations/agent.ts:31-40`

**Repro (GraphQL, authenticated as normal admin via UI cookies):**
1. Create valid agent `zzq-validator` (temperature 0.5, maxSteps 10) → OK.
2. `mastraAgentUpdate` with `{temperature:-999, maxSteps:0, destructiveOps:"GARBAGE_ENUM", visibility:"NOT_A_SCOPE", toolPolicy:"bogus"}` → **succeeds**, returns those exact values.
3. Fresh `mastraAgent(_id)` read confirms persisted: `temperature:-999, maxSteps:0, destructiveOps:"GARBAGE_ENUM", visibility:"NOT_A_SCOPE", toolPolicy:"bogus"`.

**Contrast (proves it's an update-only bug):** the SAME garbage via `mastraAgentCreate` is REJECTED — create runs validators: `"mastra_agents validation failed: destructiveOps: GARBAGE is not a valid enum value..., temperature (-999) is less than minimum allowed value (0)"`.

**Impact:** invalid `visibility` (e.g. "NOT_A_SCOPE") slips past `visibilityFilter` scoping (row silently invisible/misfiled); `temperature:-999` gets sent to the model provider; `toolPolicy:"bogus"` is neither 'all' nor 'custom' (undefined tool-gating behavior); `maxSteps:0`. Any client that can call update (incl. the edit form for fields zod doesn't bound) can write these.
**Fix:** add `{ new: true, runValidators: true }` to the `findOneAndUpdate`.

## EDGECRUD-002 — [MEDIUM] mongoose `ValidationError` on create leaks as `INTERNAL_SERVER_ERROR` + full stacktrace
**Severity:** medium
**Root cause:** create path (`mastraAgentCreate` → `models.MastraAgent.create(doc)`) does not catch mongoose `ValidationError` and rewrap it as an `ExpectedError`. It propagates as a GraphQL `INTERNAL_SERVER_ERROR` whose response body includes the raw message AND a `stacktrace` array.
**Code:** `agent/graphql/resolvers/mutations/agent.ts:28` (`createAgent`), `Agent.ts:136-138` (`createAgent` = bare `.create`); no try/catch anywhere in the chain.
**Repro:** `mastraAgentCreate` with `temperature:-999` → response `errors[0].extensions.code = "INTERNAL_SERVER_ERROR"`, `extensions.stacktrace = ["ValidationError: mastra_agents validation failed...", "at Document..."]`.
**Impact:** ugly non-actionable error to end users (front-end frontend zod does NOT bound temperature — `validations.ts:15 temperature: z.number().nullable()` — so a user CAN submit an out-of-range temperature and hit this), plus internal path/stacktrace disclosure to the client.
**Fix:** catch ValidationError → ExpectedError with a clean message; and/or bound temperature in the zod schema (min 0 max 2).

## EDGECRUD-003 — [LOW] No length limits on agent name / instructions (create accepts 5000-char name, 100k instructions)
**Severity:** low
**Root cause:** neither the mongoose schema (`definitions/agent.ts:7` name `String` no maxlength, `:10` instructions no maxlength) nor the frontend zod (`validations.ts:4` `name: z.string().min(1)` — no max; `:7` instructions min(1) no max) bounds length.
**Repro:** `mastraAgentCreate` with a 5004-char name + 100000-char instructions → created OK (`name.length=5004`, `instructions.length=100000`).
**Impact:** unbounded storage; oversized names risk layout/perf issues in the table and chat headers. Recommend sane maxlengths (e.g. name ≤120, instructions ≤~50k).
**Also:** duplicate `agentId` create returns a **raw mongo `E11000` error incl. DB+collection name** (`erxes_local.mastra_agents index: agentId_1`) straight to the client — same unfriendly/leaky handling as EDGECRUD-002.

## EDGECRUD-004 — [HIGH] One agent with an invalid `visibility` (or any bad enum) CRASHES the entire Agents list page
**Severity:** high (availability; chains from EDGECRUD-001)
**Root cause:** the visibility column does `const { label, variant } = VISIBILITY_META[visibility ?? 'private'];`. `??` only substitutes null/undefined, NOT an unknown truthy string. An agent whose `visibility` is any value outside the 5 known keys (writable because EDGECRUD-001 lets update bypass the enum validator) makes `VISIBILITY_META[bad]` === `undefined`, and destructuring `.label`/`.variant` off `undefined` throws `TypeError: Cannot read properties of undefined (reading 'label')`. The `<cell>` throw bubbles to `PluginErrorBoundary`, replacing the WHOLE agents console with "This part of the agent console failed to load."
**Code:** `frontend/plugins/erxes-agent_ui/src/pages/agents/AgentsIndexPage.tsx:301`
**Repro:**
1. Set any agent's `visibility` to `"NOT_A_SCOPE"` via `mastraAgentUpdate` (EDGECRUD-001).
2. Open `/settings/erxes-agent/agents` → entire table replaced by the error boundary. Console: `TypeError: Cannot read properties of undefined (reading 'label')` at `<cell>`. (screenshot EDGECRUD-004-agents-list-crash.png)
**Impact:** the agents management page becomes completely unusable — you can't even open the offending agent to fix it from the UI. If the corrupted agent is org/team-visible, it breaks the page for every user who can see it. A single bad row = full-page denial of the feature.
**Fix:** `VISIBILITY_META[visibility] ?? VISIBILITY_META.private` (guard unknown keys), and defensively default in the toolPolicy/other enum cells too.

## EDGECRUD-005 — [HIGH] Deleting an agent orphans its conversations; recreating the same `agentId` RESURRECTS them into the new agent
**Severity:** high (data-integrity; privacy-adjacent)
**Root causes:**
1. `removeAgent` deletes ONLY the agent document — no cascade to the agent's threads/sessions/messages. `backend/plugins/erxes-agent_api/src/modules/agent/db/models/Agent.ts:160-164` (bare `deleteOne`, no thread cleanup).
2. Chat threads/sessions are keyed by the **mutable `agentId` slug**, not the immutable agent `_id`: `session/graphql/resolvers/queries/session.ts:33-39` (`listOwnedThreads(..., agentId, ...)`), and turn resourceId derives from agentId too (`agent/prepare.ts:50 deriveResourceId({user, agentId})`).
3. `agentId` is reusable: it's `unique` only among live docs (`definitions/agent.ts:8`), and nothing blocks reusing a freed slug or duplicate names (EDGECRUD-006).

**Repro (all reproduced, incl. UI):**
1. Create agent `zzq-inuse` (agentId `zzq-inuse`), open its chat, send `"[edgecrud] hello from delete-in-use test"`.
2. Delete the agent (`mastraAgentRemove` → `{acknowledged:true, deletedCount:1}`).
3. `mastraThreads(agentId:"zzq-inuse")` → still returns 1 thread; `mastraThreadMessages` → still returns the message. **Orphaned data survives deletion, uncleaned.**
4. Create a BRAND NEW agent (new `_id`, name "zzq-inuse-v2 (reused id)", agentId reused = `zzq-inuse`).
5. `mastraThreads(agentId:"zzq-inuse")` on the new agent → returns the OLD thread; opening `/erxes-agent/chat/zzq-inuse` in the UI **displays the deleted agent's message** (screenshot EDGECRUD-005-resurrected-conversation.png).

**Impact:** (a) permanent orphaned-data/storage leak on every agent delete; (b) a newly created agent silently inherits a prior deleted agent's full conversation history whenever the slug is reused — surprising, wrong attribution, and a privacy footgun (transcripts you "deleted with the agent" reappear). Threads should key on the immutable `_id`, and delete should cascade thread/session/message/artifact cleanup.

**Note — delete-in-use is NOT a frontend crash:** opening a deleted agent's chat renders the graceful `<Empty>` "Select an agent" state (`ChatPage.tsx:526-538`, `selectedAgent === null` guard). Investigated — the crash hypothesis from attack #2 does not hold on the frontend; the real bug is the backend orphan/resurrection above.
**Minor:** `mastraAgentRemove` returns the raw `{acknowledged, deletedCount}` while its TS interface declares `Promise<{ok:number}>` (`Agent.ts:50`) — shape mismatch; a non-owner delete would also return `deletedCount:0` with no error (silent no-op) rather than a permission error.

## EDGECRUD-006 — [LOW] Duplicate agent names allowed; indistinguishable in the agent picker
**Severity:** low
**Root cause:** `createAgent` performs no name-uniqueness check (`Agent.ts:136-138`); only `agentId` is unique (`definitions/agent.ts:8`). The create form auto-slugs agentId from name but the slug is editable, so two agents can share a name with distinct agentIds.
**Repro:** created two agents both named `zzq-dup` (agentId `zzq-dup-a`, `zzq-dup-b`) → both succeed. In the chat agent rail they appear as two identical `"Edit zzq-dup settings zzq-dup"` entries with no differentiator.
**Impact:** ambiguity in every place agents are listed by name (chat rail, pickers). Low, but worth a soft uniqueness warning.

## EDGECRUD-007 — [MEDIUM] `maxSteps` has no server-side bounds: create accepts 999,999,999 and negative values (runaway-loop / cost risk)
**Severity:** medium
**Root cause:** the schema declares `maxSteps: { type: Number, default: 10 }` with **no `min`/`max`** (`backend/plugins/erxes-agent_api/src/modules/agent/db/definitions/agent.ts:39`). Only the frontend zod bounds it (`validations.ts:14 maxSteps: z.number().int().min(1).max(50)`), which any direct GraphQL client (or the update path) bypasses.
**Repro:** `mastraAgentCreate` with `maxSteps: 999999999` → created, stored verbatim. `maxSteps: -5` → also created. (empty `model` on create IS correctly rejected: `model: Path 'model' is required` — so attack-6 "no model" is blocked on the create path only.)
**Impact:** `maxSteps` caps the agent's tool-call/step loop; a value of ~1e9 lets a single conversation turn loop effectively unbounded → runaway token cost and a self-inflicted DoS. Negative/zero values give undefined loop behavior. Add `min:1, max:<sane>` to the schema (and `runValidators` per EDGECRUD-001 so update honors it too).

## EDGECRUD-001 (addendum) — update-bypass also skips `required`: an agent can be left with NO model
Same `findOneAndUpdate` (no `runValidators`) also skips `required`. `mastraAgentUpdate` with `{model:"", provider:""}` **succeeds** and persists empty model/provider, even though create rejects an empty model. This directly realizes attack #6 "no model selected": the edit path can strip an agent's model, after which every chat turn feeds an empty model to the provider (`agent/prepare.ts` uses `agent.model`) and fails. Strengthens the case for `runValidators:true`.

## Investigated — NOT bugs (with code grounding)
- **Injection / XSS in agent name & description (attack #4):** created `zzq-xss` with name `</script><img src=x onerror=window.__XSSFIRED=1>` and description `'; DROP TABLE agents; -- {{7*7}} <b>bold</b>`. Rendered in the agents table: `window.__XSSFIRED` never set, 0 `<img>` created, payload shown as literal text, `<b>bold</b>` not bold, `{{7*7}}` not evaluated to 49. React's default JSX escaping handles it; Mongo (mongoose params) makes the SQL string inert. Safe.
- **Skill name/content boundaries & bad enums:** skills validate on BOTH create and update via `validateSkillContent` (`store/skillContent.ts:34-61`): name regex `^[a-z0-9]+(?:-[a-z0-9]+)*$` ≤64, description ≤1024, instructions ≤~5000 tokens, category regex. So the agent-side validator-bypass (EDGECRUD-001) does NOT apply to skills — they're robust. (Skill name XSS is impossible — regex rejects `<`.)
- **Delete-in-use conversation (attack #2) frontend:** graceful `<Empty>` state, no crash (see EDGECRUD-005 note).

## Secondary observation (out of strict CRUD scope) — latent SVG-XSS sink
`frontend/plugins/erxes-agent_ui/src/modules/chat/components/PanZoomSvg.tsx:102-107,372` injects `processedSvg` via `dangerouslySetInnerHTML` with NO sanitization (only appends hover CSS). If artifact/diagram SVG content (agent renderChart / workflow diagram output) ever contains `<script>`/`onload`, it executes. Not reachable purely through agent/skill CRUD, but worth sanitizing (DOMPurify) since the SVG source is model-influenced.
