# `agent_api` Plugin Guide

## Identity

- **Plugin:** `agent`
- **Project:** `agent_api`
- **Layer:** `Backend API`
- **Path:** `backend/plugins/agent_api`
- **Last synchronized:** `2026-08-24`

## Scope

### Owns

- AI Assistant (managed OpenClaw) lifecycle: deploy, managed provisioning,
  retry, approve, restart, destroy, and cross-SaaS transfer.
- Assistant LLM connection management (API-key and subscription credential
  modes, provider catalog, device-code subscription auth).
- Assistant runtime proxying (skills, plugins, diagnostics, health) and
  Discord gateway integration for assistants.
- Assistant organization identifiers (`assistantOrg` module) and the OpenCode
  coder variant (`opencode` module).

### Does not own

- The managed deployer service itself (separate repo: openclaw-deployer);
  this plugin only calls its HTTP API.
- The runtime pods/servers; they are reached only through the deployer and
  the runtime's authenticated HTTP endpoints.
- Frontend UI (see `frontend/private-plugins/agent_ui`).

## Current Capabilities

- `deployManagedAgent` provisions or retries a managed runtime through the
  deployer; a retry that omits provider/credentialMode/model reuses the
  stored `AgentServer` values instead of resetting to kimi/api_key defaults.
- `agentRuntimeHealth` query reports whether an approved runtime answers its
  authenticated health endpoint (used by the UI to gate the chat iframe).
- Transfer: `createAgentTransferCredentials` exports server credentials
  (including provider/model/credentialMode) and stamps
  `transferCredentialsIssuedAt`; `transferAgent` validates the runtime is
  reachable (health probe) and that the pasted gateway token matches the
  deployer's live token before linking, and persists the transferred LLM
  connection metadata; `destroyAgent` skips server teardown when transfer
  credentials were issued (the server may be shared).
- `getAgent` refreshes the live gateway token from the deployer for approved
  agents only (pending/failed records skip the deployer call).
- All deployer calls attach the `x-erxes-managed-deployer-secret` header via
  `deployerHeaders()`.

## Architecture

| Area | Path | Responsibility |
| ---- | ---- | -------------- |
| Entry | `src/main.ts` | `startPlugin` (name `agent`, port 33010), cron init |
| Agent GraphQL | `src/modules/agent/graphql/` | schemas, query/mutation resolvers |
| Deployer client | `src/modules/agent/utils.ts` | deployer HTTP calls, `deployerHeaders`, `verifyManagedRuntime`, `probeManagedRuntimeHealth` |
| LLM providers | `src/modules/agent/managedLlmProviders.ts` | provider catalog, connection/credential-mode resolution |
| Runtime client | `src/modules/agent/runtimeClient.ts` | authenticated runtime operations |
| Discord | `src/modules/agent/discordGatewayClient.ts` | Discord gateway service calls |
| Identifiers | `src/modules/assistantOrg/` | assistant org identifiers, access control, deletion cron |
| OpenCode | `src/modules/opencode/` | OpenCode coder variant |

## Contracts

### Provides

- GraphQL (via gateway federation): `getAgent`, `agentRuntimeHealth`,
  `deployManagedAgent`, `transferAgent`, `createAgentTransferCredentials`,
  `destroyAgent`, `setAgentLlmConnection`, `startAgentLlmSubscriptionAuth`,
  runtime/discord queries and mutations (see `graphql/schemas/agent.ts`).
- tRPC router (`trpcAppRouter`) for service-to-service calls.

### Consumes

- Managed deployer HTTP API (`DEPLOYER_URL`, default `http://localhost:4200`
  in dev, `https://deployer.erxes.io` in prod), authenticated with
  `MANAGED_OPENCLAW_DEPLOYER_SECRET`.
- Runtime HTTP endpoints authenticated with
  `ERXES_AI_ASSISTANT_RUNTIME_SHARED_SECRET`.
- `erxes-api-shared` public utils (`startPlugin`, `getEnv`).

## Data and State

- Mongo (per-subdomain models): `AgentServer` (collection
  `agent_serversses`) with provider/credentialMode/status/provisioning and
  transfer metadata (`transferredFromSubdomain`, `transferredAt`,
  `transferCredentialsIssuedAt`); assistant org identifiers
  (`assistant_orgs`).
- In-memory `managedDeploymentsInProgress` lock keyed by identifierId during
  managed deployments.

## Local Invariants

- Pasted credentials (apiKey, kimiApiKey, subscriptionToken) are normalized
  through `normalizeCredential` (trims and strips wrapping quotes) before
  validation or forwarding.
- Error details extracted from deployer/runtime responses must pass through
  `sanitizeProvisioningError` before reaching a user-facing message.
- Retry/redeploy must never change a stored provider/credentialMode unless
  the caller explicitly sends new values.
- `destroyAgent` must not call the deployer's destroy for a record whose
  `transferCredentialsIssuedAt` is set — another SaaS may share the server.
- Only annotate safe tRPC procedures with `.meta({ agent })`; deployer and
  runtime secrets must never be returned to clients.
- `probeManagedRuntimeHealth` must stay non-throwing; the UI polls it.

## Validation

- `pnpm nx lint agent_api`
- `pnpm nx build agent_api`
- Smoke: with a dev deployer on :4200, retry provisioning on a failed
  subscription assistant with no provider in the input — the Mongo record
  must keep its stored provider/credentialMode.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-24` — Provider-preserving retries, runtime health query, transfer safety

- **Summary:** `deployManagedAgent` falls back to stored provider/credentialMode/model on retry; new `agentRuntimeHealth` query + `probeManagedRuntimeHealth`; transfer stamps `transferCredentialsIssuedAt`, validates runtime reachability and gateway-token match before linking, carries provider/model/credentialMode, and `destroyAgent` skips shared-server teardown; `getAgent` refreshes the live gateway token for approved agents only.
- **Affected areas:** `graphql/resolvers/mutations/agent.ts`, `graphql/resolvers/queries/agent.ts`, `graphql/schemas/agent.ts`, `utils.ts`, `@types/agent.ts`, `db/definitions/agent.ts`
- **Contracts changed:** Added query `agentRuntimeHealth(identifierId: String!): AgentRuntimeHealth`; `AgentServer` gained `transferCredentialsIssuedAt`; `TransferAgentInput` and `AgentTransferCredentials` gained `provider`/`model`/`credentialMode`.
