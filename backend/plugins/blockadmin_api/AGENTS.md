# `blockadmin_api` Plugin Guide

## Identity

- **Plugin:** `blockadmin`
- **Project:** `blockadmin_api`
- **Layer:** `Backend API`
- **Path:** `backend/plugins/blockadmin_api`
- **Last synchronized:** `2026-08-11`

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
- Client-portal browse surface for agencies and listings (`cpGetBlockAdmin*`): agency directory/detail, and listing directory/detail/stats scoped to publicly visible (`status: 'active'`) listings, optionally narrowed to one agency. These require only a client-portal app token, not a `cpUser`.
- Mirrors `block_api` offers the same way once their `status` becomes `sent` (create/update/send-email all funnel through `Offer.upsertSentOffer`) — draft offers are never synced. Does not recompute invoices/payment schedules for offers (that stays org-side in `block_api`); this is a pure state mirror, not a business-logic duplicate.
- Client-portal GraphQL surface (`clientportal` module) exposing a customer's contracts and offers, per-contract payment schedule, and a computed summary (totals + next payment) — intentionally NOT subdomain-scoped, since a customer may hold contracts/offers across multiple orgs. The list queries (`cpBlockAdminGetContracts`/`cpBlockAdminGetOffers`) are scoped to the authenticated `cpUser`'s own `BlockCustomer`, but the single-record detail queries that take an id argument (`cpBlockAdminGetContractPayments`/`cpBlockAdminGetContractSummary`/`cpBlockAdminGetOffer`) currently do **not** verify the requested record belongs to that `cpUser` — see Local Invariants.
- `CpBlockOffer.paymentSchedule` computes an offer's full barter/down-payment/progress-payment/completion-payment breakdown (rows + total) on the fly from `paymentPlan` — the same computation `block_ui`'s `OfferDetailSheet` does client-side, ported so the client portal doesn't need offer-payment-plan math duplicated on every consumer.
- Exposes blockadmin GraphQL schema sections through `src/apollo/schema/schema.ts`.
- Daily BullMQ-scheduled worker (`src/worker/`) that sends client-portal payment reminder/overdue notifications for every org's contract payments in one global scan (no per-org loop needed, since `ContractPayment` rows already carry their own `subdomain`).
- `blockSyncContractPayments`'s webhook route sends a "payment successful" notification the moment a specific payment row transitions into `paid` status, detected by diffing the schedule's prior statuses (fetched before the bulk replace) against the newly-synced rows — payments are always mirrored as a full wholesale replace, never a per-row update, so this diff is the only way to know which row just changed.

## Architecture

| Area | Path | Responsibility |
| ---- | ---- | -------------- |
| Runtime routes | `backend/plugins/blockadmin_api/src/routes/index.ts` | Mounts signed `/webhook` receivers with context and request modifiers |
| Supplier profile | `backend/plugins/blockadmin_api/src/modules/supplier/profile/` | Supplier profile schema, model, GraphQL API, and `updateSupplier` webhook |
| Supplier product | `backend/plugins/blockadmin_api/src/modules/supplier/product/` | Supplier product schema, model, GraphQL API, and product/category sync webhooks |
| Supplier models | `backend/plugins/blockadmin_api/src/modules/supplier/db/loadModels.ts` | Registers `block_admin_suppliers` and `block_admin_supplier_products` models |
| Contract | `backend/plugins/blockadmin_api/src/modules/contract/` | Mirrored `Contract`/`ContractPayment`/`Offer` schemas, models, webhook routes (`routes/contract.ts`, `routes/payment.ts`, `routes/offer.ts`); `utils/paymentNotify.ts` holds the shared `paymentLabel`/`notifyPayment` helpers used by both the payment-paid webhook trigger and the worker |
| BlockCustomer | `backend/plugins/blockadmin_api/src/modules/blockCustomer/` | Customer identity link (`customerId` ↔ org `entityId`), core-verified via `utils.ts#resolveBlockCustomer`, webhook route in `routes/blockCustomer.ts` |
| Client portal | `backend/plugins/blockadmin_api/src/modules/clientportal/` | `cp*`-prefixed GraphQL queries for the authenticated customer's contracts/offers/payments/summary, plus building/project/unit/developer read models. Custom resolvers add `unitDetail`/`project`/`unitType` to both `CpBlockContract` and `CpBlockOffer` (same `unit → zoning → building → project` chain), and `paymentSchedule` to `CpBlockOffer` (`utils/offerPaymentSchedule.ts`, computed on the fly from `paymentPlan`, not stored). |
| `schemaWrapper` | `backend/plugins/blockadmin_api/src/utils.ts` | Adds `subdomain`/`entityId` (default `ObjectId`, overridable via `entityIdType`) and a unique `{subdomain, entityId}` index to every blockadmin schema |
| Apollo wiring | `backend/plugins/blockadmin_api/src/apollo/` | Combines blockadmin schemas, queries, mutations, and custom resolvers |
| Worker | `backend/plugins/blockadmin_api/src/worker/` | `index.ts` wires a BullMQ `upsertJobScheduler` (queue `blockadmin-payment-reminders`, daily `0 9 * * *` at `Asia/Ulaanbaatar`) to a consumer; `paymentReminders.ts` holds the actual scan/notify logic |
| cp notifications | `backend/plugins/blockadmin_api/src/utils/cpNotify.ts` | Shared `notifyBlockCustomer(models, subdomain, orgCustomerId, data)` — resolves an org-side customer id through `BlockCustomer` to a verified core customer id, looks up its client-portal users (`cpUsers.list`, grouped by `clientPortalId`), and sends `cpNotifications.create`. Used by the payment reminder worker and the contract-signed/offer-sent webhook routes. |

## Contracts

### Provides

- HTTP `POST /webhook/updateSupplier` for supplier profile sync.
- HTTP `POST /webhook/syncProduct` for supplier product create/update/delete sync.
- HTTP `POST /webhook/syncProductCategory` for supplier category snapshot update/delete sync.
- HTTP `POST /webhook/{customerSync, blockCreateContract, blockUpdateContract, blockUpdateContractStatus, contractSigned, blockSyncContractPayments}` — all signed contract/customer mirror receivers consumed only by `block_api`.
- GraphQL supplier profile queries/mutations with `ba*` operation names.
- GraphQL supplier product queries/mutations with `ba*` operation names.
- GraphQL client-portal queries — all require an authenticated `cpUser` (`erxesCustomerId`):
  - `cpBlockAdminGetContracts` / `cpBlockAdminGetOffers` — every contract/offer this customer holds, across all orgs, scoped via the requesting `cpUser`'s `BlockCustomer`.
  - `cpBlockAdminGetContractPayments(contractId)` / `cpBlockAdminGetContractSummary(contractId)` / `cpBlockAdminGetOffer(offerId)` — look up the single record by its blockadmin `_id` (the same `_id` the list queries return); do **not** currently verify it belongs to the requesting `cpUser` (see Local Invariants).
  - `cpBlockAdminGetPayments` / `cpBlockAdminGetSummary` — the same payments/summary shape aggregated across *every* contract the customer holds (no `contractId`), by querying `ContractPayment` directly on `customerId` rather than joining through `Contract`.
- GraphQL client-portal agency/listing browse queries — marked `forClientPortal: true` only, so they need a client-portal app token but no authenticated `cpUser`:
  - `cpGetBlockAdminAgencies(verificationStatus, searchValue, city, district, + offset params): [CpBlockAdminAgency]` / `cpGetBlockAdminAgencyInfo(_id!): CpBlockAdminAgency`.
  - `cpGetBlockAdminListings(agencyId, type, propertyType, searchValue, city, district, + offset params): [CpBlockAdminListing]`, `cpGetBlockAdminListing(_id!): CpBlockAdminListing`, `cpGetBlockAdminListingStats(agencyId): CpBlockAdminListingStats`.
  - `CpBlockAdminAgency` deliberately omits the admin-only `documents`, `rejectionReasons`, and `rejectionNotes` fields; `CpBlockAdminListing` omits `subdomain`/`entityId` and resolves `agencyId` through a custom resolver instead.

### Consumes

- Supplier webhook bodies signed with `BLOCK_ADMIN_SECRET`.
- Supplier payload shape `{ subdomain, payload: { entityId, entityIds, data } }`.
- Contract/customer webhook payload shape `{ subdomain, payload: { entityId, data: { input? , email?, phone?, payments? } } }`, HMAC-signed with `BLOCK_ADMIN_SECRET`, sent by `block_api`'s `sendMessage`/`sendMessageAwait`.
- `sendTRPCMessage` to erxes core (via `BlockCustomer`'s `resolveBlockCustomer`) to independently verify a customer's email/phone before linking — never trusts the webhook payload's identity claim alone.
- `sendTRPCMessage` to erxes core's `cpUsers.list`/`cpNotifications.create` tRPC routes, via the shared `notifyBlockCustomer` helper (used by the payment reminder worker and the contract-signed webhook route) — addressed at the *relevant record's own* `subdomain` (the originating org), never blockadmin's own worker-local subdomain.
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
- `ContractPayment` rows carry their own `customerId` (mirrored from block_api's payment rows, which inherit it from their parent contract), so user-wide payment/summary queries can query `ContractPayment` directly without joining through `Contract` first — but this `customerId` is block_api's org-side reference (mirrors `BlockCustomer.entityId`), not the verified core customer id (`BlockCustomer.customerId`). Client-portal queries filter by `blockCustomer.entityId` (correct); anything that needs the *verified* core customer id (e.g. calling core's `cpUsers`/`cpNotifications` tRPC routes) must resolve it through `BlockCustomer.findOne({subdomain, entityId: payment.customerId})` first.

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
- Client-portal listing queries must force `status: 'active'`; `draft`, `inactive`, and `sold` listings stay admin-side. `cpGetBlockAdminListing` therefore returns "Listing not found" for a non-active `_id` rather than the record.
- Listings carry no `agencyId` column — they are joined to an agency by `subdomain`. Any client-portal `agencyId` filter must resolve the agency first, and an unknown `agencyId` must yield an empty result, never an unfiltered one.
- `@/agency/utils#generateFilter` covers only `searchValue`/`city`/`district` and silently ignores `verificationStatus`; the client-portal agency query applies that filter itself. Do not assume the shared filter honors every declared query param.
- The payment reminder worker (`src/worker/paymentReminders.ts`) runs once daily and sends exactly two kinds of notification with no persisted "already sent" state: upcoming reminders at 5/3/1 days before `dueDate` (each a distinct calendar-day bucket, so a once-daily cron naturally fires each at most once) and overdue reminders for every unpaid/partial payment whose `dueDate` has passed (these resend every run — that's intentional, not a bug). Every `sendTRPCMessage` call it makes must use the *payment's* `subdomain`, not the worker's own fixed `WORKER_SUBDOMAIN` — the former addresses the originating org's core-api (where the actual cpUser/cpNotification records live), the latter only selects blockadmin's own local DB connection.
- The "payment paid" notification (`routes/payment.ts`) fires per-row, once, exactly when a payment's status transitions into `paid` on a given sync — detected by fetching the schedule's prior statuses *before* `replaceForContract`'s delete+reinsert and diffing against the newly-synced rows by `String(entityId)` (must stringify — `entityId` is a Mongoose ObjectId, and comparing ObjectId instances directly by `===`/Map-key never matches even for the same underlying id). On a contract's very first-ever payment sync there is no prior state to diff against, so any row synced already-`paid` (e.g. backdated historical data) will spuriously notify once — accepted as a minor edge case, not fixed.
- The worker resolves a payment's client-portal users via `BlockCustomer.findOne({subdomain: payment.subdomain, entityId: payment.customerId})` to get the verified `customerId`, then passes *that* as `cpUsers.list`'s `erxesCustomerId` — `payment.customerId` itself is block_api's org-side reference, not the value `cpUsers.list` expects (fixed 2026-08-11; see Local Invariants above).
- `notifyBlockCustomer` (`src/utils/cpNotify.ts`) is the one place that resolves an org-side customer id to client-portal users and sends a notification; any new notification trigger should call it rather than re-deriving the `BlockCustomer` → `cpUsers.list` → `cpNotifications.create` chain.
- The "new contract" notification in `contract/routes/contract.ts`'s `syncIfSigned` fires exactly once, only when `Contract.findOne({subdomain, entityId})` found nothing *before* the upsert — i.e. on whichever of block_api's three mirror entry points (create/update/status-change) happens to be blockadmin's first encounter with that contract. It must never fire on a re-sync of an already-mirrored contract (including `blockManualSyncContract`'s repeat syncs).
- `contract/routes/offer.ts`'s `syncIfSent` mirrors that exact pattern for Offer (`syncIfSigned` → `syncIfSent`, `Contract.upsertSignedContract` → `Offer.upsertSentOffer`, gated on `status === 'sent'` instead of `'signed'`, "new offer" notification fires once on first-ever sync). Any future Offer mirror change should stay symmetric with Contract's — don't let the two drift apart.
- Every mirrored entity's schema-level Mongoose `ref` on its `unit` field must point at `block_admin_units` (blockadmin's own collection), not `block_units` (block_api's org-side collection name) — `ref` doesn't affect query correctness (nothing here calls `.populate()`), but a wrong value is a copy-paste tell that the field itself may also be unresolved; `Offer.unit`'s `ref` had this exact bug (fixed 2026-08-11, matching the same fix already applied to `Contract.unit`) — always resolve an incoming `input.unit` (block_api's org-side unit id) through `Unit.getUnit(subdomain, input.unit)` to get blockadmin's own unit `_id` before storing it.
- Offer intentionally has no `blockGetOffers`-equivalent invoice-generation logic in blockadmin — that math (discount/down-payment/installment/interest) is block_api's job; blockadmin only ever mirrors the offer's own fields once `sent`, the same way it mirrors contract payments as already-computed rows rather than recomputing a payment plan itself.
- Client-portal single-record detail queries (`cpBlockAdminGetContractPayments`/`cpBlockAdminGetContractSummary`/`cpBlockAdminGetOffer`) look up strictly by the id argument (`Contract.findOne({_id})`/`Offer.findOne({_id})`) with no check that the record belongs to the requesting `cpUser` — any authenticated cp user can currently fetch any contract's payments/summary or any offer by guessing/enumerating its `_id`. This was already true for contracts before the offer queries were added; the offer queries were built to match that existing pattern rather than introduce a new, inconsistent one. Fixing it (e.g. re-adding an ownership join through `BlockCustomer`) needs to cover contracts and offers together.
- `CpBlockOfferPaymentPlan` is a client-portal-only type, deliberately **not** reusing the admin-facing `BlockAdminOfferPaymentPlan` — the admin type has a non-null `type: BlockAdminProjectPaymentPlanType!` field that block_api never actually populates (Offer's org-side payment plan has no `type` field at all), so querying it would throw "Cannot return null for non-nullable field". Do not reuse `BlockAdminOfferPaymentPlan` for client-portal or admin-panel work without fixing that field first.
- `clientportal/utils/offerPaymentSchedule.ts#buildOfferPaymentSchedule` is a line-for-line port of `block_ui`'s `OfferDetailSheet.tsx`'s `OfferSchedule` component (installment-date generation, interest calc, barter/down/completion split). If that frontend calculation ever changes, this file must change with it or the two surfaces will silently disagree on the same offer's numbers — there is no shared package between the two today.

## Validation

- `pnpm nx lint blockadmin_api`
- `pnpm nx build blockadmin_api`
- Blockadmin smoke scenario: send a signed `POST /webhook/syncProduct` payload with `BLOCK_ADMIN_SECRET`; `block_admin_supplier_products` upserts by source `entityId`.
- Contract smoke scenario: sign a contract in `block_api`, confirm `block_admin_contracts`/`block_admin_contract_payments` reflect it; call the same sync again (e.g. via `block_api`'s `blockManualSyncContract`) and confirm it upserts cleanly with no immutable-field error and no duplicate payment rows.
- Worker smoke scenario: seed a `ContractPayment` with `dueDate` 1/3/5 days out and one with a past `dueDate`, both `status: 'unpaid'` with a real `customerId`; manually invoke `runPaymentReminders` (or wait for the `0 9 * * *` `Asia/Ulaanbaatar` schedule) and confirm a `cpNotifications.create` call fires for each, addressed at the payment's own `subdomain`.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-11` — Client-portal agency and listing browse queries

- **Summary:** Added `cpGetBlockAdminAgencies`, `cpGetBlockAdminAgencyInfo`, `cpGetBlockAdminListings`, `cpGetBlockAdminListing`, and `cpGetBlockAdminListingStats` to the `clientportal` module, reusing the admin `Agency`/`Listing` models and filter utilities but exposing public-safe `CpBlockAdminAgency`/`CpBlockAdminListing` projections, forcing `status: 'active'` on every listing read, and resolving the `agencyId` filter through the agency's `subdomain`.
- **Affected areas:** `src/modules/clientportal/graphql/schemas/{agency,listing,index}.ts`, `src/modules/clientportal/graphql/resolvers/queries/{agency,listing,index}.ts`, `src/modules/clientportal/graphql/resolvers/customResolvers/{listing,index}.ts`.
- **Contracts changed:** Added the five `cpGetBlockAdmin*` queries and the `CpBlockAdminAgency`, `CpBlockAdminListing`, `CpBlockAdminListingStats` types.
### `2026-08-11` — Payment-paid notification

- **Summary:** Added a "Таны {label} төлбөр амжилттай хийгдлээ." notification, sent from `blockSyncContractPayments`'s webhook route the moment a payment row transitions into `paid` status (detected by diffing prior schedule statuses, fetched before the bulk replace, against the newly-synced rows by stringified `entityId`). Extracted `paymentLabel`/`notifyPayment` out of the worker into a shared `contract/utils/paymentNotify.ts`, now used by both the worker and this new trigger. Also fixed the "offer sent" notification not firing (see `block_api`'s guide for the actual root cause — `blockUpdateOffer` wasn't reshaping its mirrored payload).
- **Affected areas:** `src/modules/contract/routes/payment.ts`, `src/modules/contract/utils/paymentNotify.ts` (new), `src/worker/paymentReminders.ts`.
- **Contracts changed:** None (webhook payload shape unchanged; adds an outbound `cpNotifications.create` call, no new inbound contract).

### `2026-08-11` — Offer payment schedule resolver

- **Summary:** Added `CpBlockOffer.paymentSchedule` (`rows: [CpBlockOfferScheduleRow], total: Float`), a computed field returning an offer's full barter/down-payment/progress-payment/completion-payment breakdown — a line-for-line TypeScript port of `block_ui`'s `OfferDetailSheet.tsx#OfferSchedule` calculation (installment-date generation by frequency, FLAT/REDUCING/default interest, discount/barter/down/completion splits), so client-portal consumers get the same numbers without re-implementing that math.
- **Affected areas:** `src/modules/clientportal/utils/offerPaymentSchedule.ts` (new), `src/modules/clientportal/graphql/resolvers/customResolvers/offer.ts`, `src/modules/clientportal/graphql/schemas/offer.ts`.
- **Contracts changed:** Added field `CpBlockOffer.paymentSchedule: CpBlockOfferPaymentSchedule` and types `CpBlockOfferPaymentSchedule`/`CpBlockOfferScheduleRow`.

### `2026-08-11` — Client-portal Offer queries

- **Summary:** Added `cpBlockAdminGetOffers` (list, scoped via `BlockCustomer`) and `cpBlockAdminGetOffer(offerId)` (single-record lookup by `_id`), matching `cpBlockAdminGetContracts`'s current pattern exactly — including that the single-record query does not verify ownership (see Local Invariants). `CpBlockOffer` gets the same `unitDetail`/`project`/`unitType` custom-resolver treatment as `CpBlockContract`. Deliberately did not reuse the admin-facing `BlockAdminOfferPaymentPlan` type (it has a landmine non-null `type` field block_api never populates) — defined a clean `CpBlockOfferPaymentPlan` instead.
- **Affected areas:** `src/modules/clientportal/graphql/schemas/offer.ts` (new), `src/modules/clientportal/graphql/resolvers/queries/offer.ts` (new), `src/modules/clientportal/graphql/resolvers/customResolvers/offer.ts` (new), `src/modules/clientportal/graphql/schemas/index.ts`, `src/modules/clientportal/graphql/resolvers/queries/index.ts`, `src/modules/clientportal/graphql/resolvers/customResolvers/index.ts`.
- **Contracts changed:** Added GraphQL queries `cpBlockAdminGetOffers: [CpBlockOffer]` and `cpBlockAdminGetOffer(offerId: String!): CpBlockOffer`.

### `2026-08-11` — Offer sync rebuilt to mirror Contract's pattern

- **Summary:** Rewrote `contract/routes/offer.ts` from scratch: it previously re-implemented block_api's entire invoice-generation math (discount/down-payment/installment/interest), with a live duplicate-create bug (`Offer.createOffer` called twice per non-installment offer), a hung response on the installment path (no `res.json` ever sent), and `blockSendOfferEmail`'s route always receiving `entityId: undefined` since block_api's old resolver returned a bare string. Replaced with `syncIfSent`, the exact `syncIfSigned` pattern: gate on `status === 'sent'`, upsert via new `Offer.upsertSentOffer`, and send a "Танд үнийн санал ирлээ" notification via `notifyBlockCustomer` on first-ever sync. Also fixed `Offer.unit`'s stray `ref: 'block_units'` (should reference blockadmin's own `block_admin_units`, matching Contract's already-fixed `ref`).
- **Affected areas:** `src/modules/contract/routes/offer.ts`, `src/modules/contract/db/models/Offer.ts`, `src/modules/contract/db/definitions/offer.ts`.
- **Contracts changed:** None (webhook payload shapes unchanged); depends on `block_api`'s `blockSendOfferEmail` now returning the offer document (see block_api's guide).

### `2026-08-11` — New-contract notification, extracted shared cp-notify helper

- **Summary:** Contract sync now sends a Mongolian "you have a new contract" client-portal notification exactly once, on whichever webhook call first creates a contract's `block_admin_contracts` record (`syncIfSigned` now checks `Contract.findOne` before the upsert, not just for `signedAt`). Extracted the `BlockCustomer` → `cpUsers.list` → `cpNotifications.create` chain (previously duplicated inline in the payment reminder worker) into a shared `notifyBlockCustomer(models, subdomain, orgCustomerId, data)` helper in `src/utils/cpNotify.ts`, and switched the worker to call it instead.
- **Affected areas:** `src/utils/cpNotify.ts` (new), `src/modules/contract/routes/contract.ts`, `src/worker/paymentReminders.ts`.
- **Contracts changed:** None (adds a new outbound `cpNotifications.create` call on contract creation; no inbound contract changes).

### `2026-08-11` — Daily payment reminder/overdue notification worker

- **Summary:** Added a BullMQ daily-scheduled worker (runs `0 9 * * *` at `Asia/Ulaanbaatar`, i.e. 9am Mongolia local time) that scans every org's `ContractPayment` rows in one global pass (no per-org loop, since rows carry their own `subdomain`) and sends client-portal notifications in Mongolian: an upcoming-payment reminder at 5/3/1 days before `dueDate`, and an overdue reminder every day a payment stays unpaid/partial past its `dueDate`. Resolves each payment's client-portal users via `BlockCustomer.findOne({subdomain, entityId: payment.customerId})` → verified core `customerId` → `cpUsers.list` (grouped by `clientPortalId`, since a customer could theoretically have cp users on more than one portal) → `cpNotifications.create`, all addressed at the payment's own `subdomain` (not blockadmin's own worker-local one). Notification text is hardcoded Mongolian (no i18n lookup); dates format via `toLocaleDateString('mn-MN')`; the overdue message states the actual number of days overdue (`daysBetween(payment.dueDate, today)`), not a generic "overdue" phrase.
- **Affected areas:** `src/worker/index.ts` (new), `src/worker/paymentReminders.ts` (new), `src/main.ts` (added `onServerInit` wiring `initMQWorkers(redis)`).
- **Contracts changed:** None (consumes core's existing `cpUsers.list`/`cpNotifications.create` tRPC routes; adds no new inbound contract).

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




