# `erxes-agent_api` Plugin Guide

## Identity

- **Plugin:** `erxes-agent`
- **Project:** `erxes-agent_api`
- **Layer:** Backend API
- **Path:** `backend/plugins/erxes-agent_api`
- **Last synchronized:** `2026-08-13`

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
- Discovers permitted erxes operations through Mastra ToolSearchProcessor over live GraphQL introspection, with exact live argument schemas and conservative standalone-tool scoping; when the gateway `/graphql` is blocked or introspection is disabled, the registry rebuilds itself from each subgraph's federation SDL on its internal address.
- Creates documents, charts, diagrams, and websites when those tools are enabled for the selected agent.
- Loads plugin-owned `SKILL.md` files through Mastra `Workspace` and `LocalSkillSource`; Mastra provides skill discovery and read tools at runtime.
- Bounds malformed-provider recovery, unique tool executions, exact duplicate calls, and state-changing tool concurrency per turn.
- Derives chat titles from the first meaningful request without a provider call.
- Wraps empty operation results (`{}`/`[]`/`null`) in an explicit `resultCount: 0` envelope with filter-check/pivot guidance instead of forwarding an anonymous empty payload.
- Anchors the system prompt to the current date and guards every provider (not only Kimi) against settling on progress narration, including Mongolian progressive endings.
- Finalizes every streamed turn with a persisted assistant reply: mid-stream provider failures append a plain-language failure note, and error/abort finishes create the assistant row Mastra never saved.

## Architecture

| Area             | Path                                                                 | Responsibility                                                                                  |
| ---------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Agent runtime    | `backend/plugins/erxes-agent_api/src/mastra/agentRuntime.ts`         | Builds cached Mastra agents, permission-filtered tools, memory, processors, and prompt context. |
| Turn preparation | `backend/plugins/erxes-agent_api/src/modules/agent/prepare.ts`       | Resolves identity, ownership, active tools, prompt scope, memory, and attachments.              |
| Turn execution   | `backend/plugins/erxes-agent_api/src/mastra/streamTurn.ts`           | Streams model output, tool activity, guarded replies, and persistence reconciliation.           |
| Tool execution   | `backend/plugins/erxes-agent_api/src/mastra/tools`                   | Implements operation discovery, erxes calls, files, documents, and workspace tools.             |
| Native sessions  | `backend/plugins/erxes-agent_api/src/modules/session/nativeStore.ts` | Translates and owns native thread/message persistence and tenant-scoped session operations.     |
| Runtime skills   | `backend/plugins/erxes-agent_api/skills`                             | Stores read-only Agent Skills files loaded by the Mastra workspace.                             |
| GraphQL API      | `backend/plugins/erxes-agent_api/src/modules/*/graphql`              | Exposes agent, provider, settings, session, and artifact contracts.                             |

## Contracts

### Provides

- Plugin-prefixed GraphQL queries and mutations for agents, providers, settings, sessions, and artifacts.
- `POST /chat/stream` SSE chat transport and plugin-owned file/artifact routes. The stream closes immediately after the `finish` chunk, which carries the reconciled native message id and interrupted flag in `messageMetadata`; the only post-text transient data part is `data-thread-title` (sent before `finish`).

### Consumes

- `erxes-api-shared` authentication, permission, service-discovery, and core types.
- Published erxes GraphQL/service contracts discovered from the gateway and called as the linked agent account.
- Mastra Agent, Memory, processors, `Workspace`, `LocalSkillSource`, and storage APIs.

## Data and State

- Plugin configuration and domain records use tenant-scoped Mongoose models from `src/modules/*/db`.
- Native chat threads, messages, resources, and working memory live in the configured Mastra memory database.
- Runtime skills are read-only files copied into `dist/skills` during the backend build.
- Per-turn execution state uses `AsyncLocalStorage`; exact-call caches, repetition tracking, call budgets, and state-changing tool queues never cross turn boundaries.

## Local Invariants

- Every interactive operation executes as the selected agent's linked core account while preserving the initiating human separately for ownership and approval.
- Destructive mutations always require explicit user approval; agent configuration cannot bypass that check.
- Tool permissions remain authoritative; turn scoping never grants a tool and preserves all approved standalone tools when wording is ambiguous.
- Mastra searches only the live, policy-scoped exact erxes operation tools; operation arguments use exact schema values and never trigger entity name-to-ID resolution.
- Operation discovery must survive a blocked, hidden, or introspection-disabled gateway `/graphql`: when the gateway yields zero operations, the registry rebuilds from each subgraph's federation SDL (`_service { sdl }` on internal addresses), applying the same internal/client-portal skip rules and security strip as the gateway path.
- Direct operation, file, and standalone execution admits at most ten unique calls per turn; identical calls share one promise and state-changing calls execute serially.
- An exact repeated call forces a text-only model step using the tool-result messages already present for that turn.
- Provider completion recovery adds at most one corrective model request.
- A streamed turn never ends silently: finalization always emits and persists a closing reply, creating the native assistant row directly when the model run finished in error or abort before any step completed (later steps are already persisted natively via `savePerStep`).
- Thread titles and activity labels must not trigger auxiliary model requests.
- Agent execution must start from an authenticated user request; the plugin must not subscribe to notifications, register automation actions, or run a scheduler.
- Plugin source must not import another plugin or require private changes to core/shared code.

## Validation

- `pnpm nx build erxes-agent_api`
- `pnpm nx test erxes-agent_api`
- Smoke: run plain-text, calculator, operation-count, operation-list, and ambiguous document requests; confirm plain text completes without tools, tool-backed replies contain the observed result, matched simple operation reads execute at most two unique calls, ambiguous wording retains approved capabilities, and no mutation is offered for read-only intent.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-13` — Library-native stream close

- **Summary:** The chat stream now persists before writing `finish`, carries the reconciled message id in `finish` `messageMetadata`, sends the thread title before `finish`, and closes immediately — removing the post-finish reconcile tail (`data-message-id`) so the stock AI SDK transport/status lifecycle applies unchanged.
- **Affected areas:** `src/mastra/streamTurn.ts`.
- **Contracts changed:** `POST /chat/stream` no longer emits the transient `data-message-id` part; `finish` `messageMetadata.messageId` now holds the native assistant id (previously always null at finish time).

### `2026-08-12` — Empty-result envelopes and guaranteed turn finalization

- **Summary:** Empty operation results now reach the model as an explicit `resultCount: 0` envelope with pivot guidance, the prompt anchors the current date and empty-result pivot rules, progress-narration replies (English and Mongolian) are rejected for all providers, failed/interrupted streams still emit and persist a closing assistant message, and message persistence delegates to Mastra-native `savePerStep` incremental saves on both streamed and blocking turns.
- **Affected areas:** `src/mastra/tools/emptyResult.ts` (new), `src/mastra/tools/erxesTools.ts`, `src/mastra/instructions/routing.ts`, `src/mastra/agentRuntime.ts`, `src/mastra/providerOutputGuard.ts`, `src/mastra/streamTurn.ts`, `src/modules/agent/run.ts`, `src/modules/agent/persist.ts`, `src/modules/session/nativeStore.ts`.
- **Contracts changed:** None

### `2026-08-11` — Subgraph SDL fallback for operation discovery

- **Summary:** When the gateway `/graphql` is blocked, hidden, or introspection-disabled, the operation registry rebuilds its operations and schema maps from each subgraph's federation SDL on internal addresses, keeping search/execute operation tools functional.
- **Affected areas:** `src/mastra/tools/subgraphSchemaSource.ts` (new), `src/mastra/tools/erxesTools.ts`, `src/mastra/tools/operationRegistry.ts`, and tests.
- **Contracts changed:** None

### `2026-08-10` — Finish Kimi operation turns

- **Summary:** Guards immediate Kimi coding tool-work promises without forcing duplicate tools or changing plain future-tense answers, and makes streamed and blocking chats answer from completed, deduplicated operation results.
- **Affected areas:** Agent runtime, provider-scoped completion guard, streamed and blocking turn finalization, GraphQL chat, and regression tests.
- **Contracts changed:** None

### `2026-08-07` — Fix dynamic operation routing

- **Summary:** Keeps permitted operation tools active for ToolSearchProcessor, adds compact live-name search terms, and tests direct subgraph execution with exact IDs.
- **Affected areas:** Turn tool scope, operation tool descriptions, and authentication tests.
- **Contracts changed:** None

### `2026-08-07` — Simplify agent setup and access

- **Summary:** Removed team and department audiences, per-agent memory/temperature/destructive choices, and duplicate settings/chat editors while keeping people sharing, permission groups, CRUD, and approval enforcement.
- **Affected areas:** Agent schema, GraphQL, authorization, migration cleanup, runtime guardrails, setup form, routes, settings navigation, chat rail, locales, and stale docs/tests.
- **Contracts changed:** Removed `audienceTeamIds`, `audienceDepartmentIds`, `destructiveOps`, `memoryEnabled`, and `temperature` from agent contracts; shared visibility now accepts people only.

### `2026-08-07` — Simplify dynamic operation tools

- **Summary:** Removed static operation hints, entity auto-resolution, custom response-field controls, operation preloading, and configuration-key discovery while retaining live introspection, exact tools, and safety gates.
- **Affected areas:** `src/mastra/tools`, turn preparation and execution, routing instructions, and tool-scope tests.
- **Contracts changed:** Removed the `list_config_keys` and `__responseFields` tool surfaces; operation descriptions and argument schemas now come from live GraphQL introspection.

### `2026-08-06` — Remove end-user trace payloads

- **Summary:** Removed the agent debug setting, reasoning stream output, trace-only turn state, metadata, and session payload data while preserving tool execution, status, results, artifacts, approvals, and errors.
- **Affected areas:** Agent schema and types, chat stream, activity tracking, turn accumulation and persistence, and native session hydration.
- **Contracts changed:** Removed `debug` from `MastraAgent` and `MastraAgentInput`; session messages no longer expose reasoning parts or old trace metadata.

### `2026-08-06` — Remove custom skills CMS

- **Summary:** Removed custom skill persistence, CRUD, publishing, versioning, permissions, agent assignment, distillation, seeding, and API contracts while retaining Mastra-native file skills.
- **Affected areas:** Runtime agent workspace, skill files, agent schema, GraphQL assembly, chat transport, permissions, and build assets.
- **Contracts changed:** Removed all `mastraSkill*` operations, agent `skills` fields, skill permission actions, and slash-activation payload metadata.

### `2026-08-06` — Remove notifications and background execution

- **Summary:** Removed notification-triggered turns, scheduling, background principals, and background runtime hooks while keeping on-demand chat.
- **Affected areas:** Plugin startup, agent turn identity, tools, permissions, locales, and docs.
- **Contracts changed:** Removed notification and background runtime hooks.
