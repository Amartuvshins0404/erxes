# `mushop_api` Plugin Guide

## Identity

- **Plugin:** `mushop`
- **Project:** `mushop_api`
- **Layer:** `Backend API`
- **Path:** `backend/plugins/mushop_api`
- **Last synchronized:** `2026-08-10`

## Scope

### Owns

- Mushop marketplace domain: suppliers (`mushop_suppliers`, shared with `supplier_api`), the product catalog (`mushop_products`, `mushop_product_specifications`), customer memberships (`mushop_memberships`, `mushop_membership_plans`), collectives/co-shops (`mushop_collectives`, `mushop_collective_packages`), plugin config (`mushop_configs`), and the order-forwarding log (`mushop_orders`).
- Proxying client-portal storefront traffic (orders, invoices, payment transactions) from the erxes core SaaS to a supplier's own SaaS POS when the request carries an `erxes-supplier-id` header.
- Inbound webhooks that let a supplier's own subdomain push profile/order updates back into this tenant's copy (`/webhook/updateSupplier`, `/webhook/order-sync`).

### Does not own

- The authoritative Supplier/Submission source of truth — that is `supplier_api`; `mushop_api` shares the `Supplier` model schema but does not own supplier onboarding.
- `posclient_api` order documents — mushop only logs what it forwarded/received, it never writes into another plugin's collections directly.
- Any UI — see `frontend/private-plugins/mushop_ui/AGENTS.md`.

## Current Capabilities

- Supplier directory: list/detail/verify/tier/POS-assignment (GraphQL `mushopSuppliers*`), including synced supplier industry.
- Product catalog moderation: list/detail/approve/reject/category-assign (GraphQL `mushopProducts*`).
- Membership lifecycle: grant/cancel/status/end-date, membership plans, invoices.
- Collectives (co-shops): group suppliers, replicate approved products into a target SaaS via tRPC, resync.
- **Order visibility + resync (admin):** `mushopOrders` (cursor-paginated list, filterable by `status`/`supplierId`/`customerId`/`entityId`/`dateFilters`) and `mushopOrderDetail(_id)` expose the `mushop_orders` forwarding log — status (`pending`/`forwarded`/`cancelled`/`failed`), the forwarded/returned order payload, the resolved `supplier` (joined by `subdomain`) and `customer` (joined via core tRPC by `customerId`), and any forwarding `error`. `mushopResyncOrder(_id)` (admin-only permission, blocked for `cancelled` orders) re-sends the order's already-stored payload to its supplier via `sendSupplierMessage` and updates the log with the result — the log itself is still only ever *written* by the `cpOrders*`/`invoiceCreate` before-resolver proxy path, the `/webhook/order-sync` route, or this resync mutation.
- Client-portal storefront proxy: `cpOrdersAdd/Edit/Cancel`, `cpCurrentOrder`, `cpOrderDetail`, `invoiceCreate`, `paymentTransactionsAdd`, `invoicesCheck` are intercepted in `beforeResolvers` and, when the request carries a resolvable `supplierId`, routed to that supplier's own subdomain via tRPC (`sendSupplierMessage`) instead of being handled locally. `cpFullOrders` instead aggregates the tenant's own POS orders with this tenant's local `mushop_orders` log.

## Architecture

| Area                | Path                                                              | Responsibility                                                            |
| -------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Supplier + Order     | `src/modules/supplier/`                                            | Supplier model/queries/mutations; `Order` model, order queries, custom resolvers, before-resolver proxy, webhook routes |
| Product              | `src/modules/product/`                                             | `MushopProduct` model, catalog queries/mutations                          |
| Product spec         | `src/modules/product-specification/`                                | Product specification fields (e.g. MOQ)                                   |
| Membership           | `src/modules/membership/`                                          | `MushopMembership`/`MushopMembershipPlan`, invoices                       |
| Collective           | `src/modules/collective/`, `src/modules/collective-package/`        | Co-shop grouping and replication into a target SaaS                       |
| Config               | `src/modules/config/`                                               | Plugin-wide settings (e.g. currency rate)                                 |
| Apollo aggregation   | `src/apollo/`                                                       | `typeDefs.ts` + `schema/schema.ts` + `resolvers/` stitch every module's GraphQL together |
| Permissions          | `src/meta/permissions.ts`                                           | `IPermissionConfig` — modules, actions, default groups (admin/operator/viewer) |
| Connection/models    | `src/connectionResolvers.ts`                                        | `IModels` registry and Mongoose model loading per subdomain               |
| tRPC                 | `src/trpc/init-trpc.ts`                                             | Type-safe service-to-service router                                       |

## Contracts

### Provides

- GraphQL (prefixed `mushop`): `mushopSuppliers*`, `mushopProducts*`, `mushopMemberships*`, `mushopMembershipPlans*`, `mushopCollectives*`, `mushopCollectivePackages*`, `mushopConfig*`, and now `mushopOrders`, `mushopOrderDetail`, `mushopResyncOrder`.
- GraphQL client-portal (prefixed `cp`): `cpMushopProducts*`, `cpMushopSuppliers*`, `cpMushopProductDetail`, plus the intercepted `cpOrders*`/`cpCurrentOrder`/`cpOrderDetail`/`invoiceCreate`/`paymentTransactionsAdd`/`invoicesCheck` (from posclient/payment, proxied here).
- HTTP webhooks: `POST /webhook/updateSupplier`, `POST /webhook/order-sync` (HMAC/plain JSON from a supplier's own subdomain; no auth guard beyond payload shape — do not widen without adding signature verification).
- tRPC app router at `trpc/init-trpc.ts` for collective replication and cross-service calls.
- Federation: extends `User`, `Customer`, `Company`, `CPUser`, `cpPoscProduct`.

### Consumes

- `erxes-api-shared/utils` (`sendTRPCMessage`, `cursorPaginate`, `checkPermission`, `startPlugin`, GraphQL constants) and `erxes-api-shared/core-types`.
- Core `customers` module via tRPC (`pluginName: 'core', module: 'customers'`) for customer lookups (membership search, order `customer` resolver).
- `posclient` plugin via tRPC (`fullOrders`) and via before-resolver proxy for `cpOrders*`.
- A supplier's own subdomain (its `posclient`/`payment` services) via `sendSupplierMessage`, keyed by the supplier's `posToken`.

## Data and State

- `mushop_suppliers` — shared schema with `supplier_api`; scoped by `subdomain` (the local tenant), carries synced profile fields such as `industry`, and carries the supplier's own `subdomain`/`posToken` for forwarding.
- `mushop_orders` (`Order` model) — one row per order/action forwarded to (or synced back from) a supplier: `subdomain` (**the supplier's** subdomain, not the local tenant), `order` (raw payload pre-forward, or the supplier's returned order post-forward), `status` (`pending|forwarded|cancelled|failed`), `entityId` (order id at the supplier), `customerId` (local core customer id), `error`. Written by `Order.logForward`/`markResult`/`syncFromSupplier`; never written by the frontend directly.
- `mushop_products`, `mushop_product_specifications`, `mushop_memberships`, `mushop_membership_plans`, `mushop_collectives`, `mushop_collective_packages`, `mushop_configs` — each subdomain-scoped per `connectionResolvers.ts`.

## Local Invariants

- Every model is created inside `loadClasses()` in `connectionResolvers.ts` and added to `IModels`; never instantiate a Mongoose model elsewhere.
- `Order.subdomain` is always the **supplier's** subdomain (used to resolve `MushopOrder.supplier` and to route `cpFullOrders`/webhook writes) — do not confuse it with the `subdomain` in `IContext`, which is the local tenant.
- GraphQL operation/type names stay prefixed `mushop`/`cp` and unique repo-wide; new schema fragments are registered in all three of `apollo/schema/schema.ts`, `apollo/resolvers/queries.ts` (or the owning module's local `queries/index.ts`), and `apollo/resolvers/index.ts` for custom type resolvers.
- Permission actions with `always: true` are still listed explicitly under every `defaultGroups` entry that should see them (admin/operator/viewer) — `always: true` does not imply automatic group membership.
- Never read or write another plugin's (e.g. `posclient_api`, `payment_api`) collections directly; cross-service calls go through tRPC/GraphQL/HTTP contracts only.

## Validation

- `pnpm nx build mushop_api`
- `pnpm nx lint mushop_api` (no dedicated `test` target defined in `project.json` as of this writing)
- Smoke: as an authenticated admin, run `mushopOrders(status: "failed")` and confirm each row resolves `supplier { name }` and, when `customerId` is set, `customer { primaryPhone }`.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-10` — `Synced supplier industry`

- **Summary:** Added nullable `industry` to mushop's synced supplier profile schema and GraphQL type.
- **Affected areas:** `src/modules/supplier/@types/supplier.ts`, `src/modules/supplier/db/definitions/supplier.ts`, `src/modules/supplier/graphql/schemas/supplier.ts`
- **Contracts changed:** Added nullable `MushopSupplier.industry`.

### `2026-08-08` — Order resync mutation

- **Summary:** Added `mushopResyncOrder(_id)` — re-sends an order's stored payload (`order.order`) to its resolved supplier via `sendSupplierMessage` and records the outcome through the existing `Order.markResult`, same as the original forward path. Rejects `cancelled` orders and orders whose supplier has no `posToken`. Gated by a new `mushopResyncOrder` permission action, granted only in the `mushop:admin` default group (matching `mushopResyncCollective`'s precedent — not given to operator/viewer).
- **Affected areas:** `modules/supplier/graphql/schemas/order.ts`, `modules/supplier/graphql/resolvers/mutations/order.ts` (new), `apollo/schema/schema.ts`, `apollo/resolvers/mutations.ts`, `meta/permissions.ts`.
- **Contracts changed:** Added `mushopResyncOrder(_id: String!): MushopOrder` mutation.

### `2026-08-08` — Fix: order `customer`/item product names not resolving

- **Summary:** `MushopOrder.customer` only ever read the top-level `Order.customerId`, which is empty on most existing rows (only set when the forwarding request carried a resolvable cp-user/customer) — the real id lives at `order.customerId` inside the raw JSON payload. Now falls back to that. Also added a `MushopOrder.order` resolver that enriches `order.items[]` with `productName` via a `models.Product` lookup (by `_id` or `entityId`, scoped to the order's supplier `subdomain`), matching the same lookup the forwarding path already does — raw payloads only ever carry `productId`.
- **Affected areas:** `modules/supplier/graphql/resolvers/customResolvers/order.ts`.
- **Contracts changed:** None (resolver behavior only — `MushopOrder.customer` and `MushopOrder.order` return richer/more-often-populated data for the same fields).

### `2026-08-08` — Admin GraphQL visibility for orders forwarded to suppliers

- **Summary:** Added read-only `mushopOrders`/`mushopOrderDetail` GraphQL queries (with `supplier`/`customer` custom resolvers) exposing the existing `mushop_orders` forwarding log to the admin UI, plus a new `order` permission module (`showMushopOrders`, `always: true`) wired into all three default groups.
- **Affected areas:** `modules/supplier/graphql/schemas/order.ts`, `modules/supplier/graphql/resolvers/queries/order.ts`, `modules/supplier/graphql/resolvers/customResolvers/order.ts`, `modules/supplier/graphql/resolvers/queries/index.ts`, `apollo/schema/schema.ts`, `apollo/resolvers/index.ts`, `meta/permissions.ts`.
- **Contracts changed:** Added `MushopOrder`, `MushopOrderCustomer`, `MushopOrderListResponse` types and `mushopOrders`, `mushopOrderDetail` queries. No mutations added — orders are still only written by the existing forwarding/webhook path.
