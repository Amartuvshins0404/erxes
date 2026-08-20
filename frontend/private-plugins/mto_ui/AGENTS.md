# `mto_ui` Plugin Guide

## Identity

- **Plugin:** `mto`
- **Project:** `mto_ui`
- **Layer:** `Frontend UI`
- **Path:** `frontend/private-plugins/mto_ui`
- **Last synchronized:** `2026-08-20`

## Scope

### Owns

- MTO admin UI: categories, events, registration applications (list/detail/create), FillForm schema builder, slave-mode onboarding, settings (instance ID + payment selection), and the `mtocustomer` relation-widget expose (currently a stub).
- Plugin GraphQL documents, hooks, Jotai sheet/count state, and Module Federation entry points under `src/`.

### Does not own

- `mto_api` resolvers/schema (consumed only through GraphQL).
- Core CRM chrome; relation-widget content is optional and currently stubbed.
- Other private plugins (`block_ui`, `onefit_ui`, etc.).

## Current Capabilities

- Dev port **3008**. Registers with `core-ui` as module `mto`, with navigation group, settings navigation, and relation-widget module `mtocustomer`.
- List pages for categories, events, and registrations use `PageContainer` + `PageHeader` + `PageSubHeader` with URL-driven `Filter` bars and `RecordTable` (cursor pagination on registrations).
- Category/event create and edit via side `Sheet` forms validated with React Hook Form + Zod.
- Registration detail opens as a `FocusSheet` driven by Jotai (`registrationDetailSheetState`); create uses membership-type Dialog chooser then `RegistrationFormSheet`.
- `/mto` and `/mto/registration` redirect to `/mto/registrations`.
- Slave mode without instance ID gates routes behind onboarding and settings.

## Architecture

| Area | Path | Responsibility |
| -------- | ---------------------------- | -------------------------- |
| Config | `src/config.tsx` | Module registration, navigation, widgets |
| Main routes | `src/modules/Main.tsx` | Route table + slave onboarding gate |
| Navigation | `src/modules/MtoNavigation*.tsx` | Sidebar links and setup guard |
| Category | `src/modules/category` | Category filters, table, form sheet, hooks |
| Event | `src/modules/event` | Event filters, table, form sheet, hooks |
| Registration | `src/modules/registration` | Filters, cursor table, detail/create sheets, schema builder utils |
| Config/settings | `src/modules/config`, `src/modules/Settings.tsx` | Instance ID, payments, upload config |
| Upload | `src/components/MtoUpload.tsx` | Shared image upload primitive |
| Widgets | `src/widgets` | Relation widget dispatcher (stub customer widget) |

## Contracts

### Provides

- Module Federation exposes: `./config`, `./mto`, `./mtoSettings`, `./widgets`, `./relationWidget` (keep aligned with `module-federation.config.ts` and host loaders).

### Consumes

- `mto_api` GraphQL operations prefixed `mto*` / `cpMto*` (categories, events, registration applications/schemas, config).
- Public `erxes-ui` and `ui-modules` UI/hooks only; no direct `@radix-ui/*` imports.

## Data and State

- Apollo Client for server state; list filters live in URL query params (`useMultiQueryState` / `useNonNullMultiQueryState`).
- Jotai for registration detail sheet open id and registrations total count chip.
- React Hook Form + Zod for category/event sheets; registration answer forms use RHF without Zod schemas.

## Local Invariants

- Plugin changes stay inside `frontend/private-plugins/mto_ui/**`.
- List filters must stay URL-driven and share `REGISTRATIONS_CURSOR_SESSION_KEY` with registrations cursor pagination.
- Do not reintroduce `MtoPageLayout` / `MtoListPageLayout` / `MtoFilterBase`; compose `PageContainer` + `PageHeader` + `Filter` like Block Offers/Payments.
- Slave-mode routes must continue to hide events/categories/fillform and require instance ID.
- Relation widget `mtocustomer` remains a stub unless explicitly implemented; do not add relation-widget side tabs without a real widget.

## Validation

- `pnpm nx build mto_ui`
- Smoke: categories / events / registrations list → filter via URL → create/edit sheet → empty list → settings save → slave-mode onboarding still gates routes

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-20` — Align UI with Block Offers patterns

- **Summary:** Replaced custom MTO page/filter chrome with Block-style `PageContainer`/`PageHeader`/`Filter`/URL state, split RecordTables, RHF+Zod category/event sheets, FocusSheet registration detail, settings restyle, and landing redirects.
- **Affected areas:** `src/pages/*`, `src/modules/category`, `src/modules/event`, `src/modules/registration`, `src/modules/Settings.tsx`, `src/components/MtoUpload.tsx`
- **Contracts changed:** None
