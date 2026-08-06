# `erxes-agent_ui` Plugin Guide

## Identity

- **Plugin:** `erxes-agent`
- **Project:** `erxes-agent_ui`
- **Layer:** Frontend UI
- **Path:** `frontend/plugins/erxes-agent_ui`
- **Last synchronized:** `2026-08-06`

## Scope

### Owns

- Agent, chat, skill, learning, workflow, provider, and agent-runtime settings UI.
- Agent navigation, settings navigation, Module Federation exposes, workflow automation widgets, and chat SSE rendering.

### Does not own

- Agent execution, provider credentials, chat persistence, or erxes business data; those remain backend contracts.
- Core navigation, authentication, shared UI primitives, or another plugin's routes and state.

## Current Capabilities

- Lists, creates, edits, and chats with permission-scoped AI team members.
- Manages reusable skills, learned statements, workflows, providers, and tenant runtime settings.
- Streams native agent chat parts, tool activity, attachments, artifacts, feedback, and session updates.
- Contributes the `Run agent workflow` action configuration to the automations builder.

## Architecture

| Area       | Path                                                          | Responsibility                                                                 |
| ---------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Federation | `frontend/plugins/erxes-agent_ui/module-federation.config.ts` | Exposes config, main/settings routes, widgets, and the automations widget.     |
| Routes     | `frontend/plugins/erxes-agent_ui/src/modules`                 | Lazy-loaded main and settings route trees with permission gates.               |
| Chat       | `frontend/plugins/erxes-agent_ui/src/modules/chat`            | Session list, SSE turn rendering, composer, artifacts, feedback, and trace UI. |
| Settings   | `frontend/plugins/erxes-agent_ui/src/pages/settings`          | Provider and tenant runtime settings forms, validation, and mutation feedback. |
| GraphQL    | `frontend/plugins/erxes-agent_ui/src/graphql`                 | Plugin-prefixed queries, mutations, and subscriptions consumed by the UI.      |
| Workflows  | `frontend/plugins/erxes-agent_ui/src/pages/workflows`         | Workflow list, graph, form, run history, and manual execution UI.              |

## Contracts

### Provides

- Module Federation exposes `./config`, `./erxes_agent`, `./erxes_agentSettings`, `./widgets`, and `./automationsWidget`.
- Routes under `/erxes-agent/*` and `/settings/erxes-agent/*`.
- Navigation modules for agents, skills, and workflows.

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
- Runtime settings expose only behavior the backend currently executes; cosmetic activity labels never require a summarizer-model setting.

## Validation

- `pnpm nx build erxes-agent_ui`
- Smoke: open `/settings/erxes-agent/general`, save runtime settings, and confirm the refetched values render without a manual refresh.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-06` — Remove obsolete summarizer settings

- **Summary:** Removed unused provider/model controls after chat labels became deterministic, and made router singleton sharing independent of Nx's version-qualified pnpm graph nodes.
- **Affected areas:** General settings form/validation/types, settings GraphQL documents, and Module Federation sharing.
- **Contracts changed:** Removed `summarizerProvider` and `summarizerModel` from the settings UI contract.
