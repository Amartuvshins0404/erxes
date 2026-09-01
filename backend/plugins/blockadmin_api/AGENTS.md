# `blockadmin_api` Plugin Guide

## Identity

- **Plugin:** `blockadmin`
- **Project:** `blockadmin_api`
- **Layer:** `Backend API`
- **Path:** `backend/plugins/blockadmin_api`
- **Last synchronized:** `2026-08-29`

## Scope

### Owns

- Blockadmin admin-side data and APIs for developers, agencies, agency members (agents), projects, buildings, units, contracts, listings, documents, invoices, customers, forms, suppliers, and supplier products.
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
- Mirrors an agency's members (agents) from `blockagency_api` into `block_admin_members`, upserted by `{subdomain, entityId}` on every member create/update/profile-update webhook and deleted on remove. Each record carries the denormalized core user summary (`user`) the agency tenant resolved, because the person behind an agent lives in the agency's own tenant and cannot be resolved here.
- Admin agent queries (`getBlockAdminAgents`, `getBlockAdminAgentInfo`) and listing queries/stats that can be narrowed to one agent (`agencyMemberId`).
- Client-portal browse surface for agencies and listings (`cpGetBlockAdmin*`): agency directory/detail, and listing directory/detail/stats scoped to publicly visible (`active`/`sold`) listings, optionally narrowed to one agency or one agent, plus an agent directory/detail (`cpBlockAdminAgents`, `cpBlockAdminAgentInfo`). These require only a client-portal app token, not a `cpUser`.
- Mirrors `block_api` offers the same way once their `status` becomes `sent` (create/update/send-email all funnel through `Offer.upsertSentOffer`) — draft offers are never synced. Does not recompute invoices/payment schedules for offers (that stays org-side in `block_api`); this is a pure state mirror, not a business-logic duplicate.
- Client-portal GraphQL surface (`clientportal` module) exposing a customer's contracts and offers, per-contract payment schedule, and a computed summary (totals + next payment) — intentionally NOT subdomain-scoped, since a customer may hold contracts/offers across multiple orgs. The list queries (`cpBlockAdminGetContracts`/`cpBlockAdminGetOffers`) are scoped to the authenticated `cpUser`'s own `BlockCustomer`, but the single-record detail queries that take an id argument (`cpBlockAdminGetContractPayments`/`cpBlockAdminGetContractSummary`/`cpBlockAdminGetOffer`) currently do **not** verify the requested record belongs to that `cpUser` — see Local Invariants.
- `CpBlockOffer.paymentSchedule` computes an offer's full barter/down-payment/progress-payment/completion-payment breakdown (rows + total) on the fly from `paymentPlan` — the same computation `block_ui`'s `OfferDetailSheet` does client-side, ported so the client portal doesn't need offer-payment-plan math duplicated on every consumer.
- Exposes blockadmin GraphQL schema sections through `src/apollo/schema/schema.ts`.
- Daily BullMQ-scheduled worker (`src/worker/`) that sends client-portal payment reminder/overdue notifications for every org's contract payments in one global scan (no per-org loop needed, since `ContractPayment` rows already carry their own `subdomain`).
- Client-portal online payment (`cpBlockAdminCreatePaymentInvoice`): a customer can start paying one mirrored scheduled payment, which is forwarded to the owning org's `block_api` (`POST /webhook/createContractPaymentInvoice`) and answered with that org's payment_api invoice url (QPay). Blockadmin bills nothing itself and stores no invoice state — the settled payment comes back through the normal `blockSyncContractPayments` mirror, which is what flips the row to `paid` and notifies the customer.
- Client-portal payment reconciliation (`cpBlockAdminCheckPaymentInvoice`): re-asks the owning org whether an invoice the customer says they paid actually settled, for when QPay's callback to that org's payment_api never arrived. Keyed on `{contractId, invoiceId}`, never on a payment's own `_id`.
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
| Agency members | `backend/plugins/blockadmin_api/src/modules/member/` | Mirrored agent schema/model (`block_admin_members`), member webhook routes (`routes/member.ts`), admin GraphQL API, and `utils.ts`'s `resolveAgencyKeys`/`resolveAgentKeys`/`findAgentAgency` id translation plus `toAgencyFileUrl`/`toAgentUser`/`toAgentCertificatePhotos`, which turn agency-tenant file keys into absolute `read-file` urls on read |
| Client portal | `backend/plugins/blockadmin_api/src/modules/clientportal/` | `cp*`-prefixed GraphQL queries and mutations (`graphql/resolvers/mutations/payment.ts` starts an online payment against the owning org) for the authenticated customer's contracts/offers/payments/summary, plus building/project/unit/developer read models. Custom resolvers add `unitDetail`/`project`/`unitType` to both `CpBlockContract` and `CpBlockOffer` (same `unit → zoning → building → project` chain), and `paymentSchedule` to `CpBlockOffer` (`utils/offerPaymentSchedule.ts`, computed on the fly from `paymentPlan`, not stored). |
| `schemaWrapper` | `backend/plugins/blockadmin_api/src/utils.ts` | Adds `subdomain`/`entityId` (default `ObjectId`, overridable via `entityIdType`) and a unique `{subdomain, entityId}` index to every blockadmin schema |
| Apollo wiring | `backend/plugins/blockadmin_api/src/apollo/` | Combines blockadmin schemas, queries, mutations, and custom resolvers |
| Worker | `backend/plugins/blockadmin_api/src/worker/` | `index.ts` wires a BullMQ `upsertJobScheduler` (queue `blockadmin-payment-reminders`, daily `0 9 * * *` at `Asia/Ulaanbaatar`) to a consumer; `paymentReminders.ts` holds the actual scan/notify logic |
| cp notifications | `backend/plugins/blockadmin_api/src/utils/cpNotify.ts` | Shared `notifyBlockCustomer(models, subdomain, orgCustomerId, data)` — resolves an org-side customer id through `BlockCustomer` to a verified core customer id, looks up its client-portal users (`cpUsers.list`, grouped by `clientPortalId`), and sends `cpNotifications.create`. Used by the payment reminder worker and the contract-signed/offer-sent webhook routes. |

## Contracts

### Provides

- HTTP `POST /webhook/updateSupplier` for supplier profile sync.
- HTTP `POST /webhook/syncProduct` for supplier product create/update/delete sync.
- HTTP `POST /webhook/syncProductCategory` for supplier category snapshot update/delete sync.
- HTTP `POST /webhook/{blockAgentCreateMember, blockAgentUpdateMember, blockAgentUpdateMemberProfile, blockAgentRemoveMember}` — agency member mirror receivers consumed only by `blockagency_api`.
- GraphQL admin agent queries `getBlockAdminAgents(agencyId, role, searchValue, + cursor params): BlockAdminAgentListResponse` and `getBlockAdminAgentInfo(_id!): BlockAdminAgent`.
- HTTP `POST /webhook/{customerSync, blockCreateContract, blockUpdateContract, blockUpdateContractStatus, contractSigned, blockSyncContractPayments}` — all signed contract/customer mirror receivers consumed only by `block_api`.
- GraphQL supplier profile queries/mutations with `ba*` operation names.
- GraphQL supplier product queries/mutations with `ba*` operation names.
- GraphQL client-portal queries — all require an authenticated `cpUser` (`erxesCustomerId`):
  - `cpBlockAdminGetContracts` / `cpBlockAdminGetOffers` — every contract/offer this customer holds, across all orgs, scoped via the requesting `cpUser`'s `BlockCustomer`.
  - `cpBlockAdminGetContractPayments(contractId)` / `cpBlockAdminGetContractSummary(contractId)` / `cpBlockAdminGetOffer(offerId)` — look up the single record by its blockadmin `_id` (the same `_id` the list queries return); do **not** currently verify it belongs to the requesting `cpUser` (see Local Invariants).
  - `cpBlockAdminGetPayments` / `cpBlockAdminGetSummary` — the same payments/summary shape aggregated across *every* contract the customer holds (no `contractId`), by querying `ContractPayment` directly on `customerId` rather than joining through `Contract`.
- GraphQL client-portal mutation `cpBlockAdminCreatePaymentInvoice(paymentId, amount): CpBlockPaymentInvoice` — requires an authenticated `cpUser`, verifies the mirrored payment belongs to that customer's `BlockCustomer` in the payment's own org, and returns `{invoiceId, url, amount, currency}` produced by that org's `block_api`.
- GraphQL client-portal mutation `cpBlockAdminCheckPaymentInvoice(contractId, invoiceId): CpBlockPaymentCheck` — same `cpUser` + `BlockCustomer` ownership check as above (on the contract), forwarded to the owning org's `POST /webhook/checkContractPaymentInvoice`; returns `{status, paymentStatus, paidAmount, amount}` where `status` is the invoice's and `paymentStatus` is the scheduled payment's after any crediting.
- GraphQL client-portal agency/listing browse queries — marked `forClientPortal: true` only, so they need a client-portal app token but no authenticated `cpUser`:
  - `cpGetBlockAdminAgencies(verificationStatus, searchValue, city, district, + offset params): [CpBlockAdminAgency]` / `cpGetBlockAdminAgencyInfo(_id!): CpBlockAdminAgency`.
  - `cpGetBlockAdminListings(agencyId, agencyMemberId, status, type, propertyType, searchValue, city, district, + offset params): [CpBlockAdminListing]`, `cpGetBlockAdminListing(_id!): CpBlockAdminListing`, `cpGetBlockAdminListingStats(agencyId, agencyMemberId): CpBlockAdminListingStats` (`total`/`active`/`draft`/`sold`/`totalViews`).
  - `cpBlockAdminAgents(agencyId, role, searchValue, + offset params): [CpBlockAdminAgent]` / `cpBlockAdminAgentInfo(_id!): CpBlockAdminAgent`; `CpBlockAdminAgent` omits the admin-only `subdomain`/`entityId`/`memberId` keys and exposes the agent's own agency as a nested `agency: CpBlockAdminAgency`, resolved through `findAgentAgency`. Its flat `agencyId` field stays the raw agency-side id (`Agency.entityId`), which is **not** the `_id` `cpBlockAdminAgents(agencyId)`/`cpGetBlockAdminAgencyInfo(_id)` expect — read `agency._id` for that.
  - `CpBlockAdminAgency` deliberately omits the admin-only `documents`, `rejectionReasons`, and `rejectionNotes` fields; `CpBlockAdminListing` omits `subdomain`/`entityId` and resolves `agencyId` through a custom resolver instead.

### Consumes

- Supplier webhook bodies signed with `BLOCK_ADMIN_SECRET`.
- Supplier payload shape `{ subdomain, payload: { entityId, entityIds, data } }`.
- Agency member payload shape `{ subdomain, payload: { entityId?, data: { members?: [member], member?, input?, _id? } } }`, HMAC-signed with `BLOCK_ADMIN_SECRET`, sent by `blockagency_api`'s `wrapMutationResolver`.
- Contract/customer webhook payload shape `{ subdomain, payload: { entityId, data: { input? , email?, phone?, payments? } } }`, HMAC-signed with `BLOCK_ADMIN_SECRET`, sent by `block_api`'s `sendMessage`/`sendMessageAwait`.
- `sendTRPCMessage` to erxes core (via `BlockCustomer`'s `resolveBlockCustomer`) to independently verify a customer's email/phone before linking — never trusts the webhook payload's identity claim alone.
- `sendTRPCMessage` to erxes core's `cpUsers.list`/`cpNotifications.create` tRPC routes, via the shared `notifyBlockCustomer` helper (used by the payment reminder worker and the contract-signed webhook route) — addressed at the *relevant record's own* `subdomain` (the originating org), never blockadmin's own worker-local subdomain.
- `block_api`'s `POST /webhook/checkContractPaymentInvoice` (same signed channel) as the only way to force a re-check of an org's invoice.
- `block_api`'s `POST /webhook/createContractPaymentInvoice` (via `sendBlockMessage`, HMAC-signed with `BLOCK_ADMIN_SECRET` and addressed at `BLOCK_API_URL` for the payment's own `subdomain`) as the only way to bill a customer for a mirrored contract payment.
- Public `erxes-api-shared` utilities and GraphQL JSON/scalar conventions.

## Data and State

- `block_admin_suppliers` stores supplier records keyed by source supplier entity and subdomain.
- `block_admin_supplier_products` stores supplier product copies keyed by `{ subdomain, entityId }`.
- Supplier products use `status` values `pending`, `approved`, and `rejected`.
- Supplier products use `state` values `active`, `hidden`, and `deleted`.
- Product category sync stores category snapshots in `initialCategory`; it does not own core category records.
- `block_admin_members` mirrors an agency's members keyed by `{subdomain, entityId}` (entityId = the agency-side member `_id`); `agencyId` on it is the agency-side agency id (`Agency.entityId`), never blockadmin's own `Agency._id`. It declares `subdomain`/`entityId` explicitly instead of using `schemaWrapper`, because the agency-side ids are strings.
- `block_admin_listings.agencyMemberId` stores the agency-side member id of the listing's agent (mapped from `blockagency_api`'s `memberId`), so it joins to `block_admin_members.entityId`.
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
- Client-portal listing queries are restricted to the publicly visible statuses `active` and `sold` (`PUBLIC_LISTING_STATUSES`); `draft` and `inactive` listings stay admin-side. The `status` query param may only narrow *within* that set — any other value yields an empty result, never an unfiltered one — and with no `status` the default stays `active`. `cpGetBlockAdminListing` returns "Listing not found" for a draft/inactive `_id`. These queries are `forClientPortal: true` only (no `cpUser`), so anything added here is effectively public per portal.
- Listings carry no `agencyId` column — they are joined to an agency by `subdomain`. Any client-portal `agencyId` filter must resolve the agency first, and an unknown `agencyId` must yield an empty result, never an unfiltered one.
- Every id crossing the API boundary is a blockadmin `_id`; every stored cross-tenant link is an agency-side id. `@/member/utils`'s `resolveAgencyKeys`/`resolveAgentKeys` are the only translation path (`Agency._id` / `AgencyMember._id` → `{subdomain, entityId}`), with `findAgentAgency` as the reverse hop (an agent's `{subdomain, agencyId}` → its `Agency` doc), and both key resolvers return `null` for an unknown id, which callers must treat as "no results" rather than as "no filter". An `agencyId` + `agencyMemberId` pair from different tenants must also resolve to no results.
- An agent mirrored without `agencyId` is invisible to every agency-scoped query here (`getBlockAdminAgents`/`cpBlockAdminAgents` filter on it), so a gap in the agents tab points at the agency side not stamping it, not at this filter. `blockagency_api` resolves it from the tenant's single agency.
- The agency side is the source of truth for members and may replay a webhook, so `AgencyMember.saveAgent` always upserts by `{subdomain, entityId}` and never assumes prior existence — `blockAgentUpdateMemberProfile` in particular can be blockadmin's first encounter with a member.
- Member webhooks carry the full synced snapshot (`data.members` on create, `data.member` on update) because `wrapMutationResolver` only forwards mutation *arguments* plus the result `_id` — the resolver result body never reaches blockadmin. Anything blockadmin needs about a member, including the core `user` summary, must be written onto the mutation arguments agency-side. `blockAgentCreateMember` also arrives outside any mutation, when the agency side seeds its owners as admins on agency creation.
- A seeded owner's member webhook can arrive before the agency itself has ever synced, since creating an agency in `blockagency_api` does not mirror it. That is fine — agents join to an agency by `{subdomain, agencyId}`, never by a foreign key that must already exist — so never gate `saveAgent` on the agency being present.
- Agency `logo`, `coverImage`, and `documents`, and agent `certificatePhotos`, are `Attachment` values mirrored from `blockagency_api`, but records synced before that migration hold plain url strings. Every read must go through the `BlockAdminAgency` / `BlockAdminAgent` / `CpBlockAdminAgency` / `CpBlockAdminAgent` custom resolvers (`@/agency/graphql/resolvers/customResolvers/agency.ts`, `@/member/graphql/resolvers/customResolvers/member.ts`, `@/clientportal/graphql/resolvers/customResolvers/{agency,agent}.ts`), which normalize both shapes with `normalizeAttachment`/`normalizeAttachments` from `@/agency/utils` — `Attachment.url` is non-nullable, so an unnormalized legacy string surfaces as `Cannot return null for non-nullable field Attachment.url` and nulls the whole field. The mirror of that mistake — declaring one of these fields as `String` — fails with `String cannot represent value: { name: …, url: … }` on every post-migration record, so admin and client-portal projections of the same field must both be typed `Attachment`. Those reads must also stay `.lean()` (`cursorPaginate` already is), because hydrating a legacy string into the attachment subdocument path drops the value entirely.
- An agent's images (`user.avatar`, `certificatePhotos[].url`) are mirrored as raw storage keys, not urls: `modifierMiddleware` only rewrites the top-level `data.input` image fields, and a member webhook carries its snapshot under `data.members`/`data.member`, so nothing on that path is converted at ingest. Erxes UIs hide this because `readImage` resolves a key against their own api, but a client-portal consumer receives the bare key and renders a broken image. Every agent read therefore goes through `toAgentUser`/`toAgentCertificatePhotos` (`@/member/utils`), which build `<agency tenant>/read-file?key=…` from the agent's own `subdomain` — the file lives in the agency's tenant, never blockadmin's — and leave values that are already absolute untouched. `BLOCKAGENCY_API_URL` supplies that domain in production (`<subdomain>` placeholder), `http://localhost:4000` in development, matching `modifierMiddleware`.
- `@/agency/utils#generateFilter` covers only `searchValue`/`city`/`district` and silently ignores `verificationStatus`; the client-portal agency query applies that filter itself. Do not assume the shared filter honors every declared query param.
- The payment reminder worker (`src/worker/paymentReminders.ts`) runs once daily and sends exactly two kinds of notification with no persisted "already sent" state: upcoming reminders at 5/3/1 days before `dueDate` (each a distinct calendar-day bucket, so a once-daily cron naturally fires each at most once) and overdue reminders for every unpaid/partial payment whose `dueDate` has passed (these resend every run — that's intentional, not a bug). Every `sendTRPCMessage` call it makes must use the *payment's* `subdomain`, not the worker's own fixed `WORKER_SUBDOMAIN` — the former addresses the originating org's core-api (where the actual cpUser/cpNotification records live), the latter only selects blockadmin's own local DB connection.
- The "payment paid" notification (`routes/payment.ts`) fires per-row, once, exactly when a payment's status transitions into `paid` on a given sync — detected by fetching the schedule's prior statuses *before* `replaceForContract`'s delete+reinsert and diffing against the newly-synced rows by `String(entityId)` (must stringify — `entityId` is a Mongoose ObjectId, and comparing ObjectId instances directly by `===`/Map-key never matches even for the same underlying id). On a contract's very first-ever payment sync there is no prior state to diff against, so any row synced already-`paid` (e.g. backdated historical data) will spuriously notify once — accepted as a minor edge case, not fixed.
- The worker resolves a payment's client-portal users via `BlockCustomer.findOne({subdomain: payment.subdomain, entityId: payment.customerId})` to get the verified `customerId`, then passes *that* as `cpUsers.list`'s `erxesCustomerId` — `payment.customerId` itself is block_api's org-side reference, not the value `cpUsers.list` expects (fixed 2026-08-11; see Local Invariants above).
- `notifyBlockCustomer` (`src/utils/cpNotify.ts`) is the one place that resolves an org-side customer id to client-portal users and sends a notification; any new notification trigger should call it rather than re-deriving the `BlockCustomer` → `cpUsers.list` → `cpNotifications.create` chain.
- The "new contract" notification in `contract/routes/contract.ts`'s `syncIfSigned` fires exactly once, only when `Contract.findOne({subdomain, entityId})` found nothing *before* the upsert — i.e. on whichever of block_api's three mirror entry points (create/update/status-change) happens to be blockadmin's first encounter with that contract. It must never fire on a re-sync of an already-mirrored contract (including `blockManualSyncContract`'s repeat syncs).
- `contract/routes/offer.ts`'s `syncIfSent` mirrors that exact pattern for Offer (`syncIfSigned` → `syncIfSent`, `Contract.upsertSignedContract` → `Offer.upsertSentOffer`, gated on `status === 'sent'` instead of `'signed'`, "new offer" notification fires once on first-ever sync). Any future Offer mirror change should stay symmetric with Contract's — don't let the two drift apart.
- Every mirrored entity's schema-level Mongoose `ref` on its `unit` field must point at `block_admin_units` (blockadmin's own collection), not `block_units` (block_api's org-side collection name) — `ref` doesn't affect query correctness (nothing here calls `.populate()`), but a wrong value is a copy-paste tell that the field itself may also be unresolved; `Offer.unit`'s `ref` had this exact bug (fixed 2026-08-11, matching the same fix already applied to `Contract.unit`) — always resolve an incoming `input.unit` (block_api's org-side unit id) through `Unit.getUnit(subdomain, input.unit)` to get blockadmin's own unit `_id` before storing it.
- Offer intentionally has no `blockGetOffers`-equivalent invoice-generation logic in blockadmin — that math (discount/down-payment/installment/interest) is block_api's job; blockadmin only ever mirrors the offer's own fields once `sent`, the same way it mirrors contract payments as already-computed rows rather than recomputing a payment plan itself.
- Blockadmin never creates a payment invoice itself and never stores one: the money belongs to the org that owns the contract, and `block_admin_contract_payments` rows are wholesale-replaced on every schedule sync, so any invoice state written here would be destroyed on the next sync. `cpBlockAdminCreatePaymentInvoice` therefore only forwards to the owning org and returns its answer, and a settled payment reaches the portal through the ordinary payment mirror.
- A mirrored payment's `_id` changes on every schedule sync (`replaceForContract` deletes and reinserts the rows), so nothing client-portal-facing may hold one across a payment: poll the schedule by `contractId` (a `Contract`'s `_id` is stable — it is upserted by `{subdomain, entityId}`), and address a specific in-flight payment by the `invoiceId` the create mutation returned. `cpBlockAdminCheckPaymentInvoice` is keyed that way for exactly this reason.
- `Contract.customerId` and `ContractPayment.customerId` both mirror block_api's org-side customer id, which is `BlockCustomer.entityId` — never the verified core `customerId`. Every client-portal ownership check compares against `entityId`; comparing against `BlockCustomer.customerId` silently rejects every legitimate request.
- Unlike the client-portal detail *queries* below, `cpBlockAdminCreatePaymentInvoice` does verify ownership — it resolves `BlockCustomer` by `{customerId: cpUser.erxesCustomerId, subdomain: payment.subdomain}` and requires `blockCustomer.entityId === payment.customerId`, so a guessed `_id` cannot be used to bill or expose another customer's payment. Keep that check on any new client-portal mutation.
- Client-portal single-record detail queries (`cpBlockAdminGetContractPayments`/`cpBlockAdminGetContractSummary`/`cpBlockAdminGetOffer`) look up strictly by the id argument (`Contract.findOne({_id})`/`Offer.findOne({_id})`) with no check that the record belongs to the requesting `cpUser` — any authenticated cp user can currently fetch any contract's payments/summary or any offer by guessing/enumerating its `_id`. This was already true for contracts before the offer queries were added; the offer queries were built to match that existing pattern rather than introduce a new, inconsistent one. Fixing it (e.g. re-adding an ownership join through `BlockCustomer`) needs to cover contracts and offers together.
- `CpBlockOfferPaymentPlan` is a client-portal-only type, deliberately **not** reusing the admin-facing `BlockAdminOfferPaymentPlan` — the admin type has a non-null `type: BlockAdminProjectPaymentPlanType!` field that block_api never actually populates (Offer's org-side payment plan has no `type` field at all), so querying it would throw "Cannot return null for non-nullable field". Do not reuse `BlockAdminOfferPaymentPlan` for client-portal or admin-panel work without fixing that field first.
- `clientportal/utils/offerPaymentSchedule.ts#buildOfferPaymentSchedule` is a line-for-line port of `block_ui`'s `OfferDetailSheet.tsx`'s `OfferSchedule` component (installment-date generation, interest calc, barter/down/completion split). If that frontend calculation ever changes, this file must change with it or the two surfaces will silently disagree on the same offer's numbers — there is no shared package between the two today.

## Validation

- `pnpm nx lint blockadmin_api`
- `pnpm nx build blockadmin_api`
- Agent smoke scenario: add a member to an agency in `blockagency_api`, confirm `block_admin_members` upserts a record with the resolved `user` summary, then confirm `getBlockAdminAgents(agencyId)` returns it for the matching blockadmin agency.
- Agent image smoke scenario: give an agent an avatar and a certificate photo in `blockagency_ui`, then read `cpBlockAdminAgentInfo` and confirm `user.avatar` and `certificatePhotos[].url` come back as absolute `…/read-file?key=…` urls that open in a browser without a session.
- Blockadmin smoke scenario: send a signed `POST /webhook/syncProduct` payload with `BLOCK_ADMIN_SECRET`; `block_admin_supplier_products` upserts by source `entityId`.
- Contract smoke scenario: sign a contract in `block_api`, confirm `block_admin_contracts`/`block_admin_contract_payments` reflect it; call the same sync again (e.g. via `block_api`'s `blockManualSyncContract`) and confirm it upserts cleanly with no immutable-field error and no duplicate payment rows.
- Online payment reconciliation smoke scenario: create an invoice via `cpBlockAdminCreatePaymentInvoice`, pay it while the org's `block_api` is stopped (so the callback is lost), restart it and call `cpBlockAdminCheckPaymentInvoice(contractId, invoiceId)` — it must return `status: "paid"`, the scheduled payment must be credited exactly once, and a second call must not credit it again.
- Online payment smoke scenario: with QPay configured in the owning org's payment plugin and selected in that org's `blockUpdateContractPaymentSettings`, call `cpBlockAdminCreatePaymentInvoice(paymentId)` as a cp user for one of their unpaid mirrored payments, pay the returned url, then confirm the org's `block_api` recorded the transaction and the next `blockSyncContractPayments` flips the mirrored row to `paid` with a "payment successful" notification.
- Worker smoke scenario: seed a `ContractPayment` with `dueDate` 1/3/5 days out and one with a past `dueDate`, both `status: 'unpaid'` with a real `customerId`; manually invoke `runPaymentReminders` (or wait for the `0 9 * * *` `Asia/Ulaanbaatar` schedule) and confirm a `cpNotifications.create` call fires for each, addressed at the payment's own `subdomain`.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-29` — Client-portal invoice re-check

- **Summary:** Added `cpBlockAdminCheckPaymentInvoice(contractId, invoiceId)`, which verifies the contract belongs to the requesting `cpUser` and forwards to the owning org's new `checkContractPaymentInvoice` webhook, so a customer whose QPay callback was lost can settle their row from the portal. Keyed on the contract plus invoice id because a mirrored payment's `_id` does not survive a schedule sync.
- **Affected areas:** `src/modules/clientportal/graphql/resolvers/mutations/payment.ts`, `src/modules/clientportal/graphql/schemas/payment.ts`.
- **Contracts changed:** Added GraphQL mutation `cpBlockAdminCheckPaymentInvoice` and type `CpBlockPaymentCheck`; now calls `block_api`'s `checkContractPaymentInvoice` webhook.

### `2026-08-27` — Client-portal online payment for mirrored contract payments

- **Summary:** Added the client-portal mutation `cpBlockAdminCreatePaymentInvoice(paymentId, amount)`, which verifies the mirrored payment belongs to the requesting `cpUser` and forwards the request to the owning org's `block_api` (`POST /webhook/createContractPaymentInvoice`), returning that org's payment_api (QPay) invoice url. No invoice state is stored here; the settled payment arrives through the existing `blockSyncContractPayments` mirror.
- **Affected areas:** `src/modules/clientportal/graphql/resolvers/mutations/` (new), `src/modules/clientportal/graphql/schemas/payment.ts` (new), `src/modules/clientportal/graphql/schemas/index.ts`, `src/apollo/schema/schema.ts`, `src/apollo/resolvers/mutations.ts`.
- **Contracts changed:** Added GraphQL mutation `cpBlockAdminCreatePaymentInvoice` and type `CpBlockPaymentInvoice`; now calls `block_api`'s `createContractPaymentInvoice` webhook.

### `2026-08-24` — Agent images returned as absolute urls

- **Summary:** `user.avatar` and `certificatePhotos[].url` were served as the raw agency-tenant storage keys, which erxes UIs resolve through `readImage` but a client-portal consumer cannot, so agent pictures were broken on third-party sites. Both now resolve to an absolute `read-file` url built from the agent's own `subdomain` on every admin and client-portal read; values already absolute are left alone.
- **Affected areas:** `src/modules/member/utils.ts`, `src/modules/member/graphql/resolvers/customResolvers/member.ts`, `src/modules/clientportal/graphql/resolvers/customResolvers/agent.ts`
- **Contracts changed:** None in shape. `BlockAdminAgent`/`CpBlockAdminAgent` `user.avatar` and `certificatePhotos[].url` now carry absolute urls instead of storage keys.

### `2026-08-21` — Client-portal agency images typed as attachments, agent agency resolved

- **Summary:** `CpBlockAdminAgency.logo`/`coverImage` were left as `String` when the agency attachment migration landed, so `cpGetBlockAdminAgencies`/`cpGetBlockAdminAgencyInfo` returned `String cannot represent value: { name: …, url: … }` and nulled both fields; they are now `Attachment` and go through a new `CpBlockAdminAgency` custom resolver that normalizes legacy url strings like the admin side does. `CpBlockAdminAgent` also gained a nested `agency` field so `cpBlockAdminAgents`/`cpBlockAdminAgentInfo` can return the agent's agency (including its normalized logo/cover) without a second round trip.
- **Affected areas:** `src/modules/clientportal/graphql/schemas/agency.ts`, `src/modules/clientportal/graphql/resolvers/customResolvers/{agency.ts (new),agent.ts,index.ts}`, `src/modules/member/utils.ts`
- **Contracts changed:** `CpBlockAdminAgency.logo` and `CpBlockAdminAgency.coverImage` are now `Attachment` (previously `String`); adds `CpBlockAdminAgent.agency: CpBlockAdminAgency`.

### `2026-08-21` — Agent `certificatePhotos` mirrored as attachments

- **Summary:** `block_admin_members.certificatePhotos` stores `Attachment` subdocuments instead of url strings, matching the agency-side change, and new `BlockAdminAgent`/`CpBlockAdminAgent` custom resolvers normalize rows synced before it.
- **Affected areas:** `src/modules/member/{@types,db/definitions,graphql}/`, `src/modules/clientportal/graphql/{schemas/agency.ts,resolvers/customResolvers/}`, `src/apollo/resolvers/resolvers.ts`
- **Contracts changed:** `BlockAdminAgent.certificatePhotos` and `CpBlockAdminAgent.certificatePhotos` are now `[Attachment]` (previously `[String]`); the `/webhook/blockAgent*Member` payloads carry attachment objects for that field.

### `2026-08-21` — Agency members mirrored as agents

- **Summary:** Agency members synced from `blockagency_api` are stored in `block_admin_members` with a denormalized core user summary, exposed through admin (`getBlockAdminAgents`/`getBlockAdminAgentInfo`) and client-portal (`cpBlockAdminAgents`/`cpBlockAdminAgentInfo`) queries, and listings now record `agencyMemberId` so listing lists/stats can be narrowed to one agent.
- **Affected areas:** `src/modules/member/`, `src/modules/listing/{@types,db/definitions,routes,utils,graphql}`, `src/modules/clientportal/graphql/{schemas,resolvers/queries}/{agency,listing}.ts`, `src/connectionResolvers.ts`, `src/routes/index.ts`, `src/apollo/`, `src/utils.ts`
- **Contracts changed:** Adds `/webhook/blockAgent{Create,Update,Remove}Member` + `/webhook/blockAgentUpdateMemberProfile`; adds `getBlockAdminAgents`/`getBlockAdminAgentInfo`/`cpBlockAdminAgents`/`cpBlockAdminAgentInfo`; adds `agencyMemberId` to listing queries/type and `status` to `cpGetBlockAdminListings`; adds `sold` to both listing stats types; client-portal listings now also expose `sold` records.

### `2026-08-20` — Agency attachments normalized on read

- **Summary:** `BlockAdminAgency.logo`/`coverImage`/`documents` now resolve as `Attachment` values through new custom resolvers that accept both the mirrored attachment shape and the plain url strings stored before `blockagency_api`'s attachment migration, so pre-migration agencies stop failing with `Cannot return null for non-nullable field Attachment.url`.
- **Affected areas:** `src/modules/agency/graphql/resolvers/customResolvers/agency.ts` (new), `src/modules/agency/utils.ts`, `src/apollo/resolvers/resolvers.ts`, `src/modules/agency/@types/agency.ts`, `src/modules/agency/db/definitions/agency.ts`, `src/modules/agency/graphql/schemas/agency.ts`.
- **Contracts changed:** `BlockAdminAgency.logo`/`coverImage` are now `Attachment` and `BlockAdminAgency.documents` is `[Attachment]` (previously `String`/`[String]`); the `/webhook/updateAgencyInfo` payload now carries attachment objects for those fields.

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
