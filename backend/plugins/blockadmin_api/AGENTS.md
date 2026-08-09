# `blockadmin_api` Plugin Guide

## Identity

- **Plugin:** `blockadmin`
- **Project:** `blockadmin_api`
- **Layer:** `Backend API`
- **Path:** `backend/plugins/blockadmin_api`
- **Last synchronized:** `2026-08-09`

## Scope

### Owns

- Blockadmin admin-side data and APIs for developers, agencies, projects, buildings, units, contracts, listings, documents, invoices, customers, forms, suppliers, and supplier products.
- Signed webhook receivers used by block, blockagency, and supplier-facing plugins.
- Admin GraphQL operations and Mongo models for blockadmin-owned records.

### Does not own

- Supplier tenant source product/category data in `supplier_api` or core product modules.
- Mushop consumer behavior or POS client catalog writes.
- Block or blockagency source plugin implementations.
- Shared libraries, gateway configuration, or core API contracts unless explicitly scoped.

## Current Capabilities

- Receives signed webhooks under `/webhook` and loads blockadmin tenant models with context/modifier middleware.
- Stores supplier profiles synced from supplier tenants and exposes admin review queries/mutations.
- Stores supplier products synced from supplier tenants, including initial category snapshots, attachments, status, state, and source `entityId`.
- Supports product approval/rejection, category assignment, soft-delete by source entity IDs, and supplier verification/tier updates.
- Exposes blockadmin GraphQL schema sections through `src/apollo/schema/schema.ts`.

## Architecture

| Area | Path | Responsibility |
| ---- | ---- | -------------- |
| Runtime routes | `backend/plugins/blockadmin_api/src/routes/index.ts` | Mounts signed `/webhook` receivers with context and request modifiers |
| Supplier profile | `backend/plugins/blockadmin_api/src/modules/supplier/profile/` | Supplier profile schema, model, GraphQL API, and `updateSupplier` webhook |
| Supplier product | `backend/plugins/blockadmin_api/src/modules/supplier/product/` | Supplier product schema, model, GraphQL API, and product/category sync webhooks |
| Supplier models | `backend/plugins/blockadmin_api/src/modules/supplier/db/loadModels.ts` | Registers `block_admin_suppliers` and `block_admin_supplier_products` models |
| Apollo wiring | `backend/plugins/blockadmin_api/src/apollo/` | Combines blockadmin schemas, queries, mutations, and custom resolvers |

## Contracts

### Provides

- HTTP `POST /webhook/updateSupplier` for supplier profile sync.
- HTTP `POST /webhook/syncProduct` for supplier product create/update/delete sync.
- HTTP `POST /webhook/syncProductCategory` for supplier category snapshot update/delete sync.
- GraphQL supplier profile queries/mutations with `ba*` operation names.
- GraphQL supplier product queries/mutations with `ba*` operation names.

### Consumes

- Supplier webhook bodies signed with `BLOCK_ADMIN_SECRET`.
- Supplier payload shape `{ subdomain, payload: { entityId, entityIds, data } }`.
- Public `erxes-api-shared` utilities and GraphQL JSON/scalar conventions.

## Data and State

- `block_admin_suppliers` stores supplier records keyed by source supplier entity and subdomain.
- `block_admin_supplier_products` stores supplier product copies keyed by `{ subdomain, entityId }`.
- Supplier products use `status` values `pending`, `approved`, and `rejected`.
- Supplier products use `state` values `active`, `hidden`, and `deleted`.
- Product category sync stores category snapshots in `initialCategory`; it does not own core category records.

## Local Invariants

- Webhook receivers must validate `subdomain` and source entity IDs before writing.
- Supplier product sync must upsert by `{ subdomain, entityId }`, not by local `_id`.
- Delete webhooks soft-delete supplier products by setting `state: deleted`.
- Category delete webhooks clear `initialCategory` on matching active records.
- Do not import supplier or mushop plugin internals; consume their data only through webhook payloads.

## Validation

- `pnpm nx build blockadmin_api`
- Blockadmin smoke scenario: send a signed `POST /webhook/syncProduct` payload with `BLOCK_ADMIN_SECRET`; `block_admin_supplier_products` upserts by source `entityId`.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-09` — `Supplier product webhook contract documented`

- **Summary:** Documented the existing blockadmin supplier/product webhook receivers and invariants for the supplier-to-blockadmin product sync fix.
- **Affected areas:** `src/modules/supplier/profile/routes/webhook.ts`, `src/modules/supplier/product/routes/webhook.ts`, `src/modules/supplier/product/db/models/Product.ts`
- **Contracts changed:** None.
