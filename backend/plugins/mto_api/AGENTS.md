# `mto_api` Plugin Guide

## Identity

- **Plugin:** `mto`
- **Project:** `mto_api`
- **Layer:** `Backend API`
- **Path:** `backend/plugins/mto_api`
- **Last synchronized:** `2026-09-01`

## Scope

### Owns

- MTO tenant data and GraphQL: providers, categories, events, travel associations, registration applications/form schemas, and system config (instance ID, selected payments).
- Master/slave runtime (`mto` mode), including slave GraphQL proxy for profile operations and registration payment callbacks.

### Does not own

- Core CRM customers, client-portal chrome, or payment processing internals (consumes platform payment callbacks).
- Frontend admin UI (`mto_ui`).
- Other plugins' collections; never import another service's implementation.

## Current Capabilities

- Plugin starts via `startPlugin` on port **33015**.
- Category, event, travel association, and profile CRUD.
- Registration applications (submit, list/export, status, archive, payment) and FillForm schema CRUD.
- System config keys including instance ID and selected payments; `mtoMode` / `mtoMasterUrl` / `mtoInstanceId` queries.
- Slave mode proxies profile GraphQL (`mtoProfiles`, `mtoProfile`, `mtoMyProfile`, create/update/remove) to master; other operations run locally.
- `mtoMyProfile` returns the instance's primary provider (`instanceId`, oldest first) or the local singleton when `instanceId` is absent.

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
| Slave proxy | `src/middlewares/graphqlProxyMiddleware.ts` | Profile ops forwarded to master |

## Contracts

### Provides

- GraphQL operations prefixed `mto*` / `cpMto*`, unique repo-wide: categories, events, travel associations (`mtoTravelAssociations`, `mtoTravelAssociation`, `mtoTravelAssociationCreate`, `mtoTravelAssociationUpdate`, `mtoTravelAssociationsRemove`), profiles (`mtoProfiles`, `mtoProfile`, `mtoMyProfile`, `mtoProfileCreate`, `mtoProfileUpdate`, `mtoProfileApprove`, `mtoProfileReject`, `mtoProfilesRemove`), registration applications/schemas, system config.
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
- Slave proxy whitelist is profile operations; do not add travel associations unless slave UI is explicitly enabled.
- `mtoMyProfile` must not return another instance's provider; without `instanceId` it only matches records with missing/empty `instanceId`.

## Validation

- `pnpm nx build mto_api`
- Smoke: `mtoMyProfile` returns the instance profile (or local singleton); first save creates, later saves update; rejected profiles still cannot update

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-09-01` — Slim profile GraphQL fields

- **Summary:** Removed `facilities`, `categoryIds`/`categories`, and `singleProviderLimit` from `MtoProfile` and profile create/update inputs; slave proxy no longer forwards `mtoCategories`.
- **Affected areas:** `src/modules/provider/graphql`, `src/modules/provider/db/definitions/provider.ts`, `src/middlewares/graphqlProxyMiddleware.ts`
- **Contracts changed:** `MtoProfile` and `mtoProfileCreate`/`mtoProfileUpdate` no longer expose facilities, categories, or `singleProviderLimit`

### `2026-09-01` — Profile GraphQL operations

- **Summary:** Renamed provider GraphQL types and operations to profile (`MtoProfile`, `mtoProfiles`, `mtoProfile`, `mtoMyProfile`, `mtoProfileCreate`/`Update`/`Approve`/`Reject`, `mtoProfilesRemove`) and proxied the profile reads/writes with `mtoCategories` in slave mode.
- **Affected areas:** `src/modules/provider/graphql`, `src/middlewares/graphqlProxyMiddleware.ts`, `src/utils/ownershipValidator.ts`
- **Contracts changed:** Replaced `MtoProvider`/`mtoProvider*` with `MtoProfile` and `mtoProfile*`; slave proxy whitelist now includes `mtoMyProfile`, `mtoProfiles`, `mtoProfile`, `mtoProfileCreate`, `mtoProfileUpdate`, and `mtoProfilesRemove`

### `2026-08-20` — Travel Association model

- **Summary:** Added tenant-scoped travel associations with logo, cover, bilingual title/description, found date, and GraphQL CRUD/list filters.
- **Affected areas:** `src/modules/travelAssociation`, `src/connectionResolvers.ts`, `src/apollo/schema/schema.ts`, `src/apollo/resolvers/queries.ts`, `src/apollo/resolvers/mutations.ts`
- **Contracts changed:** Added `MtoTravelAssociation` and operations `mtoTravelAssociations`, `mtoTravelAssociation`, `mtoTravelAssociationCreate`, `mtoTravelAssociationUpdate`, `mtoTravelAssociationsRemove`
