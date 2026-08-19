# `erxes-agent_api` Plugin Guide

## Identity

- **Plugin:** `erxes-agent`
- **Project:** `erxes-agent_api`
- **Layer:** Backend API
- **Path:** `backend/plugins/erxes-agent_api`
- **Last synchronized:** `2026-08-19`

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
- Bounds unique tool executions and state-changing tool concurrency per turn; every tool invocation (first or exact repeat) spends from the same 50-call hard stop so a repeat loop cannot spin forever.
- Asks structured clarifying questions through `ask_user` (`src/mastra/tools/metaTools.ts`): same input contract as Mastra's built-in `askUserTool` (question/options/selectionMode), but returns the payload as a plain tool result (`awaitingUserAnswer: true`) and ends the turn instead of suspending the run — the UI renders the question card and the answer arrives as the next user message (the `request_approval` replay pattern; no Mastra snapshot storage required).
- Derives chat titles from the first meaningful request without a provider call.
- Wraps empty operation results (`{}`/`[]`/`null`) in an explicit `resultCount: 0` envelope with filter-check/pivot guidance instead of forwarding an anonymous empty payload.
- Anchors the system prompt to the current date and lets the native Mastra loop own turn lifecycle: a turn ends when the model itself answers or when the 50-call tool budget is spent (the only hard stop), with no other step ceiling or completion guard.
- Streams the model's reply as-is: mid-stream provider failures append a plain-language failure note, and error/abort finishes with no text create the assistant row Mastra never saved. A completed turn's text is never rewritten, synthesized, or replaced.

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
- Per-turn execution state uses `AsyncLocalStorage`; exact-call caches, repetition tracking, call budgets, and state-changing tool queues never cross turn boundaries.

## Local Invariants

- Every interactive operation executes as the selected agent's linked core account while preserving the initiating human separately for ownership and approval.
- Destructive mutations always require explicit user approval; agent configuration cannot bypass that check.
- Tool permissions remain authoritative; every approved tool (builtins included) is active on every turn and the model decides what to call — no keyword scoping. Only the erxes operation catalog stays search-gated via `search_tools`.
- Mastra searches only the live, policy-scoped native capability tools; tool arguments follow the manifest's flat input fields and never trigger entity name-to-ID resolution.
- Capability discovery is best-effort per plugin: a failed or unreachable `/agent-tools/manifest` skips that plugin (fail-closed), and the agent's own plugin is excluded from discovery to avoid recursion.
- Plugins' agent-tool surface is default-deny until enabled in settings; `agentUsable=false` tools are never executable.
- Direct operation, file, and standalone execution admits at most ten invocations per turn; identical calls share one promise and state-changing calls execute serially.
- Sandboxed `erxes.call` invocations (run-code) execute as the agent account serialized through a promise chain and spend from the SAME per-turn budget as any tool: each bridged call goes through `runToolOnce` (50-call hard stop + exact-call dedupe) and mutations join the turn-wide `runMutationSerially` queue — code mode cannot fan out past the turn limit. The serving plugin's permission checks remain authoritative, and agent-side destructive approval does not wrap calls made from inside code mode (v1, documented in the tool description). Isolated mode keeps the zero-egress invariant: the in-container shim mediates calls by deterministic memoized replay over workspace files, never by network or stdin.
- The agentic loop has no step ceiling beyond the tool budget (`stopWhen: [turnToolBudgetExceeded]`) and no answer budget; a turn ends when the model itself answers or when the 50-call budget is spent, which also emits a plain-language closing note when no reply text exists. No other completion guards or forced text-only steps — the only processors are tool search and the memory replay filter.
- Provider-specific code is limited to compatibility (Kimi reasoning-separator sanitization/buffering), never turn-lifecycle control.
- The model's answer is never inspected or rewritten: no synthesis-from-results, no fallback text, no completeness checks. Only a hard failure or abort with no text produces a plain-language closing note (creating the native assistant row directly when the run finished before any step completed; later steps are already persisted natively via `savePerStep`).
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

### `2026-08-19` — Legacy index drop waits out background index builds

- **Summary:** The startup account migration no longer aborts tenants with MongoDB error 12586 (`BackgroundOperationInProgressForNamespace`): it awaits the model's autoIndex builds (`MastraAgent.init()`) before dropping the legacy `agentId_1` index and retries the drop with backoff while any background build drains.
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

### `2026-08-15` — Structured ask_user questions

- **Summary:** Agents can ask the user a clarifying question with structured choices: the new always-bound `ask_user` tool (Mastra built-in contract, non-suspending execution) ends the turn with an `awaitingUserAnswer` result, the system prompt gained an "Asking the User" block (act-first, one question per turn, never self-answer), and turn finalization never writes a closing note while a question is pending so the turn never closes over the card. Answers continue as ordinary next user messages.
- **Affected areas:** `src/mastra/tools/metaTools.ts` (tool + `isAwaitingUserAnswer`), `src/mastra/agentRuntime.ts` (unconditional registration, ROUTING_VERSION 42), `src/mastra/instructions/routing.ts`, `src/mastra/streamTurn.ts` (no closing note for pending questions), `src/mastra/tools/__tests__/askUserTool.test.ts` (new).
- **Contracts changed:** `POST /chat/stream` turns may now end with an `ask_user` tool part carrying `{ awaitingUserAnswer: true, question, options, selectionMode }` and no reply text; no other stream contract changes.

### `2026-08-14` — Signed agent-tools auth header

- **Summary:** Native capability discovery and execution now authenticate with the HMAC-signed `x-erxes-agent-auth` header (shared `JWT_TOKEN_SECRET`, short expiry) instead of the reversible `x-trpc-context` header, matching the hardened platform contract; the mutation correlation id moves from the header context into the reserved `__processId` input key.
- **Affected areas:** `src/mastra/tools/nativeTools.ts` (`fetchPluginManifest`, `callNativeTool`).
- **Contracts changed:** `GET /agent-tools/manifest` and `POST /agent-tools/call` requests must carry a valid `x-erxes-agent-auth` header; unsigned requests are rejected with 401 by the platform.

### `2026-08-14` — Remove the isolated terminal tool

- **Summary:** Removed the `terminal` shell tool and its additional-tools toggle — code mode (`run-code`) is the sandbox execution path now; the sandbox workspace tools (`workspaceWrite`, `publishWebsite`) moved under the `runCode` gate, retired allowlist keys are dropped silently instead of failing agents saved with them, and the gateway locales now carry `runCode` labels (EN/MN) in place of the terminal ones.
- **Affected areas:** deleted `src/mastra/tools/terminalTool.ts` (+ test); `src/mastra/tools/additionalTools.ts`, `src/mastra/agentRuntime.ts`, `src/mastra/turnToolScope.ts`, `src/modules/settings/@types/settings.ts`, `src/modules/agent/@types/agent.ts`, scope/capability tests; `backend/gateway/src/locales/{en,mn}/mastra.json`.
- **Contracts changed:** `terminal` removed from the additional-tools catalog (`mastraAgentAdditionalTools`); agents storing it keep working (key ignored).

### `2026-08-14` — Tool-budget hard stop and complete-only tool input streaming

- **Summary:** The turn loop now hard-stops via `stopWhen: [turnToolBudgetExceeded]` once the 50-call budget is spent (previously the budget rejection was the sole breaker, so a retrying model could spin the turn indefinitely), with a plain-language closing note when the stop leaves no reply text; the chat stream no longer forwards partial `tool-input-start`/`tool-input-delta` chunks — tool input arrives only complete, eliminating the client-side argsText mismatch that flooded assistant-ui's tool tracker and froze the tab; and `ToolCallSignalFilter` now locates current-run frames structurally (after the last user message) instead of trusting the unreliably-populated `steps`, fixing models re-issuing identical successful tool calls forever because they never saw the results. Same change raised the default per-turn budget from 10 to 50 and fixed the `node:vm` cross-realm `SyntaxError` instanceof check that made every multi-statement `run-code` snippet fail to parse.
- **Affected areas:** `src/mastra/agentRuntime.ts`, `src/mastra/streamTurn.ts`, `src/mastra/requestContext.ts`, `src/mastra/memory/toolCallSignalFilter.ts`, `src/mastra/codeMode/onServerRunner.ts`, `src/mastra/codeMode/runCode.ts`, `src/mastra/codeMode/isolatedRunner.ts`, `src/modules/agent/types.ts`.
- **Contracts changed:** `POST /chat/stream` no longer emits `tool-input-start`/`tool-input-delta` chunks (clients see tool input only via complete `tool-input-available`).

### `2026-08-14` — Code mode (`run-code`) with dual sandbox backends

- **Summary:** Added an opt-in `run-code` builtin tool that executes LLM-written async JavaScript with an injected `erxes` SDK (`erxes.call(toolId, input)` / `erxes.list()`) bridging into the native capability layer as the agent account; the new tenant setting `sandboxMode` selects an in-process `node:vm` realm (`onserver`, zero-config default) or the OpenSandbox container (`isolated`, where a shim mediates capability calls by deterministic memoized replay over workspace files because the installed SDK has no stdin channel — zero egress preserved); output is a `{ result, logs, error? }` envelope capped at 64KB, executions audit as `agentCodeExecute`, and `runCode` joins the additional-tool allowlist and the serial side-effecting set.
- **Affected areas:** `src/mastra/codeMode/runCode.ts`, `onServerRunner.ts`, `isolatedRunner.ts` (new), `src/mastra/tools/codeModeTool.ts` (new), `src/mastra/tools/additionalTools.ts`, `src/mastra/agentRuntime.ts`, `src/modules/settings/{@types,db,graphql}`.
- **Contracts changed:** `MastraSettings` type and `MastraSettingsInput` gained `sandboxMode: String` (`"onserver"`/`"isolated"`; other values rejected with ExpectedError in the model layer).
