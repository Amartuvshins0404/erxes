# `mto_api` Plugin Guide

## Identity

- **Plugin:** `mto`
- **Project:** `mto_api`
- **Layer:** `Backend API`
- **Path:** `backend/plugins/mto_api`
- **Last synchronized:** `2026-08-20`

## Scope

### Owns

- MTO tenant data and GraphQL: providers, categories, events, travel associations, registration applications/form schemas, and system config (instance ID, selected payments).
- Master/slave runtime (`mto` mode), including slave GraphQL proxy for provider operations and registration payment callbacks.

### Does not own

- Core CRM customers, client-portal chrome, or payment processing internals (consumes platform payment callbacks).
- Frontend admin UI (`mto_ui`).
- Other plugins' collections; never import another service's implementation.

## Current Capabilities

- Plugin starts via `startPlugin` on port **33015**.
- Category, event, travel association, and provider CRUD.
- Registration applications (submit, list/export, status, archive, payment) and FillForm schema CRUD.
- System config keys including instance ID and selected payments; `mtoMode` / `mtoMasterUrl` / `mtoInstanceId` queries.
- Slave mode proxies provider GraphQL to master; other operations run locally.

## Architecture

| Area | Path | Responsibility |
| -------- | ---------------------------- | -------------------------- |
| Runtime | `src/main.ts`, `src/connectionResolvers.ts` | Plugin boot, tenant models, Apollo context |
| Provider | `src/modules/provider` | Provider records, filters, export |
| Category | `src/modules/category` | Hierarchical categories |
| Event | `src/modules/event` | Events linked to categories |
| Travel association | `src/modules/travelAssociation` | Travel associations (logo, cover, bilingual title/description, found date) |
| Registration | `src/modules/registration` | Applications, form schemas, payment |
| Config | `src/modules/config` | System config keys |
| Slave proxy | `src/middlewares/graphqlProxyMiddleware.ts` | Provider ops forwarded to master |

## Contracts

### Provides

- GraphQL operations prefixed `mto*` / `cpMto*`, unique repo-wide: categories, events, travel associations (`mtoTravelAssociations`, `mtoTravelAssociation`, `mtoTravelAssociationCreate`, `mtoTravelAssociationUpdate`, `mtoTravelAssociationsRemove`), providers, registration applications/schemas, system config.
- Payment meta `callback` for registration invoices.

### Consumes

- `erxes-api-shared` (`startPlugin`, `generateModels`, Apollo helpers).
- Platform payment callbacks; master HTTP client in slave mode.

## Data and State

- Tenant-scoped Mongo collections: `mto_providers`, `mto_categories`, `mto_events`, `mto_travel_associations`, `mto_registration_applications`, `mto_registration_form_schemas`, `mto_system_configs`.
- Travel association documents store bilingual `title` (required), optional bilingual `description`, `logo`, `cover`, and required `foundDate`.

## Local Invariants

- Plugin changes stay inside `backend/plugins/mto_api/**`.
- Models are generated from request `subdomain`; do not read or write another plugin's collections.
- GraphQL operation names stay prefixed `mto` / `cpMto` and unique repository-wide.
- Travel association `title.en`/`title.mn` and `foundDate` remain required on create.
- Slave proxy whitelist is provider-only; do not add travel associations unless slave UI is explicitly enabled.

## Validation

- `pnpm nx build mto_api`
- Smoke: create/update/remove a travel association with logo, cover, bilingual title/description, and found date; list filters by search and found-date range still return matching rows

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-20` — Travel Association model

- **Summary:** Added tenant-scoped travel associations with logo, cover, bilingual title/description, found date, and GraphQL CRUD/list filters.
- **Affected areas:** `src/modules/travelAssociation`, `src/connectionResolvers.ts`, `src/apollo/schema/schema.ts`, `src/apollo/resolvers/queries.ts`, `src/apollo/resolvers/mutations.ts`
- **Contracts changed:** Added `MtoTravelAssociation` and operations `mtoTravelAssociations`, `mtoTravelAssociation`, `mtoTravelAssociationCreate`, `mtoTravelAssociationUpdate`, `mtoTravelAssociationsRemove`
