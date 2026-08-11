# `block_ui` Plugin Guide

## Identity

- **Plugin:** `block`
- **Project:** `block_ui`
- **Layer:** `Frontend UI`
- **Path:** `frontend/private-plugins/block_ui`
- **Last synchronized:** `2026-08-11`

## Scope

### Owns

- Real-estate developer/project vertical UI: project/building/unit management, opportunities, contracts and their payment plans/transactions, offers, stacking plan, developer info, and the "Block Platform Sync" relation widget.
- Its own GraphQL documents, hooks, Jotai state, and relation-widget modules under `src/modules/*` and `src/widgets/*`.

### Does not own

- `block_api`'s resolvers/schema (consumed only through generated GraphQL operations) or `blockadmin_api`'s cross-org platform (never called directly from the frontend).
- Core CRM contact/company pages or relation-widget host chrome — this plugin only supplies the widget content rendered inside `core-ui`'s existing relation-widget slot.

## Current Capabilities

- Dev port **3007**. Registers with `core-ui` as module `block`, with a navigation group, a floating widget (`hasFloatingWidget: true`), and relation-widget modules `oppty` and `customerSync` (label "Block Platform Sync") shown wherever a content record (contact, company, contract, ...) hosts relation widgets.
- Full CRUD UI for projects, buildings, units, unit types, opportunities, contracts (with payment-plan builder validated by Zod — `frequency` is required whenever any other payment-plan field is filled), offers, stacking plan, developer info.
- "Block Platform Sync" relation widget (`src/widgets/relation/modules/CustomerSync.tsx`): shows the linked core customer's block-admin sync status with a manual (re-)sync button, plus "Contract Sync" (`blockManualSyncContract`) and "Offer Sync" (`blockManualSyncOffer`) sections. In `core:customer` context (Contact page, contentId = customerId) it lists every contract and every offer for that customer; in `block:contract`/`block:offer` context (Contract/Offer detail page, contentId = record id, customerId passed separately) it shows a sync action for only that one record, not the full list. `OfferDetailSheet.tsx` hosts `RelationWidgetSideTabs` the same way `ContractDetailSheet.tsx` does, so the offer detail page has its own relation-widget side tabs.

## Architecture

| Area              | Path                                       | Responsibility                                                       |
| ------------------ | -------------------------------------------- | ------------------------------------------------------------------------ |
| Config             | `src/config.tsx`                             | Module registration, navigation group, relation-widget manifest       |
| Widgets            | `src/widgets`                                | `RelationWidgets` dispatcher (by `module` name), floating widget      |
| Admin/sync         | `src/modules/admin`                          | Customer sync GraphQL + hooks (`useCustomerSync`, `useSyncCustomer`)   |
| Contract           | `src/modules/contract`                       | Contract CRUD, payment-plan form/schema, GraphQL docs, hooks           |
| Contract-payment   | `src/modules/contract-payment`               | Payment schedule + transaction UI                                     |
| Contract-status    | `src/modules/contract-status`                | Per-project contract status board/config                              |
| Project/Building/Unit | `src/modules/project`, `building`, `unit` | Project/building/unit management UI                                   |
| Oppty              | `src/modules/oppty`                          | Opportunity pipeline UI                                               |
| Offer/Pricing      | `src/modules/offer`, `pricing`               | Offer generation, pricing tools                                       |
| Stacking           | `src/modules/stacking`                       | Stacking-plan visualization                                           |

## Contracts

### Provides

- Module Federation exposes declared in `module-federation.config` (navigation, pages, widgets) — keep `config.tsx` paths and exposes aligned with actual routes.

### Consumes

- `block_api` GraphQL operations (all prefixed `block*`): contract CRUD/status/payments (`contractQueries.ts`, `contractMutations.ts`), customer sync (`admin/graphql/customerSync*`), plus the equivalent per-module GraphQL documents for project/building/unit/oppty/offer.
- `erxes-ui` and `ui-modules` components exclusively for UI primitives; no direct `@radix-ui/*` imports.

## Data and State

- Apollo Client for all server state (contracts, payments, sync status); Jotai only for plugin-wide client state (e.g. stacking view state); local `useState`/React Hook Form + Zod for forms.
- No Apollo cache normalization tricks for sync status — `useCustomerSync`/manual contract sync rely on `refetch`/mutation completion rather than cache writes, since block-admin sync state is external and best re-fetched.

## Local Invariants

- The relation-widget `module` prop dispatched by `core-ui` must exactly match a `name` entry in `config.tsx`'s `widgets.relationWidgets` array (`oppty`, `customerSync`); adding a new widget requires registering it there.
- Each detail-sheet's own `RelationWidgetSideTabs` call (`ContractDetailSheet.tsx`, `UnitDetailSheet.tsx`, `OfferDetailSheet.tsx`, `OpptyDetailSheet.tsx`, `PaymentTransactionsSheet.tsx`) passes `hookOptions.hiddenPlugins`/`hiddenModules` to suppress specific relation widgets on that page — filtering is by plugin name or module name, not per-page-per-widget, so hiding one block-owned widget (e.g. `oppty`, to avoid recursion) requires listing that module name in `hiddenModules` rather than hiding the whole `block` plugin, or every other block-owned widget (e.g. `customerSync`) disappears too.
- `CustomerSync`/`ContractSync*`/`OfferSync*` components must degrade gracefully (empty state, no throw) when `contentType` is outside `['core:customer', 'block:contract', 'block:offer']` or when no customer is linked — the widget host renders this component in multiple unrelated content-type contexts.
- Contract payment-plan fields must stay in exact parity (TS type, Zod schema, GraphQL query/mutation selection sets) with `block_api`'s Mongoose schema — Mongoose silently drops any field not declared server-side, so a frontend-only field addition here is inert until mirrored server-side too.
- `ContractAdd.tsx`/`ContractEditSheet.tsx` gate "has a payment plan" on `paymentPlan?.frequency` (not a nonexistent `.type` field) — this was a previously-fixed bug; don't reintroduce the `.type` check.
- Every unit-select dropdown (`ContractUnitSelector.tsx`, `OfferAdd.tsx`'s `OfferUnitSelector`) must disable units whose `activeContract?.statusType === 'signed'` (rendering `(Signed)` next to the label) — the underlying `useUnits`/`BLOCK_GET_UNITS` query always returns `activeContract` and `locked` on every unit, so a new unit-select must read and apply this itself; it is not filtered server-side.
- Once an offer's `status` is `sent`, `block_api` rejects further edits (`'Sent offers cannot be edited'`, 5-minute revert window). There is no client-side gate for this anywhere in `block_ui` (no disabled Edit button, no disabled status Select) — it's intentionally left to the existing `try/catch` + `toast({variant: 'destructive'})` at both call sites (`OfferDetailSheet.handleStatusChange`, `OfferEditSheet.handleSubmit`) to surface the server error. Don't assume a missing client-side guard here is a bug to fix.

## Validation

- `pnpm nx lint block_ui`
- `pnpm nx build block_ui`
- `pnpm nx test block_ui` (when `project.json` defines a test target)
- Smoke: open a Contact record with a linked, signed contract → "Block Platform Sync" relation widget → "Contract Sync" section lists the contract → click sync icon → toast confirms success and no console errors.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-11` — Offer sync widget, matching Contract's

- **Summary:** Extended the "Block Platform Sync" relation widget with "Offer Sync" (`blockManualSyncOffer`), matching the existing "Contract Sync" section exactly: lists every offer for the customer on the Contact page, or shows a single sync action on the offer's own detail page. Added `RelationWidgetSideTabs` to `OfferDetailSheet.tsx` (it previously had no relation-widget host at all, unlike `ContractDetailSheet.tsx`) so `block:offer` context now exists.
- **Affected areas:** `src/widgets/relation/modules/CustomerSync.tsx`, `src/modules/offer/components/OfferDetailSheet.tsx`, `src/modules/offer/hooks/useManualSyncOffer.ts` (new), `src/modules/offer/hooks/useCustomerOffers.ts` (new), `src/modules/offer/graphql/offerMutations.ts`.
- **Contracts changed:** None (consumes `block_api`'s new `blockManualSyncOffer` mutation).

### `2026-08-11` — Fixed dead `SEND_OFFER_EMAIL` doc after backend return-type change

- **Summary:** `block_api`'s `blockSendOfferEmail` return type changed from `String` to `BlockOffer` (see `block_api`'s guide) as part of making offer-sync/immutability work like Contract. `SEND_OFFER_EMAIL` in `offerMutations.ts` — unused anywhere in the UI (the actual "mark sent" action goes through `blockUpdateOffer`'s status Select in `OfferDetailSheet`) — had no sub-selection and would now be an invalid GraphQL document against an object-returning field; added `{ _id status }`.
- **Affected areas:** `src/modules/offer/graphql/offerMutations.ts`.
- **Contracts changed:** None (frontend-only fix to stay valid against the already-changed backend schema).

### `2026-08-11` — Offer unit-select disables already-signed units

- **Summary:** `OfferAdd.tsx`'s `OfferUnitSelector` let any unit be picked, including ones already under a signed contract — it fetched the same `activeContract`-carrying unit data as `ContractUnitSelector` but never read it. Applied the identical `isSigned = activeContract?.statusType === 'signed'` + `disabled={isSigned}` + `(Signed)` label logic.
- **Affected areas:** `src/modules/offer/components/OfferAdd.tsx`.
- **Contracts changed:** None.

### `2026-08-10` — Contract detail page syncs only the viewed contract

- **Summary:** On the Contract detail page's "Block Platform Sync" widget, the "Contract Sync" section previously listed every contract for the linked customer (correct for the Contact page, redundant here). Added `SingleContractSync`, used only in `block:contract` context, which shows a sync action for just the contract being viewed.
- **Affected areas:** `src/widgets/relation/modules/CustomerSync.tsx`.
- **Contracts changed:** None.

### `2026-08-10` — Fixed sync widget hidden on Contract detail page

- **Summary:** `ContractDetailSheet.tsx` hid the entire `block` plugin (`hiddenPlugins: [..., 'block']`) from its own relation-widget side tabs, which also hid the newly-added "Block Platform Sync" / Contract Sync widget. Narrowed the exclusion to just the `oppty` module (via `hiddenModules`) so `customerSync` now shows.
- **Affected areas:** `src/modules/contract/components/ContractDetailSheet.tsx`.
- **Contracts changed:** None.

### `2026-08-10` — Contract sync widget on Contact page

- **Summary:** Extended the "Block Platform Sync" relation widget with a "Contract Sync" section that lists the linked customer's contracts and lets the user manually trigger `blockManualSyncContract` per contract (mirrors customer link, contract info, and full payment/transaction schedule — the on-demand equivalent of the automatic signed-contract sync).
- **Affected areas:** `src/widgets/relation/modules/CustomerSync.tsx`, `src/modules/contract/hooks/useManualSyncContract.ts` (new), `src/modules/contract/hooks/useCustomerContracts.ts` (new), `src/modules/contract/graphql/contractMutations.ts`.
- **Contracts changed:** None (consumes `block_api`'s new `blockManualSyncContract` mutation).

### `2026-08-10` — Payment-plan frequency validation

- **Summary:** Added a Zod `superRefine` so filling in any payment-plan field without selecting `frequency` raises a validation error instead of silently creating an incomplete plan.
- **Affected areas:** `src/modules/contract/constants/contractSchema.ts`.
- **Contracts changed:** None.

### `2026-08-10` — Fixed empty payment-plan bug in contract creation

- **Summary:** `ContractAdd.tsx` checked a nonexistent `paymentPlan.type` field instead of `.frequency` to decide whether to attach a payment plan, causing new contracts to always save without one.
- **Affected areas:** `src/modules/contract/components/ContractAdd.tsx`.
- **Contracts changed:** None.

### `2026-08-10` — Removed dead `paymentPlan.type` field from mutations

- **Summary:** Removed a stray `type` field from `CREATE_CONTRACT`/`UPDATE_CONTRACT` GraphQL documents that no longer exists on the server-side `BlockContractPaymentPlan` type.
- **Affected areas:** `src/modules/contract/graphql/contractMutations.ts`.
- **Contracts changed:** None (query selection set only).
