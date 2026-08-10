# `block_ui` Plugin Guide

## Identity

- **Plugin:** `block`
- **Project:** `block_ui`
- **Layer:** `Frontend UI`
- **Path:** `frontend/private-plugins/block_ui`
- **Last synchronized:** `2026-08-10`

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
- "Block Platform Sync" relation widget (`src/widgets/relation/modules/CustomerSync.tsx`): shows the linked core customer's block-admin sync status with a manual (re-)sync button, plus a "Contract Sync" section that calls `blockManualSyncContract`. In `core:customer` context (Contact page, contentId = customerId) it lists every contract for that customer; in `block:contract` context (Contract detail page, contentId = contract id, customerId passed separately) it shows a sync action for only that one contract, not the full list.

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
- `CustomerSync`/`ContractSync*` components must degrade gracefully (empty state, no throw) when `contentType` is outside `['core:customer', 'block:contract']` or when no customer is linked — the widget host renders this component in multiple unrelated content-type contexts.
- Contract payment-plan fields must stay in exact parity (TS type, Zod schema, GraphQL query/mutation selection sets) with `block_api`'s Mongoose schema — Mongoose silently drops any field not declared server-side, so a frontend-only field addition here is inert until mirrored server-side too.
- `ContractAdd.tsx`/`ContractEditSheet.tsx` gate "has a payment plan" on `paymentPlan?.frequency` (not a nonexistent `.type` field) — this was a previously-fixed bug; don't reintroduce the `.type` check.

## Validation

- `pnpm nx lint block_ui`
- `pnpm nx build block_ui`
- `pnpm nx test block_ui` (when `project.json` defines a test target)
- Smoke: open a Contact record with a linked, signed contract → "Block Platform Sync" relation widget → "Contract Sync" section lists the contract → click sync icon → toast confirms success and no console errors.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

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
