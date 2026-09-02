# `mto_ui` Plugin Guide

## Identity

- **Plugin:** `mto`
- **Project:** `mto_ui`
- **Layer:** `Frontend UI`
- **Path:** `frontend/private-plugins/mto_ui`
- **Last synchronized:** `2026-09-01`

## Scope

### Owns

- MTO admin UI: profile, categories, travel associations, events, registration applications (list/detail/create), FillForm schema builder, slave-mode onboarding, settings (instance ID + payment selection), and the `mtocustomer` relation-widget expose (currently a stub).
- Plugin GraphQL documents, hooks, Jotai sheet/count state, and Module Federation entry points under `src/`.

### Does not own

- `mto_api` resolvers/schema (consumed only through GraphQL).
- Core CRM chrome; relation-widget content is optional and currently stubbed.
- Other private plugins (`block_ui`, `onefit_ui`, etc.).

## Current Capabilities

- Dev port **3008**. Registers with `core-ui` as module `mto`, with navigation group (including registration-type `subGroup`), settings navigation, and relation-widget module `mtocustomer`.
- Profile page at `/mto/profile`: slave mode loads `mtoMyProfile` and creates or updates the instance profile with RHF + Zod; master mode lists all profiles in a `RecordTable` with search/status/active filters, create/edit sheet, and approve/reject/delete. Profile form includes address and certificate number.
- List pages for categories, travel associations, events, and registrations use `PageContainer` + `PageHeader` + `PageSubHeader` with URL-driven `Filter` bars and `RecordTable` (cursor pagination on registrations).
- Navigation `subGroup` lists FillForm membership types and filters `/mto/registrations?membershipTypeId=...`.
- Category/travel-association/event create and edit via side `Sheet` forms validated with React Hook Form + Zod.
- Registration detail opens as a `FocusSheet` driven by Jotai (`registrationDetailSheetState`); create uses membership-type Dialog chooser then `RegistrationFormSheet`.
- `/mto` and `/mto/registration` redirect to `/mto/registrations`.
- Slave mode without instance ID gates routes behind onboarding and settings.

## Architecture

| Area | Path | Responsibility |
| -------- | ---------------------------- | -------------------------- |
| Config | `src/config.tsx` | Module registration, navigation, widgets |
| Main routes | `src/modules/Main.tsx` | Route table + slave onboarding gate |
| Navigation | `src/modules/MtoNavigation*.tsx`, `src/modules/MtoRegistrationsNavigation.tsx` | Sidebar links, setup guard, registration-type subGroup |
| Category | `src/modules/category` | Category filters, table, form sheet, hooks |
| Travel association | `src/modules/travelAssociation` | Travel association filters, table, form sheet, hooks |
| Event | `src/modules/event` | Event filters, table, form sheet, hooks |
| Profile | `src/modules/profile` | Slave instance form; master profiles list/table/sheet; GraphQL documents and hooks |
| Registration | `src/modules/registration` | Filters, cursor table, detail/create sheets, schema builder utils |
| Config/settings | `src/modules/config`, `src/modules/Settings.tsx` | Instance ID, payments, upload config |
| Upload | `src/components/MtoUpload.tsx` | Shared image upload primitive |
| Widgets | `src/widgets` | Relation widget dispatcher (stub customer widget) |

## Contracts

### Provides

- Module Federation exposes: `./config`, `./mto`, `./mtoSettings`, `./widgets`, `./relationWidget` (keep aligned with `module-federation.config.ts` and host loaders).

### Consumes

- `mto_api` GraphQL operations prefixed `mto*` / `cpMto*` (categories, travel associations, events, profile `mtoProfiles` / `mtoProfile` / `mtoMyProfile` / `mtoProfileCreate` / `mtoProfileUpdate` / `mtoProfileApprove` / `mtoProfileReject` / `mtoProfilesRemove`, registration applications/schemas, config).
- Public `erxes-ui` and `ui-modules` UI/hooks only; no direct `@radix-ui/*` imports.

## Data and State

- Apollo Client for server state; list filters live in URL query params (`useMultiQueryState` / `useNonNullMultiQueryState`).
- Jotai for registration detail sheet open id and registrations total count chip.
- React Hook Form + Zod for category/travel-association/event sheets and the profile form; registration answer forms use RHF without Zod schemas.
- Master profile list filters live in URL query params (`searchValue`, `status`, `isActive`) and share `PROFILES_CURSOR_SESSION_KEY` with cursor pagination. `mtoProfiles` limit is 1–100.

## Local Invariants

- Plugin changes stay inside `frontend/private-plugins/mto_ui/**`.
- List filters must stay URL-driven and share `REGISTRATIONS_CURSOR_SESSION_KEY` with registrations cursor pagination.
- Do not reintroduce `MtoPageLayout` / `MtoListPageLayout` / `MtoFilterBase`; compose `PageContainer` + `PageHeader` + `Filter` like Block Offers/Payments.
- Slave-mode routes must continue to hide events/categories/travel-associations/fillform and require instance ID.
- Profile remains visible in both modes. Slave `/mto/profile` is the instance self-edit form (`mtoMyProfile`). Master `/mto/profile` lists every profile via `mtoProfiles` and must not use `mtoMyProfile` for that list.
- Profile must create when `mtoMyProfile` is empty and update the existing record otherwise; rejected profiles stay read-only.
- Relation widget `mtocustomer` remains a stub unless explicitly implemented; do not add relation-widget side tabs without a real widget.

## Validation

- `pnpm nx build mto_ui`
- Smoke: slave `/mto/profile` create/update including address and certificate number; master `/mto/profile` lists all profiles and can edit/approve/delete

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-09-01` — Profile address and certificate number

- **Summary:** Profile form and master list now include optional address and certificate number, saved through `mtoProfileCreate`/`mtoProfileUpdate`.
- **Affected areas:** `src/modules/profile`
- **Contracts changed:** Consumes `address` and `certificateNo` on `MtoProfile` and profile create/update

### `2026-09-01` — Profile list page size

- **Summary:** Master profile list uses `limit: 100` (API max) with RecordTable cursor pagination instead of an invalid 200-row request.
- **Affected areas:** `src/modules/profile`
- **Contracts changed:** `MtoProfiles` now requests `pageInfo` and pages with `limit` 1–100

### `2026-09-01` — Master profile list

- **Summary:** Master `/mto/profile` is a RecordTable of all profiles with filters, create/edit sheet, and approve/reject/delete; slave still uses the self-service form.
- **Affected areas:** `src/modules/profile`, `src/pages/ProfilePage.tsx`
- **Contracts changed:** Consumes `mtoProfiles`, `mtoProfile`, `mtoProfileApprove`, `mtoProfileReject`, and `mtoProfilesRemove` on master

### `2026-09-01` — Slim profile form

- **Summary:** Profile form no longer edits facilities, categories, or `singleProviderLimit`.
- **Affected areas:** `src/modules/profile`
- **Contracts changed:** Consumes `mtoMyProfile`, `mtoProfileCreate`, and `mtoProfileUpdate` without facilities, categories, or `singleProviderLimit`

### `2026-09-01` — Profile page

- **Summary:** Added `/mto/profile` so the current instance can create or edit its profile with branding, bilingual name, contact, and status display.
- **Affected areas:** `src/modules/profile`, `src/pages/ProfilePage.tsx`, `src/modules/Main.tsx`, `src/modules/MtoNavigation.tsx`
- **Contracts changed:** Consumes `mtoMyProfile`, `mtoProfileCreate`, and `mtoProfileUpdate`

### `2026-08-20` — Travel Association admin

- **Summary:** Added a master-only travel associations list with URL filters, RecordTable, and a Zod-validated create/edit sheet for logo, cover, bilingual title/description, and found date.
- **Affected areas:** `src/modules/travelAssociation`, `src/pages/TravelAssociationsPage.tsx`, `src/modules/Main.tsx`, `src/modules/MtoNavigation.tsx`
- **Contracts changed:** Consumes new `mtoTravelAssociation*` GraphQL operations

### `2026-08-20` — Registration type nav submenus

- **Summary:** Added Block-style `navigationGroup.subGroup` listing FillForm membership types; each link opens registrations filtered by `membershipTypeId`, with matching breadcrumb.
- **Affected areas:** `src/config.tsx`, `src/modules/MtoRegistrationsNavigation.tsx`, `src/pages/RegistrationsPage.tsx`
- **Contracts changed:** None

### `2026-08-20` — Tighter RecordTable columns

- **Summary:** Reorganized category/event/registration tables: icon headers, fixed sizes, sticky primary columns, bilingual name/title stacked cells, schedule/status consolidation, and kebab action menus.
- **Affected areas:** `CategoryColumns.tsx`, `EventColumns.tsx`, `RegistrationColumns.tsx`, `*RecordTable.tsx`
- **Contracts changed:** None

### `2026-08-20` — Align UI with Block Offers patterns

- **Summary:** Replaced custom MTO page/filter chrome with Block-style `PageContainer`/`PageHeader`/`Filter`/URL state, split RecordTables, RHF+Zod category/event sheets, FocusSheet registration detail, settings restyle, and landing redirects.
- **Affected areas:** `src/pages/*`, `src/modules/category`, `src/modules/event`, `src/modules/registration`, `src/modules/Settings.tsx`, `src/components/MtoUpload.tsx`
- **Contracts changed:** None
