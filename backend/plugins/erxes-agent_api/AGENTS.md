# `erxes-agent_api` Plugin Guide

## Identity

- **Plugin:** `erxes-agent`
- **Project:** `erxes-agent_api`
- **Layer:** Backend API
- **Path:** `backend/plugins/erxes-agent_api`
- **Last synchronized:** `2026-08-21`

## Scope

### Owns

- AI team-member configuration, provider settings, streamed chat execution, native chat persistence, file-based runtime skills, artifacts, and permission-scoped tool routing.

### Does not own

- Core user, permission, sales, contact, content, or other plugin data; those capabilities are consumed through published erxes service contracts.
- The `erxes-agent_ui` frontend or shared/core runtime implementation.

## Current Capabilities

- Runs blocking and SSE-streamed Mastra agent turns as linked AI team-member accounts with tenant and permission isolation.
- Creates agents with private, people-shared, or organization visibility, permission groups, additional-tool allowlists, provider/model settings, and active state.
- Persists chats, working memory, attachments, and artifacts in the native Mastra-backed stores; message persistence itself is Mastra-native (`savePerStep` incremental saves), with the plugin reconciling only erxes metadata, attachments, and zero-step failure rows.
- Discovers permitted erxes capabilities through `ErxesToolSearchProcessor` (a Mastra ToolSearchProcessor subclass that states loaded tools arrive on the next step, not the next turn) over each plugin's native `GET /agent-tools/manifest` (model + tRPC descriptors with flat input fields and derived permissions), with exact per-tool input schemas and conservative standalone-tool scoping; per-plugin manifest failures are skipped so one down plugin never wipes tenant-wide discovery.
- Curates each plugin's agent-tool surface per tenant (`PluginToolCuration`, collection `erxes_agent_plugin_tool_curations`): the native tool registry is default-deny — a plugin contributes capability tools only when enabled in settings (minus per-tool `disabledTools`), and `agentUsable=false` manifest entries are inventory-only, never executable; curation writes invalidate the registry cache immediately.
- Creates documents, charts, diagrams, and websites when those tools are enabled for the selected agent.
- Runs LLM-written JavaScript through the opt-in `run-code` builtin with an injected `erxes` SDK (`erxes.call`/`erxes.list`) bridging into the native capability layer; the tenant `sandboxMode` setting selects an in-process `node:vm` realm (`onserver`, default) or the OpenSandbox container (`isolated`, deterministic memoized replay over workspace files — zero egress).
- Loads plugin-owned `SKILL.md` files through Mastra `Workspace` and `LocalSkillSource`; Mastra provides skill discovery and read tools at runtime.
- Deduplicates exact tool calls per turn (identical calls, including failures, share one promise) and serializes state-changing calls; there is no numeric tool budget — a turn ends only when the model itself answers.
- Asks structured clarifying questions through `ask_user` (`src/mastra/tools/metaTools.ts`): same input contract as Mastra's built-in `askUserTool` (question/options/selectionMode), but returns the payload as a plain tool result (`awaitingUserAnswer: true`) and ends the turn instead of suspending the run — the UI renders the question card and the answer arrives as the next user message (the `request_approval` replay pattern; no Mastra snapshot storage required).
- Derives chat titles from the first meaningful request without a provider call.
- Wraps empty operation results (`{}`/`[]`/`null`) in an explicit `resultCount: 0` envelope with filter-check/pivot guidance instead of forwarding an anonymous empty payload.
- Anchors the system prompt to the current date and lets the native Mastra loop own turn lifecycle: a turn ends only when the model itself answers — no tool budget, no step ceiling, no completion guard. When the sandbox workspace tools are active, the prompt also carries the workspace doctrine (batch writes, idempotent full-file content, `workspaceReused: false` means the workspace was recreated empty — rewrite from plan, never probe; publish once after all writes).
- Streams the model's reply as-is: mid-stream provider failures append a plain-language failure note, error/abort finishes with no text create the assistant row Mastra never saved, and a turn that goes silent after tool work (no answer, no artifact) closes with a persisted plain-language note. A completed turn's text is never rewritten, synthesized, or replaced.

## Architecture

| Area             | Path                                                                 | Responsibility                                                                                  |
| ---------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Agent runtime    | `backend/plugins/erxes-agent_api/src/mastra/agentRuntime.ts`         | Builds cached Mastra agents, permission-filtered tools, memory, processors, and prompt context. |
| Turn preparation | `backend/plugins/erxes-agent_api/src/modules/agent/prepare.ts`       | Resolves identity, ownership, active tools, prompt scope, memory, and attachments.              |
| Turn execution   | `backend/plugins/erxes-agent_api/src/mastra/streamTurn.ts`           | Streams model output, tool activity, guarded replies, and persistence reconciliation.           |
| Tool execution   | `backend/plugins/erxes-agent_api/src/mastra/tools`                   | Implements native capability discovery/calls, files, documents, and workspace tools.        |
| Code mode        | `backend/plugins/erxes-agent_api/src/mastra/codeMode`                | Dispatches `run-code` executions to the on-server vm realm or the isolated OpenSandbox replay runner, and enforces the 64KB output cap. |
| Native sessions  | `backend/plugins/erxes-agent_api/src/modules/session/nativeStore.ts` | Translates and owns native thread/message persistence and tenant-scoped session operations.     |
| Runtime skills   | `backend/plugins/erxes-agent_api/skills`                             | Stores read-only Agent Skills files loaded by the Mastra workspace.                             |
| GraphQL API      | `backend/plugins/erxes-agent_api/src/modules/*/graphql`              | Exposes agent, provider, settings, session, and artifact contracts.                             |
| Plugin tool curation | `backend/plugins/erxes-agent_api/src/modules/plugintools`        | Stores per-plugin agent-tool curation and exposes the inventory/curation REST contract.      |

## Contracts

### Provides

- Plugin-prefixed GraphQL queries and mutations for agents, providers, settings, sessions, and artifacts. `MastraSettings`/`MastraSettingsInput` include `sandboxMode` (`"onserver"` | `"isolated"`, default `"onserver"`).
- `GET /pl:erxes-agent/plugin-tools` (REST, `settings.statusRead`) returns every active plugin's full agent-tool inventory (supported/enabled/disabledTools/tools incl. `agentUsable=false` entries); `POST /pl:erxes-agent/plugin-tools/curation` (REST, `settings.manage`) upserts the plugin's curation row (`enabled`, `disabledTools`) and invalidates the native tool registry. Reached through the gateway proxy with the browser session forwarded as the user header (same auth as `/chat/stream`).
- `POST /chat/stream` SSE chat transport and plugin-owned file/artifact routes. The stream closes immediately after the `finish` chunk, which carries the reconciled native message id and interrupted flag in `messageMetadata`; the only post-text transient data part is `data-thread-title` (sent before `finish`). Tool input is forwarded only as complete `tool-input-available` chunks — partial `tool-input-start`/`tool-input-delta` chunks are folded server-side but never sent to the client.

### Consumes

- `erxes-api-shared` authentication, permission, service-discovery, agent-tool types (`AgentToolDescriptor`/`AgentToolManifest`), and core types.
- Published plugin capability contracts: `GET /agent-tools/manifest` for discovery and `POST /agent-tools/call` for execution as the linked agent account. Both carry the HMAC-signed `x-erxes-agent-auth` header (tenant for manifests, tenant + acting user for calls; mutation correlation id travels in the reserved `__processId` input key); the serving plugin verifies the signature and enforces descriptor permissions authoritatively.
- Mastra Agent, Memory, processors, `Workspace`, `LocalSkillSource`, and storage APIs.

## Data and State

- Plugin configuration and domain records use tenant-scoped Mongoose models from `src/modules/*/db`.
- Native chat threads, messages, resources, and working memory live in the configured Mastra memory database.
- Runtime skills are read-only files copied into `dist/skills` during the backend build.
- Per-turn execution state uses `AsyncLocalStorage`; exact-call caches and state-changing tool queues never cross turn boundaries.

## Local Invariants

- Every interactive operation executes as the selected agent's linked core account while preserving the initiating human separately for ownership and approval.
- Destructive mutations always require explicit user approval; agent configuration cannot bypass that check.
- Tool permissions remain authoritative; every approved tool (builtins included) is active on every turn and the model decides what to call — no keyword scoping. Only the erxes operation catalog stays search-gated via `search_tools`.
- Mastra searches only the live, policy-scoped native capability tools; tool arguments follow the manifest's flat input fields and never trigger entity name-to-ID resolution.
- Capability discovery is best-effort per plugin: a failed or unreachable `/agent-tools/manifest` skips that plugin (fail-closed), and the agent's own plugin is excluded from discovery to avoid recursion.
- Plugins' agent-tool surface is default-deny until enabled in settings; `agentUsable=false` tools are never executable.
- Direct operation, file, and standalone execution has no per-turn invocation cap; identical calls share one promise and state-changing calls execute serially.
- Sandboxed `erxes.call` invocations (run-code) execute as the agent account serialized through a promise chain: each bridged call goes through `runToolOnce` (exact-call dedupe) and mutations join the turn-wide `runMutationSerially` queue — code mode cannot fan out past the turn's serial controls. The serving plugin's permission checks remain authoritative, and agent-side destructive approval does not wrap calls made from inside code mode (v1, documented in the tool description). Isolated mode keeps the zero-egress invariant: the in-container shim mediates calls by deterministic memoized replay over workspace files, never by network or stdin.
- The agentic loop has no step ceiling, no tool-call budget, and no answer budget; a turn ends only when the model itself stops calling tools and answers. `defaultOptions.stopWhen` must ALWAYS carry an explicit never-true condition — omitting `stopWhen` silently activates Mastra's built-in `stepCountIs(5)` default and caps every turn at five steps. No completion guards or forced text-only steps — the only processors are tool search and the memory replay filter. A hard failure or abort with no text still produces a plain-language closing note.
- Provider-specific code is limited to compatibility (Kimi reasoning-separator sanitization/buffering), never turn-lifecycle control.
- The model's answer is never inspected or rewritten: no synthesis-from-results, no fallback text, no completeness checks. A plain-language closing note (`src/mastra/closingNote.ts`) appears only when a turn leaves the user with nothing — a hard failure, an abort, or a silent finish after tool work (tool calls ran, but the model composed no answer and delivered no artifact); the silent-finish note is written into the existing native row so it survives reloads, while error/abort finishes create the assistant row Mastra never saved.
- Thread titles and activity labels must not trigger auxiliary model requests.
- Agent execution must start from an authenticated user request; the plugin must not subscribe to notifications, register automation actions, or run a scheduler.
- Plugin source must not import another plugin or require private changes to core/shared code.

## Validation

- `pnpm nx lint erxes-agent_api`
- `pnpm nx build erxes-agent_api`
- `pnpm nx test erxes-agent_api`
- Smoke: run plain-text, calculator, operation-count, operation-list, and ambiguous document requests; confirm plain text completes without tools, tool-backed replies contain the observed result, matched simple operation reads execute at most two unique calls, ambiguous wording retains approved capabilities, and no mutation is offered for read-only intent.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-21` — Startup account migration removed

- **Summary:** The legacy agent/service-user cutover migration is gone: startup no longer canonicalizes legacy profiles, drops the legacy `agentId_1` index, or backfills agent accounts — `onServerInit` is removed entirely, so the permission-action cache flush (`user_actions_*` SCAN/DEL on permissions-definition change) it hosted is gone too. The adoption helpers (`adoptLegacyAgentAccount`/`isAdoptableAgentAccount`) remain available in `src/mastra/auth/servicePrincipal.ts`.
- **Affected areas:** `src/main.ts` (`onServerInit` removed); deleted `src/migrations/migrateAgentAccounts.ts` (+ test) and the now-empty `src/migrations/` directory.
- **Contracts changed:** None

### `2026-08-20` — Turn loop step ceiling restored

- **Summary:** Removing the tool budget (#396's predecessor commit) also removed the only explicit `stopWhen`, and Mastra silently applies `stepCountIs(5)` when none is given — every turn then hard-stopped after five tool rounds mid-task (observed twice: a run ending on "please wait" after five run-code calls, and one ending with no text at all). Agent defaults now carry an explicit never-true stop condition, so the loop again ends only when the model itself stops calling tools.
- **Affected areas:** `src/mastra/agentRuntime.ts`.
- **Contracts changed:** None

### `2026-08-20` — Closing note for silent-after-work turns

- **Summary:** A turn that called tools and then ended without composing any answer (observed: five run-code calls, then an empty assistant message and the UI's "No response was generated" fallback) now closes with a plain-language note — "I completed the actions but could not put together a reply. Please try again." — streamed and written into the existing native row so it survives reloads; the note fires only when nothing else was delivered (no text, no ask_user card, no artifact), and interrupted/failed notes keep their existing wording and persistence paths.
- **Affected areas:** `src/mastra/closingNote.ts` (new), `src/mastra/streamTurn.ts`, `src/mastra/__tests__/closingNote.test.ts` (new).
- **Contracts changed:** None

### `2026-08-20` — Tool-call budget removed (model-owned turn ending)

- **Summary:** Per product decision, the 50-call per-turn tool budget is gone entirely: `runToolOnce` no longer counts or rejects invocations, the `stopWhen: [turnToolBudgetExceeded]` hard stop is removed from agent defaults, and the "action limit reached" closing-note branch is dropped — a turn now ends only when the model itself stops calling tools and answers (hard failure/abort with no text still produces the plain-language note). Exact-call dedupe (identical calls share one promise, failures included) and the serial mutation queue remain as the only execution controls.
- **Affected areas:** `src/mastra/requestContext.ts`, `src/mastra/agentRuntime.ts`, `src/mastra/streamTurn.ts`, `src/modules/agent/types.ts`, `src/mastra/codeMode/runCode.ts` (comment).
- **Contracts changed:** None

### `2026-08-20` — Workspace tool contract hardening

- **Summary:** Closed the remaining gaps behind a recorded turn failure (agent looped on a wiped workspace and oversized heredoc writes): the system prompt now carries a workspace doctrine when `workspaceWrite` is active (batch up to 32 files in one call, always full-file idempotent content, `workspaceReused: false` means the sandbox was recreated empty so rewrite from plan instead of probing, publish once after writes), the `workspaceWrite`/`publishWebsite` descriptions state the same semantics in plain language, and workspace lease acquisition polls briefly (4 attempts × 500ms) on a cross-replica duplicate-key race before surfacing the "workspace is busy" error.
- **Affected areas:** `src/mastra/instructions/routing.ts`, `src/mastra/tools/workspaceTools.ts`, `src/mastra/sandbox/commandService.ts` (+ tests).
- **Contracts changed:** None

### `2026-08-19` — Legacy index drop waits out background index builds

- **Summary:** The startup account migration no longer aborts tenants with MongoDB error 12586 (`BackgroundOperationInProgressForNamespace`): it awaits the model's autoIndex builds (`MastraAgent.init()`) before dropping the legacy `agentId_1` index — proceeding with the drop even if that wait fails, since a failed build is no longer in progress — and retries the drop with backoff while any background build drains.
- **Affected areas:** `src/migrations/migrateAgentAccounts.ts` (+ test).
- **Contracts changed:** None

### `2026-08-17` — Strict tRPC-only agent tool curation

- **Summary:** Aligned native capability discovery with the strict admit-only tRPC platform: only procedures declaring `.meta({ agent: { description, permission } })` are exposed or executable, permission-less fallbacks and model CRUD checks are removed, and tests are updated to enforce declared permissions.
- **Affected areas:** `src/mastra/tools/actionsToAllowedTools.ts`, `src/mastra/tools/destructiveGuard.ts`, `src/mastra/tools/nativeTools.ts`, `src/modules/plugintools/inventory.ts`, unit tests.
- **Contracts changed:** All uncurated/permission-less tRPC procedures are strictly forbidden; only explicit `.meta({ agent })` procedures are admitted.

### `2026-08-15` — Per-plugin agent-tool curation (REST surface)

- **Summary:** Added a per-tenant curation surface for which plugins agents may use: `PluginToolCuration` (collection `erxes_agent_plugin_tool_curations`) stores `enabled` + `disabledTools` per plugin (default-deny — a plugin contributes no capability tools until enabled), exposed to the admin UI as REST routes `GET /pl:erxes-agent/plugin-tools` (`settings.statusRead`) and `POST /pl:erxes-agent/plugin-tools/curation` (`settings.manage`) through the gateway proxy; the native tool registry always drops `agentUsable=false` manifest entries and skips disabled/disabled-tool plugins, and curation writes invalidate the registry cache immediately.
- **Affected areas:** `src/modules/plugintools/` (new: db model, inventory builder, REST routes), `src/routes.ts`, `src/mastra/tools/nativeTools.ts` (registry enforcement), `src/mastra/agentRuntime.ts` (models passed to registry), `src/connectionResolvers.ts` (model registration); shared lib `agent-tools` manifest now lists all tRPC procedures with an `agentUsable` flag and start-plugin mounts the endpoints unconditionally.
- **Contracts changed:** `GET /agent-tools/manifest` now includes `agentUsable=false` tRPC inventory entries and `/agent-tools/call` rejects them; agent-tools endpoints are always mounted on every plugin; new plugin REST routes `GET /plugin-tools` and `POST /plugin-tools/curation` (no GraphQL surface for curation).

### `2026-08-15` — Always-on approved tools (keyword scoping removed)

- **Summary:** `selectTurnActiveTools` no longer regex-gates standalone builtins per turn (the gate hid `webSearch`/`fetchUrl` on phrasing like "research …", and the model then wrongly concluded it had no internet access); every permission-approved tool in the turn's toolset is now active and the model decides, while the erxes operation catalog stays model-searchable via `search_tools`.
- **Affected areas:** `src/mastra/turnToolScope.ts` (simplified to always-on), `src/modules/agent/prepare.ts` (call site), `src/mastra/__tests__/turnToolScope.test.ts` (rewritten for always-on).
- **Contracts changed:** None

### `2026-08-15` — Debug-mode locale strings removed

- **Summary:** The UI's Debug mode setting was removed (the process line always opens the activity panel now), so the `general-settings-debug-*` strings were dropped from `src/locales/{en,mn}/erxes-agent.json`.
- **Affected areas:** `src/locales/en/erxes-agent.json`, `src/locales/mn/erxes-agent.json`.
- **Contracts changed:** None
