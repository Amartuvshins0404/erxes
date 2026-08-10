# `blockadmin_api` Plugin Guide

## Identity

- **Plugin:** `blockadmin`
- **Project:** `blockadmin_api`
- **Layer:** `Backend API`
- **Path:** `backend/plugins/blockadmin_api`
- **Last synchronized:** `2026-08-10`

## Scope

### Owns

- Blockadmin admin-side data and APIs for developers, agencies, projects, buildings, units, contracts, listings, documents, invoices, customers, forms, suppliers, and supplier products.
- Signed webhook receivers used by block, blockagency, and supplier-facing plugins.
- Admin GraphQL operations and Mongo models for blockadmin-owned records.
- Cross-org "Block Platform" mirror: a `block` org's signed contracts, contract payment schedules, and customer links, received via `block_api`'s webhooks and re-exposed to the client portal.

### Does not own

- Supplier tenant source product/category data in `supplier_api` or core product modules.
- Mushop consumer behavior or POS client catalog writes.
- Block, blockagency, or block source plugin implementations — never import `block_api` source; consume it only through the signed webhook contract.
- Shared libraries, gateway configuration, or core API contracts unless explicitly scoped.

## Current Capabilities

- Receives signed webhooks under `/webhook` and loads blockadmin tenant models with context/modifier middleware.
- Stores supplier profiles synced from supplier tenants and exposes admin review queries/mutations.
- Stores supplier products synced from supplier tenants, including initial category snapshots, attachments, status, state, and source `entityId`.
- Supports product approval/rejection, category assignment, soft-delete by source entity IDs, and supplier verification/tier updates.
- Mirrors a `block_api` org's signed contracts (create/update/status-change/manual-resync all funnel through one upsert-by-`{subdomain, entityId}` path), their full payment/transaction schedules (bulk-replaced on every sync), and customer identity links (`BlockCustomer`, verified against erxes core by email/phone before linking, keyed by `customerId` = core's customer id).
- Client-portal GraphQL surface (`clientportal` module) exposing a customer's contracts, per-contract payment schedule, and a computed summary (totals + next payment) — intentionally NOT subdomain-scoped, since a customer may hold contracts across multiple orgs; ownership is instead verified per-request against the authenticated `cpUser`.
- Exposes blockadmin GraphQL schema sections through `src/apollo/schema/schema.ts`.

## Architecture

| Area | Path | Responsibility |
| ---- | ---- | -------------- |
| Runtime routes | `backend/plugins/blockadmin_api/src/routes/index.ts` | Mounts signed `/webhook` receivers with context and request modifiers |
| Supplier profile | `backend/plugins/blockadmin_api/src/modules/supplier/profile/` | Supplier profile schema, model, GraphQL API, and `updateSupplier` webhook |
| Supplier product | `backend/plugins/blockadmin_api/src/modules/supplier/product/` | Supplier product schema, model, GraphQL API, and product/category sync webhooks |
| Supplier models | `backend/plugins/blockadmin_api/src/modules/supplier/db/loadModels.ts` | Registers `block_admin_suppliers` and `block_admin_supplier_products` models |
| Contract | `backend/plugins/blockadmin_api/src/modules/contract/` | Mirrored `Contract`/`ContractPayment`/`Offer` schemas, models, webhook routes (`routes/contract.ts`, `routes/payment.ts`, `routes/offer.ts`) |
| BlockCustomer | `backend/plugins/blockadmin_api/src/modules/blockCustomer/` | Customer identity link (`customerId` ↔ org `entityId`), core-verified via `utils.ts#resolveBlockCustomer`, webhook route in `routes/blockCustomer.ts` |
| Client portal | `backend/plugins/blockadmin_api/src/modules/clientportal/` | `cp*`-prefixed GraphQL queries for the authenticated customer's contracts/payments/summary, plus building/project/unit/developer read models |
| `schemaWrapper` | `backend/plugins/blockadmin_api/src/utils.ts` | Adds `subdomain`/`entityId` (default `ObjectId`, overridable via `entityIdType`) and a unique `{subdomain, entityId}` index to every blockadmin schema |
| Apollo wiring | `backend/plugins/blockadmin_api/src/apollo/` | Combines blockadmin schemas, queries, mutations, and custom resolvers |

## Contracts

### Provides

- HTTP `POST /webhook/updateSupplier` for supplier profile sync.
- HTTP `POST /webhook/syncProduct` for supplier product create/update/delete sync.
- HTTP `POST /webhook/syncProductCategory` for supplier category snapshot update/delete sync.
- HTTP `POST /webhook/{customerSync, blockCreateContract, blockUpdateContract, blockUpdateContractStatus, contractSigned, blockSyncContractPayments}` — all signed contract/customer mirror receivers consumed only by `block_api`.
- GraphQL supplier profile queries/mutations with `ba*` operation names.
- GraphQL supplier product queries/mutations with `ba*` operation names.
- GraphQL client-portal queries — all require an authenticated `cpUser` (`erxesCustomerId`):
  - `cpBlockAdminGetContracts` — every contract this customer holds, across all orgs.
  - `cpBlockAdminGetContractPayments(contractId)` / `cpBlockAdminGetContractSummary(contractId)` — scoped to one contract; verify the contract belongs to the requesting customer via `getOwnedContract` before returning data.
  - `cpBlockAdminGetPayments` / `cpBlockAdminGetSummary` — the same payments/summary shape aggregated across *every* contract the customer holds (no `contractId`), by querying `ContractPayment` directly on `customerId` rather than joining through `Contract`.

### Consumes

- Supplier webhook bodies signed with `BLOCK_ADMIN_SECRET`.
- Supplier payload shape `{ subdomain, payload: { entityId, entityIds, data } }`.
- Contract/customer webhook payload shape `{ subdomain, payload: { entityId, data: { input? , email?, phone?, payments? } } }`, HMAC-signed with `BLOCK_ADMIN_SECRET`, sent by `block_api`'s `sendMessage`/`sendMessageAwait`.
- `sendTRPCMessage` to erxes core (via `BlockCustomer`'s `resolveBlockCustomer`) to independently verify a customer's email/phone before linking — never trusts the webhook payload's identity claim alone.
- Public `erxes-api-shared` utilities and GraphQL JSON/scalar conventions.

## Data and State

- `block_admin_suppliers` stores supplier records keyed by source supplier entity and subdomain.
- `block_admin_supplier_products` stores supplier product copies keyed by `{ subdomain, entityId }`.
- Supplier products use `status` values `pending`, `approved`, and `rejected`.
- Supplier products use `state` values `active`, `hidden`, and `deleted`.
- Product category sync stores category snapshots in `initialCategory`; it does not own core category records.
- `block_admin_contracts` mirrors one org's signed contracts, keyed by `{subdomain, entityId}` (entityId = block_api's contract `_id`); this document's own `_id` is blockadmin-generated and must never be overwritten by a mirrored payload's `_id`.
- `block_admin_contract_payments` is wholesale-replaced (`deleteMany` + `insertMany`) on every sync — never patched row by row — keyed by `{subdomain, contractId}`.
- `block_admin_customers` (`BlockCustomer`) stores `{customerId, subdomain, entityId}` only (no PII); `entityId` uses `String` (core customer ids are `mongooseStringRandomId`-based, not ObjectIds) via `schemaWrapper`'s `entityIdType` override — every other blockadmin schema keeps the default `ObjectId` `entityId`.
- Client-portal queries intentionally do not filter by `subdomain` — a customer's contracts are looked up purely by `customerId` across all orgs; per-contract queries additionally verify ownership via `BlockCustomer` → `Contract.customerId`.
- `ContractPayment` rows carry their own `customerId` (mirrored from block_api's payment rows, which inherit it from their parent contract), so user-wide payment/summary queries can query `ContractPayment` directly without joining through `Contract` first.

## Local Invariants

- Webhook receivers must validate `subdomain` and source entity IDs before writing.
- Supplier product sync must upsert by `{ subdomain, entityId }`, not by local `_id`.
- Delete webhooks soft-delete supplier products by setting `state: deleted`.
- Category delete webhooks clear `initialCategory` on matching active records.
- Do not import supplier or mushop plugin internals; consume their data only through webhook payloads.
- Any mirrored `IContract`/`IContractPaymentSyncRow` payload from `block_api` carries block_api's own `_id` as a field — strip it before spreading into a Mongo `$set`/replacement, or the update fails with `Performing an update on the path '_id' would modify the immutable field '_id'` on every re-sync of an already-mirrored contract (see `Contract.upsertSignedContract`, fixed 2026-08-10). Never trust a foreign `_id` field in any mirrored payload's update path.
- `Contract.status` here is a fixed enum (`reserved|draft|signed|lost|cancelled`) mirroring `block_api`'s per-org `ContractStatus.type`, never a raw per-org `ContractStatus._id` reference.
- `Contract.upsertSignedContract` is the single upsert path for all three of block_api's mirror entry points (create/update/status-change) plus manual re-sync — any of them may be blockadmin's first encounter with a given contract, so it must always upsert, never assume prior existence.
- `BlockCustomer.resolveBlockCustomer` always re-verifies identity against erxes core by email/phone before linking/upserting; it never trusts a client-supplied `entityId`-only claim.

## Validation

- `pnpm nx lint blockadmin_api`
- `pnpm nx build blockadmin_api`
- Blockadmin smoke scenario: send a signed `POST /webhook/syncProduct` payload with `BLOCK_ADMIN_SECRET`; `block_admin_supplier_products` upserts by source `entityId`.
- Contract smoke scenario: sign a contract in `block_api`, confirm `block_admin_contracts`/`block_admin_contract_payments` reflect it; call the same sync again (e.g. via `block_api`'s `blockManualSyncContract`) and confirm it upserts cleanly with no immutable-field error and no duplicate payment rows.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-10` — Added `unitDetail`/`project`/`unitType` to the client-portal Contract custom resolver

- **Summary:** `CpBlockContract` only exposed `unit` as a raw unit-id string; added a `CpBlockContract` custom resolver (previously none existed) with `unitDetail` (full Unit record — named to avoid colliding with the existing `unit` id field), `project`, and `unitType` fields that walk `contract.unit → Unit → (zoning → building → project) / type` to return full unit/project/unit-type detail directly from a contract, mirroring the chain already used by the client-portal Unit resolver.
- **Affected areas:** `src/modules/clientportal/graphql/resolvers/customResolvers/contract.ts` (new), `src/modules/clientportal/graphql/resolvers/customResolvers/index.ts`, `src/modules/clientportal/graphql/schemas/contract.ts`.
- **Contracts changed:** Added fields `CpBlockContract.unitDetail: CpBlockAdminUnit`, `CpBlockContract.project: BlockAdminProject`, `CpBlockContract.unitType: CpBlockAdminUnitType`.

### `2026-08-10` — Fixed missing `await` on Project/Building/Zoning webhook writes

- **Summary:** Same bug class fixed earlier in the contract webhook routes: `blockCreateProject`/`blockUpdateProjectGeneralInfo`/`blockPublishProject`/`blockRemoveProject`, `blockCreateBuilding`/`blockUpdateBuilding`/`blockDeleteBuilding`/`blockDupplicateBuilding`, and the equivalent zoning routes called their model writes without `await`. Beyond swallowing thrown errors, this let `blockCreateProject` and the immediately-following `blockUpdateProjectGeneralInfo` race each other — the update's `getProject` lookup could run before the create had actually landed, fall into its own `create` branch, and produce a second, full-data project document with a different `_id` than the stub the update should have completed, while `Building.project`/counts kept pointing at the original stub. This is the likely explanation for a project client-portal resolver returning a correct `_id` (matching real building/unit counts) but null on every descriptive field. `unit/routes/unit.ts` was already correctly awaited and needed no change.
- **Affected areas:** `src/modules/project/routes/project.ts`, `src/modules/building/routes/building.ts`, `src/modules/building/routes/zoning.ts`.
- **Contracts changed:** None (webhook payload shapes unchanged; fixes how writes are sequenced).

### `2026-08-10` — Added `project` to the client-portal Unit custom resolver

- **Summary:** `CpBlockAdminUnit` (client-portal unit type) previously only resolved `building`/`zoning`/`type`; added a `project` field resolver that walks `unit.zoning → zoning.building → building.project` to return the unit's project detail directly, matching the existing (non-batched) resolver style in this file.
- **Affected areas:** `src/modules/clientportal/graphql/resolvers/customResolvers/unit.ts`, `src/modules/clientportal/graphql/schemas/unit.ts`.
- **Contracts changed:** Added field `CpBlockAdminUnit.project: BlockAdminProject`.

### `2026-08-10` — User-wide payments/summary client-portal queries

- **Summary:** Added `cpBlockAdminGetPayments`/`cpBlockAdminGetSummary`, aggregating across every contract a customer holds (no `contractId` arg), alongside the existing per-contract `cpBlockAdminGetContractPayments`/`cpBlockAdminGetContractSummary`. Both query `ContractPayment` directly by `customerId` rather than joining through `Contract`. Extracted shared `getBlockCustomer`/`summarizePayments` helpers used by all four query resolvers. Added `contractId`/`contractNumber` to `CpBlockPayment` so multi-contract payment rows are distinguishable.
- **Affected areas:** `src/modules/clientportal/graphql/resolvers/queries/contract.ts`, `src/modules/clientportal/graphql/schemas/contract.ts`.
- **Contracts changed:** Added GraphQL queries `cpBlockAdminGetPayments: [CpBlockPayment]` and `cpBlockAdminGetSummary: CpBlockContractSummary`; added fields `CpBlockPayment.contractId`/`contractNumber`.

### `2026-08-10` — Fixed `_id`/`entityId` mismatch breaking client-portal payment/summary lookups

- **Summary:** `cpBlockAdminGetContracts` returned blockAdmin's own internal Mongo `_id` as each contract's `_id`, but `cpBlockAdminGetContractPayments`/`cpBlockAdminGetContractSummary` (and `ContractPayment.contractId`) key off `entityId` (block_api's org-side contract id) — a different value — so a client round-tripping the list's `_id` into either follow-up query always got an empty/null result. `cpBlockAdminGetContracts` now returns `entityId` as `_id`.
- **Affected areas:** `src/modules/clientportal/graphql/resolvers/queries/contract.ts`.
- **Contracts changed:** `cpBlockAdminGetContracts[]._id` now returns the org-side contract id (matches `Contract.entityId`) instead of blockAdmin's internal document `_id`.

### `2026-08-10` — Fixed immutable `_id` error on contract re-sync

- **Summary:** `Contract.upsertSignedContract` spread the mirrored `input` (which carries block_api's own contract `_id`) directly into a Mongo `$set`, so any re-sync of an already-mirrored contract (e.g. `block_api`'s new manual sync) failed with "Performing an update on the path '_id' would modify the immutable field '_id'". Now strips `_id` from the mirrored fields before the `$set`.
- **Affected areas:** `src/modules/contract/db/models/Contract.ts`.
- **Contracts changed:** None (webhook payload shape unchanged; fixes a latent bug in how it was applied).

### `2026-08-10` — Documented contract/customer/client-portal mirror surface

- **Summary:** Synchronized this guide with the contract, customer-link, and client-portal mirroring work built up over prior sessions (previously undocumented here) — signed-contract mirroring, bulk payment/transaction sync, core-verified customer linking, and the non-subdomain-scoped client-portal contract queries.
- **Affected areas:** Documentation only.
- **Contracts changed:** None.

### `2026-08-09` — `Supplier product webhook contract documented`

- **Summary:** Documented the existing blockadmin supplier/product webhook receivers and invariants for the supplier-to-blockadmin product sync fix.
- **Affected areas:** `src/modules/supplier/profile/routes/webhook.ts`, `src/modules/supplier/product/routes/webhook.ts`, `src/modules/supplier/product/db/models/Product.ts`
- **Contracts changed:** None.
