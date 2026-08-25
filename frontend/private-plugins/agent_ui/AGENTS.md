# `agent_ui` Plugin Guide

## Identity

- **Plugin:** `agent`
- **Project:** `agent_ui`
- **Layer:** `Frontend UI`
- **Path:** `frontend/private-plugins/agent_ui`
- **Last synchronized:** `2026-08-24`

## Scope

### Owns

- AI Assistant UI: creation/provisioning wizard (Company Brain), managed
  provisioning progress, retry flows, deploy screen, runtime chat surface
  (health-gated iframe), LLM connection dialog, transfer credentials dialog,
  Discord management sheets, agent templates, OpenCode coder UI.

### Does not own

- Backend resolvers or deployer/runtime services (see
  `backend/plugins/agent_api`).
- Shared UI primitives (`erxes-ui`) or cross-plugin modules.

## Current Capabilities

- Retry provisioning is provider-aware everywhere (deploy screen and Company
  Brain Discord sheet): it sends the assistant's stored provider and
  credential mode, routes the credential to `subscriptionToken` vs
  `apiToken`, hides the credential input for device-code providers
  (ChatGPT/Copilot/MiniMax), and uses provider-specific labels/placeholders.
- The chat iframe in `AgentMain` is health-gated for managed assistants: a
  "Connecting…" overlay (erxes-ui `Spinner`) polls `agentRuntimeHealth`
  (3s while down, 15s once serving) and the iframe mounts only when the
  runtime answers — key changes, restarts, and pod recreation never surface
  a raw 5xx. Legacy (non-managed) agents keep the ungated iframe.
- The LLM connection dialog opens only on user action, defaults to the
  assistant's current provider/mode, closes on Escape when not busy, and
  treats timeout/503 during apply as "still applying" rather than failure.
- Transfer credentials dialog exports server name/URL/gateway token/IDs plus
  the LLM provider/model/credential mode; the create sheet's transfer mode
  accepts those values so a linked assistant keeps its real connection
  metadata.

## Architecture

| Area | Path | Responsibility |
| ---- | ---- | -------------- |
| Chat surface | `src/modules/main/AgentMain.tsx` | toolbar, health-gated runtime iframe, dialogs |
| Runtime health | `src/modules/main/hooks/useAgentRuntimeHealth.tsx` | polls `agentRuntimeHealth` (network-only), exposes `probeFailed` |
| Ready decision | `src/modules/main/runtimeReady.ts` | pure gate logic (`getRuntimeReadyUpdate`), fails open on probe error; tested in `runtimeReady.spec.ts` |
| Provisioning UI | `src/modules/deploy/` | deploy form, progress, retry, transfer dialog |
| Company Brain | `src/modules/company-brain/` | creation wizard, Discord manage sheets, provider catalog (`llmProviders.ts`) |
| Connection dialog | `src/modules/detail/components/LlmConnectionDialog.tsx` | provider/API-key/subscription switching |
| Overlay | `src/modules/detail/components/RestartingOverlay.tsx` | stopping/loading overlay (`immediate` prop skips the stopping phase) |
| GraphQL | `src/modules/*/graphql/` | queries/mutations per feature |

## Contracts

### Provides

- Module Federation remote consumed by `core-ui`; routes under `/agent/*`
  (see `src/config.tsx` and `AgentRoutes.tsx`).

### Consumes

- `agent_api` GraphQL via the gateway: `GetAgent`, `AgentRuntimeHealth`,
  `DeployManagedAgent`, `TransferAgent`, `CreateAgentTransferCredentials`,
  `SetAgentLlmConnection`, subscription-auth operations.
- `erxes-ui` components (Button, Input, Sheet, AlertDialog, Spinner, Form,
  Select, toast).

## Data and State

- Apollo Client for all server state; mutations refetch `GetAgent` (or
  update cache) so the UI reflects changes without manual refresh.
- Local React state for dialogs, retry credentials, and the `runtimeReady`
  iframe gate; no plugin-wide Jotai atoms in the assistant flows.

## Local Invariants

- Retry/redeploy calls must derive provider/credentialMode from the agent
  record — never hardcode kimi/api_key.
- The chat iframe for a managed assistant must stay unmounted until
  `agentRuntimeHealth` reports healthy; `refreshIframe` must reset the gate.
- Credential inputs use the plugin's `SecretInput`
  (`src/modules/components/SecretInput.tsx`): password-masked with a reveal
  toggle that auto-hides after 10s, cleared after successful submission.
  There is no shared erxes-ui reveal component — core-ui composes its own the
  same way.
- Loading/overlay visuals use `erxes-ui` `Spinner` — no hand-rolled
  spinners.

## Validation

- `pnpm nx lint agent_ui`
- `pnpm nx build agent_ui`
- `pnpm nx test agent_ui`
- Smoke: with a failed subscription assistant, the retry card shows the
  provider's credential label (or no input for device-code providers); after
  a key change the chat area shows "Connecting…" until the runtime answers,
  then mounts the iframe.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-24` — Provider-aware retries and health-gated runtime iframe

- **Summary:** Discord-sheet and deploy-screen retries send the stored provider/credential mode (device-code providers get no credential input); `AgentMain` gates the chat iframe behind an `agentRuntimeHealth`-polling "Connecting…" overlay; `RestartingOverlay` rebuilt on erxes-ui `Spinner` with an `immediate` prop; transfer dialog exports and the create sheet's transfer mode imports provider/model/credential mode.
- **Affected areas:** `main/AgentMain.tsx`, `main/hooks/useAgentRuntimeHealth.tsx` (new), `main/graphql/queries.ts`, `company-brain/components/CompanyBrainWorkspacePage.tsx`, `deploy/components/AgentDeployScreen.tsx`, `deploy/components/AgentTransferCredentialsDialog.tsx`, `deploy/hooks/useAgentTransfer.tsx`, `deploy/graphql/mutations.ts`, `detail/components/RestartingOverlay.tsx`
- **Contracts changed:** None (consumes new `agentRuntimeHealth` query and extended transfer fields).
