# `erxes-agent_ui` Plugin Guide

## Identity

- **Plugin:** `erxes-agent`
- **Project:** `erxes-agent_ui`
- **Layer:** Frontend UI
- **Path:** `frontend/plugins/erxes-agent_ui`
- **Last synchronized:** `2026-08-13`

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
- Renders the chat conversation on assistant-ui primitives (`ThreadPrimitive`, `MessagePrimitive`, `ComposerPrimitive`, streaming markdown) over the AI SDK chat runtime; tool calls display as inline per-call status lines with dedicated readable renderers for web-search and fetch-url results.
- Hosts the nested module navigation in the main sidebar: a "Chat" group whose agent rows lazy-expand to their sessions, plus the flat "Agents" manage link.

## Architecture

| Area       | Path                                                          | Responsibility                                                                       |
| ---------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Federation | `frontend/plugins/erxes-agent_ui/module-federation.config.ts` | Exposes config, main/settings routes, and widgets.                                   |
| Routes     | `frontend/plugins/erxes-agent_ui/src/modules`                 | Lazy-loaded main and settings route trees with permission gates.                     |
| Chat       | `frontend/plugins/erxes-agent_ui/src/modules/chat`            | Page shell, session bootstrap, SSE stream state, artifacts, approvals, and preview.  |
| Assistant  | `frontend/plugins/erxes-agent_ui/src/modules/chat/assistant`  | assistant-ui thread, message rows, composer, and per-message extras mapping.         |
| Navigation | `frontend/plugins/erxes-agent_ui/src/modules/navigation`      | Nested main-sidebar tree (agents → lazy sessions) and settings navigation.           |
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
- Live chat turns are owned by AI SDK `Chat` instances (one per agent+thread) behind a small zustand registry; the stock `DefaultChatTransport` speaks to the SSE endpoint, whose `finish` chunk metadata supplies the native message id. Session/activity signals mirror into the registry only for background-thread badges.
- The conversation view runs on `@assistant-ui/react` primitives via `useAISDKRuntime(chatHelpers)`; sends go through the store's pipeline (staged attachment uploads and per-send body extras), not the runtime composer send.
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

### `2026-08-13` — Sidebar session rows redesigned

- **Summary:** Rebuilt the sidebar conversation rows on `Sidebar.SubItem` + `Sidebar.SubButton` with a left tree-guide border; the delete control is now a hover/focus-revealed icon button absolutely centered (`top-1/2 -translate-y-1/2`) over a solid `bg-sidebar` chip, replacing the misaligned `NavigationMenuLinkItem` + `Sidebar.MenuAction` pairing, and the agent row gained consistent action spacing.
- **Affected areas:** `src/modules/navigation/AgentChatNavTree.tsx`.
- **Contracts changed:** None

### `2026-08-13` — Readable fetchUrl tool results

- **Summary:** Added a dedicated `fetchUrl` tool renderer that shows the fetched page as a readable card (favicon, linked title, site name, plain-text content behind a "Read more" toggle) instead of dumping the raw JSON payload; unexpected result shapes still fall back to the capped JSON block.
- **Affected areas:** `src/modules/chat/assistant/FetchUrlTool.tsx` (new), `src/modules/chat/assistant/AgentMessage.tsx`.
- **Contracts changed:** None

### `2026-08-13` — Sidebar session rows use sidebar primitives

- **Summary:** Fixed the session delete button floating below its row by switching it to `Sidebar.MenuAction` (absolute, vertically centered, hover-revealed); sessions now indent under their agent via `Sidebar.Sub`, the agent row uses `Sidebar.MenuButton` for consistent hover/active states, and the new-conversation control is a real icon button.
- **Affected areas:** `src/modules/navigation/AgentChatNavTree.tsx`.
- **Contracts changed:** None

### `2026-08-13` — assistant-ui chat surface and nested sidebar navigation

- **Summary:** Rebuilt the conversation view on assistant-ui primitives (thread, message rows with streaming markdown and inline per-call tool status, composer) over the AI SDK chat runtime, replacing the custom message list/bubble/composer/waiting components and the summarized activity line; moved the agent/session browser into the main sidebar as a nested "Chat" tree with lazy session loading, deleting the in-page side panel.
- **Affected areas:** `src/modules/chat/assistant` (new), `src/modules/chat/ChatPage.tsx`, `src/modules/navigation/AgentChatNavTree.tsx` (new), `src/config.tsx`, `src/modules/chat/hooks/useChatView.ts`; removed `MessageList`, `MessageBubble`, `Composer`, `WaitingIndicator`, `ChatMarkdown`, `ChatSidePanel`, `AgentRail`, `SessionList`, `MastraNavigation` and related hooks.
- **Contracts changed:** None

### `2026-08-13` — Stock AI SDK chat transport

- **Summary:** Dropped the custom settling transport, settled flags, idle handoff, and message-id reconcile parts now that the backend closes the stream at `finish` with the native id in `messageMetadata`; the chat runs on the stock `DefaultChatTransport` and status lifecycle.
- **Affected areas:** `src/modules/chat/lib/chatTransport.ts`, `src/modules/chat/store/chatStore.ts`, `src/modules/chat/hooks/useChatView.ts`, `src/modules/chat/types.ts`.
- **Contracts changed:** Consumes `finish` `messageMetadata.messageId` instead of the removed transient `data-message-id` part.

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

