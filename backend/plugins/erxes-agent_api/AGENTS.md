# `erxes-agent_api` Plugin Guide

## Identity

- **Plugin:** `erxes-agent`
- **Project:** `erxes-agent_api`
- **Layer:** `Backend API`
- **Path:** `backend/plugins/erxes-agent_api`
- **Last synchronized:** `2026-09-01`

## Scope

### Owns

- The `erxes-agent` federated GraphQL and tRPC plugin service, started on
  port `3306`.
- The `agents` module under `src/modules/agents`: the per-user BYOK
  multi-provider `AgentsConnection` model, its GraphQL schema and
  resolvers, the server-side per-provider models listing, the thread
  list/detail GraphQL queries, the `agentsThreadRemove` mutation, the
  `agentsThreadsChanged` subscription surface, the tenant-wide
  `AgentsSettings` model with its `agentsSettings` /
  `agentsSettingsUpdate` GraphQL surface and the code-mode sandbox tool
  (`src/modules/agents/codeMode.ts`), and the declarative
  permission config at `src/meta/permissions.ts`.
- The `cfos` module under `src/modules/cfos` (merged from the legacy
  plugin's lineage): the `CfOsConnectCodes` model (hashed, single-use,
  short-lived connect codes on collection `cf_os_connect_codes`) and the
  `POST /cf-os/connect-code` (dashboard-authenticated mint) and
  `POST /cf-os/exchange` (gatekeeper-only, `x-cf-os-secret` header)
  routes that back the cf_os_ui plugin's passwordless Cloudflare OS
  sign-in.

### Does not own

- Any AI agent runtime, chat store, platform AI agent definitions, or skill
  execution.
  This plugin revives the legacy `erxes-agent` name but reuses no code,
  models, or contracts from the previously removed plugin of the same name.
- Core API, gateway, shared libraries, frontend plugin code, or other plugins.
- The `erxes-agent_ui` surfaces; those live in the frontend project.
- Direct source imports from another plugin; cross-service access must use
  published GraphQL, tRPC, HTTP, event, or federation contracts.

## Current Capabilities

- Boots as a federated plugin through `startPlugin` with name
  `erxes-agent` on port `3306`, wiring Apollo, tRPC, and per-`subdomain`
  model generation.
- Stores each user's bring-your-own-key (BYOK) agents connections — an
  entry per configured provider (`provider`, `model`,
  `config: { apiKey }`) in one document per user per tenant through the
  tenant-scoped `AgentsConnection` model, so several providers can be
  configured side by side. Entries reuse the platform's
  `IAiAgentConnection` shape verbatim so `providers.ts` consumes them
  unchanged. An entry's stored `model` defaults to the provider default
  (`getProviderDefaultModel` in `providers.ts`; re-saving without an
  explicit `model` refreshes a stale stored entry to the current default)
  and may be overridden by
  the chat request per turn (never persisted); documents written by the
  previous single-connection shape are lazily normalized on read.
- Serves GraphQL query `agentsConnections` (one masked entry per
  configured provider) and mutations
  `agentsConnectionUpsert(provider, model?, apiKey?)` /
  `agentsConnectionRemove(provider)`, all gated by `agentsChat` and scoped
  to the acting user's own document. The API key never appears in any
  response: reads expose only `hasKey`; an omitted `apiKey` keeps that
  provider's stored key, an empty string clears it, and a resulting entry
  without a key is rejected. Each provider's entry is independent — adding
  a provider never touches another one's key.
- Opencode-style BYOK setup per provider: select provider, paste API key,
  save. A stored entry's model defaults to the provider default
  (`PROVIDER_DEFAULTS`: openai → `gpt-5.6-luna`, grok → `grok-4.5`, kimi →
  `kimi-k3`, kimi-code → `kimi-for-coding`). The BYOK surface accepts
  exactly the four whitelist providers `openai`, `grok`, `kimi`,
  `kimi-code` (`BYOK_PROVIDERS` in `src/modules/agents/providerModels.ts`);
  `cloudflare-ai-gateway` is not accepted (it cannot build a URL without
  accountId/gatewayId the BYOK UI never collects) but `providers.ts` still
  resolves stored cloudflare connections.
- Serves GraphQL query `agentsModels` for the chat's model picker: for every
  configured provider it fetches the provider's public /models endpoint
  server-side with the stored key (`fetchProviderModels` in
  `src/modules/agents/providerModels.ts`; dual `Authorization: Bearer` +
  `x-api-key` headers, 10s timeout, deduplicated sorted ids). A provider
  whose listing fails is left out of the result instead of failing the
  query, and the key never leaves the server.
- Publishes declarative permissions through `startPlugin` meta: one `agents`
  module scoped to `all` with actions `showAgents` (`always`),
  `agentsChat`, and `manageAgentsSettings` (admin-only), and default
  groups `erxes-agent:admin` (all three actions) and `erxes-agent:user`
  (`showAgents` + `agentsChat`).
- Serves the tenant-wide settings surface: GraphQL query `agentsSettings`
  (gated `showAgents`) returns the tenant's flags and mutation
  `agentsSettingsUpdate` (gated `manageAgentsSettings`) patches them.
  Today the flags are `codeModeEnabled` (default `false`) and
  `codeModeEnvironment` (enum `in-process`, default `in-process`).
- Code mode: when the tenant flag is on, the chat agent additionally
  carries the `execute_typescript` tool built by Mastra's `createCodeMode`
  with the `QuickJsCodeModeTransport` (`@mastra/quickjs`) — model-authored
  TypeScript runs in an in-process QuickJS (WebAssembly) sandbox with a
  bare global object (no filesystem, network, process, timer, or module
  access). The allow-list injected into the sandbox is
  `{ searchTools, callTool: safeCallTool }` where `safeCallTool` is a
  wrapped clone of the bridge's `callTool` that refuses approval-gated
  tool ids with a readable `APPROVAL_REQUIRED` failure — sandboxed
  programs bypass Mastra's `requireApproval` suspension, so the wrapper is
  the gate. `askUser` is excluded. Wall-clock cap: 15s
  (`AGENTS_CODE_MODE_TIMEOUT_MS`); sandbox memory/stack use the transport
  defaults (128 MiB / 1 MiB). Chat, approve, and answer routes all resolve
  the flag via `resolveCodeMode(models)` so resumed runs keep the tool.
- Streams a Mastra-agent chat over SSE: `POST /agents/chat` forwards only the
  newest client message and delegates history to Mastra `Memory`
  (`@mastra/memory` + `@mastra/mongodb` MongoDBStore) keyed by `threadId`
  (client-supplied or auto-generated, returned in the `X-Agents-Thread-Id`
  header) and the acting user id as resource. There is exactly one chat
  agent, built per request from one of the acting user's BYOK connections
  with fixed instructions and model settings (temperature 0.2,
  maxOutputTokens 2000); no agent definition documents exist and no agent
  documents are read. Each turn carries an optional `provider` (validated
  against the user's stored entries; first configured provider when
  omitted), a per-turn `model` override (never persisted), and a
  `thinkingLevel` (`off`|`minimal`|`low`|`medium`|`high`, default `off`)
  mapped to per-provider options: openai `reasoningEffort`, grok/xai
  `reasoningEffort` ('minimal' → 'low'; kimi has no verified thinking
  control and is left untouched), kimi-code Anthropic
  `thinking: { type: 'enabled', budgetTokens }` with the output-token cap
  raised so the budget never starves the visible response.
  `@mastra/ai-sdk`/`ai` convert the Mastra stream to an AI SDK v7 UI stream;
  a failed model stream is logged server-side
  (`[erxes-agent] chat stream failed:`) and the client receives the
  provider's readable error message, not a generic dead end.
- Teaches the artifact fence convention in the fixed agent instructions
  (`DEFAULT_INSTRUCTIONS` in `src/modules/agents/agent.ts`): when the user
  needs a file they can preview/download/edit, the model emits ONE complete
  fenced code block per artifact — ```html (self-contained HTML),
  ```xlsx <title> (CSV rows, first row headers), ```docx/```pdf <title>
  (a markdown subset; never a ``` fence inside the content — 4-space
  indented code instead) — with the title on the fence line. Prompt-only
  convention; the UI renders matching fences as artifact cards.
- Human-in-the-loop questions through the plugin-owned `ask_user` tool
  (`src/modules/agents/askUser.ts`, injected as `askUser` alongside the
  two-tier tool bridge; replaces Mastra's built-in single-question tool):
  the model batches one or more questions (each optionally with 2-4
  structured options and a `single_select`/`multi_select` mode) into ONE
  suspension, the tool calls `suspend({ questions })`, the run suspends
  durably in the same snapshot storage as approvals, and the suspension
  surfaces to the UI as a `data-tool-call-suspended` SSE part carrying the
  questions. `POST /agents/answer`
  (`{ threadId, answer, provider?, model?, thinkingLevel? }` → SSE)
  resumes the run via `agent.resumeStream(answer)` scoped to the newest
  suspended non-approval tool call, so the model continues with the user's
  answers; the answer is persisted ONLY as the ask_user tool result inside
  the resumed assistant message — never as its own user message — and the
  UI renders it as the answered Q&A card (questions from the tool input,
  answers from the tool result, which is exactly what survives reloads).
  `answer` is a string (single
  free-text/single-select), a string array (one multi-select question), or
  one entry per question positionally (each a string or string array); the
  tool normalizes every shape into per-question text for the model.
  Ownership is re-checked before any resume, and a run suspended on an
  approval gate is rejected with 409 (it must go through `/agents/approve`).
- Every agent run entry point passes `maxSteps: AGENTS_MAX_STEPS` (32) —
  chat `stream`, answer `resumeStream`, and `approveToolCall` /
  `declineToolCall`. Mastra's default of 5 is exhausted silently by real
  turns (searchTools discovery + code-mode iterations + the ask_user step
  counting against the resumed run's budget), which ended runs right after
  their last tool result with no final answer and nothing surfaced.
- Threads and titles are handled entirely by Mastra: the agent auto-creates a
  missing thread during `stream`, and `generateTitle: true` derives a
  descriptive title from the first user message asynchronously (agent model,
  no response-time cost). No thread creation or title code is hand-written.
- Persists conversations in a dedicated `{db}_agents_memory` sub-database
  (derived from the shared mongoose connection — no env read) through a
  library `connectorHandler`, so agents memory never collides with the
  platform's own legacy `mastra_*` collections.
- Serves read-only GraphQL queries `agentsThreads(page, perPage)` (the
  acting user's threads, newest activity first, paginated) and
  `agentsThreadDetail(threadId)` (one thread's stored messages), both gated
  by `showAgents` and ownership-scoped to the acting user (cross-user access
  is rejected), plus mutation `agentsThreadRemove(threadId)` (gated by
  `agentsChat`, deletes only the acting user's own thread via Mastra's
  `deleteThread`, then publishes `agentsThreadsChanged`). Messages are stored
  in Mastra's v7 format (assistant text is
  a JSON-string envelope with `parts`). The `agentsThreadsChanged`
  subscription is published from Mastra's native `onFinish` and
  `memory.onTitleGenerated` hooks and from the removal mutation over the
  shared Redis pubsub, so the UI
  sidebar refreshes with no manual action.
- Exposes a two-tier tool bridge to the model: exactly two Mastra tools are
  injected into the chat agent. `searchTools(intent)` ranks descriptors from
  every plugin's `/agent-tools/manifest` (merged via service discovery, cached
  per subdomain for 60s), and `callTool(toolId, input)` executes one tool as the
  acting user via `/agent-tools/call`. `callTool` declares a framework-native
  `requireApproval` predicate (true when `descriptor.destructive` or the
  plugin's always-confirm list, currently `inbox.conversations.changeStatus`),
  so Mastra itself suspends the gated call before `execute` ever runs;
  permission denials (403) and oversized responses (413) are returned to the
  model as readable tool results, not thrown.
- Durable human approval for destructive actions via Mastra's native
  tool-approval API: gated calls suspend into Mastra workflow snapshots in the
  same `{db}_agents_memory` sub-database (the per-subdomain runtime pairs
  `Memory` with a minimal `Mastra` (`logger: false, workers: false`) sharing one
  `MongoDBStore`, and the agent receives that `Mastra` instance), so approvals
  survive across HTTP requests and restarts. `POST /agents/approve` re-checks
  thread ownership, finds the newest suspended run via
  `agent.listSuspendedRuns({ threadId, resourceId })` (409 when none), then
  calls `agent.approveToolCall({ runId, toolCallId })` or
  `agent.declineToolCall({ runId, toolCallId, reason })`. Scoping is by
  Mastra's per-call `toolCallId`, so approving one held call never
  auto-approves another (a chained second destructive tool re-suspends for its
  own decision) and a decline never executes. The returned continuation stream
  is piped through the same AI SDK v7 SSE pipeline as chat.

## Architecture

| Area        | Path                                        | Responsibility                                            |
| ----------- | ------------------------------------------- | --------------------------------------------------------- |
| Bootstrap   | `src/main.ts`                               | Starts the plugin on port `3306` and registers GraphQL/tRPC |
| Runtime     | `src/connectionResolvers.ts`                | Builds tenant-scoped models per `subdomain`               |
| Agents     | `src/modules/agents`                       | Provider resolution, Mastra agent builder (per-provider thinking options), Mastra memory (dedicated sub-db), per-user multi-provider BYOK model/GraphQL, HTTP routes in `src/routes.ts` |
| Models listing | `src/modules/agents/providerModels.ts` | BYOK provider whitelist + server-side /models fetching for the chat's model picker |
| Memory      | `src/modules/agents/memory.ts`             | Per-subdomain runtime bundle: Mastra `Memory` + minimal `Mastra` (`logger: false, workers: false`) sharing one `MongoDBStore` over a `connectorHandler` targeting the dedicated `{db}_agents_memory` sub-db (threads, messages, and workflow snapshots) |
| ask_user    | `src/modules/agents/askUser.ts`            | Plugin-owned multi-question human-in-the-loop tool (batched `questions` suspension; normalizes legacy string/string[] and positional resume answers) |
| Tools       | `src/modules/agents/tools.ts`              | Two-tier Mastra tool bridge: `searchTools` (discovery + per-subdomain manifest cache) and `callTool` (execute as the acting user; framework-native `requireApproval` predicate suspends destructive/always-confirm actions before `execute`, which stays a pure runner) |
| Code mode   | `src/modules/agents/codeMode.ts`           | Builds the `execute_typescript` tool via Mastra `createCodeMode` + `QuickJsCodeModeTransport` (in-process WASM sandbox, 15s timeout); wraps `callTool` with the approval-gate refusal for the sandbox allow-list |
| Settings model | `src/modules/agents/db/definitions/settings.ts` + `db/models/Settings.ts` | Tenant-wide singleton on `agents_settings` (`codeModeEnabled`, `codeModeEnvironment`) with `getSettings`/`updateSettings` statics |
| Settings GraphQL | `src/modules/agents/graphql/schemas/settings.ts` + resolvers | `agentsSettings` query (`showAgents`) and `agentsSettingsUpdate` mutation (`manageAgentsSettings`) |
| Http        | `src/routes.ts`                             | `POST /agents/chat`, `POST /agents/approve`, `POST /agents/answer`, `POST /cf-os/connect-code`, `POST /cf-os/exchange` |
| cf-os       | `src/modules/cfos`                          | Passwordless Cloudflare OS sign-in: connect-code mint + gatekeeper exchange (`CfOsConnectCodes` model) |
| Threads GraphQL | `src/modules/agents/graphql`           | Threads schema, read resolvers, and the `agentsThreadRemove` mutation resolver |
| Thread events | `src/modules/agents/threadsEvents.ts`  | Per-user `agentsThreadsChanged` publish over the shared Redis pubsub |
| Subscription bundle | `src/apollo/subscription.ts`      | Gateway graphql-ws bundle, `withFilter` per-user |
| Permissions | `src/meta/permissions.ts`                   | `IPermissionConfig` passed to `startPlugin` via `meta`    |
| GraphQL     | `src/apollo`, `src/modules/agents/graphql` | Type definitions, queries, and mutations                  |
| Models      | `src/modules/agents/db`                    | `agentsConnectionSchema` definition and `AgentsConnection` model class |
| Types       | `src/modules/agents/@types`                | `IAgentsConnectionEntry` and `IAgentsConnectionsDocument`   |
| tRPC        | `src/trpc`                                  | `appRouter` and outbound plugin clients                   |
| Container   | `Dockerfile`                                | Two-stage Alpine runtime image for the `docker-build` target; installs only the merged shared+plugin production deps, so every runtime import (e.g. `graphql-tag` for `src/apollo/typeDefs.ts`) must be a real dependency in `package.json` |

## Contracts

### Provides

- GraphQL query `agentsConnections` returning the acting user's masked
  entries (`provider`, `model`, `hasKey`, `updatedAt`; empty list when none
  is stored). The API key is never exposed.
- GraphQL mutations `agentsConnectionUpsert(provider, model?, apiKey?)`
  (adds/replaces ONE provider's entry, opencode-style: provider + key;
  provider must be one of the four `BYOK_PROVIDERS`; the stored model is
  ALWAYS the current provider default from `getProviderDefaultModel` unless
  an explicit `model` is provided — omitting `model` refreshes stale
  entries on re-save; omitted `apiKey` keeps that provider's stored key;
  empty string clears it; rejects a keyless result; config only ever
  carries `apiKey`) and `agentsConnectionRemove(provider)` (removes exactly
  that provider's entry; deletes the document when none remain).
- GraphQL query `agentsModels` returning
  `[AgentsProviderModels { provider models }]` — every configured
  provider's model ids, fetched server-side from the provider's /models
  endpoint with the stored key; a failing provider is omitted, and the
  result is empty (no fetch) when nothing is configured.
- Permission actions `showAgents` and `agentsChat`, the admin-only
  `manageAgentsSettings`, and default groups `erxes-agent:admin` /
  `erxes-agent:user`, declared through `startPlugin` meta permissions.
- GraphQL query `agentsSettings` returning the tenant's
  `AgentsSettings { codeModeEnabled codeModeEnvironment updatedAt }` and
  mutation `agentsSettingsUpdate(codeModeEnabled: Boolean,
  codeModeEnvironment: String)` (at least one field required;
  `codeModeEnvironment` validated against `AGENTS_CODE_MODE_ENVIRONMENTS`,
  currently `in-process`).
- tRPC namespace `erxesAgent` exposing a single `hello` query.
- No tRPC procedure is annotated with `.meta({ agent })`, so this plugin
  currently exposes no agent-callable tools of its own.
- Consumes other plugins' agent tools through the agents module's two-tier
  bridge (`src/modules/agents/tools.ts`): `searchTools` reads each service's
  `/agent-tools/manifest`; `callTool` posts to the owning service's
  `/agent-tools/call` with an HMAC header minted per acting user.
- HTTP routes on port `3306`: `POST /agents/chat` (SSE — returns the thread
  id in the `X-Agents-Thread-Id` header; optional `provider`/`model`/
  `thinkingLevel` body fields select the turn's connection, model override
  and thinking depth; 400 `Add your API key to start using Agents.` when
  the acting user has no stored BYOK connection and 400 `No connection
  stored for provider "x". Add it under Settings → API key.` for an
  unconfigured provider),
  `POST /agents/approve`
  (`{ threadId, approved, reason?, provider?, model?, thinkingLevel? }` →
  SSE; the resumed run continues on the same provider/model/thinking the UI
  used for the suspended turn; approves or declines the thread's newest
  suspended tool call via Mastra's native
  `approveToolCall`/`declineToolCall`; 401/400/403/404/409/500 error contract),
  each requiring the gateway `user` header. All responses echo the request origin
  with `Access-Control-Allow-Credentials: true` (via `startPlugin`
  `corsOptions`) so credentialed cross-origin browser fetches succeed. The
  former `/agents/spike/*` probe routes were removed.
- HTTP route `POST /agents/answer`
  (`{ threadId, answer, provider?, model?, thinkingLevel? }` → SSE):
  resumes the thread's newest suspended **ask_user** run with the user's
  answer. `answer` must be a non-empty string (free-text / single-select)
  or a non-empty string array (multi-select); blanks are trimmed. 401
  unauthenticated, 400 missing threadId or invalid answer, 404 unknown
  thread, 403 foreign thread, 409 when nothing is suspended or the
  suspension is an approval gate (must go through `/agents/approve`), 500
  unexpected. The resumed run continues on the same
  provider/model/thinking the UI used for the suspended turn.
- GraphQL query `agentsThreads(page, perPage)` returning
  `AgentsThreadList { threads { id title createdAt updatedAt } total page
  perPage hasMore }` (1-based `page`), and GraphQL query
  `agentsThreadDetail(threadId)` returning `{ thread, messages }` —
  `NOT_FOUND` for a missing thread and `FORBIDDEN` "Thread belongs to another
  user." for a foreign thread. Both are gated by `showAgents` and
  ownership-scoped to the acting user.
- GraphQL mutation `agentsThreadRemove(threadId)` returning `Boolean` —
  `NOT_FOUND` for a missing thread and `FORBIDDEN` "Thread belongs to another
  user." for a foreign thread. Gated by `agentsChat` and ownership-scoped to
  the acting user; deletes through Mastra's `deleteThread` and publishes
  `agentsThreadsChanged` on success.
- GraphQL subscription `agentsThreadsChanged { userId }`, delivered through
  the gateway's graphql-ws subscription server from this plugin's
  subscription bundle (`src/apollo/subscription.ts`).

### Consumes

- Value bindings of `erxes-api-shared/utils` via direct static named imports
  (the plugin compiles as CommonJS, so `require` consumes them natively):
  `startPlugin`, `apolloCommonTypes`, `apolloCustomScalars`,
  `createGenerateModels`, `getPlugin`,
  `getPluginAddress`, `getPlugins`, `isEnabled`, `extractUserFromHeader`,
  `getSubdomain`, `encodeAgentToolsAuthHeader`, `agentToolsAuthHeaderName`,
  `ExpectedError`, and `graphqlPubsub` (transient per-user PUBLISH on the
  `agentsThreadsChanged` channel).
- Types via `import type`: `ITRPCContext` (`erxes-api-shared/utils`),
  `IMainContext` and `IPermissionConfig` (`erxes-api-shared/core-types`), and
  `IAiAgent*` (`erxes-api-shared/core-modules`). Type-only imports of ESM-only packages
  (`ai`, `@mastra/core/llm`, `@mastra/core/agent`, `@mastra/core/memory`,
  `@mastra/mongodb`) carry a
  `'resolution-mode': 'import'` attribute, as nodenext requires from CommonJS
  files.
- The ESM-only AI runtime packages are loaded exclusively through standard
  dynamic `await import(...)`: `@mastra/core/agent` and `@mastra/ai-sdk`
  (in the agent builder/routes), `ai` (route streaming), `@mastra/memory`
  and `@mastra/mongodb` (agents memory), `@mastra/core/tools` (the two-tier
  tool factory in `tools.ts`), `@mastra/core/request-context` (the acting-user
  `RequestContext` stamped in `src/routes.ts`), and
  `@ai-sdk/anthropic` (kimi-code provider models).

## Data and State

- Tenant-scoped Mongoose models are generated per request `subdomain` through
  `generateModels`.
- One Mongo model is registered: `AgentsConnection` on collection
  `agents_user_connections`, defined by `agentsConnectionSchema`
  (`userId` required/unique, `connections` array of
  `{ provider, model, config }` subdocuments, `timestamps: true`), holding
  one BYOK connections document per user per tenant with an entry per
  configured provider. Documents from the previous single-connection shape
  are lazily normalized on read and fully rewritten on the next write; no
  separate migration runs.
- A second Mongo model, `CfOsConnectCodes` on collection `cf_os_connect_codes`
  (hashed single-use cf-os sign-in codes with a TTL index on `expiresAt`),
  backs the `cfos` module's passwordless sign-in routes; it is the only
  non-BYOK write surface this plugin owns.
- A third Mongo model, `AgentsSettings` on collection `agents_settings`
  (tenant-wide singleton; `codeModeEnabled` + `codeModeEnvironment` with
  schema defaults, created on first read/write) backs the admin settings
  surface and the code-mode flag. This new write surface was explicitly
  requested and approved by the user when choosing tenant-wide admin
  control for code mode.
- Conversation state (threads, messages, indexes) and durable approval
  snapshots (`mastra_workflow_snapshot`) are owned entirely by Mastra
  `Memory`/`MongoDBStore` (store id `erxes-agent-store`) in the dedicated
  `{db}_agents_memory` database
  (derived from `mongoose.connection.db.databaseName`); no custom thread,
  message, or approval models exist.
- An in-process `Map<subdomain, Promise<IAgentsRuntime>>` caches one runtime
  bundle (`{ memory, mastra }`) per subdomain so store initialization/index
  creation runs at most once; failed creations are evicted so the next request
  retries. `getAgentsMemory` delegates to the bundle's `memory`.
- The `agentsThreadsChanged` subscription event is a transient Redis
  `PUBLISH` on one channel carrying only `{ userId }` — no new Redis keys,
  queues, or collections — and the thread list/detail queries are pure reads
  that add no models.
- No migrations exist yet.

## Local Invariants

- Write ship-stable code: prefer framework-native APIs and existing platform
  contracts over custom mechanisms (for example, Mastra-native tool approval
  instead of hand-rolled suspend/resume).
- Never introduce a new write surface (Mongo collection, Redis key or queue,
  log pipeline) without discussing it with the user first.
- Preserve tenant isolation by resolving models from the request `subdomain` in
  every resolver, service, worker, and route.
- Define schemas with `new Schema(...)`; never introduce `schemaWrapper`.
- The tRPC router key must remain a valid JavaScript identifier
  (`erxesAgent`). The kebab-case plugin name `erxes-agent` is not a
  valid unquoted object key and produces a parse error.
- `startPlugin` must keep `corsOptions: { credentials: true, origin: true }`.
  The agents UI authenticates with the httpOnly `auth-token` cookie via
  `credentials: 'include'`; the plugin's proxied CORS headers win over the
  gateway's, and default `cors()` (`Access-Control-Allow-Origin: *`) makes
  browsers reject every credentialed response ("Failed to fetch").
- Resolvers take `(parent, args, context)`; read `models` from the third
  argument only. Reading it from the second silently yields `undefined`.
- Port `3306` must stay unique across `backend/plugins/*/src/main.ts`. The
  generator default `33010` is already used by `agent_api`, `blocktest_api`,
  and `insurance_api`.
- Agent tool annotations are admit-only: a procedure is invisible to agents
  unless it explicitly declares `.meta({ agent: { description, permission } })`.
- Tenant tool curation is intentionally **default-open**; there is deliberately
  no plugin-side allow/deny list, curation storage, or curation GraphQL
  setter. Tool exposure is already curated by the platform's admit-only tRPC
  annotation (only procedures declaring `.meta({ agent: { description,
  permission } })` reach `/agent-tools/manifest`), and execution is
  additionally enforced by the owning service's per-user permission check at
  `/agent-tools/call`. `searchTools` therefore returns every ranked manifest
  match and `callTool` routes any `toolId` present in the manifest. Do not
  build plugin-side curation unless it is explicitly re-requested.
- Anthropic-protocol providers (`kimi-code`) need URL and header normalization
  that differs from the platform bridge. `@ai-sdk/anthropic` requests
  `${baseURL}/messages` and only auto-appends `/v1` when `baseURL` is exactly
  `https://api.anthropic.com`, whereas the platform bridge requests
  `${baseUrl}/v1/messages`. The stored connection `baseUrl` is therefore
  pre-normalized to end with `/v1` so both clients hit the same endpoint;
  without it the provider returns HTTP 404 `resource_not_found_error`. The
  platform also authenticates with **both** `Authorization: Bearer` and
  `x-api-key`, so the plugin sends both; connection-level headers win on
  conflict. Never pass `authToken` alongside `apiKey` — `createAnthropic`
  throws.
- OpenAI on its default endpoint must be built WITHOUT a `url` in the Mastra
  model config (`createModelConfig` in `src/modules/agents/providers.ts`):
  a `url` forces Mastra's generic openai-compatible Chat Completions client,
  which maps `maxOutputTokens` to `max_tokens` — a parameter OpenAI's
  reasoning models (the gpt-5 family, e.g. `gpt-5.6-luna`) reject with a
  400 — and it cannot express `max_completion_tokens`. Without `url`,
  Mastra resolves `openai/*` through its native OpenAI Responses client,
  which maps model settings correctly for reasoning models. Only a
  connection that explicitly overrides the OpenAI endpoint (proxy) keeps
  the openai-compatible path. Do not "simplify" this by re-adding the
  default url.
- A failed model stream must surface its real cause: `pipeAgentStream`'s
  `onError` logs the underlying error server-side
  (`[erxes-agent] chat stream failed:`) and forwards the provider's
  readable message to the client. Provider error bodies contain no secrets
  (the API key never appears in one). Do not replace this with a generic
  message — it makes every provider failure undiagnosable.
- The API gateway proxies Server-Sent Events **without buffering** (verified:
  1s-spaced chunks arrive 1s apart through `/pl:erxes-agent/...` with
  roughly 9ms added latency). SSE is therefore a safe transport here even
  though no other backend service uses it. Do not add response compression or
  `selfHandleResponse` to that proxy path, and never wrap a streaming route in
  `apiHandlers` — that wrapper awaits completion via `logHandler`.
- The plugin compiles as CommonJS under `"module": "nodenext"` /
  `"moduleResolution": "nodenext"` with no `"type": "module"` field in
  `package.json`. ESM-only AI packages (`ai`, `@mastra/core/*`,
  `@mastra/ai-sdk`, `@ai-sdk/anthropic`) must never be statically imported as
  values; load them with `await import(...)` at the point of use. With plain
  `"module": "commonjs"`, TypeScript downlevels `import()` into `require()`,
  which cannot load ESM-only packages — do not narrow the module setting.
- There is no local CJS/ESM interop shim: no namespace-unwrap helper,
  synthetic-default guard, `createRequire`, or hand-written `require()` exists
  for `erxes-api-shared`. Restore direct named imports instead.
- No environment variables: provider credentials/secrets are never read from
  env or `.env`. They live only on the per-user BYOK connection document
  written by `agentsConnectionUpsert`; `src/modules/agents/providers.ts`
  resolves config-only values, with public endpoint/model constants as the
  sole non-secret fallbacks. Never reintroduce `getEnv`/`process.env` here,
  and never echo secret values into errors, logs, or GraphQL responses
  (reads expose only `hasKey`).
- BYOK storage is multi-provider: one document per user, one entry per
  provider in its `connections` array — keep every read/write operating on
  the array (never restore a single top-level `connection` field; the lazy
  normalizer exists only to absorb legacy documents). The BYOK whitelist is
  `BYOK_PROVIDERS` in `src/modules/agents/providerModels.ts` — exactly
  `openai`, `grok`, `kimi`, `kimi-code`; it is the single source for the
  upsert mutation's provider validation. The API key never leaves the
  server and must never appear in an error message. The BYOK surface
  carries no `baseUrl`; `providers.ts` still resolves `config.baseUrl` and
  `cloudflare-ai-gateway` for stored/agent connections only.
- Model listing (`agentsModels`) is a server-side read: fetch
  `PROVIDER_MODELS_ENDPOINTS` with the stored key, dedupe + sort ids, and
  swallow per-provider failures so one bad key never breaks the picker;
  never expose keys, raw provider errors, or endpoints that were not
  fetched for a configured provider.
- The stored model must always track the current provider default: the
  upsert resolves a missing `model` to `getProviderDefaultModel(provider)`
  — NEVER to the previously stored model — so re-saving (key rotation)
  refreshes entries whose model predates a default change, and the UI can
  display the stored model truthfully. An explicit `model` argument still
  overrides, and the chat's per-turn override is never persisted. The
  `PROVIDER_DEFAULTS` map in `providers.ts` is the single backend source;
  the frontend's `PROVIDER_OPTIONS.defaultModel` display copy must be kept
  in sync with it.
- Thinking levels are a fixed normalized enum
  (`off|minimal|low|medium|high`, default `off`) mapped in
  `agent.ts` to per-provider `providerOptions` (openai `reasoningEffort`;
  xai/grok `reasoningEffort` with 'minimal' → 'low'; kimi untouched — no
  verified control; kimi-code Anthropic `thinking.budgetTokens` capped to
  stay below the output-token budget, whose cap is raised when thinking is
  on). Do not pass raw thinking values to providers.
- Code mode is security-sensitive. The sandbox allow-list must stay
  `{ searchTools, callTool: safeCallTool }` and must NEVER include
  `askUser` (suspending from inside a sandboxed program has unverified
  semantics). `safeCallTool` must keep refusing gated tool ids
  (`isGatedAgentToolCall`: manifest-destructive or always-confirm) —
  Mastra's code-mode dispatcher invokes `tool.execute` directly, so
  `requireApproval` never runs for `external_*` calls and the wrapper is
  the only gate. The wrapper fails closed when the request context is
  missing. Keep the wall-clock cap (`AGENTS_CODE_MODE_TIMEOUT_MS = 15000`)
  and the QuickJS transport's default memory/stack bounds; the QuickJS WASM
  boundary is what denies filesystem/network/process access to guest code —
  never pass host capabilities beyond the allow-listed tools.
- `agentsSettingsUpdate` stays gated by the admin-only
  `manageAgentsSettings` action (granted only to the `erxes-agent:admin`
  default group). The `agentsSettings` read stays gated by `showAgents`
  because the flag shapes every user's chat. New environments must extend
  `AGENTS_CODE_MODE_ENVIRONMENTS` (single source shared by the schema enum
  and resolver validation).
- The code-mode tool is built once per process
  (`buildCodeModeAddition` memoizes) wrapping the process-wide bridge
  tools; the tenant flag is resolved per request by the routes
  (`resolveCodeMode(models)`) and passed into `buildAgentsAgent`, so
  chat/approve/answer all keep (or lose) the tool together.
- In jest, `ts-blank-space` is mapped to a callable CJS stub
  (`src/modules/agents/__tests__/__stubs__/ts-blank-space.js`):
  `@mastra/quickjs@0.1.0`'s CJS bundle misuses esbuild's `__toESM(mod, 1)`
  against the real ESM-only package (`.default` is the namespace, not the
  function), and loading its ESM entry drags in real-ESM loading plus the
  WASM loader's dynamic imports. Test programs are plain JS, so identity
  passthrough is equivalent; production uses the real ESM package. The
  jest run needs `NODE_OPTIONS=--experimental-vm-modules` for the
  `@jitl/quickjs-wasmfile-release-sync` variant's dynamic import.
- Agents memory must stay in the dedicated `{db}_agents_memory` sub-database
  resolved via `mongoose.connection.useDb(...)` — never the shared
  `mastra_threads`/`mastra_messages` collections in the base DB. Those hold
  legacy-format rows (old `threadId`/`agentId`/`userId` schema, no `id`
  field) from an earlier platform Mastra integration; the current store's
  required unique index on `{id}` cannot be created over them. The store's
  `connectorHandler` reuses the single mongoose client (no second pool, no
  env) and keeps `close()` a no-op because the platform owns the connection
  lifecycle.
- Chat forwards only the newest client message with an explicit
  `memory: { thread, resource }` option. Sending the full transcript would
  duplicate stored messages and risk ordering conflicts with stored
  timestamps. Mastra auto-creates missing threads and derives their titles,
  so the plugin never pre-creates or titles them itself. The resulting
  thread id is returned via the `X-Agents-Thread-Id` header; the resource is
  the acting user id, and any cross-user thread access must 403 — this
  ownership check is the only thread-handling logic kept server-side.
- Thread reads must stay read-only and ownership-scoped: `agentsThreads`
  filters by the acting user id, and `agentsThreadDetail` throws for foreign
  threads, masking their existence. `agentsThreadRemove` follows the same
  ownership pattern (`getThreadById` → `NOT_FOUND` → `FORBIDDEN`) before
  calling Mastra's `deleteThread`, and never deletes a foreign thread.
- Publishes to `agentsThreadsChanged` must stay transient per-user events
  carrying only `{ userId }`, fired from Mastra's native
  `onFinish`/`onTitleGenerated` hooks and from `agentsThreadRemove` after a
  successful deletion — never add other manual publish points or
  new Redis state.
- `src/apollo/subscription.ts` must contain NO TypeScript-only syntax (no
  interfaces, no type annotations, no casts): the gateway downloads it from
  `/subscriptionPlugin.js`, saves it with a `.js` extension, and parses it as
  JavaScript, so TS syntax crashes the gateway with TS8006/TS8010. Keep it in
  block_api's plain-JavaScript bundle style.
- Approval uses Mastra's native tool-approval API, not a hand-rolled
  suspend/resume: `callTool` declares a `requireApproval` predicate that reads
  the acting user's `subdomain` off the approval context plus the call's
  `toolId`, and gates on `descriptor.destructive` or the always-confirm list,
  so Mastra suspends the gated call before `execute` runs and the executor
  stays a pure runner. Note the two request-context shapes: inside
  `requireApproval` the `ctx.requestContext` is a **plain record** (read with
  property access, `ctx.requestContext.subdomain`), whereas inside `execute`
  the `context.requestContext` is a `RequestContext` instance (read with
  `.get('subdomain')`) — do not mix the two access patterns. The approve route
  accepts only `threadId`/`approved`/`reason`, re-checks thread
  ownership before any resume, and discovers the run through
  `agent.listSuspendedRuns({ threadId, resourceId })` (newest first) rather
  than trusting a client-supplied run id; it then calls
  `agent.approveToolCall({ runId, toolCallId })` or
  `agent.declineToolCall({ runId, toolCallId, reason })`. Scoping is by
  Mastra's per-call `toolCallId`, so approving one held call never
  auto-approves another and a decline never executes. Approval gating and
  execution both derive from the same per-subdomain manifest, and the owning
  service independently enforces the admit-only permission check, so a tool
  missing from the manifest cannot be executed destructively either. The
  always-confirm list exists because some platform mutations are declared as
  queries and would otherwise escape the `destructive` flag — keep it in sync
  with the platform's agent-tool annotations. The runtime `Mastra` is built
  with `workers: false`; native `requireApproval` suspend,
  `approveToolCall`/`declineToolCall` resume, chained-call re-suspension, and
  parallel read+destructive steps were all verified against real Mastra with a
  mock LLM without workers, so do not enable workers (and their scheduler
  machinery) without re-verifying the need.

## Validation

- `pnpm nx lint erxes-agent_api`
- `pnpm nx test erxes-agent_api`
- Focused run without Nx (from the repository root; the
  `NODE_OPTIONS` flag is required by the QuickJS WASM loader):
  `NODE_OPTIONS=--experimental-vm-modules pnpm exec jest --config
  backend/plugins/erxes-agent_api/jest.config.ts --runInBand --forceExit`
  (9 suites, 156 tests: tool bridge incl. the `requireApproval` predicate
  and pure executor and the shared `isGatedAgentToolCall` gate, agent-tools
  client, HTTP routes auth/isolation incl. the approve/decline contract and
  the tenant code-mode flag on chat/approve/answer, the ask-user
  answer/resume contract and the BYOK no-connection 400, the code-mode
  sandbox incl. real QuickJS execution, host-capability denial and the
  gated-tool refusal, provider
  resolution incl. the OpenAI native-path/proxy split, memory/runtime
  lifecycle, BYOK multi-provider connection resolvers incl. the
  server-side models listing and the stale-model re-save refresh, tenant
  settings resolvers incl. the admin-only gating, thread list/detail
  resolvers, and the `agentsThreadRemove` mutation).
- `pnpm nx build erxes-agent_api` passes (the earlier repo-wide
  `erxes-api-shared:build` failure has been resolved upstream of this
  plugin).
- `cd backend/plugins/erxes-agent_api && npx tsc --project tsconfig.json --noEmit`
  compiles this plugin cleanly and is the reliable local type check. Under
  nodenext, un-exported deep imports need
  narrowly scoped `paths` entries to real declaration files
  (`@apollo/server/dist/esm/express4` → its `dist/cjs` declaration twin), and
  type-only imports of ESM-only packages need `'resolution-mode': 'import'`.
- **Never run an emitting `tsc` (`pnpm build`, `tsc -p tsconfig.build.json`)
  locally while `backend/erxes-api-shared/dist` is empty.** The shared
  package's stub declarations re-export its `.ts` sources, so those sources are
  pulled into this plugin's program and `tsc` writes `.js`, `.d.ts`, and
  `.js.map` artifacts *beside them* inside `backend/erxes-api-shared/src`. Those
  emitted `.js` files shadow the real sources and break other services in dev.
  Use `--noEmit` for local type checks. If artifacts appear, remove them with
  `git status --porcelain backend/erxes-api-shared` and delete every untracked
  `.js` / `.d.ts` / `.js.map` before continuing.
- Dev boot must run through `pnpm nx serve erxes-agent_api` (or `pnpm dev`
  from the plugin directory). Running `tsx` on `src/main.ts` from the repository
  root fails with `MODULE_NOT_FOUND` for
  `erxes-api-shared/utils`, because tsx then loads the root `tsconfig.json` and
  loses this plugin's `erxes-api-shared/*` → source `paths` mapping, falling
  back to the empty `dist`.
- Smoke scenario: start the service and confirm it registers as
  `erxes-agent` on port `3306`, then save two BYOK connections with
  `agentsConnectionUpsert(provider: "openai", apiKey: "...")` and
  `agentsConnectionUpsert(provider: "grok", apiKey: "...")`; re-read
  `agentsConnections` (two masked entries) and `agentsModels` (both
  providers' model lists, fetched server-side) without a restart.
- Verified boot signature (Phase 0 gate): `/health` returns HTTP 200 `ok`,
  the log shows `erxes-agent graphql api ready at
  http://localhost:3306/graphql`, `Connected to the database`, and
  `erxes-service erxes-agent joined with http://localhost:3306`.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-09-01` — Restore `graphql-tag` as a real runtime dependency

- **Summary:** The BYOK rewrite dropped `graphql-tag` from `package.json`
  while `src/apollo/typeDefs.ts` still imports it; monorepo-wide installs
  masked the loss via hoisting, but the Docker image installs only the
  merged shared+plugin production deps, so the `latest` image crashed at
  boot with `MODULE_NOT_FOUND: graphql-tag` and the Swarm update rolled
  back. `graphql-tag@^2.12.6` is restored (same fix as oroltsoo in
  `4700365457`).
- **Affected areas:** `package.json` (runtime dependency only).
- **Contracts changed:** None.

### `2026-08-31` — Serialize `build:packageJson` behind the shared lib build

- **Summary:** The `build:packageJson` target could start compiling the
  plugin while `erxes-api-shared:build` (preconstruct) was still rewriting
  the shared dist, racing on the generated declaration chain and failing
  the build with spurious TS2305/TS2307 errors; the target now depends on
  `^build`.
- **Affected areas:** `project.json` (`build:packageJson.dependsOn`).
- **Contracts changed:** None (build orchestration only).

### `2026-08-31` — Answer resume no longer stores a duplicate user message

- **Summary:** `POST /agents/answer` resumes the suspended ask_user run
  without first saving the answer as its own user message: the answer
  already survives inside the ask_user tool result of the resumed assistant
  message, and the UI now renders it as the answered Q&A card instead of a
  user bubble — the extra message duplicated model context and the stored
  transcript.
- **Affected areas:** `src/routes.ts` (`/agents/answer`),
  `src/__tests__/routes.test.ts`.
- **Contracts changed:** None (same endpoint, payload, and resume
  behavior; only the persisted-message side effect was removed).

### `2026-08-31` — Artifact fence convention in the fixed agent instructions

- **Summary:** `DEFAULT_INSTRUCTIONS` (the chat agent's fixed
  instructions) gained a prompt-only convention: file deliverables are
  emitted as ONE complete tagged fence per artifact — ```html
  (self-contained HTML), ```xlsx <title> (CSV rows, first row = header),
  ```docx/```pdf <title> (a markdown subset; no ``` fences inside the
  content, indented code instead) — with the title on the fence line, so
  the agents UI renders them as preview/download artifact cards. No schema,
  route, tool, or model changes.
- **Affected areas:** `src/modules/agents/agent.ts`
  (`DEFAULT_INSTRUCTIONS` only).
- **Contracts changed:** None (system-prompt text only).

### `2026-08-31` — Ask_user answer durability and the agent step budget

- **Summary:** Fixed ask_user answers vanishing on reload and resumed runs
  dying after tool results: `POST /agents/answer` now persists the answer
  as a real user message via `memory.saveMessages` before resuming
  (formatted identically to the UI bubble), and every agent run entry point
  (chat `stream`, answer `resumeStream`, `approveToolCall`,
  `declineToolCall`) passes `maxSteps: AGENTS_MAX_STEPS` (32) instead of
  Mastra's default 5, which real turns (searchTools discovery + code-mode
  iterations + the resumed ask_user step) exhausted silently — the run
  stopped right after its last tool result with no final answer.
- **Affected areas:** `src/routes.ts` (`AGENTS_MAX_STEPS`, answer
  persistence + typed answer normalization),
  `src/__tests__/routes.test.ts` (`saveMessages` fake, persistence and
  maxSteps assertions).
- **Contracts changed:** `POST /agents/answer` now writes one user message
  to thread memory before resuming (no request/response wire change); all
  four agent-run entry points carry an explicit `maxSteps`.

### `2026-08-31` — Code mode: sandboxed agent code execution behind a tenant-wide admin toggle

- **Summary:** Added code mode: when an admin enables it
  (`agentsSettingsUpdate` gated by the new admin-only
  `manageAgentsSettings` action, stored on the new tenant singleton
  `agents_settings`), the chat agent additionally carries the
  `execute_typescript` tool — model-authored TypeScript runs in-process in
  a QuickJS (WASM) sandbox via Mastra's `createCodeMode` +
  `QuickJsCodeModeTransport` (`@mastra/quickjs`), orchestrating the bridge
  tools as `external_*` functions. Because the code-mode dispatcher calls
  `tool.execute` directly (bypassing `requireApproval`), the sandbox
  allow-list carries a wrapped `callTool` refusing gated tool ids with
  `APPROVAL_REQUIRED`; `askUser` is excluded; 15s timeout; chat/approve/
  answer all resolve the flag so resumed runs keep the tool. Also
  extracted the shared `isGatedAgentToolCall` gate in `tools.ts`.
- **Affected areas:** `src/modules/agents/codeMode.ts` (new),
  `db/definitions/settings.ts` + `db/models/Settings.ts` (new),
  `graphql/schemas/settings.ts` + `graphql/resolvers/{queries,mutations}/settings.ts`
  (new), `@types/settings.ts` (new), `tools.ts` (gate extraction),
  `agent.ts` (codeMode input + tool/instructions merge), `routes.ts`
  (`resolveCodeMode` on all three routes), `connectionResolvers.ts`
  (`AgentsSettings` registration), `meta/permissions.ts` (new action +
  admin group), `package.json` (+`@mastra/quickjs`), `jest.config.ts` +
  `tsconfig.spec.json` + the `ts-blank-space` test stub,
  `src/__tests__/routes.test.ts`,
  `src/modules/agents/__tests__/{tools,codeMode,settingsResolvers}.test.ts`.
- **Contracts changed:** Added GraphQL `agentsSettings` /
  `agentsSettingsUpdate` and permission action `manageAgentsSettings`
  (admin default group only); new collection `agents_settings`; chat,
  approve, and answer agent builds now carry the extra
  `execute_typescript` tool when the tenant flag is on (no REST wire
  changes).

### `2026-08-31` — Multi-question ask_user tool (plugin-owned)

- **Summary:** Replaced Mastra's built-in single-question `ask_user` with
  the plugin-owned tool at `src/modules/agents/askUser.ts`: the model now
  batches up to 5 questions into ONE suspension (`questions` array, each
  with its own options/selectionMode), so a multi-question step no longer
  pauses the run once per question. Suspend payload is `{ questions }`;
  `POST /agents/answer` validation now also accepts per-question positional
  answer arrays (each element a string or string array), and the tool
  normalizes legacy string/string[] and positional resume data into
  per-question text for the model. Agent instructions teach batching.
- **Affected areas:** `src/modules/agents/askUser.ts` (new),
  `src/modules/agents/agent.ts`, `src/routes.ts`,
  `src/__tests__/routes.test.ts` (+1 positional-answer resume test, updated
  400 message assertions).
- **Contracts changed:** `POST /agents/answer` `answer` additionally accepts
  an array of per-question answers (string or string[] each); the
  `data-tool-call-suspended` payload is now `{ questions: [...] }` instead
  of a single `{ question, options, selectionMode }`.

### `2026-08-31` — cf-os passwordless sign-in kept alive on the BYOK plugin

- **Summary:** The BYOK rewrite replaces the legacy runtime wholesale,
  and the cf-os passwordless dashboard sign-in (legacy commit
  `25a929c82c`) lives inside this plugin: `cf_os_ui` calls
  `/pl:erxes-agent/cf-os/connect-code`. The `src/modules/cfos` module is
  therefore kept, with the `CfOsConnectCodes` model (collection
  `cf_os_connect_codes`, hashed single-use codes with a TTL index)
  registered in `IModels`/`loadClasses`, and `registerCfOsRoutes(router)`
  mounting `POST /cf-os/connect-code` (dashboard mint) and
  `POST /cf-os/exchange` (gatekeeper-only, `x-cf-os-secret`) — the
  feature stays alive on the rewritten plugin.
- **Affected areas:** `src/connectionResolvers.ts`, `src/routes.ts`,
  `src/modules/cfos/**` (merged in), `AGENTS.md`.
- **Contracts changed:** HTTP routes `POST /cf-os/connect-code` and
  `POST /cf-os/exchange` now served by this plugin (unchanged wire contract
  from `25a929c82c`); new `CfOsConnectCodes` model on
  `cf_os_connect_codes`.

### `2026-08-31` — ask_user human-in-the-loop + Mastra patch bump

- **Summary:** The chat agent now carries Mastra's built-in `ask_user` tool
  (injected as `askUser`, id `ask_user`) alongside the two-tier tool bridge,
  with instructions teaching when to ask. A question suspends the run
  durably (same snapshot storage as approvals) and surfaces as a
  `data-tool-call-suspended` SSE part; the new `POST /agents/answer` route
  (`{ threadId, answer, provider?, model?, thinkingLevel? }` → SSE) resumes
  via `agent.resumeStream(answer)` after re-checking thread ownership,
  rejecting (409) runs suspended on approval gates, and validating the
  answer (non-empty string or string array, trimmed). Mastra deps bumped:
  `@mastra/core` 1.63.0→1.63.2, `@mastra/memory` 1.28.0→1.28.1,
  `@mastra/mongodb` 1.18.2→1.18.4 (`@mastra/ai-sdk` 1.10.0 unchanged).
- **Affected areas:** `src/modules/agents/agent.ts` (askUser injection +
  instructions), `src/routes.ts` (`/agents/answer` + shared
  `findSuspendedToolCall` discovery), `package.json`,
  `src/__tests__/routes.test.ts` (+17 tests, now 133 total).
- **Contracts changed:** Added HTTP `POST /agents/answer`; the agent's tool
  set now includes `askUser`; suspension SSE now includes
  `data-tool-call-suspended` parts (ask_user) in addition to
  `data-tool-call-approval`.

### `2026-08-30` — Stored model always tracks the current provider default

- **Summary:** `agentsConnectionUpsert` now resolves a missing `model`
  argument straight to `getProviderDefaultModel(provider)` instead of first
  falling back to the previously stored model, so re-saving a connection
  (e.g. rotating a key) refreshes an entry whose stored model predates a
  default change — openai re-saves now always store `gpt-5.6-luna`. An
  explicit `model` argument still overrides, and the chat's per-turn model
  override remains unpersisted. Complements the frontend's new
  always-visible model display (stored model in parentheses in the settings
  entries, default model on provider cards and the chat picker's Auto
  entry).
- **Affected areas:**
  `src/modules/agents/graphql/resolvers/mutations/connection.ts`,
  `src/modules/agents/__tests__/connectionResolvers.test.ts` (+1 test, now
  116 total).
- **Contracts changed:** None (the mutation's signature and types are
  unchanged; only the server-side default resolution for an omitted
  `model`).

