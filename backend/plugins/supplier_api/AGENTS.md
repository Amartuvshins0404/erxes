# `supplier_api` Plugin Guide

## Identity

- **Plugin:** `supplier`
- **Project:** `supplier_api`
- **Layer:** `Backend API`
- **Path:** `backend/plugins/supplier_api`
- **Last synchronized:** `2026-08-09`

## Scope

### Owns

- Supplier profile data for a supplier tenant.
- Supplier-facing GraphQL mutations and queries.
- Supplier webhook endpoints for platform callbacks and mushop collective flows.
- Supplier-to-consumer product/category webhook sync triggered from core product mutations.

### Does not own

- Consumer-side supplier or product storage in `mushop_api` or `blockadmin_api`.
- Core product/category schema, models, mutations, or POS configuration ownership.
- Shared platform APIs outside the existing public `erxes-api-shared` contracts.

## Current Capabilities

- Stores and updates the tenant's supplier profile, verification status, tier level, and POS token.
- Sends supplier profile updates to configured consumer platforms through signed webhooks.
- Listens to core product/category create, update, and delete after-mutation events and sends signed `syncProduct` / `syncProductCategory` webhooks to target consumer platforms.
- Sends product/category create and update sync only for products/categories included in the supplier's selected POS catalog, regardless of target consumer platform.
- Runs a BullMQ backfill worker to replay the selected POS catalog after supplier profile saves with a POS token.
- Handles signed consumer callbacks under `/webhook/:platform/supplier`.

## Architecture

| Area | Path | Responsibility |
| ---- | ---- | -------------- |
| Runtime | `backend/plugins/supplier_api/src/main.ts` | Starts the supplier plugin, GraphQL, tRPC, Express routes, after-process hooks, and backfill worker |
| Routes | `backend/plugins/supplier_api/src/routes.ts` | Mounts platform and collective webhook routers |
| Supplier module | `backend/plugins/supplier_api/src/modules/supplier/` | Supplier profile schema, model, GraphQL API, and platform callback routes |
| Platform sync | `backend/plugins/supplier_api/src/modules/platform/` | Consumer platform resolution, signed webhook transport, product payload building, and POS catalog backfill helpers |
| Product hook | `backend/plugins/supplier_api/src/meta/afterProcess.ts` | Observes core product/category mutations and dispatches consumer product sync webhooks |
| Backfill worker | `backend/plugins/supplier_api/src/workers/backfill.ts` | Processes POS catalog backfill jobs |

## Contracts

### Provides

- GraphQL supplier profile operations from `src/modules/supplier/graphql`.
- tRPC app router from `src/trpc/init-trpc.ts`.
- HTTP `POST /webhook/:platform/supplier` for `mushop` and `blockadmin` verification callbacks.
- HTTP `POST /webhook/mushop/*` collective webhook endpoints.
- Meta after-process rules for `productsAdd`, `productsEdit`, `productsRemove`, `productCategoriesAdd`, `productCategoriesEdit`, and `productCategoriesRemove`.

### Consumes

- Core product/category after-mutation payloads.
- Core product category tRPC `findOne` and `withChilds`.
- POS client tRPC `getConfigByToken` and `findByToken`.
- SaaS organization bundle lookup through `getSaasOrganizationDetail`.
- Consumer webhook endpoints configured by `MUSHOP_API_URL` / `MUSHOP_SECRET` and `BLOCK_ADMIN_API_URL` / `BLOCK_ADMIN_SECRET`.

## Data and State

- Tenant-scoped supplier Mongo models are generated through `generateModels(subdomain)`.
- Supplier POS token defines the product/category publish scope for every consumer platform and drives replayable backfill jobs.
- Consumer platform targets are selected by SaaS bundle type and `MUSHOP_SUPPLIER_BUNDLE_TYPE` / `BLOCK_ADMIN_SUPPLIER_BUNDLE_TYPE`; development falls back to configured consumers when bundle targeting is unavailable.
- Product/category sync state is not stored here; consumer plugins own synced copies.

## Local Invariants

- Every outbound webhook body is signed as `sha256=<hmac>` over `JSON.stringify({ subdomain, payload })`.
- Product/category create and update sync to any consumer platform must stay limited to the supplier POS catalog.
- POS catalog backfill must use `posclient.products.findByToken` as the selected product source of truth.
- Webhook failures are logged but do not fail the original supplier/core mutation.
- Do not import consumer plugin models or source; communicate with consumers only through signed HTTP webhooks.

## Validation

- `pnpm nx build supplier_api`
- Supplier smoke scenario: save a supplier profile with a configured `posToken`; selected POS products from `posclient.products.findByToken` are replayed to configured consumer platforms.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-09` — `Selected POS product webhook sync`

- **Summary:** Product/category sync now resolves target platforms explicitly, keeps selected POS filtering for live mutations, replays selected POS products on supplier profile save, allows same-POS resync jobs, awaits dispatch, and logs unmatched consumers.
- **Affected areas:** `src/meta/afterProcess.ts`, `src/modules/platform/shared.ts`, `src/modules/platform/productSync.ts`, `src/modules/supplier/graphql/resolvers/mutations/supplier.ts`, `src/workers/backfill.ts`
- **Contracts changed:** `getTargetPlatforms(subdomain)` exported from platform shared utilities; existing HTTP webhook payloads unchanged.
