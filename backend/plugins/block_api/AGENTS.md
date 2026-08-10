# `block_api` Plugin Guide

## Identity

- **Plugin:** `block`
- **Project:** `block_api`
- **Layer:** `Backend API`
- **Path:** `backend/plugins/block_api`
- **Last synchronized:** `2026-08-10`

## Scope

### Owns

- Real-estate developer/project vertical for a single org (subdomain): projects, buildings, zonings, unit types, units, opportunities (`oppty`), contracts, contract statuses, contract payments/transactions, offers, invoices, developer profile, documents, notes, attachments.
- Mirroring org data (customer link, signed contracts, contract payment schedules) into `blockadmin_api`, the cross-org shared platform, via signed webhook calls.

### Does not own

- Cross-org/shared "Block Platform" storage — that is `blockadmin_api`'s collections (`block_admin_*`), reached only through the `BLOCK_ADMIN_API_URL` webhook contract, never imported directly.
- Client-portal-facing queries for the shared platform — those live in `blockadmin_api`'s `clientportal` module.
- Core customer/company data — read via `sendTRPCMessage({pluginName: 'core', module: 'customers', ...})`, never via direct DB access.

## Current Capabilities

- Full CRUD for projects, buildings, zonings, unit types, units, opportunities, contracts, offers, invoices, developer info, documents, notes, attachments.
- Per-org customizable `ContractStatus` (name/color/order) whose `type` field carries the fixed semantic vocabulary (`reserved | draft | signed | lost | cancelled`) that `blockadmin_api` understands.
- Contract payment schedule generation from a contract's `paymentPlan` (`ContractPayment.regenerateForContract`), with transaction tracking (`ContractPaymentTransaction`) and per-payment status recomputation from transactions.
- Automatic mirroring to block-admin: customer sync (`blockSyncCustomer`), contract mirror + payment/transaction sync fire automatically whenever a contract's resolved status becomes `signed` (create, update, or status-change paths) or is cancelled.
- On-demand manual re-sync of a single signed contract (`blockManualSyncContract`) — same pipeline as the automatic signed-path sync, triggered by a widget instead of a status transition.
- Every mutation in `resolvers.Mutation` is globally wrapped by `wrapMutationResolver` (`src/main.ts`), which fires a best-effort webhook to `${BLOCK_ADMIN_API_URL}/webhook/{mutationName}` after any mutation that returns a truthy entity — most of these paths have no matching route in `blockadmin_api` and are ignored there; only the explicitly-built webhook paths below are consumed.

## Architecture

| Area              | Path                                     | Responsibility                                                                 |
| ------------------ | ----------------------------------------- | -------------------------------------------------------------------------------- |
| Admin/sync         | `src/modules/admin`                       | `CustomerSync` link record, `sendMessage`/`sendMessageAwait` webhook client, `syncCustomerToBlockAdmin`, global `wrapMutationResolver` |
| Contract           | `src/modules/contract`                    | Contract CRUD, `ContractStatus`, `ContractPayment`/`ContractPaymentTransaction`, offers, block-admin mirror utils (`utils/mirror.ts`, `utils/paymentsSync.ts`, `utils/signedStatus.ts`) |
| Project            | `src/modules/project`                     | Project, payment plan templates, project members                               |
| Building           | `src/modules/building`                    | Buildings, zonings                                                              |
| Unit               | `src/modules/unit`                        | Units, unit types                                                               |
| Oppty              | `src/modules/oppty`                       | Opportunity pipeline, oppty statuses, convert-to-contract                       |
| Developer          | `src/modules/developer`                   | Developer org profile                                                           |
| Document/Note/Attachment | `src/modules/document`, `note`, `attachment` | Generic file/note/attachment CRUD scoped to block entities                   |
| Invoice            | `src/modules/invoice`                     | Invoice read/pay                                                                |

## Contracts

### Provides

- GraphQL (all operations prefixed `block`/`getBlock`/`createBlock` etc., unique repo-wide): contract (`blockCreateContract`, `blockUpdateContract`, `blockUpdateContractStatus`, `blockManualSyncContract`, `blockGetContract(s)`, `blockGetContractsList`, `blockGetUnitContractOverview`), contract payments/transactions (`blockGetContractPayments`, `blockAddPaymentTransaction`, `blockUpdatePaymentTransaction`, `blockRemovePaymentTransaction`, ...), contract statuses (`*BlockContractStatus*`), projects/buildings/units/oppty/offers/invoices/documents/notes/attachments (see `src/modules/*/graphql/schemas`), customer sync (`blockSyncCustomer`, `blockGetCustomerSync`).
- Webhook calls to `blockadmin_api` at `${BLOCK_ADMIN_API_URL}/webhook/{path}` (HMAC-signed with `BLOCK_ADMIN_SECRET`): `customerSync`, `blockCreateContract`, `blockUpdateContract`, `blockUpdateContractStatus`, `contractSigned`, `blockSyncContractPayments`. Every other mutation name is also fired generically by `wrapMutationResolver` but has no consuming route on the other side.

### Consumes

- `sendTRPCMessage({pluginName: 'core', module: 'customers', action: 'findOne', ...})` from `erxes-api-shared/utils` to resolve core customer email/phone for sync.
- `blockadmin_api`'s webhook routes (see above) as the only way to write into the shared cross-org platform.

## Data and State

- MongoDB collections scoped by `subdomain` implicitly (single-tenant DB per org deployment); no explicit `subdomain` field needed on block_api's own schemas since the whole DB is the tenant.
- Key collections: `block_projects`, `block_buildings`, `block_zonings`, `block_units`, `block_unit_types`, `block_contracts`, `block_contract_statuses`, `block_contract_payments`, `block_contract_payment_transactions`, `block_opptys`, `block_oppty_statuses`, `block_offers`, `block_customer_syncs`.
- `Contract.status` is an ObjectId reference into this org's own `ContractStatus` collection — never a fixed enum. Only `ContractStatus.type` carries the fixed semantic value (`reserved|draft|signed|lost|cancelled`) that must be resolved before mirroring to block-admin.

## Local Invariants

- Any payload sent to `blockadmin_api` must carry `ContractStatus.type` (the semantic string), never the raw per-org `ContractStatus._id` — block-admin has no concept of this org's custom status documents.
- Contract payment schedules and payment-plan mirroring are only ever pushed to block-admin when the contract's resolved status type is `signed` (or being cancelled, which clears/cancels the mirrored schedule). Do not sync draft/reserved contracts.
- `ContractPayment.regenerateForContract` deletes and recreates the schedule but restores existing `ContractPaymentTransaction` rows for payments regenerated at the same `index` — always re-fetch fresh via `find({contractId})` after calling it before syncing to block-admin, since its own return value can be stale (its internal restore loop recomputes statuses after the array is returned).
- Any Mongoose write inside an Express route/resolver body must be `await`ed — a missed `await` lets thrown validation errors become unhandled rejections outside the surrounding `try/catch`, and the caller sees a false success.
- `wrapMutationResolver` mutates and forwards the same `args`/`input` object reference used to call the resolver; resolvers may intentionally mutate `input` in place (e.g. resolving `status` to its semantic type) to control what gets mirrored, without touching the generic wrapper.
- `sendMessage` (fire-and-forget) never throws or surfaces errors to the caller — only `sendMessageAwait` (used for `customerSync` and the manual contract mirror) can raise/report `.error` and should be checked when the caller needs to know the sync actually succeeded.
- `BLOCK_ADMIN_API_URL` must point directly at the gateway's `/pl:blockadmin` route (no `/gateway` prefix) — the gateway does not register that prefix internally.

## Validation

- `pnpm nx lint block_api`
- `pnpm nx build block_api`
- `pnpm nx test block_api` (when `project.json` defines a test target)
- Smoke: create a contract, move its status to a `signed`-typed `ContractStatus`, confirm `block_admin_contracts`/`block_admin_contract_payments` in blockAdmin's DB reflect it; then call `blockManualSyncContract(contractId)` again and confirm no duplicate rows and payments/transactions are intact.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-10` — Manual contract sync mutation

- **Summary:** Added `blockManualSyncContract(contractId)`, an on-demand version of the automatic signed-contract sync pipeline (customer link + contract mirror + full payment/transaction regenerate-and-sync), for use from a UI-triggered "sync" action; extracted the contract-mirror-payload construction shared with `blockUpdateContractStatus` into `contract/utils/mirror.ts`.
- **Affected areas:** `src/modules/contract/graphql/resolvers/mutations/contract.ts`, `src/modules/contract/graphql/schemas/contract.ts`, `src/modules/contract/utils/mirror.ts` (new).
- **Contracts changed:** Added GraphQL mutation `blockManualSyncContract(contractId: String!): BlockContract`.

### `2026-08-10` — Payment sync consolidated to single bulk mechanism

- **Summary:** Replaced per-transaction single-row sync with one "sync all payments for this contract" mechanism (`ContractPayment.syncAllForContract`), triggered after every transaction add/update/remove and after contract regenerate, so block-admin's payment schedule is always replaced wholesale rather than patched row by row.
- **Affected areas:** `src/modules/contract/db/models/Payment.ts`, `src/modules/contract/utils/paymentsSync.ts`.
- **Contracts changed:** Webhook `blockSyncContractPayments` now always carries the full current payment list for the contract.

### `2026-08-10` — Signed-only contract mirroring

- **Summary:** Contracts (and their payment schedules) are now mirrored to block-admin only once their resolved status type is explicitly `signed`, checked at each of the three mutation entry points (create, update, status-change) rather than relying on an internal early-return; cancelled contracts clear their mirrored schedule.
- **Affected areas:** `src/modules/contract/db/models/Contract.ts`, `src/modules/contract/graphql/resolvers/mutations/contract.ts`.
- **Contracts changed:** None (webhook shapes unchanged; gating logic only).

### `2026-08-10` — Customer sync verifies identity against core

- **Summary:** `syncCustomerToBlockAdmin` now sends the customer's email/phone (not stored PII) to block-admin, which independently re-verifies against erxes core before linking, rather than trusting client-supplied data.
- **Affected areas:** `src/modules/admin/utils.ts`.
- **Contracts changed:** Webhook `customerSync` payload now carries `{email, phone}` instead of no identity data.
