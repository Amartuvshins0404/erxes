# `erxes-agent_ui` Plugin Guide

## Identity

- **Plugin:** `erxes-agent`
- **Project:** `erxes-agent_ui`
- **Layer:** `Frontend UI`
- **Path:** `frontend/plugins/erxes-agent_ui`
- **Last synchronized:** `2026-08-31`


## Scope

### Owns

- The `erxes-agent` Module Federation remote, served on port `3016`.
- The agents chat surface: full-page chat under `src/pages/agents`, the
  destructive-action approval prompt, thread history sidebar (including
  thread deletion), the empty-chat hero with suggestion chips, and the
  global floating widget side panel.
- The plugin settings surface under `/settings/erxes-agent/*`: the
  settings router (`ErxesAgentSettings`), the settings sidebar
  navigation (`ErxesAgentSettingsNavigation`), and the opencode-style
  BYOK form at `src/pages/settings/SettingsConnectionPage.tsx` (select
  provider -> paste API key -> save; several providers can be configured
  side by side, each listed with its own entry and removable individually.
  The chat's model picker lists every configured provider's models (fetched
  server-side by the backend from each provider's /models endpoint) grouped
  by provider, with an implicit Auto (server default) entry, and a
  per-turn thinking-level picker (off/minimal/low/medium/high) sits next to
  it; both selections ride along with every chat turn. The chat surfaces
  never query or manage keys; they only consume the models listing.
- The AI SDK chat transport, stored-history mapping, REST client, and GraphQL
  documents under `src/modules/agents`.
- The animated bot avatar: the MIT-licensed, framework-free bloub engine
  vendored under `src/modules/agents/bloub/` (unchanged upstream code) plus
  the React wrapper `src/modules/agents/components/BloubBot.tsx`.
- Plugin navigation, routing, and the `CONFIG` contract.

### Does not own

- Backend schema, resolvers, routes, or contracts; those live in
  `erxes-agent_api`. The UI only consumes its public REST and GraphQL
  contracts.
- AI agent runtime, tool curation, or approval enforcement. The UI surfaces
  approval decisions; the backend enforces them.
- `core-ui`, `erxes-ui`, `ui-modules`, or another plugin's source.

## Current Capabilities

- Registers with the `core-ui` host through the `CONFIG` named export and
  contributes a navigation group named `Agents` (icon + `defaultPath`
  `erxes-agent`, no panel `content`) and one module named `agents` at path
  `erxes-agent` (the chat page is the plugin root), plus a
  `settingsNavigation` sidebar group ("Agents" / "API key") for the host
  settings area. With no navigationGroup content the host renders no
  secondary plugin panel: the rail click lands on the chat page directly.
- Plugin routes mount the chat page directly at the plugin root
  (`<Route index element={<IndexPage />} />`) with no intermediate route
  segment and no catch-all route, so navigating to other plugins never 404s
  through this remote.
- Full-page agents chat (`/erxes-agent`) with a thread history sidebar,
  streaming transcript with inbox-style auto-scroll, markdown rendering,
  and a composer. The empty state pairs the hero and the composer as one
  centered, scroll-safe block: an animated bot playing the calm
  `CALM_FACE_CYCLE`, "How can I help you today?", "Ask anything about your
  erxes workspace", the composer itself, then four starter chips
  ("Summarize my open deals", "Draft a follow-up email", "Show overdue
  tasks", "Search my contacts") that send through the same
  `sendMessage({ text })` path the composer uses. Once a conversation
  exists the transcript fills the panel with the composer docked below.
  The same layout serves the full page, the floating side panel and mobile.
- Composer: one card holding the plugin-local `ChatInput` (auto-growing
  native textarea — deliberately not `erxes-ui`'s `Textarea`, which forces a
  focus shadow and scrollbar arrows inside the card), the model/thinking
  pickers as pill triggers, and the send/stop control (`IconArrowUp` /
  `IconPlayerStop`). No bot inside the composer.
- Bot avatar (`BloubBot`) used across every agents surface, always rendered
  in the design system primary (`color` defaults to `var(--primary)`, an
  indigo that matches `bg-primary` buttons): the empty-state hero
  (`CALM_FACE_CYCLE`), each assistant
  message's avatar (size 28, contextual — three-dots `thinking` while its
  message streams, `wide` while an ask_user question on it awaits an
  answer, otherwise a random never-repeating shuffle walk through the
  curated `MESSAGE_AVATAR_SHUFFLE_POOL` with each state held its measured
  duration), the streaming "Thinking…"
  indicator and the thread-loading state (`thinking`), the thread list's
  empty state (`sleep`), the approval prompt (`alert`), the ask_user card
  (`wide`), the side-panel
  header (`idle`), and the floating launcher (`LAUNCHER_CYCLE`, `orbit`
  while dragged). The engine's `sample(t)` is a pure function of time; the
  wrapper owns the rAF loop, the montage cursor and the SVG.
- Floating launcher is the bot itself: it plays `LAUNCHER_CYCLE` so it is
  always alive, can be dragged anywhere on screen (pointer capture, clamped
  to the viewport, remembered in `localStorage` under
  `erxes-agent:launcher-position`, re-clamped on resize), switches to the
  `orbit` state while dragging, and opens the side panel on a press that
  never crossed the 4px drag threshold.
- Destructive-action approval prompts rendered inline in the transcript;
  approving or declining records the decision on the tool part and the AI SDK
  auto-resends, which the transport routes to the backend's
  `POST /agents/approve` resume endpoint. All other tool execution states
  are hidden in the transcript (no tool cards).
- ask_user questions rendered inline as an `AskUserPrompt` card (wide-eyed
  bot, question text, choice chips for options, multi-select chip state +
  send counter, and a free-text input revealed by "None of these — type my
  own answer"). The suspension arrives as a `data-tool-call-suspended` data
  part; answering stages the answer and triggers `chat.resumeStream()`,
  whose transport consumer POSTs to the backend's `POST /agents/answer` and
  pipes the resumed stream through the same useChat state machine.
- Loads stored threads and thread messages over GraphQL and maps them to AI
  SDK `UIMessage`s for rendering; the thread list refreshes itself through
  the `agentsThreadsChanged` subscription (debounced refetch).
- Conversation sidebar (`ThreadList`): sessions grouped by activity (Today /
  Yesterday / Previous 7 days / Older, derived client-side from `updatedAt`),
  the active session marked by a primary accent rail + `bg-primary/10` row,
  hover-revealed delete, skeleton rows while the first page loads, and the
  sleeping bot + "Start one" button on the empty state. Rows are text-only —
  no per-row icons (a repeated message icon down a long list reads as
  noise); timestamps use `formatDateISOStringToRelativeDateShort`.
- Thread deletion: each thread row shows a hover-revealed delete button that
  confirms through an `AlertDialog` and runs `AgentsThreadRemove`; deleting
  the active conversation resets the chat to a new conversation on both the
  full page and the floating widget.
- Global floating agents widget mounted on every page via
  `hasFloatingWidget`: a right-edge vertical-center chevron handle
  (fixed `right-0 top-1/2`, hidden while the panel is open) toggles a
  full-height right `Sheet` side panel with the thread sidebar (md and up)
  and the same chat surface.
- BYOK in settings: each user manages their own AI connection on the
  opencode-style form at `/settings/erxes-agent/connection`
  (also reachable via the chat page header "Settings" button). The form is
  provider card grid -> API key -> save, with a step reveal (the key
  section appears only once a provider is chosen or stored), a show/hide
  toggle on the password input, a connected-status row with relative
  `updatedAt`, and an `AlertDialog`-confirmed remove. Omitting `apiKey`
  keeps the stored key only when the provider is unchanged; switching
  providers requires a fresh key. The stored key is never rendered back.
  The model is always visible, never hidden: each configured entry shows
  the stored model in parentheses (`OpenAI (gpt-5.6-luna)`), each provider
  card shows the default model a fresh entry will store, and the chat
  model picker's Auto entry shows the model the server default actually
  runs (`Auto (gpt-5.6-luna)`). The chat surfaces have no key UI at all:
  chatting starts directly, and a missing key surfaces only as the
  backend's 400 error in the chat error banner.
- Two-tier responsive transcript typography (base 15px / md 17px) for
  markdown, user bubbles, composer, and thread titles, with polished
  markdown styling (paragraph spacing, blockquote, hr, list markers and
  spacing, bordered code blocks with mono resets, styled inline code,
  underlined links, bordered tables), a dashed-border reasoning
  collapsible, and `whitespace-pre-wrap break-words` user bubbles that
  keep multi-line paste line breaks.

## Architecture

| Area                | Path                                           | Responsibility                                    |
| ------------------- | ---------------------------------------------- | ------------------------------------------------- |
| Host contract       | `src/config.tsx`                               | Exports `CONFIG` consumed by `core-ui`            |
| Routing             | `src/modules/ErxesAgentMain.tsx`               | Declares the plugin's main routes (chat at index) |
| Settings routing    | `src/modules/ErxesAgentSettings.tsx`           | Declares the plugin's settings routes (`connection`) |
| Settings navigation | `src/modules/ErxesAgentSettingsNavigation.tsx` | Settings sidebar group ("Agents" / "API key")     |
| Chat page           | `src/pages/agents/IndexPage.tsx`               | Full-page chat with thread sidebar                |
| Settings page       | `src/pages/settings/SettingsConnectionPage.tsx`| Opencode-style BYOK form (save/remove connection) |
| Floating widget     | `src/widgets/FloatingWidget.tsx`               | Right-edge chevron handle + full-height `Sheet` side panel |
| Chat hook           | `src/modules/agents/hooks/useAgentsChat.ts`    | `useChat` wrapper: thread tracking, approval resend, ask-user answer resume, history |
| Threads hook        | `src/modules/agents/hooks/useAgentsThreads.ts` | Loads the user's agents threads                   |
| Connection hook     | `src/modules/agents/hooks/useAgentsConnection.ts` | Loads the user's BYOK connection               |
| Provider picker     | `src/modules/agents/components/ProviderPicker.tsx` | Provider whitelist + selectable card grid (settings form) |
| Transport           | `src/modules/agents/transport.ts`              | `DefaultChatTransport` subclass; routes approval resend to `/agents/approve`, ask-user answers through the reconnect consumer to `/agents/answer` |
| History mapping     | `src/modules/agents/mapStoredMessages.ts`      | Stored Mastra messages → AI SDK `UIMessage`s      |
| REST URLs           | `src/modules/agents/api.ts`                    | `/agents/chat`, `/agents/approve`, `/agents/answer` SSE endpoint URLs |
| GraphQL documents   | `src/modules/agents/graphql/connection.ts`     | `AgentsConnection*` BYOK operations               |
| GraphQL documents   | `src/modules/agents/graphql/threads.ts`        | `Agents*` thread list/detail operations and the `AgentsThreadsChanged` subscription |
| Components          | `src/modules/agents/components/*`              | Chat panel (transcript + empty state + composer layouts), message list, parts, approval, tool call helpers, composer, `ChatInput`, markdown, thread list (with delete), provider picker, `BloubBot` avatar wrapper |
| Bot cycles          | `src/modules/agents/botCycles.ts`              | Curated module-level montages (`CALM_FACE_CYCLE`, `LAUNCHER_CYCLE`) with stable references |
| Bot avatar (vendored) | `src/modules/agents/bloub/*`                 | MIT-licensed framework-free bloub engine (upstream, unchanged) + `README.md` credit/license; the pure `engine.sample(t)` the `BloubBot` wrapper renders |
| Types               | `src/modules/agents/types.ts`                  | REST and stored-message shapes                    |
| Federation          | `module-federation.config.ts`                  | Remote name, exposes, and shared library policy   |

## Contracts

### Provides

- Module Federation remote with container name `erxes_agent_ui`
  (underscores — MF container names cannot contain dashes), exposing
  `./config`, `./erxes_agent`, `./erxes_agentSettings`, and
  `./floatingWidget`.
- `CONFIG` with `name: 'erxes_agent'` (the underscored MF remote name the
  host uses to build `${name}_ui` for `loadRemote`),
  `permissionName: 'erxes-agent'` (the dashed backend plugin name used
  for permission checks), `path: 'erxes-agent'`,
  `hasFloatingWidget: true`, `settingsNavigation`, a navigation group
  named `Agents` with `defaultPath: 'erxes-agent'`, and one module named
  `agents` at path `erxes-agent`.

### Consumes

- Backend REST (via `${REACT_APP_API_URL}/pl:erxes-agent`):
  `POST /agents/chat` (SSE), `POST /agents/approve` (SSE),
  `POST /agents/answer` (SSE).
- Backend GraphQL: `AgentsConnections`, `AgentsModels`,
  `AgentsConnectionUpsert`, `AgentsConnectionRemove` (the former singular
  `AgentsConnection`/`AgentsConnectionUpdate` operations are gone),
  `AgentsThreads`, `AgentsThreadDetail`, `AgentsThreadRemove`, and the
  `AgentsThreadsChanged` subscription (refetch signal only).
- `ai` (`DefaultChatTransport`, `UIMessage`, part type guards,
  `lastAssistantMessageIsCompleteWithApprovalResponses`) and
  `@ai-sdk/react` (`useChat`), matched to the backend's AI SDK major.
- `erxes-ui` for `IUIConfig`, navigation items, `Breadcrumb`, `Button`,
  `buttonVariants`, `Sheet`, `AlertDialog`, `Input`, `Label`, `Textarea`,
  `Collapsible`, `Avatar`, `Spinner`, `Badge`, `toast`, and
  `REACT_APP_API_URL`.
- `ui-modules` for `PageHeader`.
- `react-markdown` for assistant text, `@tabler/icons-react` for icons, and
  `react-router` / `react-router-dom` for routing.

## Data and State

- Server state via Apollo Client for the BYOK connection
  (`AgentsConnection` query; `AgentsConnectionUpdate` and
  `AgentsConnectionRemove` with `refetchQueries`) and the thread history
  (`AgentsThreads` query with a subscription-driven debounced refetch;
  `AgentsThreadDetail` lazy query with `network-only` for opening a
  thread; `AgentsThreadRemove` with `refetchQueries`).
- Chat state via the AI SDK's `useChat`; the plugin holds the server thread id
  (learned from the `X-Agents-Thread-Id` response header) in a ref + React
  state.
- No Jotai atoms and no persisted client state.

## Local Invariants

- `core-ui` discovers this remote from the `ENABLED_PLUGINS` environment
  variable and maps each entry to `<name>_ui`, so the enabled entry must be
  `erxes-agent`.
- Module Federation container/remote names cannot contain dashes. Nx
  normalizes the `erxes-agent_ui` project to the container global
  `erxes_agent_ui`, and the host loads exposes via `${CONFIG.name}_ui`,
  so `CONFIG.name` must stay the underscored `erxes_agent` while
  `CONFIG.permissionName` keeps the dashed backend name `erxes-agent` for
  permission checks. The `plugin.name`-derived expose key (`./erxes_agent`)
  must stay underscored to match, and the main module's named export is
  `ErxesAgent` to match the host's PascalCase resolution candidate.
- `src/config.tsx` must keep the `CONFIG` named export.
  `PluginConfigsProvidersEffect` loads `<remote>/config` and reads `CONFIG`;
  renaming it breaks plugin registration.
- Exposed modules use named exports. The host resolves a component by trying
  `default`, the PascalCase module name, and then the first component-shaped
  export. `FloatingWidget` intentionally also provides a default export so the
  floating-widget loader resolves it directly.
- The chat page is the plugin root: the main router must keep the single
  `<Route index element={<IndexPage />} />` with no `Navigate`, no
  intermediate route segment, and no `path="*"` catch-all. The settings
  router keeps its relative index redirect (`<Navigate to="connection"
  replace />`) and likewise no catch-all; the old catch-all redirected every
  unknown path and 404'd users leaving for other plugins. The BYOK form
  lives in the settings surface: the host mounts `./erxes_agentSettings` at
  `/settings/erxes-agent/*`, so the form URL is
  `/settings/erxes-agent/connection` and every in-plugin link to it
  (chat page header "Settings" button) must use that path.
- The chat surfaces must not render any API-key prompt, pointer row, or
  gating button: key management lives exclusively in the settings surface,
  chatting starts directly, and a missing key surfaces only as the
  backend's 400 error in the chat error banner. Do not reintroduce a
  connection-state check in `ChatPanel` — its `useAgentsConnection` query
  is display-only (it feeds the model picker's Auto label) and must never
  disable or block anything.
- The settings expose key must stay `./erxes_agentSettings`
  (underscored `${CONFIG.name}Settings`): the host's
  `getPluginsSettingsRoutes` resolves `${plugin.name}_ui/${plugin.name}Settings`
  for every plugin and mounts it under `/settings/${plugin.path}/*`.
- Starter chips must send through the exact same path as the composer
  (`ChatPanel` calls `sendMessage({ text })` directly for both, mirroring the
  composer's `onSend`); do not introduce a second send path. The empty state
  (hero + composer + chips) lives in `ChatPanel` — `MessageList` is
  transcript-only and has no empty branch.
- The transcript renders only approval prompts for tool parts; do not
  reintroduce tool-execution cards or spinner rows for tool states.
- Transcript auto-scroll must follow the inbox ScrollArea viewport pattern
  (`ScrollArea.Root`/`ScrollArea.Viewport` with a `viewportRef` and
  distance-from-bottom tracking, jumping via `scrollTop = scrollHeight`
  inside `setTimeout(0)`); it pauses while the user is scrolled up
  (near-bottom threshold 120px), re-arms when the transcript empties, and
  always jumps to the bottom once thread history finishes loading.
- The BYOK API keys are write-only in the UI: `agentsConnections` never returns
  it, the settings form renders it only in a password input (with a local
  show/hide toggle), and an empty `apiKey` on upsert must be omitted (not
  sent as an empty string, which clears that provider's stored key).
  Omitting `apiKey` keeps that provider's stored key. Each provider entry
  is independent — adding one never touches another provider's key. The
  stored model is the provider default (the backend refreshes it to the
  current default on every re-save without an explicit model); the chat
  may override it per turn via the model picker, but the settings form
  never asks for a model or base URL. `PROVIDER_OPTIONS.defaultModel` in
  `ProviderPicker.tsx` is display-only copy mirroring the backend's
  `PROVIDER_DEFAULTS` — keep the two in sync when a default changes.
- Model/thinking selection lives in `useAgentsChat` (refs feed the
  transport's `getRequestSelection`) and rides along with EVERY chat body
  and the approve body — the transport must keep sending it on the approval
  resend so the resumed run continues on the same provider/model/thinking.
  The model picker's "Auto" entry uses the `__auto__` sentinel (Radix
  Select items reject empty-string values) and maps back to '' before it
  reaches the hook. Its label shows the actual default model via the
  `autoModel` prop (`ChatPanel` passes the first configured connection's
  stored model — what the server default runs); it falls back to
  "Auto (server default)" only while that value is unknown.
- The `navigationGroup` in `src/config.tsx` must NOT define `content` (or
  `subGroup`): the host renders a secondary plugin panel whenever group
  content exists, and the chat page must fill the width directly with no
  extra sidebar step. The rail click alone navigates straight to the chat
  page via the activity `defaultPath`. (`IUIConfig.navigationGroup.content`
  became optional in `erxes-ui` to enable this.)
- `src/modules/agents/bloub/` is vendored MIT code (see its `README.md`):
  keep it pristine — the only edit was rewriting `gaze.ts`'s three `@/`
  imports to relative `./bot/*`. Do not "clean up" the French comments,
  the non-null assertions (upstream style; they surface as lint warnings,
  not errors), or the measured constants (rounding them breaks the avatar).
  All bot rendering goes through the React wrapper `BloubBot.tsx`; never
  add a second consumer of the engine.
- The chat input is the plugin-local `ChatInput` (`src/modules/agents/components/ChatInput.tsx`),
  a chrome-free auto-growing native textarea — NOT `erxes-ui`'s `Textarea`,
  whose focus shadow and fixed height produced a bright ring inside the
  composer card and scrollbar arrows on a one-line field. Both chat
  inputs (composer and approval decline reason) use it; do not swap them
  back to the shared `Textarea`.
- The empty state is one layout in `ChatPanel`, reused by the full page,
  the floating side panel and mobile. It must stay responsive and
  scroll-safe (`overflow-y-auto` outer + `min-h-full` centered inner) and
  its avatar must play a curated, size-stable montage
  (`CALM_FACE_CYCLE` from `botCycles.ts` — only states that keep the
  `baseBody` circle), never the full 14-state `defaultCycle()`: in a
  narrow panel the montage's "thinking" three-dots state reads as a
  loading spinner and its size-varying states float awkwardly.
- Every `cycle` array passed to `BloubBot` must be a stable module-level
  constant (`botCycles.ts`) — an unstable reference restarts playback on
  each render. Each block duration must stay above the engine's block
  floor (the longest state morph, ~0.6s) or the block is cut mid-morph.
  The same stability rule applies to `shuffle` pools: pass the module-level
  `MESSAGE_AVATAR_SHUFFLE_POOL` (or another stable constant), never an
  inline array. `shuffle` picks each next state randomly among the pool
  minus the state on screen (never an immediate repeat), holding each its
  measured duration from the vendored `makeBlock`, and memory stays O(1).
- The assistant message avatar is contextual, never frozen: the streaming
  tail shows `thinking`, a message with a pending ask_user suspension shows
  `wide`, and every settled message plays the `MESSAGE_AVATAR_SHUFFLE_POOL`
  walk. `frozenAt` remains available but no transcript avatar uses it.
- Ask-user answers must resume through `POST /agents/answer` (threadId-keyed
  resume), never a fresh `sendMessage`: `submitAnswer` stages the answer on
  the transport's `consumePendingAnswer` seam and calls
  `chat.resumeStream()`, whose reconnect consumer turns it into the answer
  POST and returns the resumed stream — reusing the SDK's resume state
  machine instead of hand-rolling stream injection. The staged answer is
  consumed exactly once, and `startNewConversation` clears any stale one.
- All bot avatars render in the design system primary: `BloubBot`'s `color`
  prop defaults to `var(--primary)` and no caller overrides it. Catalog ids
  resolve through the vendored skins map; any other CSS color passes
  through verbatim. Inks are applied via CSS `fill` (style), NOT the SVG
  `fill` attribute — the attribute does not resolve `var(--…))` values.
- The floating launcher is draggable: pointer capture, viewport clamping,
  `orbit` while dragging, and persistence under
  `erxes-agent:launcher-position`. A press that never crossed the 4px
  drag threshold opens the panel — keep the `movedRef` click suppression,
  otherwise every drag also opens the side panel at release.
- Approval resume must go through `POST /agents/approve` (threadId-keyed),
  not the AI SDK's native whole-transcript resend. The transport detects the
  approval decision in the last assistant message and reroutes that one
  request; identity still comes from gateway cookies/headers, never the body.
- The `ai` / `@ai-sdk/react` versions must stay on the same major as the
  backend so the SSE `UIMessage` wire format matches.
- Serve port `3016` must stay unique across `frontend/plugins/*` and
  `frontend/private-plugins/*`.
- Keep `module-federation.config.ts` exposes, `CONFIG` paths, and real routes
  aligned.
- Do not import Radix primitives directly or from another plugin.

## Validation

- `pnpm nx lint erxes-agent_ui` (inferred from `eslint.config.js`)
- `pnpm nx build erxes-agent_ui`
- Type-check (plugin files): `cd frontend/plugins/erxes-agent_ui && npx
  tsc --project tsconfig.app.json --noEmit` (pre-existing `erxes-ui` /
  `ui-modules` library errors are unrelated)
- Smoke scenario: add `erxes-agent` to `ENABLED_PLUGINS`, serve `core-ui`
  and this remote, then confirm the navigation group appears, the chat page
  at `/erxes-agent` fills the width with no secondary plugin panel next to
  it and shows the centered empty state (bot in the design system primary
  blue playing the calm face cycle,
  composer under the heading, starter chips — clicking a chip
  sends it; the composer input shows NO focus ring/outline while typing),
  streaming a reply moves the composer to the docked bottom bar,
  each assistant message shows a small
  frozen bot avatar and the "Thinking…" indicator shows the three-dots bot,
  opening a stored thread shows the thinking bot as its loading state,
  a destructive tool call shows an approval prompt led by the alert bot,
  the thread list's empty state shows the sleeping bot, hovering a thread
  row reveals a working delete confirm,
  `/settings/erxes-agent/connection` (settings sidebar "Agents / API
  key", chat header "Settings") saves and removes the connection — the
  provider cards show each default model in parentheses
  (`OpenAI (gpt-5.6-luna)`), the configured entry shows the stored model
  in parentheses, and the chat model picker's Auto entry shows the actual
  default model — chatting
  with no stored key shows only the backend's "Add your API key" error
  banner with no other key UI,
  and the floating bot launcher: shows the calm face cycle, dragging it
  moves it anywhere (rings spin while dragging) and the spot survives a
  reload, while a simple click opens the full-height side panel with
  threads and chat on any page, whose empty state matches the full page
  without floating or clipping (also on mobile).

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-31` — ask-user card, contextual message avatar with shuffle walk

- **Summary:** Added the ask_user human-in-the-loop surface: the
  `AskUserPrompt` card (wide-eyed bot, question, choice chips, multi-select
  chip state, "type my own answer" free-text) rendered from the
  `data-tool-call-suspended` part, answered through the transport's new
  reconnect-consumer seam (`consumePendingAnswer`) which POSTs to the
  backend's `POST /agents/answer` and feeds the resumed stream through
  `chat.resumeStream()`. The assistant message avatar is now bigger (28px)
  and contextual: `thinking` while its message streams, `wide` while its
  ask_user question awaits an answer, and a random never-repeating
  shuffle walk (`MESSAGE_AVATAR_SHUFFLE_POOL`, measured durations, O(1)
  memory) on settled messages — implemented as the new `shuffle` mode in
  `BloubBot`.
- **Affected areas:**
  `src/modules/agents/components/{AskUserPrompt (new), MessagePart,
  MessageList, BloubBot}.tsx`,
  `src/modules/agents/{transport.ts, api.ts, botCycles.ts}`,
  `src/modules/agents/hooks/useAgentsChat.ts`,
  `src/modules/agents/components/ChatPanel.tsx`.
- **Contracts changed:** Consumes `POST /agents/answer`; the transport
  gained the `consumePendingAnswer` constructor seam and answer-aware
  `reconnectToStream`; `MessageList` gained `answerBusy`/`onAnswer` props.

### `2026-08-30` — Conversation sidebar redesign

- **Summary:** Redesigned `ThreadList` into a session-history layout:
  threads grouped by activity (Today / Yesterday / Previous 7 days / Older),
  the active session marked with a primary accent rail on a tinted row,
  short relative timestamps (`formatDateISOStringToRelativeDateShort`),
  skeleton rows for the first load, a header "New" action, a toast on
  successful deletion, and the sleeping bot plus a "Start one" pill on the
  empty state. Rows are deliberately text-only — per-row message icons were
  tried and removed (a repeated icon down a long list reads as noise).
- **Affected areas:**
  `src/modules/agents/components/ThreadList.tsx`.
- **Contracts changed:** None (same queries/mutations; grouping is
  client-side from `updatedAt`).

### `2026-08-30` — Chat redesign: local input, bot-everywhere, draggable launcher

- **Summary:** Redesigned the chat around the plugin-local `ChatInput`
  (chrome-free auto-growing native textarea replacing `erxes-ui`'s
  `Textarea`, which forced a focus ring and scrollbar arrows inside the
  composer card) and used the bloub bot aggressively across every surface,
  all rendered in the design system primary (`color` defaults to
  `var(--primary)`):
  the empty-state hero plays the new curated `CALM_FACE_CYCLE`
  (size-stable face states from the new `botCycles.ts`),
  the thread-loading state and "Thinking…" indicator use the three-dots
  `thinking` bot, the thread list's empty state sleeps, the approval
  prompt leads with the `alert` bot (decline reason now also uses
  `ChatInput`), and the side-panel header carries a small bot. The
  floating launcher is now the bot itself — always animating
  `LAUNCHER_CYCLE`, draggable anywhere on screen (pointer capture,
  viewport clamping, localStorage persistence), switching to `orbit` with
  spinning rings while dragging, and opening the panel on a non-dragged
  press. Composer card styling: pill pickers, `IconArrowUp` send,
  docked bar with backdrop blur in conversation view, no bot inside the
  composer.
- **Affected areas:** `src/modules/agents/components/{ChatInput (new),
  Composer,ChatPanel,MessageList,ThreadList,ApprovalPrompt,ModelPicker,
  ThinkingPicker}.tsx`, `src/modules/agents/botCycles.ts` (new),
  `src/widgets/FloatingWidget.tsx`.
- **Contracts changed:** None (self-contained UI; no exposes, `CONFIG`,
  routes, or GraphQL operations changed).

### `2026-08-30` — Remove "Agents" label from assistant messages

- **Summary:** Removed the `Agents` text label rendered next to the bot avatar
  above each assistant message in `MessageList` (the small `BloubBot`
  `frozenAt={0}` avatar remains as the sole sender indicator).
- **Affected areas:** `src/modules/agents/components/MessageList.tsx`.
- **Contracts changed:** None.

### `2026-08-30` — Animated bloub bot avatar; calm, responsive empty state

- **Summary:** Vendored the MIT-licensed framework-free bloub bot engine
  under `src/modules/agents/bloub/` (upstream unchanged except `gaze.ts`
  import paths; `README.md` carries the credit + license) and added the
  React wrapper `BloubBot.tsx` (owns the rAF loop, montage cursor and SVG;
  `engine.sample(t)` stays pure). Wired it into the chat: each assistant
  message avatar (frozen idle, size 24), the "Thinking…" indicator (the
  three-dots `thinking` state, size 20), and the empty-state hero. The hero
  first shipped playing the full 14-state montage, which looked weird in the
  narrow side panel — at the "thinking" block it collapsed to three dots
  that read as a loading spinner and floated in an oversized box — so the
  one shared empty state is now a calm idle avatar (size 96) with
  scroll-safe centering, so it holds up identically on the full page, the
  floating side panel and mobile.
- **Affected areas:** `src/modules/agents/bloub/**` (new, vendored),
  `src/modules/agents/components/BloubBot.tsx` (new),
  `src/modules/agents/components/MessageList.tsx`.
- **Contracts changed:** None (self-contained UI; no exposes, `CONFIG`,
  routes, or GraphQL operations changed).

### `2026-08-30` — Model always visible in parentheses

- **Summary:** The stored/default model is no longer hidden anywhere: the
  settings page's configured entries show the stored model in parentheses
  (`OpenAI (gpt-5.6-luna)`), the provider cards show the default model a
  fresh entry will store (new `PROVIDER_OPTIONS.defaultModel` display
  copy mirroring the backend `PROVIDER_DEFAULTS`), and the chat model
  picker's Auto entry shows the model the server default actually runs via
  the new `autoModel` prop (`ChatPanel` re-added a display-only
  `useAgentsConnection` query for it — no gating, no key UI). Together
  with the backend change that refreshes a stale stored model to the
  current provider default on re-save, an OpenAI entry always visibly
  reads `gpt-5.6-luna`.
- **Affected areas:**
  `src/modules/agents/components/{ProviderPicker,ModelPicker,ChatPanel}.tsx`,
  `src/pages/settings/SettingsConnectionPage.tsx`.
- **Contracts changed:** None (all values come from existing
  `AgentsConnections` query fields).

### `2026-08-30` — No secondary nav panel: chat page fills the width

- **Summary:** Removed the plugin's navigation panel content (the
  "API key" settings shortcut module `ErxesAgentNavigation` was deleted and
  `CONFIG.navigationGroup.content` dropped), so the host no longer renders
  the secondary 256px plugin sidebar next to the chat page — the rail click
  lands directly on the full-width chat. Enabled by making
  `IUIConfig.navigationGroup.content` optional in `erxes-ui` (type-only
  change). Settings remains reachable via the chat header "Settings"
  button and the settings sidebar.
- **Affected areas:** `src/config.tsx`, deleted
  `src/modules/ErxesAgentNavigation.tsx`, `frontend/libs/erxes-ui/src/types/UIConfig.ts`.
- **Contracts changed:** `CONFIG.navigationGroup` no longer carries
  `content`; `IUIConfig.navigationGroup.content` is now optional in
  `erxes-ui`.

### `2026-08-30` — Chat is direct: in-chat API key step removed

- **Summary:** Removed the chat panel's "API key required." pointer row
  and its "Add API key" button (the floating widget shared `ChatPanel`, so
  both surfaces lost it); the chat no longer queries the BYOK connection,
  chatting starts directly, and a missing key surfaces only as the
  backend's 400 error in the existing error banner. The pickers lost their
  connection-based disabled state — the model picker still self-disables
  while no provider models exist, and the thinking picker stays enabled.
- **Affected areas:** `src/modules/agents/components/ChatPanel.tsx`.
- **Contracts changed:** None (the chat simply no longer runs the
  `AgentsConnections` query; all backend contracts are unchanged).

### `2026-08-28` — Multi-provider BYOK, chat model + thinking pickers, nav panel slimmed

- **Summary:** The settings BYOK page now manages several providers side by
  side (configured entries listed with per-entry remove via
  `AgentsConnectionRemove`, add/update form with provider cards and a
  revealed-after-selection password key input), the chat gained a model
  picker fed by the new `AgentsModels` query (grouped by provider, Auto =
  server default) and a per-turn thinking-level picker
  (off/minimal/low/medium/high), and both selections ride along with every
  chat turn and the approval resend through the transport's
  `getRequestSelection`. The nav panel content was slimmed to a single
  settings shortcut — no duplicate chat entry point — so the rail click
  lands directly on the chat page.
- **Affected areas:** `src/modules/agents/graphql/connection.ts`,
  `src/modules/agents/hooks/{useAgentsConnection,useAgentsModels,useAgentsChat}.ts`,
  `src/modules/agents/transport.ts`,
  `src/modules/agents/components/{ModelPicker,ThinkingPicker,ChatPanel}.tsx`,
  `src/pages/settings/SettingsConnectionPage.tsx`,
  `src/modules/ErxesAgentNavigation.tsx`, `src/config.tsx`.
- **Contracts changed:** Consumes `AgentsConnections`, `AgentsModels`,
  `AgentsConnectionUpsert`, `AgentsConnectionRemove` (singular
  `AgentsConnection`/`AgentsConnectionUpdate` gone); chat and approve bodies
  now carry optional `provider`/`model`/`thinkingLevel`.

### `2026-08-28` — Rename plugin to `erxes-agent`; flatten routes; chevron launcher; chat hero

- **Summary:** Renamed the former AI support plugin to the revived
  `erxes-agent` name (project `erxes-agent_ui`, `CONFIG.name`
  `erxes_agent`, path `/erxes-agent`), renamed every legacy chat-assistant
  identifier to `agents` (hooks, transport, REST URLs,
  `X-Agents-Thread-Id` header, and the `Agents*` GraphQL operations
  matching the renamed backend), flattened the chat page to the plugin
  root (index route, no intermediate segment, no redirect), replaced
  the bottom-right round launcher with a right-edge vertical-center chevron
  handle that hides while the sheet is open, and replaced the empty chat
  state with a hero plus four suggestion chips that send through the
  composer's existing `sendMessage({ text })` path.
- **Affected areas:** `project.json`, `module-federation.config.ts`,
  `jest.config.ts`, `tsconfig.json`, `src/config.tsx`,
  `src/modules/ErxesAgentMain.tsx`, `src/modules/ErxesAgentNavigation.tsx`,
  `src/modules/ErxesAgentSettings.tsx`,
  `src/modules/ErxesAgentSettingsNavigation.tsx`,
  `src/pages/agents/IndexPage.tsx`,
  `src/pages/settings/SettingsConnectionPage.tsx`,
  `src/widgets/FloatingWidget.tsx`, `src/modules/agents/**` (module
  directory renamed as part of the identifier rename); deleted the empty
  `src/modules/support` directory.
- **Contracts changed:** Exposes are now `./config`, `./erxes_agent`,
  `./erxes_agentSettings`, and `./floatingWidget`; `CONFIG.name` is now
  `erxes_agent` with `permissionName: 'erxes-agent'` and
  `path: 'erxes-agent'`; main route flattened to `/erxes-agent` (index
  route, no redirect); now consumes the `AgentsConnection*`, `AgentsThreads`,
  `AgentsThreadDetail`, `AgentsThreadRemove`, and `AgentsThreadsChanged`
  GraphQL operations, REST `POST /agents/chat` + `POST /agents/approve`
  behind `/pl:erxes-agent`, and the `X-Agents-Thread-Id` header.

