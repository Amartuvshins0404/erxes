# `erxes-agent_ui` Plugin Guide

## Identity

- **Plugin:** `erxes-agent`
- **Project:** `erxes-agent_ui`
- **Layer:** Frontend UI
- **Path:** `frontend/plugins/erxes-agent_ui`
- **Last synchronized:** `2026-08-21`

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
- Admin-gated Plugin tools page (`/settings/erxes-agent/plugin-tools`) toggles per-plugin agent capability access (default off, `No endpoint` when unsupported) and per-tool disable switches; non-agent-callable tools show a muted badge instead of a switch.
- Streams native agent chat parts, tool activity, attachments, artifacts, and session updates.
- Renders the chat conversation on assistant-ui primitives (`ThreadPrimitive`, `MessagePrimitive`, `ComposerPrimitive`, streaming markdown) over the AI SDK chat runtime; a turn's reasoning bursts and tool calls group into ONE ChatGPT-style process line — while working it shows the current step's real, content-derived title (a reasoning step's title is distilled from its own text, a tool step shows its per-tool label), settled it shows the existing summary — and clicking it opens the right preview panel with the whole process as titled steps (status icon + bold title + content: full reasoning text for reasoning steps, params/result/sources per tool call, separators between steps) — the panel binds to the turn's message id and live-updates as the turn streams, no re-click needed. Reasoning never renders as rows in the message body and nothing expands inline. Tool args/results render structured (key-value rows, capped mini tables, web-search sources list) — never raw JSON.
- Shows "thinking"/activity with `thinking-orbs` (`ThinkingOrb`): a size-64 orb while the turn spins up, size-20 per-step-state orbs (`searching`, `connecting`, `solving`, `composing`, `shaping`, `listening`) on the running process line and the panel's active step.
- Renders the agent's `ask_user` clarifying questions as an interactive card (numbered options, free-text "Something else", Skip) docked after the message parts; answers replay as hidden user messages quoting the question.
- The preview panel (file list, single artifact, tool-activity view) docks beside the chat in the second pane of an erxes-ui `Resizable` split (`autoSaveId`-persisted, min 20%) and can go fullscreen as a fixed overlay; tool-activity fullscreen skips the file-list sidebar.
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

- The `erxes-agent_api` GraphQL schema, chat SSE endpoint, plugin file/artifact routes, and the plugin-tools curation REST endpoints (`GET/POST /pl:erxes-agent/plugin-tools(/:curation)`).
- Public `erxes-ui` and `ui-modules` components, Apollo Client, React Router, and React Hook Form with Zod.

## Data and State

- Apollo Client owns server state; settings mutations refetch `MASTRA_SETTINGS` immediately after save.
- Live chat turns are owned by AI SDK `Chat` instances (one per agent+thread) behind a small zustand registry; the stock `DefaultChatTransport` speaks to the SSE endpoint, whose `finish` chunk metadata supplies the native message id. Session/activity signals mirror into the registry only for background-thread badges.
- Conversation selection is owned by an assistant-ui `unstable_useRemoteThreadListRuntime` per agent: a plugin adapter (`chat/runtime/mastraThreadListAdapter.ts`) maps the mastra session queries/mutations onto the remote-thread-list contract (thread ids are client-generated; `initialize` is an id passthrough, archiving is unsupported). `ChatRuntimeSync` keeps `?thread=`, the runtime main thread, and the store's per-agent active selection in two-way sync.
- The conversation view runs on `@assistant-ui/react` primitives via per-thread `useAISDKRuntime(chatHelpers)` instances (one hook instance per alive thread, mounted by the remote list runtime); sends go through the store's pipeline (staged attachment uploads and per-send body extras), not the runtime composer send.
- `ask_user` answers replay through `chatStore.sendMessage` as hidden user messages (`formatAskUserAnswer`/`formatAskUserSkip` in `chat/types.ts` — the quote anchors backend keyword tool-scoping); `AskUserCard` parses the convention back for the answered receipt, and `UserMessageRow` hides convention-matching messages via `parseAskUserAnswer` (the `hidden` metadata is in-memory only), so neither the bubble nor the receipt breaks after reloads.
- The activity preview view is bound to a turn's message id (`previewStore.activity.messageId`): the bound message's `ToolGroupBlock` re-renders on every streamed part and pushes fresh steps through `previewStore.syncActivity` (no-op unless the panel is open on that message; serialized compare skips unchanged payloads), so the open panel tracks the turn in real time.
- Settings forms use React Hook Form values validated by Zod schemas in `src/pages/settings/validations.ts`.

## Local Invariants

- GraphQL operation names remain prefixed with `Mastra` and unique repository-wide.
- Every mutation provides error feedback and updates or refetches the affected Apollo data.
- Routes and federation exposes stay lazy-loaded and aligned with `src/config.tsx`.
- Thread ids are generated by the assistant-ui remote list runtime (`__LOCALID_*` for drafts) and passed through to the backend unchanged; never remap them in the adapter.
- Session delete must `item.detach()` first, wait a macrotask for the provider unmount to commit, then `item.delete()` — assistant-ui 0.11's remote-list `delete()` removes the thread from the list lookup but never stops its mounted per-thread provider, so deleting without detaching throws `tapLookupResources: Resource not found` and trips the plugin error boundary.
- UI primitives come from `erxes-ui`; plugin code never imports another plugin.
- Runtime settings expose only behavior the backend currently executes.
- The host global CSS is built without this plugin's source, so plugin-unique Tailwind utilities (arbitrary values, `/<pct>` opacity modifiers, named group/data variants) never reach production. Any style not guaranteed by the host must be an `ea-*` class in `src/modules/chat/chat.css` (import it directly in pages outside the chat chunk graph).

## Validation

- `pnpm nx build erxes-agent_ui`
- Smoke: open `/settings/erxes-agent/general`, save runtime settings, and confirm the refetched values render without a manual refresh.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-21` — Session delete no longer crashes the runtime

- **Summary:** Deleting a conversation threw `tapLookupResources: Resource not found` and tripped the plugin error boundary: assistant-ui 0.11's remote-list `delete()` removes the thread from the list lookup but never stops its mounted per-thread provider (only `detach()` calls `stopThreadRuntime`), so the dead thread's provider kept reading its list-item snapshot. `confirmDelete` now detaches first (also re-homes main onto a fresh draft), waits a macrotask for the unmount to commit, then deletes; the re-home-to-most-recent step is unchanged.
- **Affected areas:** `src/modules/chat/sidebar/AgentChatSidebar.tsx` (`confirmDelete`).
- **Contracts changed:** None

### `2026-08-21` — Real-time activity panel

- **Summary:** The tool-activity panel no longer renders a click-time snapshot: `openActivity` binds the view to the turn's message id, and the bound message's `ToolGroupBlock` pushes every streamed step change into the store via the new `syncActivity` action (binding check + serialized-compare guard), so the open panel live-updates as reasoning bursts, tool calls, and results arrive — no close/re-click to refresh.
- **Affected areas:** `src/modules/chat/preview/previewStore.ts` (`activity.messageId` binding, `syncActivity`), `src/modules/chat/assistant/ToolGroupBlock.tsx` (message-id binding, sync effect, shared `panelTitle`), `src/modules/chat/preview/ToolActivityPanel.tsx` (stale snapshot comments removed).
- **Contracts changed:** None

### `2026-08-15` — Plugin tools settings page (REST transport)

- **Summary:** Added an admin-gated Plugin tools settings page (`/settings/erxes-agent/plugin-tools`) listing one collapsible card per plugin — header enable switch, `No endpoint` and `N unavailable` badges, module-grouped tool rows with kind/mutation/destructive badges, dimmed permission actions, and per-tool disable switches (non-agent-callable tools render a muted badge instead); every toggle saves the full `{plugin, enabled, disabledTools}` and refetches. The page uses a fetch-based `usePluginTools` hook against the plugin's REST endpoints instead of GraphQL.
- **Affected areas:** `src/pages/settings/PluginToolsPage.tsx` (new), `src/pages/settings/hooks/usePluginTools.ts` (new fetch hook), `src/modules/MastraSettings.tsx` (route), `src/modules/MastraSettingsNavigation.tsx` (nav item).
- **Contracts changed:** Consumes the backend REST endpoints `GET /pl:erxes-agent/plugin-tools` (full per-plugin inventory incl. `disabledTools` and `agentUsable=false` entries) and `POST /pl:erxes-agent/plugin-tools/curation` (upsert `{plugin, enabled, disabledTools}`); no GraphQL surface for curation.

### `2026-08-15` — Debug mode removed; process line always opens the panel

- **Summary:** Deleted the Debug mode setting entirely (settings switch, `chatDebugModeAtom`/`useChatDebugMode`, the `debugMode.ts` module, and its EN/MN locale strings) — the single process line now always opens the right activity panel on click, and the debug-only inline stepper in the message body is gone, so there is exactly one activity UX with no `debugMode` branches.
- **Affected areas:** `src/modules/chat/assistant/ToolGroupBlock.tsx` (panel-open button only; `StepRow`/Collapsible path removed), `src/modules/chat/debugMode.ts` (deleted), `src/pages/settings/GeneralSettingsPage.tsx` (debug card removed), `backend/plugins/erxes-agent_api/src/locales/{en,mn}/erxes-agent.json` (debug strings removed).
- **Contracts changed:** None

### `2026-08-15` — Hidden ask_user replays and collapsible panel tool calls

- **Summary:** Replayed ask_user answers never render as user bubbles anymore — `UserMessageRow` now hides any message matching the `formatAskUserAnswer`/`formatAskUserSkip` convention via `parseAskUserAnswer` (the `hidden` flag is in-memory only, so metadata-based hiding broke after reload); and in the activity panel, tool-call steps are individually collapsible (default collapsed, title row is the trigger with a rotating chevron) while thought/phase steps keep their always-visible title + text.
- **Affected areas:** `src/modules/chat/assistant/AgentMessage.tsx` (convention-based hide), `src/modules/chat/preview/ToolActivityPanel.tsx` (`ToolStepSection` with erxes-ui `Collapsible`; `StepTitle`/`StepContent` extracted).
- **Contracts changed:** None

### `2026-08-15` — Composer height fix on preview panel toggle

- **Summary:** The composer no longer balloons to its 160px cap when the preview panel opens/closes: react-textarea-autosize measured the empty input's placeholder at the split's mid-transition width and kept the bloated inline height until the next keystroke (the panel group's settled-layout re-render bails out on the composer subtree), so the input now passes `maxRows={8}` and ChatPage dispatches a window `resize` two frames after `previewStore.open` changes to force a settled-width re-measure.
- **Affected areas:** `src/modules/chat/assistant/AgentComposer.tsx` (`maxRows`), `src/modules/chat/ChatPage.tsx` (settled re-measure effect), `src/modules/chat/chat.css` (`.ea-composer-input` comment corrected; the rule stays the visual clamp).
- **Contracts changed:** None

### `2026-08-15` — Single process line; titled activity steps in panel

- **Summary:** A turn now shows exactly one process line — while working, the current step's content-derived title (reasoning steps distilled from their own text, tool steps their per-tool labels); settled, the existing summary — and clicking it opens the right preview panel rendering the whole process as titled steps (full reasoning text, per-call params/results/sources, separators between steps); reasoning never renders as message rows and inline expansion is debug-mode-only.
- **Affected areas:** `src/modules/chat/assistant/turnSteps.ts` (ordered `TurnActivityItem` input with reasoning steps), `src/modules/chat/assistant/ToolGroupBlock.tsx` (line click opens the panel; debug mode keeps the inline stepper), `src/modules/chat/assistant/AgentMessage.tsx` (reasoning + tool parts merge into the single activity group; per-tool renderers removed), `src/modules/chat/preview/previewStore.ts` (`openActivity` takes `{steps, title?}`, new `PanelStep`), `src/modules/chat/preview/ToolActivityPanel.tsx` (step-centric sections), `src/modules/chat/assistant/toolValue.tsx` (gained `humanizeToolName`), `src/modules/chat/assistant/WebSearchTool.tsx` (trimmed to the sources exports), `src/modules/chat/assistant/QuietTools.tsx` (import update only); deleted `ReasoningBlock.tsx`, `FetchUrlTool.tsx`, `ToolFallback.tsx`.
- **Contracts changed:** None

### `2026-08-15` — Activity stepper and scoped tool-activity panel

- **Summary:** The turn's single tool-activity line now expands inline into a process-step list (analyze → one step per tool call → compose) with descriptive labels and pending/active/done states, and each step opens the right preview panel scoped to that step (step label as title, note atop the body, separators between calls and between args/result sections).
- **Affected areas:** `src/modules/chat/assistant/turnSteps.ts` (new step model), `src/modules/chat/assistant/ToolGroupBlock.tsx` (collapsible stepper replaces open-panel-on-click; `children` prop removed), `src/modules/chat/assistant/AgentMessage.tsx` (call site), `src/modules/chat/preview/previewStore.ts` (`openActivity` takes `{toolCalls, title?, note?}`), `src/modules/chat/preview/ToolActivityPanel.tsx` (scoped title/note, separators).
- **Contracts changed:** None

### `2026-08-15` — Tool activity line opens detail panel; resizable panel shell

- **Summary:** Clicking a turn's single tool-activity line now opens the right preview panel with every call's full args/results (webSearch renders its sources list; all-webSearch turns read as "Sources · N") instead of expanding inline — inline expansion is debug-mode-only; the docked chat↔preview layout moved off the custom CSS-variable resizer onto the erxes-ui `Resizable` split (`defaultSize` 30, `minSize` 20, persisted via `autoSaveId`).
- **Affected areas:** `src/modules/chat/preview/previewStore.ts` (`activity` view + `PanelToolCall`), `src/modules/chat/preview/ToolActivityPanel.tsx` (new), `src/modules/chat/preview/PreviewPanel.tsx`, `src/modules/chat/assistant/ToolGroupBlock.tsx`, `src/modules/chat/assistant/WebSearchTool.tsx` (exported `SourcesList`), `src/modules/chat/ChatPage.tsx`, `src/modules/chat/chat.css` (removed `.ea-preview-dock`); deleted `src/modules/chat/components/PreviewResizer.tsx`.
- **Contracts changed:** None

### `2026-08-15` — Tool activity redesign, thinking orbs, and ask_user cards

- **Summary:** Rebuilt the tool-call surface on the official assistant-ui tool-fallback architecture (scroll-locked collapsibles, shimmer-while-running, per-call elapsed time) with structured args/results — key-value rows, capped mini tables for record lists, and notes for the empty/error envelopes — replacing every raw JSON dump; webSearch/fetchUrl render ChatGPT-style "Searching <query>" status lines and favicon source lists; `thinking-orbs` drives the turn-level Thinking orb and per-tool running states; the agent's `ask_user` questions render as an interactive option card (single/multi select, free-text, Skip) whose answer replays as a hidden user message; plumbing tools (calculator, approvals, tool search, artifact generators) are quiet one-liners.
- **Affected areas:** `src/modules/chat/assistant/` (rewritten `ToolFallback`/`WebSearchTool`/`FetchUrlTool`/`ToolGroupBlock`; new `toolValue.tsx`, `QuietTools.tsx`, `AskUserTool.tsx`), `AgentThread.tsx` (orb ThinkingRow), `chat/types.ts` (ask_user contract), `chatContexts.ts`, `ChatPage.tsx` (answer/skip handlers), `chat.css` (`ea-kv`, `ea-tool-table`, `ea-clamp-2`, `ea-ask-*`; removed `ea-typing-dot`), root `package.json` (+`thinking-orbs`).
- **Contracts changed:** Consumes the backend's new `ask_user` tool (args `{question, options, selectionMode}`, result `{awaitingUserAnswer: true, …}`); GraphQL contracts unchanged.


