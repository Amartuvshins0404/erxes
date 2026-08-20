# `command_ui` Plugin Guide

## Identity

- **Plugin:** `command`
- **Project:** `command_ui`
- **Layer:** `Frontend UI`
- **Path:** `frontend/plugins/command_ui`
- **Last synchronized:** `2026-08-20`

## Scope

### Owns

- The `command` navigation group and its Module Federation entry point.
- The embedded view for the deployed Cloudflare OS application.

### Does not own

- Cloudflare OS backend or deployment.
- Executor authentication, APIs, or persistence.
- Erxes authentication, permissions, or core navigation.

## Current Capabilities

- Adds a `command` item to the Erxes plugin navigation.
- Renders `https://os-erxes.darjs.dev/` inside the Erxes content area.
- Builds as the `command_ui` Module Federation remote.

## Architecture

| Area          | Path                                      | Responsibility                         |
| ------------- | ----------------------------------------- | -------------------------------------- |
| Configuration | `src/config.tsx`                          | Registers navigation and the route.    |
| Entry point   | `src/modules/CommandMain.tsx`             | Embeds the deployed Command app.      |
| Federation    | `module-federation.config.ts`             | Exposes config and the Command page.  |

## Contracts

### Provides

- `command_ui/config`
- `command_ui/command`
- The `/command` route and navigation item.

### Consumes

- Public `erxes-ui` types and icons.
- The deployed Command URL at `https://os-erxes.darjs.dev/`.

## Local Invariants

- The remote name is `command_ui`.
- The plugin route is `/command`.
- The visible navigation label is derived from `command`.
- The embedded page must remain full-height and full-width so the Erxes shell stays visible above it.
- The embedded app must not receive Erxes credentials through JavaScript or URL parameters.

## UI Conventions

- Keep the Erxes header and global sidebar owned by `core-ui`.
- Keep the Command application inside the plugin content area.
- Use the existing `@tabler/icons-react` icon package.
- Do not add another navigation, routing, or UI library.

## Forbidden

- Do not copy Cloudflare OS or Executor source into this plugin.
- Do not add OAuth or token handling to the browser.
- Do not access `document.cookie` or place credentials in the iframe URL.
- Do not edit `core-ui` to register this plugin. Enable `command` through the existing frontend plugin configuration.

## Validation

- `pnpm nx build command_ui`
- Confirm the deployed app loads at `https://os-erxes.darjs.dev/`.
- In Erxes, confirm the `command` navigation item opens the embedded app while the Erxes header and global sidebar remain visible.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-20` — Add Command navigation entry

- **Summary:** Added the `command` Module Federation remote and embedded the deployed Cloudflare OS application in the Erxes content area.
- **Affected areas:** `src/config.tsx`, `src/modules/CommandMain.tsx`, and Module Federation configuration.
- **Contracts changed:** Adds the `command_ui` remote and `/command` route.
