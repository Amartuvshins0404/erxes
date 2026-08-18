# `blockagency_ui` Plugin Guide

## Identity

- **Plugin:** `blockagency`
- **Project:** `blockagency_ui`
- **Layer:** `Frontend UI`
- **Path:** `frontend/private-plugins/blockagency_ui`
- **Last synchronized:** `2026-08-11`

## Scope

### Owns

- Agency profile surfaces: general info, verification status, and the
  Frontline integration panel that binds an erxes messenger integration to the
  agency.
- Property listing management: list, create, detail, general info, location,
  pricing, specs.
- Unit management: unit table, status counts/KPI, status updates, assigning a
  unit to a member.
- Agency member management: member list, member profile, create/update/remove.
- Agency dashboard: listing stats.
- `blockagency` navigation group, settings navigation entry, and every route
  under the `blockagency` path.

### Does not own

- Any backend contract. There is no paired `blockagency_api` project in this
  repository; all data comes from the gateway schema.
- The erxes messenger integration picker itself — it is owned by
  `frontline_ui` and only consumed here at runtime.
- Core shell chrome (breadcrumbs, page container, navigation host), which comes
  from `erxes-ui` / `ui-modules`.

## Current Capabilities

- Agency profile page with editable general info and a Frontline integrations
  card that stores `messengerIntegrationId` and `widgetBundleUrl`.
- Runtime loading of `frontline_ui/selectErxesMessenger` with skeleton,
  unavailable, and error states — the page stays usable when `frontline` is
  disabled.
- Listing index with cursor pagination, create sheet, and detail page with
  section forms.
- Unit index with status filters, KPI counts, status mutation, and member
  assignment.
- Member index with profile view and create/update/remove mutations.
- Dashboard index with listing stats.
- `./blockagencySettings` and `./widgets` are still generated placeholders and
  render static text; they are not wired to real behavior yet.

## Architecture

| Area                  | Path                                                | Responsibility                                                       |
| --------------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| Federation config     | `module-federation.config.ts`                       | Remote name `blockagency_ui` and the four exposes                     |
| Plugin config         | `src/config.tsx`                                    | `CONFIG: IUIConfig` — navigation group, settings navigation, modules   |
| Route host            | `src/modules/BlockagencyMain.tsx`                   | Lazy `Routes` for every `AgencyPaths` entry                            |
| Route paths           | `src/modules/types/AgencyPaths.ts`                  | Single source of truth for in-plugin route segments                    |
| Pages                 | `src/pages/blockagency/`                            | Page shells that compose module components                            |
| Agency module         | `src/modules/agency/`                               | Agency info, verification, profile forms, Frontline integration panel  |
| Listing module        | `src/modules/listing/`                              | Listing table, forms, sheets, Jotai listing state                      |
| Unit module           | `src/modules/unit/`                                 | Unit table, status filters/KPI, assignment                             |
| Member module         | `src/modules/member/`                               | Member table, profile, member mutations                                |
| Dashboard module      | `src/modules/dashboard/`                            | Listing statistics                                                     |
| Cross-plugin loading  | `src/modules/agency/hooks/useRemoteComponent.ts`    | Resolves the federation host that owns a remote, then loads the module |

## Contracts

### Provides

- Module Federation exposes:
  - `./config` → `src/config.tsx`
  - `./blockagency` → `src/modules/BlockagencyMain.tsx`
  - `./blockagencySettings` → `src/modules/BlockagencySettings.tsx`
  - `./widgets` → `src/widgets/Widgets.tsx`
- Dev server on port `3005` (`project.json` → `serve`).

### Consumes

- `erxes-ui` and `ui-modules` for every UI primitive, form, table, and page
  layout; `@module-federation/enhanced/runtime` for remote resolution.
- GraphQL through the gateway. Queries: `GetAgencyInfo`,
  `GetAgencyVerificationStatus`, `GetListings`, `GetListing`,
  `GetListingStats`, `BlockAgencyGetUnits`, `BlockAgencyGetUnitsTotalCount`,
  `BlockAgencyGetUnitStatusCounts`, `BlockAgentGetMembers`,
  `BlockAgentGetMemberProfile`. Mutations: `UpdateAgencyInfo`,
  `BlockCreateListing`, `BlockUpdateListingGeneralInfo`, `BlockRemoveListing`,
  `BlockAgencyUpdateUnitStatus`, `BlockAgencyAssignUnitToMember`,
  `BlockAgentCreateMember`, `BlockAgentUpdateMember`,
  `BlockAgentUpdateMemberProfile`, `BlockAgentRemoveMember`.
- `frontline_ui/selectErxesMessenger` — an **optional** runtime remote. It is
  deliberately absent from `module-federation.config.ts` `remotes` so this
  plugin still builds and runs when `frontline` is not enabled.

## Data and State

- Server state lives in Apollo Client; documents sit beside their feature in
  each module's `graphql/` directory.
- Jotai is used only for plugin-wide UI state: `createListingSheetAtom` and
  `editListingAtom` in `src/modules/listing/states/listing.ts`.
- Forms use React Hook Form with Zod resolvers; schemas live in each module's
  `schema/` or `form/` directory.
- The agency integrations form persists on change through `UpdateAgencyInfo`
  rather than an explicit submit button.

## Local Invariants

- Never add another plugin to `remotes` in `module-federation.config.ts`. Load
  cross-plugin components through `useRemoteComponent`, which finds the
  federation instance that already registered the remote (the core-ui host) and
  loads through it. `loadRemote` imported directly from
  `@module-federation/enhanced/runtime` resolves against this plugin's own
  instance, which has no remotes, and always fails.
- Every cross-plugin component must degrade gracefully: render a loading state
  while resolving and an explicit unavailable state on error.
- Route segments must come from `AgencyPaths`, never inline strings.
- Every expose in `module-federation.config.ts` must point at a file with a
  default export, because `useRemoteComponent` and the core-ui plugin loader
  read `default`.
- GraphQL operation names stay prefixed so they remain unique repo-wide.

## Validation

- `pnpm nx lint blockagency_ui`
- `pnpm nx build blockagency_ui`
- Smoke: run `pnpm nx serve core-ui` with `ENABLED_PLUGINS` containing both
  `blockagency` and `frontline`, open the agency profile page, and confirm the
  "Erxes Messenger" field renders the Frontline picker and saves a selection.
  Repeat with `frontline` removed from `ENABLED_PLUGINS` and confirm the field
  reports that the plugin is unavailable instead of hanging on a skeleton.

`project.json` defines no `test` target, so `pnpm nx test blockagency_ui` does
not apply.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-11` — Fix cross-plugin loading of the erxes messenger picker

- **Summary:** `useRemoteComponent` now resolves the federation instance that
  owns the requested remote before loading, so
  `frontline_ui/selectErxesMessenger` loads from the agency profile instead of
  failing with "Unable to locate … in blockagency_ui", and the integrations
  field renders an unavailable state instead of a permanent skeleton.
- **Affected areas:** `src/modules/agency/hooks/useRemoteComponent.ts`,
  `src/modules/agency/components/AgencyProfileIntegrations.tsx`
- **Contracts changed:** `None`
