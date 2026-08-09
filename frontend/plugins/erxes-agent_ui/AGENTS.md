# `erxes-agent_ui` Plugin Guide

## Identity

- **Plugin:** `erxes-agent`
- **Project:** `erxes-agent_ui`
- **Layer:** Frontend UI
- **Path:** `frontend/plugins/erxes-agent_ui`
- **Last synchronized:** `2026-08-07`

## Scope

### Owns

- Agent, chat, provider, and agent-runtime settings UI.
- Agent navigation, settings navigation, Module Federation exposes, and chat SSE rendering.

### Does not own

- Agent execution, provider credentials, chat persistence, or erxes business data; those remain backend contracts.
- Core navigation, authentication, shared UI primitives, or another plugin's routes and state.

## Current Capabilities

- Lists, creates, edits, and chats with permission-scoped AI team members from the main `/erxes-agent/agents` area.
- Supports private, people-shared, and organization visibility, permission groups, additional-tool allowlists, provider/model settings, and active state.
- Manages providers and tenant runtime settings; Settings opens Providers by default.
- Streams native agent chat parts, tool activity, attachments, artifacts, and session updates.

## Architecture

| Area       | Path                                                          | Responsibility                                                                       |
| ---------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Federation | `frontend/plugins/erxes-agent_ui/module-federation.config.ts` | Exposes config, main/settings routes, and widgets.                                   |
| Routes     | `frontend/plugins/erxes-agent_ui/src/modules`                 | Lazy-loaded main and settings route trees with permission gates.                     |
| Chat       | `frontend/plugins/erxes-agent_ui/src/modules/chat`            | Session list, SSE assistant rendering, tool status, composer, artifacts, and errors. |
| Settings   | `frontend/plugins/erxes-agent_ui/src/pages/settings`          | Provider and tenant runtime settings forms, validation, and mutation feedback.       |
| GraphQL    | `frontend/plugins/erxes-agent_ui/src/graphql`                 | Plugin-prefixed queries, mutations, and subscriptions consumed by the UI.            |

## Contracts

### Provides

- Module Federation exposes `./config`, `./erxes_agent`, `./erxes_agentSettings`, and `./widgets`.
- Routes under `/erxes-agent/*` and `/settings/erxes-agent/*`; agent administration exists only under `/erxes-agent/agents`.
- Navigation for chat, agents, providers, and general runtime settings.

### Consumes

- The `erxes-agent_api` GraphQL schema, chat SSE endpoint, and plugin file/artifact routes.
- Public `erxes-ui` and `ui-modules` components, Apollo Client, React Router, and React Hook Form with Zod.

## Data and State

- Apollo Client owns server state; settings mutations refetch `MASTRA_SETTINGS` immediately after save.
- Chat session and stream state remain inside `src/modules/chat`; component-local interactions use React state.
- Settings forms use React Hook Form values validated by Zod schemas in `src/pages/settings/validations.ts`.

## Local Invariants

- GraphQL operation names remain prefixed with `Mastra` and unique repository-wide.
- Every mutation provides error feedback and updates or refetches the affected Apollo data.
- Routes and federation exposes stay lazy-loaded and aligned with `src/config.tsx`.
- UI primitives come from `erxes-ui`; plugin code never imports another plugin.
- Runtime settings expose only behavior the backend currently executes.

## Validation

- `pnpm nx build erxes-agent_ui`
- Smoke: open `/settings/erxes-agent/general`, save runtime settings, and confirm the refetched values render without a manual refresh.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-07` — Enforce agent rail access

- **Summary:** Hides agent settings links without edit access and refreshes the access-filtered chat agent list after saves.
- **Affected areas:** Agent rail permissions, save mutation cache handling, and stale cache tests.
- **Contracts changed:** None

### `2026-08-07` — Simplify agent setup and navigation

- **Summary:** Kept one full agent admin under `/erxes-agent/agents`, reduced setup to people-only sharing and core runtime controls, and changed chat edit to navigate to the full config route.
- **Affected areas:** Agent form/types/GraphQL/cache, chat rail, route trees, Settings navigation, locales, and stale tests.
- **Contracts changed:** Removed agent team/department audiences, per-agent memory/temperature/destructive fields, Settings agent routes, and the in-chat editor.

### `2026-08-06` — Remove end-user trace UI

- **Summary:** Removed reasoning and tool trace views, debug controls, trace-only state, and parsers while keeping assistant replies, tool status, approvals, artifacts, and errors.
- **Affected areas:** Chat components, stream hydration, artifact and tool readers, agent forms, GraphQL documents, styles, and types.
- **Contracts changed:** Removed `debug` from agent reads and writes and removed trace-only stream data parts.

### `2026-08-06` — Remove custom skills CMS UI

- **Summary:** Removed skill admin routes, screens, GraphQL documents, permissions, agent assignment, chat distillation, and slash activation UI.
- **Affected areas:** Main and settings navigation, routes, agent detail, chat composer and transport, GraphQL selections, and types.
- **Contracts changed:** Removed use of all `mastraSkill*` operations, agent `skills` fields, and skill activation request metadata.

### `2026-08-06` — Remove background execution UI

- **Summary:** Removed background execution controls, schedule contracts, and the automations widget.
- **Affected areas:** GraphQL documents, permissions, navigation metadata, and Module Federation exposes.
- **Contracts changed:** Removed background execution and schedule controls and the `./automationsWidget` expose.

### `2026-08-06` — Remove custom agent workflow UI

- **Summary:** Removed workflow pages, graph, chat mode, automation widget, routes, navigation, API documents, permissions, exports, and tests.
- **Affected areas:** Main and agent routes, chat UI, navigation, config, GraphQL documents, Module Federation, permissions, and automation widgets.
- **Contracts changed:** Removed custom workflow routes, navigation modules, GraphQL operations, permission keys, and the `./automationsWidget` expose.

### `2026-08-06` — Remove retired chat knowledge UI

- **Summary:** Removed pages, routes, agent tabs, settings controls, GraphQL documents, permissions, message ratings, and related trace labels.
- **Affected areas:** Main and agent routes, chat UI/store, general settings, GraphQL documents, permissions, and types.
- **Contracts changed:** Removed the retired knowledge and message-rating operations and settings fields.

### `2026-08-06` — Remove retired response analysis settings

- **Summary:** Removed response analysis controls, settings fields, GraphQL selections, validation, locale use, and metadata types.
- **Affected areas:** General settings, settings GraphQL documents and types, and chat message metadata.
- **Contracts changed:** Removed the retired analysis fields from settings reads, saves, and chat metadata.

### `2026-08-06` — Remove obsolete summarizer settings

- **Summary:** Removed unused provider/model controls after chat labels became deterministic, and made router singleton sharing independent of Nx's version-qualified pnpm graph nodes.
- **Affected areas:** General settings form/validation/types, settings GraphQL documents, and Module Federation sharing.
- **Contracts changed:** Removed `summarizerProvider` and `summarizerModel` from the settings UI contract.
