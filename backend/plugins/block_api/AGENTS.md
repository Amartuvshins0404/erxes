# `block_api` Plugin Guide

## Identity

- **Plugin:** `block`
- **Project:** `block_api`
- **Layer:** `Backend API`
- **Path:** `backend/plugins/block_api`
- **Last synchronized:** `2026-08-30`

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
- Offer mirroring to block-admin, mirroring Contract's design: `Offer.updateOffer` throws `'Sent offers cannot be edited'` once `status === 'sent'` (5-minute revert window, same pattern as Contract), and `blockCreateOffer`/`blockUpdateOffer`/`blockSendOfferEmail` all auto-mirror via `wrapMutationResolver` — block-admin only actually syncs the offer once its status is `sent`. On-demand manual re-sync of a single sent offer (`blockManualSyncOffer`) mirrors `blockManualSyncContract`'s design.
- Every mutation in `resolvers.Mutation` is globally wrapped by `wrapMutationResolver` (`src/main.ts`), which fires a best-effort webhook to `${BLOCK_ADMIN_API_URL}/webhook/{mutationName}` after any mutation that returns a truthy entity — most of these paths have no matching route in `blockadmin_api` and are ignored there; only the explicitly-built webhook paths below are consumed.
- Online payment of a scheduled contract payment through the org's own payment plugin: `blockCreateContractPaymentInvoice` (staff) and the `POST /webhook/createContractPaymentInvoice` receiver (client portal, called by `blockadmin_api`) both build a payment_api invoice with `contentType: 'block:contractPayment'` and the org's configured methods (QPay), and payment_api's paid-invoice callback lands back here on the `block-payments` queue, where it is recorded as a `ContractPaymentTransaction` and re-synced to block-admin like any manual transaction.
- Reconciliation of a lost paid-invoice callback: `POST /webhook/checkContractPaymentInvoice` re-asks payment_api about one invoice and, when it comes back `paid`, credits it through the same idempotent path the queue callback uses — needed because payment_api's tRPC `checkInvoice` reports status without re-firing the plugin callback (only its GraphQL `invoicesCheck` does that).
- Online-payment configuration at two levels (`blockGetContractPaymentSettings(projectId)` / `blockUpdateContractPaymentSettings(input, projectId)`): one org-wide default document plus an optional per-project override, holding which payment_api payment-method ids may be charged and whether a customer may pay less than a scheduled payment's remaining amount. An invoice resolves the settings for its own payment's `projectId`.
- Agent-callable tRPC read tools: `unit.findOne`/`unit.find`/`unit.count` (permission `unit.showUnits`) and `project.findOne`/`project.find` (permission `project.showProjects`) are exposed via `.meta({ agent: ... })`, discovered through the platform's auto-mounted `/agent-tools/manifest`. Sellable units are `status: 'available'` with `locked: false`.

## Architecture

| Area              | Path                                     | Responsibility                                                                 |
| ------------------ | ----------------------------------------- | -------------------------------------------------------------------------------- |
| Admin/sync         | `src/modules/admin`                       | `CustomerSync` link record, `sendMessage`/`sendMessageAwait` webhook client, `syncCustomerToBlockAdmin`, global `wrapMutationResolver` |
| Contract           | `src/modules/contract`                    | Contract CRUD, `ContractStatus`, `ContractPayment`/`ContractPaymentTransaction`, `ContractPaymentSettings`, offers, block-admin mirror utils (`utils/mirror.ts`, `utils/paymentsSync.ts`, `utils/signedStatus.ts`), online-payment utils (`utils/onlinePayment.ts`) and the client-portal invoice webhook (`routes/payment.ts`) |
| Payments meta      | `src/meta/payments.ts`                    | Consumer of payment_api's `block-payments` BullMQ queue: credits a paid invoice to its `ContractPayment` |
| Project            | `src/modules/project`                     | Project, payment plan templates, project members, agent-facing project tRPC tools (`trpc/project.ts`) |
| Building           | `src/modules/building`                    | Buildings, zonings                                                              |
| Unit               | `src/modules/unit`                        | Units, unit types, agent-facing unit tRPC tools (`trpc/unit.ts`)                |
| Oppty              | `src/modules/oppty`                       | Opportunity pipeline, oppty statuses, convert-to-contract                       |
| Developer          | `src/modules/developer`                   | Developer org profile                                                           |
| Document/Note/Attachment | `src/modules/document`, `note`, `attachment` | Generic file/note/attachment CRUD scoped to block entities                   |
| Invoice            | `src/modules/invoice`                     | Invoice read/pay                                                                |

## Contracts

### Provides

- GraphQL (all operations prefixed `block`/`getBlock`/`createBlock` etc., unique repo-wide): contract (`blockCreateContract`, `blockUpdateContract`, `blockUpdateContractStatus`, `blockManualSyncContract`, `blockGetContract(s)`, `blockGetContractsList`, `blockGetUnitContractOverview`), contract payments/transactions (`blockGetContractPayments`, `blockAddPaymentTransaction`, `blockUpdatePaymentTransaction`, `blockRemovePaymentTransaction`, ...), contract statuses (`*BlockContractStatus*`), projects/buildings/units/oppty/offers/invoices/documents/notes/attachments (see `src/modules/*/graphql/schemas`), customer sync (`blockSyncCustomer`, `blockGetCustomerSync`).
- tRPC agent tools (auto-mounted `/agent-tools/manifest` + `/agent-tools/call` via `trpcAppRouter` in `src/main.ts`): `unit.findOne`, `unit.find`, `unit.count` (`unit.showUnits` permission), `project.findOne`, `project.find` (`project.showProjects` permission). Read-only; find/count inputs are strict and results bounded.
- GraphQL online payment: `blockCreateContractPaymentInvoice(paymentId, amount)` → `{invoiceId, url, amount, currency}`, `blockGetContractPaymentSettings(projectId)`, `blockUpdateContractPaymentSettings(input, projectId)`.
- HTTP `POST /webhook/createContractPaymentInvoice` (HMAC-validated with `BLOCK_ADMIN_SECRET`, payload `{payload: {entityId: <ContractPayment._id>, data: {amount?, cpUserId?, email?, phone?, redirectUri?}}}`) — consumed only by `blockadmin_api` on behalf of a client-portal customer; answers `{success, invoice}`.
- HTTP `POST /webhook/checkContractPaymentInvoice` (payload `{payload: {entityId: <Contract._id>, data: {invoiceId, customerId}}}`) — same channel; re-checks the invoice, credits it if paid, and answers `{success, check: {status, paymentStatus, paidAmount, amount}}`.
- `meta.payments` handlers (`callback`, `transactionCallback`) registered through `startPlugin`, so payment_api can deliver paid invoices whose `contentType` is `block:contractPayment` on the `block-payments` queue.
- Webhook calls to `blockadmin_api` at `${BLOCK_ADMIN_API_URL}/webhook/{path}` (HMAC-signed with `BLOCK_ADMIN_SECRET`): `customerSync`, `blockCreateContract`, `blockUpdateContract`, `blockUpdateContractStatus`, `contractSigned`, `blockSyncContractPayments`. Every other mutation name is also fired generically by `wrapMutationResolver` but has no consuming route on the other side.

### Consumes

- `sendTRPCMessage({pluginName: 'core', module: 'customers', action: 'findOne', ...})` from `erxes-api-shared/utils` to resolve core customer email/phone for sync.
- `blockadmin_api`'s webhook routes (see above) as the only way to write into the shared cross-org platform.
- `sendTRPCMessage({pluginName: 'payment', module: 'payment', action: 'getOrCreateInvoiceUrl'})` to bill a scheduled payment, and `action: 'getInvoiceWithTransactions'` to read back which method (`qpay`, …) settled it.

## Data and State

- MongoDB collections scoped by `subdomain` implicitly (single-tenant DB per org deployment); no explicit `subdomain` field needed on block_api's own schemas since the whole DB is the tenant.
- `block_contract_payment_settings` holds one org-wide default (`projectId: null`) plus at most one document per project (`paymentIds`, `allowPartial`). `getSettings(projectId)` returns the project's document when it exists and otherwise the default; `updateSettings(input, projectId)` creates the document for that scope on first write.
- `block_contract_payment_transactions.invoiceId` holds the payment_api invoice id for online payments and carries a unique sparse index — it is the idempotency key for paid-invoice callbacks. Manual transactions leave it unset.
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
- `Unit.locked` (manual admin toggle via `blockToggleUnitLock`, independent of contract signing status) must be checked before creating any record that claims a unit — `blockCreateContract`, `blockCreateOppty`, and `blockCreateOffer` all throw `'Cannot create <thing>: unit is locked'` when `unit.locked` is true. Any new "claim a unit" mutation must add the same guard. Note this is separate from a unit's `activeContract.statusType === 'signed'` (computed dynamically from its contracts, not a stored flag) — frontend unit-selectors additionally disable already-signed units in the UI, but that check is not currently mirrored server-side for any of the three mutations.
- Offer's `status` (`draft|sent`) is a plain enum stored directly on the document — unlike Contract's status (an ObjectId reference into a per-org `ContractStatus` collection), there is no lookup/resolve-to-semantic-type step needed before mirroring an offer.
- `blockSendOfferEmail`'s own GraphQL args (`{_id}`) carry no offer fields, so — like `blockUpdateContractStatus` does for Contract — it must mutate `args.input` in place after computing the updated offer, or `wrapMutationResolver`'s auto-forwarded webhook payload has nothing for block-admin's route to mirror. `contract/utils/offerMirror.ts#buildOfferMirrorInput` is the one place that builds this shape; `blockSendOfferEmail`, `blockUpdateOffer`, and `blockManualSyncOffer` all use it — keep it as the single source rather than reconstructing the field list at each call site.
- `blockUpdateOffer` must always reshape `args.input` to the full DB record via `buildOfferMirrorInput(updated)` after the write, even though its GraphQL arg is a full `BlockOfferInput!` — the frontend's status-only Select (`OfferDetailSheet.handleStatusChange`) calls this same mutation with a deliberately partial input (no `customerId`, `paymentPlan`, etc.), so forwarding the caller's raw `input` as-is silently drops fields block-admin's `syncIfSent` needs (this was the root cause of the "offer sent" notification not firing — fixed 2026-08-11). Contract avoids this class of bug entirely by routing status-only changes through a dedicated `blockUpdateContractStatus` mutation instead of overloading `blockUpdateContract`; Offer instead fixes it by making the shared update path always mirror complete data regardless of what was sent.
- Contract payment invoices are always created against **this org's** payment plugin (`sendTRPCMessage` with the org's own `subdomain`), never blockadmin's — the developer org owns the QPay merchant account, and creating the invoice here is also what makes payment_api route the paid-invoice callback back to `block`, where the payment schedule actually lives. `blockadmin_api` must therefore ask for the invoice over the webhook rather than billing the customer itself.
- `ContractPayment.recordOnlinePayment` is the only entry point for a paid invoice, and it is idempotent by `invoiceId` (BullMQ retries the callback, and an invoice re-check replays it): it returns the existing transaction rather than crediting twice, and treats a duplicate-key error as the same case. Never call `addTransaction` directly from the payments callback.
- A project's settings document replaces the org-wide default outright for that project — resolution is per document, not per field, so a project row with an empty `paymentIds` switches online payment off for that project rather than falling back to the default's methods. The default is matched with `{projectId: null}`, which also picks up documents written before `projectId` existed on this schema.
- An online invoice defaults to the payment's full remaining amount (`amount - paidAmount`); a smaller amount is only accepted when `ContractPaymentSettings.allowPartial` is on. A payment that is already `paid`/`cancelled`, or has nothing remaining, must never produce an invoice.
- The webhook caller (`blockadmin_api`) is trusted to have authenticated the client-portal user, but never to have picked the right record: `checkContractPaymentInvoice` re-verifies that the invoice's `contentType` is `block:contractPayment` and that its payment's `contractId`/`customerId` match the ones the caller claims to have verified, before crediting anything.
- payment_api's tRPC `payment.checkInvoice` reports an invoice's status (and can flip it to `paid`) but does **not** enqueue the plugin callback — only its GraphQL `invoicesCheck` mutation does. Anything here that polls it must therefore credit the result itself via `recordOnlinePayment`; treating tRPC `checkInvoice` as "the callback will follow" silently leaves the contract payment unpaid forever.
- `CONTRACT_PAYMENT_CONTENT_TYPE` (`'block:contractPayment'`) is a contract with payment_api, which splits it to route the callback to this plugin — changing that string silently breaks every in-flight invoice, since pending invoices already carry the old value.
- Agent-facing tRPC reads must stay bounded and strict: every `.meta({ agent })` find-style procedure caps `limit` (default 20, max 100), rejects unknown top-level input keys via `.strict()` Zod schemas, and only safe read procedures get annotated. Never annotate raw-mongo or mutation helpers.

## Validation

- `pnpm nx lint block_api`
- `pnpm nx build block_api`
- `pnpm nx test block_api` (when `project.json` defines a test target)
- Smoke (lost callback): pay an invoice with `block_api` stopped, restart it, then `POST /webhook/checkContractPaymentInvoice` for that contract/invoice — the payment must be credited exactly once and a repeat call must change nothing.
- Smoke (online payment): set `blockUpdateContractPaymentSettings(input: {paymentIds: ["<qpay method id>"]}, projectId: "<project>")`, call `blockCreateContractPaymentInvoice(paymentId)` for an unpaid scheduled payment, pay the returned widget url with QPay, then confirm a `ContractPaymentTransaction` exists with that `invoiceId`, the payment flipped to `paid`/`partial`, and block-admin's mirrored schedule reflects it; re-deliver the same callback and confirm no second transaction appears.
- Smoke: create a contract, move its status to a `signed`-typed `ContractStatus`, confirm `block_admin_contracts`/`block_admin_contract_payments` in blockAdmin's DB reflect it; then call `blockManualSyncContract(contractId)` again and confirm no duplicate rows and payments/transactions are intact.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-30` — Per-project online-payment settings

- **Summary:** `block_contract_payment_settings` gained a `projectId`, so a project can override the org-wide default; `getSettings`/`updateSettings` take an optional project scope, the GraphQL query and mutation take a `projectId` argument, and invoice creation resolves settings for the payment's own `projectId` with the org default as fallback.
- **Affected areas:** `src/modules/contract/db/{definitions,models}/PaymentSettings.ts`, `src/modules/contract/@types/paymentSettings.ts`, `src/modules/contract/utils/onlinePayment.ts`, `src/modules/contract/graphql/{schemas,resolvers}/payment.ts`.
- **Contracts changed:** `blockGetContractPaymentSettings` now takes `projectId: String`; `blockUpdateContractPaymentSettings` takes `projectId: String`; `BlockContractPaymentSettings` exposes `projectId`.

### `2026-08-29` — Invoice re-check for lost payment callbacks

- **Summary:** Added `checkContractPaymentInvoice` (util + `POST /webhook/checkContractPaymentInvoice`), which re-asks payment_api about one contract-payment invoice, re-verifies it against the claimed contract/customer, and credits a `paid` result through `recordOnlinePayment` — payment_api's tRPC `checkInvoice` does not re-fire the plugin callback, so the caller must do the crediting. Payment-method detection now prefers the transaction's own `paymentKind` over the joined payment method, so it survives a deleted method.
- **Affected areas:** `src/modules/contract/utils/onlinePayment.ts`, `src/modules/contract/routes/payment.ts`.
- **Contracts changed:** Added webhook `POST /webhook/checkContractPaymentInvoice`. No GraphQL changes.

### `2026-08-27` — QPay online payment for contract payments

- **Summary:** A scheduled contract payment can now be settled online through the org's own payment plugin: new online-payment settings (`block_contract_payment_settings`), an invoice builder used by both `blockCreateContractPaymentInvoice` and the new `POST /webhook/createContractPaymentInvoice` receiver that `blockadmin_api`'s client portal calls, and a `meta.payments` callback that credits the paid invoice as a `ContractPaymentTransaction` (idempotent by `invoiceId`), recomputes the payment's status and re-syncs the schedule to block-admin.
- **Affected areas:** `src/meta/payments.ts` (new), `src/modules/contract/utils/onlinePayment.ts` (new), `src/modules/contract/routes/` (new), `src/modules/contract/db/models/PaymentSettings.ts` (new), `src/modules/contract/db/models/Payment.ts`, `src/modules/contract/db/definitions/transaction.ts`, `src/modules/contract/graphql/{schemas,resolvers}/payment.ts`, `src/connectionResolvers.ts`, `src/routes/index.ts`, `src/main.ts`.
- **Contracts changed:** Added GraphQL `blockCreateContractPaymentInvoice`, `blockGetContractPaymentSettings`, `blockUpdateContractPaymentSettings`; added webhook `POST /webhook/createContractPaymentInvoice`; registered `meta.payments` (queue `block-payments`) with payment_api content type `block:contractPayment`; `BlockContractPaymentTransaction` gained `invoiceId`.

### `2026-08-21` — Agent-callable tRPC read tools for units and projects

- **Summary:** Wired `trpcAppRouter` into `startPlugin` and exposed read-only agent tools — `unit.findOne`/`unit.find`/`unit.count` and `project.findOne`/`project.find` — via `.meta({ agent })`, so AI agents can answer real-estate availability questions (sellable = `status: 'available'`, `locked: false`) through the platform's `/agent-tools` protocol. Added the plugin's first permissions config (`unit.showUnits`, `project.showProjects`, both `always: true`) and a local `agentMeta` helper.
- **Affected areas:** `src/trpc/agentMeta.ts` (new), `src/trpc/init-trpc.ts`, `src/meta/permissions.ts` (new), `src/modules/unit/trpc/unit.ts` (new), `src/modules/project/trpc/project.ts` (new), `src/main.ts`.
- **Contracts changed:** Added tRPC agent tools (`unit.*`, `project.*` reads) on the auto-mounted `/agent-tools/manifest`; registered permissions modules `unit` and `project`. No GraphQL changes.

### `2026-08-11` — Fixed offer-sent notification not firing

- **Summary:** `OfferDetailSheet`'s status Select calls `blockUpdateOffer` with a partial input (no `customerId`), and that mutation forwarded the caller's raw `input` as-is to the mirror webhook — so on the sync that should have created block-admin's first record for a newly-sent offer, `customerId` was missing and the "you have a new offer" notification's guard (`offer?.customerId`) silently skipped it. `blockUpdateOffer` now always reshapes `args.input` to the full DB record via `buildOfferMirrorInput(updated)` after the write, the same way `blockSendOfferEmail` already did.
- **Affected areas:** `src/modules/contract/graphql/resolvers/mutations/offer.ts`.
- **Contracts changed:** None (webhook payload shape unchanged; now always carries complete data instead of whatever the caller partially sent).

### `2026-08-11` — Manual offer sync mutation

- **Summary:** Added `blockManualSyncOffer(offerId)`, the on-demand version of the automatic sent-offer mirror (customer link sync + offer mirror), for use from a UI-triggered "sync" action — mirrors `blockManualSyncContract`'s design. Extracted the offer-mirror-payload construction (previously inlined in `blockSendOfferEmail`) into a shared `contract/utils/offerMirror.ts#buildOfferMirrorInput`, now used by both.
- **Affected areas:** `src/modules/contract/graphql/resolvers/mutations/offer.ts`, `src/modules/contract/graphql/schemas/offer.ts`, `src/modules/contract/utils/offerMirror.ts` (new).
- **Contracts changed:** Added GraphQL mutation `blockManualSyncOffer(offerId: String!): BlockOffer`.

### `2026-08-11` — Sent offers mirrored to block-admin and made immutable

- **Summary:** `Offer.updateOffer` now throws `'Sent offers cannot be edited'` once an offer's `status` is `sent` (same 5-minute revert-window pattern as Contract). `blockSendOfferEmail` now goes through `Offer.updateOffer` (previously used a raw un-guarded `updateOne`) and returns the updated offer document instead of the string `'success'`, reshaping `args.input` in place afterward so its auto-forwarded mirror payload carries full offer fields (it previously carried none, since `{_id}` is all its own GraphQL args ever had).
- **Affected areas:** `src/modules/contract/db/models/Offer.ts`, `src/modules/contract/graphql/resolvers/mutations/offer.ts`, `src/modules/contract/graphql/schemas/offer.ts`.
- **Contracts changed:** `blockSendOfferEmail`'s return type changed from `String` to `BlockOffer`.

### `2026-08-11` — Offer creation now blocks locked units

- **Summary:** `blockCreateOffer` had no unit guard at all (any unit, including a locked one, could have an offer created against it) — added the same `unit.locked` check `blockCreateContract`/`blockCreateOppty` already use, throwing `'Cannot create offer: unit is locked'`.
- **Affected areas:** `src/modules/contract/graphql/resolvers/mutations/offer.ts`.
- **Contracts changed:** None (existing mutation now rejects a previously-allowed input in a locked-unit edge case).

### `2026-08-10` — Manual contract sync mutation

- **Summary:** Added `blockManualSyncContract(contractId)`, an on-demand version of the automatic signed-contract sync pipeline (customer link + contract mirror + full payment/transaction regenerate-and-sync), for use from a UI-triggered "sync" action; extracted the contract-mirror-payload construction shared with `blockUpdateContractStatus` into `contract/utils/mirror.ts`.
- **Affected areas:** `src/modules/contract/graphql/resolvers/mutations/contract.ts`, `src/modules/contract/graphql/schemas/contract.ts`, `src/modules/contract/utils/mirror.ts` (new).
- **Contracts changed:** Added GraphQL mutation `blockManualSyncContract(contractId: String!): BlockContract`.

### `2026-08-10` — Payment sync consolidated to single bulk mechanism

- **Summary:** Replaced per-transaction single-row sync with one "sync all payments for this contract" mechanism (`ContractPayment.syncAllForContract`), triggered after every transaction add/update/remove and after contract regenerate, so block-admin's payment schedule is always replaced wholesale rather than patched row by row.
- **Affected areas:** `src/modules/contract/db/models/Payment.ts`, `src/modules/contract/utils/paymentsSync.ts`.
- **Contracts changed:** Webhook `blockSyncContractPayments` now always carries the full current payment list for the contract.
