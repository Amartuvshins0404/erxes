# `cf-os_ui` Plugin Guide

## Identity

- **Plugin:** `cf-os`
- **Project:** `cf-os_ui`
- **Layer:** `Frontend UI`
- **Path:** `frontend/plugins/cf_os_ui`
- **Last synchronized:** `2026-08-20`

## Scope

### Owns

- The `command` navigation entry (label only) and its Module Federation
  entry point.
- The embedded view for the deployed Cloudflare OS application.

### Does not own

- Cloudflare OS backend or deployment.
- Executor authentication, APIs, or persistence.
- Erxes authentication, permissions, or core navigation.

## Current Capabilities

- Adds a `command` item to the Erxes plugin navigation.
- Renders the Command app from `CF_OS_URL` inside the Erxes content area.
- Builds as the `cf-os_ui` Module Federation remote.

## Architecture

| Area          | Path                                      | Responsibility                         |
| ------------- | ----------------------------------------- | -------------------------------------- |
| Configuration | `src/config.tsx`                          | Registers navigation and the route.    |
| Entry point   | `src/modules/CfOsMain.tsx`                | Embeds the deployed Command app.      |
| Federation    | `module-federation.config.ts`             | Exposes config and the CF OS page.    |

## Contracts

### Provides

- `cf_os_ui/config`
- `cf_os_ui/cf_os`
- The `/cf-os` route and the `command` navigation entry.

### Consumes

- Public `erxes-ui` types and icons.
- The Command URL comes from `CF_OS_URL` (runtime `window.env.CF_OS_URL`, falling back to build-time `CF_OS_URL`); nothing is hardcoded.

## Local Invariants

- The Nx project and MF remote name are `cf-os_ui` (mirrors `erxes-agent_ui`);
  the runtime normalizes the container to `cf_os_ui`. `CONFIG.name` is `cf_os`,
  with `permissionName: 'cf-os'`.
- The plugin route is `/cf-os`; the visible sidebar label is `Command`
  (from `navigationGroup.name = 'command'`).
- Enable the plugin with `cf-os` in `ENABLED_PLUGINS`; core-api maps it to the
  `cf_os_ui` remote via `remoteName()`.
- The embedded page must remain full-height and full-width so the Erxes shell stays visible above it.
- The embedded app must not receive Erxes credentials through JavaScript or URL parameters.

## UI Conventions

- Keep the Erxes header and global sidebar owned by `core-ui`.
- Keep the CF OS application inside the plugin content area.
- Use the existing `@tabler/icons-react` icon package.
- Do not add another navigation, routing, or UI library.

## Forbidden

- Do not copy Cloudflare OS or Executor source into this plugin.
- Do not add OAuth or token handling to the browser.
- Do not access `document.cookie` or place credentials in the iframe URL.
- Do not edit `core-ui` to register this plugin. Enable `cf-os` through the existing frontend plugin configuration.

## Validation

- `pnpm nx build cf-os_ui`
- Confirm `CF_OS_URL` is set and the deployed app loads in the frame.
- In Erxes, confirm the `command` navigation item opens the embedded app while the Erxes header and global sidebar remain visible.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-20` — Rename remote to `cf-os_ui`, keep `command` label

- **Summary:** Renamed the plugin project/remote to `cf-os_ui` with the `/cf-os`
  route; the sidebar label stays `command`.
- **Affected areas:** Project config, Module Federation exposes,
  `src/config.tsx`, `src/modules/CfOsMain.tsx`.
- **Contracts changed:** Remote is now `cf_os_ui`; route is now `/cf-os`.

### `2026-08-20` — Add Command navigation entry

- **Summary:** Added the Module Federation remote that embeds the deployed
  Cloudflare OS application in the Erxes content area.
- **Affected areas:** `src/config.tsx`, `src/modules/CfOsMain.tsx`, and Module
  Federation configuration.
- **Contracts changed:** Adds the remote and route.
