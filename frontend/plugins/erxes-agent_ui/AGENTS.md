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
  navigation (`ErxesAgentSettingsNavigation`), the opencode-style
  BYOK form at `src/pages/settings/SettingsConnectionPage.tsx` (select
  provider -> paste API key -> save; several providers can be configured
  side by side, each listed with its own entry and removable individually.
  The chat's model picker is a two-step picker over every configured
  provider's models (fetched server-side by the backend from each
  provider's /models endpoint): pick Auto or a provider, then the model
  (search box filters the list), and a
  per-turn thinking-level picker (off/minimal/low/medium/high) sits next to
  it; both selections ride along with every chat turn. The chat surfaces
  never query or manage keys; they only consume the models listing), and
  the tenant-wide code mode page at
  `src/pages/settings/SettingsCodeModePage.tsx` (admin-gated switch over
  the backend's `agentsSettings` flags; every user can read the state,
  only `manageAgentsSettings` holders can change it).
- The AI SDK chat transport, stored-history mapping, REST client, and GraphQL
  documents under `src/modules/agents`.
- The animated bot avatar: the MIT-licensed, framework-free bloub engine
  vendored under `src/modules/agents/bloub/` (unchanged upstream code) plus
  the React wrapper `src/modules/agents/components/BloubBot.tsx`.
- The artifact layer under `src/modules/agents/artifacts/`: the fence
  splitter, artifact cards with previews/downloads, and the HTML / XLSX /
  DOCX / PDF converters for files the assistant emits as tagged fences.
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
  `settingsNavigation` sidebar group ("Agents" / "API key" / "Code mode")
  for the host settings area. With no navigationGroup content the host renders no
  secondary plugin panel: the rail click lands on the chat page directly.
- Plugin routes mount the chat page directly at the plugin root
  (`<Route index element={<IndexPage />} />`) with no intermediate route
  segment and no catch-all route, so navigating to other plugins never 404s
  through this remote.
- Full-page agents chat (`/erxes-agent`) with a thread history sidebar,
  streaming transcript with inbox-style auto-scroll, markdown rendering,
  and a composer. The shell is responsive: the thread sidebar is permanent
  only from `lg` (1024px) up, and below that every surface — the full page
  and the floating side panel — opens the same list as a left `Sheet`
  drawer from a header button. The empty state pairs the hero and the composer as one
  centered, scroll-safe block: an animated bot playing the calm
  `CALM_FACE_CYCLE`, "How can I help you today?", "Ask anything about your
  erxes workspace", the composer itself, then four starter chips
  ("Summarize my open deals", "Draft a follow-up email", "Show overdue
  tasks", "Search my contacts") that send through the same
  `sendMessage({ text })` path the composer uses. Once a conversation
  exists the transcript fills the panel with the composer docked below.
  The same layout serves the full page, the floating side panel and mobile;
  it scales with the viewport — the hero bot shrinks (80 / 96 / 104px), and
  the block stays scroll-safe so the composer never leaves a short panel.
- Composer: one card holding the plugin-local `ChatInput` (auto-growing
  native textarea — deliberately not `erxes-ui`'s `Textarea`, which forces a
  focus shadow and scrollbar arrows inside the card), the model/thinking
  pickers as pill triggers, and the send/stop control (`IconArrowUp` /
  `IconPlayerStop`). No bot inside the composer. The toolbar is one row at
  every width: the pickers share the leftover space and truncate (the
  thinking pill drops its "Thinking:" prefix first) instead of pushing the
  send control out of the card on a phone.
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
  empty state (`sleep`), the approval prompt (`alert`), the side-panel
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
- ask_user questions rendered inline as an `AskUserPrompt` card (question
  text, choice chips for options, multi-select chip state +
  send counter, and a free-text input revealed by "None of these — type my
  own answer"). The suspension arrives as a `data-tool-call-suspended` data
  part; answering stages the answer (with the suspended tool call id) on
  the transport, resolves the suspended tool part locally, and sends a user
  message carrying the answer, which the transport reroutes to the backend's
  `POST /agents/answer` and processes as a normal send (the SDK's own resume
  path builds an empty streaming state, so the replayed suspension chunks
  would find no matching tool part and the whole stream would be discarded).
  The transport's chunk filter drops ONLY chunks tagged with the suspended
  tool call id; the resumed run's own tool inputs/outputs flow through so
  code-mode iterations and other tool activity stay visible. Once answered,
  the askUser tool part (`output-available`) renders an `AskUserAnswered`
  Q&A card — each question with the answer beneath it — built by
  `src/modules/agents/askUserAnswers.ts` from the tool input (questions)
  and the tool result (answers: the structured `answers` array the live
  patch writes, or the stored `User answered:\n<q>: <a>` content). The
  card replaces the suspension prompt and survives reloads; answers are
  never rendered as user bubbles — the send marks its user message with
  `metadata.agentsAnswer`, which `MessageList` filters out of display
  (the backend no longer stores the answer as a user message either).
  Legacy threads that DID store the answer as a user message are covered
  display-side: `MessageList` hides a user bubble that directly follows
  the ask_user assistant message when its text exactly equals
  `formatAskUserAnswers(...)` of the parsed card answers (the ', '- and
  ' · '-joined legacy format).
- Loads stored threads and thread messages over GraphQL and maps them to AI
  SDK `UIMessage`s for rendering; the thread list refreshes itself through
  the `agentsThreadsChanged` subscription (debounced refetch).
- Conversation sidebar (`ThreadList`): sessions grouped by activity (Today /
  Yesterday / Previous 7 days / Older, derived client-side from `updatedAt`),
  the active session marked by a primary accent rail + `bg-primary/10` row,
  hover-revealed delete, skeleton rows while the first page loads, and the
  sleeping bot + "Start one" button on the empty state. Rows are text-only —
  no per-row icons (a repeated message icon down a long list reads as
  noise); timestamps use `formatDateISOStringToRelativeDateShort`. The
  hover-revealed delete is always visible below `lg` (touch has no hover);
  only the pointer layouts hide it until the row is hovered or focused.
- Thread deletion: each thread row shows a delete button that
  confirms through an `AlertDialog` and runs `AgentsThreadRemove`; deleting
  the active conversation resets the chat to a new conversation on both the
  full page and the floating widget.
- Global floating agents widget mounted on every page via
  `hasFloatingWidget`: a right-edge vertical-center chevron handle
  (fixed `right-0 top-1/2`, hidden while the panel is open) toggles a
  full-height right `Sheet` side panel with the thread sidebar (md and up)
  and the same chat surface.
- BYOK in settings: each user manages their own AI connection on the
  form at `/settings/erxes-agent/connection`
  (also reachable via the chat page header "Settings" button). The form is
  provider card grid -> API key -> save, with every provider card,
  configured row and remove-dialog title led by the provider's brand mark
  (`ProviderIcon`), a primary check badge on the selected card, a step
  reveal (the key section appears only once a provider is chosen or
  stored), a show/hide toggle on the password input, a connected-status
  row with relative `updatedAt`, and an `AlertDialog`-confirmed remove.
  Omitting `apiKey`
  keeps the stored key only when the provider is unchanged; switching
  providers requires a fresh key. The stored key is never rendered back.
  The model is always visible, never hidden: each configured entry shows
  the stored model in parentheses (`OpenAI (gpt-5.6-luna)`), each provider
  card shows the default model a fresh entry will store, and the chat
  model picker's Auto entry shows the model the server default actually
  runs (`Auto (gpt-5.6-luna)`). The chat surfaces have no key UI at all:
  chatting starts directly, and a missing key surfaces only as the
  backend's 400 error in the chat error banner.
- Chat model picker: a two-step `Popover` + `Command` picker. Step one
  (selection) lists the Auto entry (sparkles, shows the default model) and
  one row per configured provider — brand mark, provider label, model
  count, and a check when the active selection belongs to that provider.
  Step two (a provider) has a back row, a search input (autofocused,
  cmdk-filtered) and that provider's models in mono with a check on the
  active one. The trigger renders the active choice itself: sparkles +
  `Auto (model)` or the provider's mark + the mono model id.
- Code mode in settings: the tenant-wide toggle page at
  `/settings/erxes-agent/code-mode` (settings sidebar "Agents / Code
  mode"). Every agents user can read the current state
  (`AgentsSettings` query); the `Switch` is disabled unless
  `usePermissionCheck().hasActionPermission('manageAgentsSettings',
  'erxes-agent')` holds, in which case toggling saves immediately through
  `AgentsSettingsUpdate` (`refetchQueries` + success/error toasts).
  Non-admins see the live state plus a muted "Managed by your
  administrators" note. The sandbox environment renders as a fixed
  "In-process (built-in server)" card marked Default — the backend
  validates the enum, the UI does not edit it.
- Artifact cards: when assistant text contains a complete fence tagged
  `html`, `xlsx`, `docx`, or `pdf` (title after the tag), the transcript
  renders it as a card (type icon, title, format badge, Copy source /
  Download / Expand actions, inline 380px ⇄ 75vh expansion) instead of a
  code block. HTML previews inside a `sandbox="allow-scripts"` iframe with
  an injected CSP; spreadsheets open as an editable Univer grid (edits are
  session-local, exported through exceljs on download); docx previews the
  generated Word file (docx-preview) whose download opens natively editable
  in Word/Google Docs/Pages; PDF previews in the browser's native viewer.
  Heavily incomplete/mid-stream fences stay plain code blocks and promote to
  a card once the closing fence arrives. Fenced code blocks wrap long lines
  instead of scrolling horizontally.
- Two-tier responsive transcript typography (base 15px / md 17px) for
  markdown, user bubbles, composer, and thread titles, plus responsive
  transcript spacing and gaps (tighter below `sm`) and horizontally
  scrollable markdown tables (`w-max min-w-full` inside an
  `overflow-x-auto overscroll-x-contain` wrapper, so a wide table scrolls
  instead of squashing its columns), with polished
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
| Settings routing    | `src/modules/ErxesAgentSettings.tsx`           | Declares the plugin's settings routes (`connection`, `code-mode`) |
| Settings navigation | `src/modules/ErxesAgentSettingsNavigation.tsx` | Settings sidebar group ("Agents" / "API key" / "Code mode") |
| Chat page           | `src/pages/agents/IndexPage.tsx`               | Full-page chat with thread sidebar (`lg`+), drawer below |
| History drawer      | `src/modules/agents/components/ThreadsDrawer.tsx` | Controlled left `Sheet` wrapping `ThreadList` for every width below `lg` |
| Settings page       | `src/pages/settings/SettingsConnectionPage.tsx`| Brand-mark BYOK form (save/remove connection)     |
| Code mode page      | `src/pages/settings/SettingsCodeModePage.tsx`  | Tenant-wide code mode toggle (admin-gated switch + fixed sandbox environment card) |
| Floating widget     | `src/widgets/FloatingWidget.tsx`               | Right-edge chevron handle + full-height `Sheet` side panel |
| Chat hook           | `src/modules/agents/hooks/useAgentsChat.ts`    | `useChat` wrapper: thread tracking, approval resend, ask-user answer resume, history |
| Threads hook        | `src/modules/agents/hooks/useAgentsThreads.ts` | Loads the user's agents threads                   |
| Connection hook     | `src/modules/agents/hooks/useAgentsConnection.ts` | Loads the user's BYOK connection               |
| Provider icons      | `src/modules/agents/components/ProviderIcon.tsx` | Inline brand marks per provider (OpenAI, xAI, Kimi; Kimi Code = Kimi mark + code badge) |
| Provider picker     | `src/modules/agents/components/ProviderPicker.tsx` | Provider whitelist, brand-mark card grid, and label helpers (settings form) |
| Settings hook       | `src/modules/agents/hooks/useAgentsSettings.ts` | Loads the tenant-wide agents settings (code mode flag) |
| Transport           | `src/modules/agents/transport.ts`              | `DefaultChatTransport` subclass; routes approval resends to `/agents/approve` and ask-user answer sends to `/agents/answer` |
| History mapping     | `src/modules/agents/mapStoredMessages.ts`      | Stored Mastra messages → AI SDK `UIMessage`s      |
| REST URLs           | `src/modules/agents/api.ts`                    | `/agents/chat`, `/agents/approve`, `/agents/answer` SSE endpoint URLs |
| GraphQL documents   | `src/modules/agents/graphql/connection.ts`     | `AgentsConnection*` BYOK operations               |
| GraphQL documents   | `src/modules/agents/graphql/settings.ts`       | `AgentsSettings` query + `AgentsSettingsUpdate` mutation |
| GraphQL documents   | `src/modules/agents/graphql/threads.ts`        | `Agents*` thread list/detail operations and the `AgentsThreadsChanged` subscription |
| Components          | `src/modules/agents/components/*`              | Chat panel (transcript + empty state + composer layouts), message list, parts, approval, tool call helpers, composer, `ChatInput`, markdown, thread list (with delete), provider picker, `BloubBot` avatar wrapper |
| Markdown repair     | `src/modules/agents/components/markdownRepair.ts` | `repairTables(text)` pre-pass normalizing malformed pipe tables before `react-markdown`: missing separator row, several rows collapsed onto one line, and a separator row merged onto the header line |
| Bot cycles          | `src/modules/agents/botCycles.ts`              | Curated module-level montages (`CALM_FACE_CYCLE`, `LAUNCHER_CYCLE`) with stable references |
| Bot avatar (vendored) | `src/modules/agents/bloub/*`                 | MIT-licensed framework-free bloub engine (upstream, unchanged) + `README.md` credit/license; the pure `engine.sample(t)` the `BloubBot` wrapper renders |
| Artifacts            | `src/modules/agents/artifacts/*`             | `parseArtifacts` fence splitter, `MessageContent`/`ArtifactCard` rendering, sandboxed `HtmlPreview` + lazy previews (`SpreadsheetPreview` / `DocxPreview` / `PdfPreview`), converters (`csv`, `mdBlocks`, `xlsx`, `docx`, `pdf`), `download` |
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
  `AgentsThreads`, `AgentsThreadDetail`, `AgentsThreadRemove`, the
  `AgentsThreadsChanged` subscription (refetch signal only), and the
  tenant settings pair `AgentsSettings` / `AgentsSettingsUpdate`.
- `ai` (`DefaultChatTransport`, `UIMessage`, part type guards,
  `lastAssistantMessageIsCompleteWithApprovalResponses`) and
  `@ai-sdk/react` (`useChat`), matched to the backend's AI SDK major.
- Artifact dependencies (root `package.json`, introduced via upstream PR
  `erxes/erxes#9180`): `docx` (Word generation), `exceljs` (xlsx export),
  `docx-preview` (Word preview) and `@react-pdf/renderer` (PDF
  generation). The `@univerjs/presets` + `@univerjs/preset-sheets-core`
  packages are still installed for back-compat but no longer imported;
  they can be dropped from `package.json` after a `pnpm install`.
- `erxes-ui` for `IUIConfig`, navigation items, `Breadcrumb`, `Button`,
  `buttonVariants`, `Sheet`, `AlertDialog`, `Input`, `Label`, `Textarea`,
  `Collapsible`, `Avatar`, `Spinner`, `Badge`, `toast`, and
  `REACT_APP_API_URL`.
- `ui-modules` for `PageHeader` and the permission gate
  (`usePermissionCheck`, `hasActionPermission(action, pluginName)`).
- `react-markdown` for assistant text, `@tabler/icons-react` for icons, and
  `react-router` / `react-router-dom` for routing.

## Data and State

- Server state via Apollo Client for the BYOK connection
  (`AgentsConnection` query; `AgentsConnectionUpdate` and
  `AgentsConnectionRemove` with `refetchQueries`) and the thread history
  (`AgentsThreads` query with a subscription-driven debounced refetch;
  `AgentsThreadDetail` lazy query with `network-only` for opening a
  thread; `AgentsThreadRemove` with `refetchQueries`).
- Chat state via the AI SDK's `useChat`; the plugin holds the conversation's
  thread id in a ref + React state. The id is generated client-side on the
  first send (`crypto.randomUUID()`) and pinned to every turn in the request
  body — the `X-Agents-Thread-Id` response header is advisory only, because
  a cross-origin browser cannot read a custom response header unless the
  gateway lists it in `Access-Control-Expose-Headers` (it does not).
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
- Artifact security invariants (non-negotiable):
  - Only **complete** fences whose language is in the `html | xlsx | docx |
    pdf` allow-list (`parseArtifacts.ts`) become cards; everything else
    stays a plain code block. Never widen the allow-list without revisiting
    every preview below.
  - The HTML preview iframe uses `sandbox="allow-scripts"` ONLY (opaque
    origin — no parent DOM/cookie/storage access), `srcDoc`,
    `referrerPolicy="no-referrer"`, and injects a strict CSP meta as the
    first policy (model-provided CSPs may only intersect and tighten). Do
    NOT add `allow-same-origin`, `allow-popups`, or an "open in new tab"
    action for HTML: a top-level `blob:`/`srcdoc` document inherits our
    origin.
  - Every heavy library (`exceljs`, `docx`, `docx-preview`,
    `@react-pdf/renderer`, `@univerjs/*`) loads behind a dynamic
    `import()`/`React.lazy` boundary (`ArtifactCard.tsx`); the module
    federation entry must not gain a static import of any of them.
  - The Univer grid is mounted vanilla (`createUniver` from
    `@univerjs/presets`, `UniverSheetsCorePreset`, en-US locale from
    `preset-sheets-core/locales/en-US`, CSS via
    `@univerjs/presets/lib/styles/preset-sheets-core.css` — do not import
    `@univerjs/core` directly, it is not a root dependency) and disposed
    with `disposeUnit` on unmount. Cell seeds/exports use plain
    `CellValue[][]` values, never the `CellValueType` enum (not
    re-exported by the presets).
  - Spreadsheet edits are session-local by design; Download reads the live
    grid through the editor handle and falls back to the fence's parsed CSV
    when the editor has not mounted.
  - Generated docx files must stay native, fully editable OOXML (real
    heading styles, `Table`/`TableRow`/`TableCell`, `TextRun` formatting —
    no rasterized or protected output).
- The transcript renders only approval prompts for tool parts; do not
  reintroduce tool-execution cards or spinner rows for tool states.
- Transcript auto-scroll must follow the inbox ScrollArea viewport pattern
  (`ScrollArea.Root`/`ScrollArea.Viewport` with a `viewportRef` and
  distance-from-bottom tracking, jumping via `scrollTop = scrollHeight`
  inside `setTimeout(0)`); it pauses while the user is scrolled up
  (near-bottom threshold 120px), re-arms when the transcript empties, and
  always jumps to the bottom once thread history finishes loading.
- Code mode settings gating mirrors the backend: the switch saves through
  `AgentsSettingsUpdate` only for `manageAgentsSettings` holders
  (`usePermissionCheck` with the dashed plugin name `'erxes-agent'`);
  everyone else gets a read-only view. The environment card is
  display-only — the backend's `AGENTS_CODE_MODE_ENVIRONMENTS` enum is the
  single source, and only `in-process` exists.
- The BYOK API keys are write-only in the UI: `agentsConnections` never
  returns it, the settings form renders it only in a password input (with a local
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
  The model picker's "Auto" entry reports `''` directly (the `Popover` +
  `Command` picker has no empty-value sentinel; the old `__auto__` Select
  sentinel is gone). Its label shows the actual default model via the
  `autoModel` prop (`ChatPanel` passes the first configured connection's
  stored model — what the server default runs); it falls back to
  "Auto (server default)" only while that value is unknown.
- Provider brand marks live only in `ProviderIcon.tsx` (inline SVG paths:
  OpenAI from simple-icons CC0, xAI + Kimi from svgl.app; Kimi Code is the
  Kimi mark plus a code badge — there is no separate Kimi Code logo). A new
  `PROVIDER_OPTIONS` entry needs a matching `provider ===` branch there or
  it falls back to the sparkles tile. The model picker's trigger renders
  the active choice manually (mark + mono model id, or sparkles for Auto)
  — keep that content in sync with the picker rows; the composer pill
  keeps the manual chevron `Combobox.Trigger` appends, and `ThinkingPicker`
  stays on `erxes-ui` `Select`, whose trigger appends its own.
- The `navigationGroup` in `src/config.tsx` must NOT define `content` (or
  `subGroup`): the host renders a secondary plugin panel whenever group
  content exists, and the chat page must fill the width directly with no
  extra sidebar step. The rail click alone navigates straight to the chat
  page via the activity `defaultPath`. (`IUIConfig.navigationGroup.content`
  became optional in `erxes-ui` to enable this.)
- `src/modules/agents/bloub/` is vendored MIT code (see its `README.md`):
  keep it pristine — the only edits are rewriting `gaze.ts`'s three `@/`
  imports to relative `./bot/*` and the deliberate plugin-added `writing`
  state in `states.ts` (registered in `StateId`, `STATES`, `POSES` and
  `SEQUENCE`, marked with a comment). Do not "clean up" the French comments,
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
- Responsive invariants (the chat is used from a 320px phone to an ultrawide
  desktop; breakpoints are Tailwind's defaults, applied as CSS classes so
  there is no first-paint jump):
  - The thread sidebar is permanent only from `lg` (1024px) up. Below that
    BOTH surfaces that show threads — `IndexPage` and `FloatingWidget` —
    must mount `ThreadsDrawer` and give it a visible trigger, because a
    phone has no other route back to a stored conversation. Never reintroduce
    a hidden sidebar without a drawer fallback (the floating panel's old
    `hidden md:block` left phones with no history access at all).
  - The drawer is controlled by the surface that owns the trigger; selecting
    a thread or starting a new conversation closes it. Keep both surfaces on
    the same `ThreadsDrawer` component rather than duplicating the sheet.
  - Layout is CSS-only (`hidden lg:block`, `lg:hidden`, …). Do not add a JS
    breakpoint hook: `erxes-ui`'s `useIsMobile` is a 1024px `matchMedia`,
    which would disagree with the CSS classes the moment they diverge.
  - Anything revealed on hover must have a non-hover fallback below `lg`
    (see the thread row's delete button): touch devices never hover.
  - The composer toolbar stays one row at every width. Pickers shrink and
    truncate; they must never wrap or push the send control out of the card.
  - Fixed pixel heights (hero avatar, artifact preview) get a smaller value
    below `sm`; the composer's bottom padding is
    `pb-[max(0.75rem,env(safe-area-inset-bottom))]` so it clears the iOS home
    indicator without adding dead space elsewhere.
  - Wide content scrolls in place: markdown tables inside an
    `overflow-x-auto` wrapper, code blocks with `whitespace-pre-wrap
    break-words`. Nothing may widen the transcript horizontally.
  - `ChatPanel`'s root keeps `flex-1` because both surfaces mount it inside
    a flex-row wrapper (`main` on the page, the sheet's content row in the
    floating widget). Without it the panel shrinks to its content's width and
    pins to the left edge, so the empty state's `mx-auto` block can never
    center.
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
  tail shows the `writing` state (a plugin-added bloub state — pen strokes
  with a fading ink trail; NOT upstream code, see the vendored-engine
  invariant), a message with a pending ask_user suspension shows
  `wide`, and every settled message plays the `MESSAGE_AVATAR_SHUFFLE_POOL`
  walk. `frozenAt` remains available but no transcript avatar uses it.
- Thread continuity is client-owned: `useAgentsChat` generates the thread id
  on the first send (`crypto.randomUUID()` via `ensureThreadId`, called from
  the wrapped `sendMessage`) and the transport includes it in every request
  body (`threadId`), including approve/answer resumes. Do NOT restore
  header-based thread tracking — the backend's `X-Agents-Thread-Id` response
  header is invisible to the cross-origin browser (the gateway's
  `cors(corsOptions)` never lists it under `Access-Control-Expose-Headers`),
  so relying on it silently breaks every conversation into per-turn fresh
  threads with no memory. The header capture in the transport stays as
  advisory only.
- Ask-user answers must resume through `POST /agents/answer` (threadId-keyed
  resume), never a fresh `sendMessage` against `/agents/chat`. But the answer
  request must travel as a NORMAL SEND, not `chat.resumeStream()`: the SDK's
  resume path builds its streaming state from an empty message, so the
  resumed stream's leading `tool-output-available` chunk finds no matching
  tool part and the SDK discards the ENTIRE stream (the symptom was a 200
  SSE with nothing rendered and nothing stored). `submitAnswer` therefore
  stages the answer on the transport's `consumePendingAnswer` seam, marks
  the suspended tool part answered locally via `chat.setMessages`, and calls
  `chat.sendMessage({ text: answer })`; `sendMessages` consumes the staged
  answer, reroutes that one request to `/agents/answer`, and drops
  `tool-output-available` chunks en route (they cannot match the fresh
  streaming state). `MessageList` hides an answered suspension card by
  toolCallId. The staged answer is consumed exactly once, and
  `startNewConversation` clears any stale one.
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
  provider cards and configured rows lead with their brand marks, the
  provider cards show each default model in parentheses
  (`OpenAI (gpt-5.6-luna)`), the configured entry shows the stored model
  in parentheses, the chat model picker's Auto entry shows the actual
  default model, and opening the picker shows the selection menu (Auto +
  one row per provider with model counts), stepping into a provider shows
  a search box filtering its mono model rows, and the trigger shows the
  active choice's mark and model — chatting
  with no stored key shows only the backend's "Add your API key" error
  banner with no other key UI,
  and the floating bot launcher: shows the calm face cycle, dragging it
  moves it anywhere (rings spin while dragging) and the spot survives a
  reload, while a simple click opens the full-height side panel with
  threads and chat on any page, whose empty state matches the full page
  without floating or clipping (also on mobile).
- Smoke (artifacts): ask the agent for "a quarterly sales report as a
  spreadsheet" and confirm the reply renders an artifact card instead of a
  code block — the spreadsheet opens as an editable grid (edit a cell,
  Download, open in Excel, edit present), an html artifact's preview runs
  scripts but sends no external network requests (devtools) and cannot
  touch the parent page, a docx download opens in Word/Google Docs with
  real, editable headings/tables, a pdf preview uses the native viewer, a
  mid-stream fence shows as a plain code block until the closing fence
  arrives, and reopening the thread regenerates the cards from stored text.
- Smoke (code mode settings): open `/settings/erxes-agent/code-mode`
  (settings sidebar "Agents / Code mode") — as an admin the `Switch`
  reflects the tenant state, toggling saves immediately with a toast and
  survives a reload; as a non-admin the switch is disabled and the
  "Managed by your administrators" note shows; the environment card reads
  "In-process (built-in server)" marked Default.
- Smoke (responsive): at 320 / 375 / 768 / 1024 / 1440px, and in a short
  landscape phone, confirm the thread sidebar is inline from `lg` up and a
  header button opens it as a left drawer below that — on BOTH the full page
  and the floating side panel — that picking a thread closes the drawer and
  loads it, the header actions stay on one line with their labels folded
  away below `sm`, the empty state keeps the composer inside the panel with
  the hero scaled down, the composer toolbar stays a single row with the
  pickers truncating rather than the send control escaping the card, a wide
  markdown table scrolls sideways without widening the transcript, and a
  thread row's delete button is reachable without hovering.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-31` — ask_user answers as an answered Q&A card

- **Summary:** Answering an ask_user prompt used to surface as a plain user
  bubble ("Bar chart · HTML preview") while the question card vanished on
  reload. The settled askUser tool part (`output-available`) now renders an
  `AskUserAnswered` card — each question with the answer beneath it — via
  the new `askUserAnswers.ts` parser, which pairs the questions from the
  tool input with the answers from the tool result (the structured array
  the live patch writes, or the stored `User answered:\n<q>: <a>` content,
  so history threads render too). The answer turn is marked
  `metadata.agentsAnswer` and filtered out of the transcript, and the
  backend no longer stores the answer as a user message (companion backend
  change), so nothing renders twice. Answer bubbles that legacy threads
  DID store are hidden display-side when a user message directly follows
  the ask_user assistant message and its text exactly matches
  `formatAskUserAnswers` of the card's parsed answers.
- **Affected areas:** `src/modules/agents/askUserAnswers.ts` (new) +
  `__tests__/askUserAnswers.test.ts` (new),
  `src/modules/agents/components/{AskUserPrompt, MessagePart,
  MessageList}.tsx`, `src/modules/agents/hooks/useAgentsChat.ts`.
- **Contracts changed:** None (same `POST /agents/answer` payload; the
  answer turn now carries `metadata.agentsAnswer`).

### `2026-08-31` — Responsive chat surface for every device

- **Summary:** The chat was built around a permanent 256px thread sidebar
  with no alternative on narrow screens, so a phone gave the transcript
  ~120px and the floating panel's history (`hidden md:block`) was simply
  unreachable. The sidebar is now permanent only from `lg` up, and both
  surfaces mount a new controlled `ThreadsDrawer` (left `Sheet` +
  `ThreadList`) opened from the header; picking a thread closes it. Also:
  the empty-state hero scales (80/96/104px), the transcript tightens its
  padding, gaps and user-bubble width below `sm`, the composer toolbar
  became one shrinkable row (the model picker flexes, the thinking pill
  drops its "Thinking:" prefix, the send control never leaves the card),
  the docked composer clears the iOS home indicator, markdown tables scroll
  sideways inside the transcript instead of squashing their columns, the
  thread row's delete button is always visible below `lg` (touch never
  hovers), the floating panel's sheet width no longer overflows the
  viewport by its own inset, and artifact previews start at 320px on small
  screens. Page-header actions drop their labels below `sm` so they stop
  pushing the breadcrumb off a phone-width header. `ChatPanel`'s root
  carries `flex-1` so the panel fills the new flex-row wrappers on both
  surfaces — without it the panel shrank to its content and the empty
  state's centered block pinned to the left edge.
- **Affected areas:**
  `src/modules/agents/components/ThreadsDrawer.tsx` (new),
  `src/pages/agents/IndexPage.tsx`, `src/widgets/FloatingWidget.tsx`,
  `src/modules/agents/components/{ChatPanel, MessageList, Composer,
  ModelPicker, ThinkingPicker, Markdown, ThreadList}.tsx`,
  `src/modules/agents/artifacts/ArtifactCard.tsx`.
- **Contracts changed:** None (presentation only; no GraphQL/REST, `CONFIG`
  or federation changes).

### `2026-08-31` — Hardened artifact guidance and wrapping code blocks

- **Summary:** Artifact instructions now demand a closed, correctly tagged
  fence for any file request, and chat code blocks wrap long lines instead
  of overflowing horizontally.
- **Affected areas:** `src/modules/agents/components/Markdown.tsx`; agent
  instructions are backend-side.
- **Contracts changed:** None

### `2026-08-31` — Artifact cards: HTML / XLSX / DOCX / PDF previews and downloads

- **Summary:** Assistant text containing complete ```html / ```xlsx /
  ```docx / ```pdf fences now renders as artifact cards (icon + title +
  format badge, Copy source / Download / Expand with inline 380px ⇄ 75vh
  expansion) instead of plain code blocks: HTML previews in a
  `sandbox="allow-scripts"` iframe with an injected first CSP; spreadsheets
  open as an editable Univer grid whose Download exports the live grid via
  exceljs (CSV fallback before mount); docx and pdf are generated on mount
  (`docx` Packer / `@react-pdf/renderer`, lazy chunks) with a spinner,
  retry-on-error preview, and a docx download that opens natively editable
  in Word/Google Docs/Pages. A new `artifacts/` layer
  (`parseArtifacts` splitter with CommonMark fence rules + unit tests,
  `MessageContent`, `ArtifactCard`, `HtmlPreview`, lazy previews,
  `csv`/`mdBlocks`/`xlsx`/`docx`/`pdf` converters) hangs off the
  `MessagePart` assistant-text branch; the backend instructions gained the
  matching fence convention. New deps landed first as upstream PR
  `erxes/erxes#9180` (`docx`, `@univerjs/presets`,
  `@univerjs/preset-sheets-core`).
- **Affected areas:** `src/modules/agents/artifacts/*` (new),
  `src/modules/agents/components/MessagePart.tsx` (text branch swaps
  `Markdown` for `MessageContent`), root `package.json` (mirrored deps).
- **Contracts changed:** None (pure presentation over existing message
  text; no GraphQL/REST changes).

### `2026-08-31` — Two-step model picker with model search

- **Summary:** Replaced the flat grouped `Select` model picker with a
  two-step `Popover` + `Command` flow: the menu lists Auto and one row per
  configured provider (brand mark, model count, active-selection check),
  stepping into a provider shows a back row plus an autofocus search box
  filtering that provider's mono model rows, and the trigger renders the
  active choice itself. Props, the `provider|model` value contract, and
  the `''`-means-Auto mapping are unchanged; the `__auto__` sentinel is
  gone.
- **Affected areas:** `src/modules/agents/components/ModelPicker.tsx`.
- **Contracts changed:** None (same props and selection values;
  presentation only).

### `2026-08-31` — Scoped ask_user answer chunk filter

- **Summary:** The transport's answer-resume filter no longer drops ALL
  `tool-output-available` chunks (which hid every tool the resumed run
  executed, e.g. code-mode iterations): the staged answer now carries the
  suspended ask_user tool call id (`IPendingAnswer`), and only chunks
  tagged with that id — the suspension replay the fresh send-side state
  cannot match — are dropped, so the resumed run's own tool inputs/outputs
  reach the UI.
- **Affected areas:** `src/modules/agents/transport.ts`
  (`IPendingAnswer`, scoped chunk filter), `src/modules/agents/hooks/useAgentsChat.ts`
  (`pendingAnswerRef` shape, suspension resolved before staging).
- **Contracts changed:** None (internal transport/hook seam; answer POST
  body unchanged).

### `2026-08-31` — Code mode settings page (tenant-wide admin toggle)

- **Summary:** Added the tenant-wide code mode settings surface: new
  `AgentsSettings` / `AgentsSettingsUpdate` GraphQL documents
  (`graphql/settings.ts`) + `useAgentsSettings` hook, and the
  `SettingsCodeModePage` at `/settings/erxes-agent/code-mode` (settings
  sidebar "Agents / Code mode") with an instant-apply `Switch`, toast
  feedback, and the fixed "In-process (built-in server)" environment card.
  Edit controls are gated by `usePermissionCheck`
  (`manageAgentsSettings` on `erxes-agent`); non-admins get a read-only
  state with a muted note. No chat-surface changes.
- **Affected areas:**
  `src/pages/settings/SettingsCodeModePage.tsx` (new),
  `src/modules/agents/hooks/useAgentsSettings.ts` (new),
  `src/modules/agents/graphql/settings.ts` (new),
  `src/modules/ErxesAgentSettings.tsx` (route),
  `src/modules/ErxesAgentSettingsNavigation.tsx` (nav item).
- **Contracts changed:** Consumes `AgentsSettings` query and
  `AgentsSettingsUpdate` mutation; settings navigation gains the
  "Code mode" item (exposes and `CONFIG` unchanged).

### `2026-08-31` — ask_user answer fix, writing avatar, question card slimmed

- **Summary:** Fixed answering an ask_user question producing nothing: the
  answer went through `chat.resumeStream()`, whose resume path builds an
  empty streaming state, so the resumed `tool-output-available` chunk found
  no tool part and the SDK discarded the whole stream (200 SSE, nothing
  rendered or stored). Answers now travel as a normal send — `submitAnswer`
  stages the answer, marks the suspended tool part answered locally, and
  sends a user message carrying the answer; `sendMessages` reroutes it to
  `POST /agents/answer` and drops `tool-output-available` chunks en route;
  `MessageList` hides an answered suspension card by toolCallId. Also: the
  streaming message avatar now plays a plugin-added `writing` bloub state
  (pen strokes + fading ink trail, registered in the vendored engine) and
  the bot avatar was removed from the question card.
- **Affected areas:**
  `src/modules/agents/{transport.ts, hooks/useAgentsChat.ts, botCycles.ts
  (docs), bloub/bot/states.ts}`,
  `src/modules/agents/components/{MessageList, MessagePart, AskUserPrompt}.tsx`.
- **Contracts changed:** None (same `POST /agents/answer` contract; only the
  client-side routing of the request changed).

### `2026-08-31` — Fix fresh-thread-per-turn: client-generated thread ids

- **Summary:** Every chat turn had been creating a new server thread with no
  memory of the previous ones: the transport learned the thread id only from
  the `X-Agents-Thread-Id` response header, which a cross-origin browser
  cannot read because the gateway's CORS never lists it under
  `Access-Control-Expose-Headers`. Thread continuity is now client-owned —
  `useAgentsChat` generates the id on the first send (`crypto.randomUUID()`)
  via `ensureThreadId` and the wrapped `sendMessage`, and the transport pins
  it in every request body (chat, approve, answer); header capture stays
  advisory only. The backend already accepted client-supplied ids
  (auto-create unknown, 403 foreign).
- **Affected areas:**
  `src/modules/agents/hooks/useAgentsChat.ts`,
  `src/modules/agents/transport.ts` (doc comment only).
- **Contracts changed:** None (the backend contract already documented
  client-supplied thread ids).

### `2026-08-31` — Model picker redesign with provider brand marks

- **Summary:** Reworked the chat `ModelPicker`: the Auto entry and every
  model row lead with their provider's brand mark (`IconSparkles` for
  Auto), per-provider group headers became uppercase micro-labels with the
  mark, model ids render in mono, and the duplicate manual chevron was
  removed (the `erxes-ui` trigger appends its own). Radix renders the
  selected item's content in the trigger, so the active provider's mark
  identifies the choice there too. The provider label helper moved to
  `ProviderPicker` exports (shared with the settings page).
- **Affected areas:**
  `src/modules/agents/components/{ModelPicker, ProviderPicker}.tsx`.
- **Contracts changed:** None (same props, `__auto__` sentinel and
  `provider|model` values).



---

### 2026-09-01 — Spreadsheet preview simplification + minimal artifact chrome

- Replaced the Univer-based `previews/SpreadsheetEditor.tsx` with a
  read-only `previews/SpreadsheetPreview.tsx` that renders
  `parseDelimitedTable(content)` as a styled HTML `<table>` (sticky
  header, 60vh max height, "Empty table" placeholder when the input has
  no rows). The Univer bundle often rendered as a silent empty grid
  when its async mount path hiccupped, so a blank card no longer looks
  like a failure.
- Simplified `ArtifactCard` chrome: no more outer `bg-muted/20`
  background, no type icon, no `Spreadsheet`/`Word`/etc. badge, no
  Expand button. Header is just the artifact title with small Copy /
  Download icons (`size-7` ghost buttons). HTML/DOCX/PDF previews keep
  their `320px ⇄ 380px` body height so the iframe still has room; the
  xlsx preview now sizes to its content.
- Removed the `ISpreadsheetHandle` / `handleRef` round-trip; the
  Download path now reads the same parsed rows it always falls back to
  when the editor never mounted.
- Dropped the `univer-css.d.ts` shim. `@univerjs/presets` and
  `@univerjs/preset-sheets-core` are still installed (in `package.json`)
  for back-compat but no longer imported; remove them from the
  manifest in a follow-up `pnpm install`.

### 2026-09-01 — Markdown repair: separator row merged onto the header line

- **Summary:** A third pipe-table malformation still rendered as raw `|`
  text: the assistant merged the separator row onto the END of the header
  line (`| A | B |---|---|---|`). `isSeparatorLine()` matches only a whole
  line of dashes/pipes, so the line read as the header and its dashes were
  counted as extra columns — columnCount became 5 instead of 2 and every
  data row below was re-chunked into 5-column garbage. `repairTables` now
  splits a trailing separator run off both header and data lines before the
  header is measured.
- **Details:** New `splitTrailingSeparator(line)` returns the real cells
  plus the separator cells, or `null` when there is no coherent run. The run
  must be >= 2 cells wide and leave >= 2 real cells, so a single trailing
  `---` (a literal "no value" cell) is never mistaken for a separator. A
  merged separator is trusted only when its width matches the header's
  column count — that preserves alignment markers (`| --- | ---: |`); a
  mismatched run is discarded and regenerated from the header. `reChunkLine`
  became `reChunkCells` so header and data lines can both be re-chunked from
  already-split cells.
- **Affected areas:**
  `src/modules/agents/components/markdownRepair.ts` and
  `src/modules/agents/__tests__/markdownRepair.test.ts` (3 new cases,
  including the exact screenshot input). `Markdown.tsx` unchanged.
- **Contracts changed:** None (pure text pre-pass; no GraphQL/REST, `CONFIG`
  or federation changes, no new dependencies).
- **Validation:** 64/64 plugin tests pass (was 61), lint clean for the
  touched files, type-check clean.
