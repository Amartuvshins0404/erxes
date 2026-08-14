# `erxes-agent_ui` Plugin Guide

## Identity

- **Plugin:** `erxes-agent`
- **Project:** `erxes-agent_ui`
- **Layer:** Frontend UI
- **Path:** `frontend/plugins/erxes-agent_ui`
- **Last synchronized:** `2026-08-14`

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
- General settings include a Sandbox mode select (`onserver` built-in vs `isolated` OpenSandbox); OpenSandbox URL/API-key fields render only in isolated mode.
- Streams native agent chat parts, tool activity, attachments, artifacts, and session updates.
- Renders the chat conversation on assistant-ui primitives (`ThreadPrimitive`, `MessagePrimitive`, `ComposerPrimitive`, streaming markdown) over the AI SDK chat runtime; tool calls display as inline per-call status lines with dedicated readable renderers for web-search and fetch-url results.
- Hosts a custom chat workspace sidebar: agents up top and the active agent's conversations below as an assistant-ui thread list (`ThreadListPrimitive` / `ThreadListItemPrimitive`) driven by a remote-thread-list runtime over the mastra session GraphQL contract, plus a permission-gated "Manage agents" footer link.
- The plugin registers no core sub-module panel (`navigationGroup` carries only the rail label/icon), so entering the plugin shows only the plugin's own sidebar.

## Architecture

| Area       | Path                                                          | Responsibility                                                                       |
| ---------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Federation | `frontend/plugins/erxes-agent_ui/module-federation.config.ts` | Exposes config, main/settings routes, and widgets.                                   |
| Routes     | `frontend/plugins/erxes-agent_ui/src/modules`                 | Lazy-loaded main and settings route trees with permission gates.                     |
| Chat       | `frontend/plugins/erxes-agent_ui/src/modules/chat`            | Page shell, SSE stream state, artifacts, approvals, and preview.                     |
| Runtime    | `frontend/plugins/erxes-agent_ui/src/modules/chat/runtime`    | Remote-thread-list runtime: mastra GraphQL adapter, per-thread runtime hook, URL/store sync. |
| Sidebar    | `frontend/plugins/erxes-agent_ui/src/modules/chat/sidebar`    | Chat workspace sidebar (agents + assistant-ui conversation thread list).             |
| Assistant  | `frontend/plugins/erxes-agent_ui/src/modules/chat/assistant`  | assistant-ui thread, message rows, composer, and per-message extras mapping.         |
| Navigation | `frontend/plugins/erxes-agent_ui/src/modules/navigation`      | Agent favorites and settings navigation (no core sub-module panel).        |
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
- Conversation selection is owned by an assistant-ui `unstable_useRemoteThreadListRuntime` per agent: a plugin adapter (`chat/runtime/mastraThreadListAdapter.ts`) maps the mastra session queries/mutations onto the remote-thread-list contract (thread ids are client-generated; `initialize` is an id passthrough, archiving is unsupported). `ChatRuntimeSync` keeps `?thread=`, the runtime main thread, and the store's per-agent active selection in two-way sync.
- The conversation view runs on `@assistant-ui/react` primitives via per-thread `useAISDKRuntime(chatHelpers)` instances (one hook instance per alive thread, mounted by the remote list runtime); sends go through the store's pipeline (staged attachment uploads and per-send body extras), not the runtime composer send.
- Settings forms use React Hook Form values validated by Zod schemas in `src/pages/settings/validations.ts`.

## Local Invariants

- GraphQL operation names remain prefixed with `Mastra` and unique repository-wide.
- Every mutation provides error feedback and updates or refetches the affected Apollo data.
- Routes and federation exposes stay lazy-loaded and aligned with `src/config.tsx`.
- Thread ids are generated by the assistant-ui remote list runtime (`__LOCALID_*` for drafts) and passed through to the backend unchanged; never remap them in the adapter.
- UI primitives come from `erxes-ui`; plugin code never imports another plugin.
- Runtime settings expose only behavior the backend currently executes.
- The host global CSS is built without this plugin's source, so plugin-unique Tailwind utilities (arbitrary values, `/<pct>` opacity modifiers, named group/data variants) never reach production. Any style not guaranteed by the host must be an `ea-*` class in `src/modules/chat/chat.css` (import it directly in pages outside the chat chunk graph).

## Validation

- `pnpm nx build erxes-agent_ui`
- Smoke: open `/settings/erxes-agent/general`, save runtime settings, and confirm the refetched values render without a manual refresh.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-14` — Sandbox mode selector in general settings

- **Summary:** General settings now offer a Sandbox mode select (`onserver` built-in restricted realm, default, vs `isolated` OpenSandbox); the OpenSandbox URL/API-key fields render only in isolated mode, are cleared when switching back to on-server, and the Zod schema strips them on submit so stale values are never sent.
- **Affected areas:** `src/pages/settings/GeneralSettingsPage.tsx`, `src/pages/settings/validations.ts`, `src/pages/settings/types.ts`, `src/graphql/queries.ts`, `src/graphql/mutations.ts`.
- **Contracts changed:** Consumes the new `sandboxMode` field on the `MastraSettings` type and the `MastraSettingsInput` save input.

### `2026-08-13` — Production-safe chat surface styles

- **Summary:** Fixed the prod-test rendering (white user bubble, unstyled send button, invisible hover controls) by moving every plugin-unique Tailwind utility off the chat surface into self-contained `ea-*` classes in `chat.css` — the deployed host CSS is built without scanning this plugin, so arbitrary values, opacity modifiers, and group/data variants were all missing in production.
- **Affected areas:** `src/modules/chat/chat.css`, chat assistant/components/preview/sidebar files, `src/pages/agents/components/AgentFormFields.tsx` (now imports chat.css for `ea-form-grid`).
- **Contracts changed:** None

### `2026-08-13` — Drop the core sub-module panel

- **Summary:** The plugin no longer registers `navigationGroup.content`, so core renders no sub-module sidebar for it; agent/conversation browsing lives entirely in the plugin's own chat sidebar, which gained a permission-gated "Manage agents" footer link.
- **Affected areas:** `src/config.tsx`, `src/modules/chat/sidebar/AgentChatSidebar.tsx`; removed `src/modules/navigation/AgentNavLinks.tsx`.
- **Contracts changed:** None

### `2026-08-13` — Fix session ping-pong in runtime sync

- **Summary:** Selecting two sessions in a row no longer blink-loops between them: the URL→runtime effect now reads the runtime via `getState()` (no reactive dep) and the runtime→URL effect reads the param through a ref, so each direction fires only from its own source.
- **Affected areas:** `src/modules/chat/runtime/ChatRuntimeSync.tsx`.
- **Contracts changed:** None

### `2026-08-13` — Custom chat sidebar on the assistant-ui remote thread list

- **Summary:** Moved session browsing out of the core sidebar into a chat-workspace sidebar built on `ThreadListPrimitive`/`ThreadListItemPrimitive`, backed by a per-agent `unstable_useRemoteThreadListRuntime` whose adapter serves the mastra session GraphQL contract (list/fetch/initialize/rename/delete; title generation reads the backend-persisted title after the first turn). Core navigation is now flat Chat / Agents links; `?thread=` deep-links, browser Back, delete-with-confirm, and re-homing all sync through `ChatRuntimeSync`.
- **Affected areas:** `src/modules/chat/runtime/` (new: adapter, provider, sync), `src/modules/chat/sidebar/AgentChatSidebar.tsx` (new), `src/modules/chat/ChatPage.tsx`, `src/modules/chat/store/chatStore.ts` (`setActiveThread`/`ensureThreadChat`/`hydrateThread` replace `newDraft`/`selectSession`), `src/modules/navigation/AgentNavLinks.tsx` (new), `src/config.tsx`; removed `AgentChatNavTree`, `useSessionBootstrap`, `useMastraThreads`, `useRemoveMastraThread`.
- **Contracts changed:** None

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
