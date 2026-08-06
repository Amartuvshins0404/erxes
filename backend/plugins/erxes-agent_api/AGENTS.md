# `erxes-agent_api` Plugin Guide

## Identity

- **Plugin:** `erxes-agent`
- **Project:** `erxes-agent_api`
- **Layer:** Backend API
- **Path:** `backend/plugins/erxes-agent_api`
- **Last synchronized:** `2026-08-06`

## Scope

### Owns

- AI team-member configuration, provider settings, streamed chat execution, native chat persistence, agent workflows, skills, artifacts, and agent-specific tool routing.

### Does not own

- Core user, permission, sales, contact, content, or other plugin data; those capabilities are consumed through published erxes service contracts.
- The `erxes-agent_ui` frontend or shared/core runtime implementation.

## Current Capabilities

- Runs blocking and SSE-streamed Mastra agent turns as linked AI team-member accounts with tenant and permission isolation.
- Persists chats, working memory, feedback, attachments, and artifacts in the native Mastra-backed stores.
- Discovers permitted erxes operations, preloads up to three message-relevant exact operations without exposing write operations to read-only prompts, and narrows standalone tools only when intent is confident.
- Creates documents, charts, diagrams, websites, workflows, and reusable skills when those tools are enabled for the selected agent.
- Bounds malformed-provider recovery, unique tool executions, exact duplicate calls, and state-changing tool concurrency per turn; matched simple interactive data reads converge after at most two unique tool executions.
- Derives chat titles from the first meaningful request without a provider call.

## Architecture

| Area             | Path                                                                 | Responsibility                                                                                         |
| ---------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Agent runtime    | `backend/plugins/erxes-agent_api/src/mastra/agentRuntime.ts`         | Builds cached Mastra agents, permission-filtered tools, memory, processors, and prompt context.        |
| Turn preparation | `backend/plugins/erxes-agent_api/src/modules/agent/prepare.ts`       | Resolves identity, ownership, active tools, operation preloads, prompt scope, memory, and attachments. |
| Turn execution   | `backend/plugins/erxes-agent_api/src/mastra/streamTurn.ts`           | Streams model output, tool activity, guarded replies, and persistence reconciliation.                  |
| Tool execution   | `backend/plugins/erxes-agent_api/src/mastra/tools`                   | Implements operation discovery, erxes calls, files, documents, workflows, and workspace tools.         |
| Native sessions  | `backend/plugins/erxes-agent_api/src/modules/session/nativeStore.ts` | Translates and owns native thread/message persistence and tenant-scoped session operations.            |
| GraphQL API      | `backend/plugins/erxes-agent_api/src/modules/*/graphql`              | Exposes agent, provider, settings, session, skill, learning, artifact, and workflow contracts.         |

## Contracts

### Provides

- Plugin-prefixed GraphQL queries and mutations for agents, providers, settings, sessions, learnings, skills, artifacts, and workflows.
- `POST /chat/stream` SSE chat transport and plugin-owned file/artifact routes.
- Agent automation metadata and notification-triggered execution hooks.

### Consumes

- `erxes-api-shared` authentication, permission, service-discovery, and core types.
- Published erxes GraphQL/service contracts discovered from the gateway and called as the linked agent account.
- Mastra Agent, Memory, processors, workspace, and storage APIs.

## Data and State

- Plugin configuration and domain records use tenant-scoped Mongoose models from `src/modules/*/db`.
- Native chat threads, messages, resources, working memory, skills, and observability records live in the configured Mastra memory database.
- Per-turn execution state uses `AsyncLocalStorage`; exact-call caches, repetition tracking, call budgets, and state-changing tool queues never cross turn boundaries.

## Local Invariants

- Every interactive operation executes as the selected agent's linked core account while preserving the initiating human separately for ownership and approval.
- Tool permissions remain authoritative; intent scoping never grants a tool and preserves all approved standalone tools when wording is ambiguous.
- At most three lexically relevant exact erxes operations are preloaded; read-only requests exclude mutations and `search_tools` remains the fallback for missed capabilities.
- Direct operation, file, and standalone execution admits at most ten unique calls per turn; matched simple interactive operation reads force a result-aware answer after two unique calls, identical calls share one promise, and state-changing calls execute serially.
- An exact repeated call forces a text-only model step using the tool-result messages already present for that turn.
- Provider completion recovery adds at most one corrective model request.
- Thread titles and activity labels must not trigger auxiliary model requests.
- Plugin source must not import another plugin or require private changes to core/shared code.

## Validation

- `pnpm nx build erxes-agent_api`
- `pnpm nx test erxes-agent_api`
- Smoke: run plain-text, calculator, operation-count, operation-list, and ambiguous document requests; confirm plain text completes without tools, tool-backed replies contain the observed result, matched simple operation reads execute at most two unique calls, ambiguous wording retains approved capabilities, and no mutation is offered for read-only intent.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-06` — Reduce agent turn latency

- **Summary:** Removed auxiliary title/activity model calls and obsolete summarizer settings, bounded provider retries and tool execution, deduplicated exact calls, serialized state-changing tools, forced result-aware completion after repetitive or overlong matched read flows, excluded mutations from read-only preloads, and made prompt/tool scoping conservative when intent is ambiguous.
- **Affected areas:** `src/mastra`, agent/session persistence, settings GraphQL/schema, streamed and blocking chat execution.
- **Contracts changed:** Removed `summarizerProvider` and `summarizerModel` from `MastraSettings`/`MastraSettingsInput`; internal turn execution now carries `activeTools`, `turnInstructions`, `intentOperationTools`, and an optional two-call interactive read budget; SSE shapes are unchanged.
