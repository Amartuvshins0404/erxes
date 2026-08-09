# `mushop_ui` Plugin Guide

## Identity

- **Plugin:** `mushop`
- **Project:** `mushop_ui`
- **Layer:** `Frontend UI`
- **Path:** `frontend/private-plugins/mushop_ui`
- **Last synchronized:** `2026-08-08`

## Scope

### Owns

- The Mushop admin section (`/mushop/*`) in `core-ui`: Suppliers, Products, Orders, Members (memberships), Collectives — list/filter/detail-sheet UI, GraphQL documents, hooks, and Jotai/query-state used only by this plugin.
- The `mushop` form widget on `core:product` and the `membership_plan` relation widget exposed via Module Federation.

### Does not own

- Any backend logic or schema — see `backend/plugins/mushop_api/AGENTS.md`. This plugin only calls the GraphQL contracts `mushop_api` publishes.
- `supplier_ui`/`blockadmin_ui` or any other plugin's source, components, or state.

## Current Capabilities

- **Suppliers** (`suppliers`): cursor-paginated list, filter (search/verification/created/founded), detail `FocusSheet` (overview + activity log), verification/tier/POS actions.
- **Products** (`products`): cursor-paginated list, filter (search/category/status), detail sheet, status/category actions.
- **Orders** (`orders`): cursor-paginated list of orders forwarded to suppliers (`mushopOrders`), filterable by order ID, status (`pending`/`forwarded`/`cancelled`/`failed`), supplier, and created date. Detail `FocusSheet` (`mushopOrderDetail`) shows status, forwarding error, resolved supplier, resolved customer, parsed line items (when the payload has `items`), amounts, and the raw JSON payload for diagnosis. The `error` field (table cell and detail row) renders through `humanizeOrderError`/`OrderErrorText`: a friendly reason by default, click to toggle to the raw backend message and back. **Resync**: `OrderResyncButton` (next to the status badge, in both the table and the detail sheet's General card) calls `mushopResyncOrder` to re-send the order to its supplier — only rendered for `pending`/`failed` orders, and only for users with the `mushopResyncOrder` action (admin group only by default).
- **Members** (`members`): membership list/detail, grant membership flow, cancel/status/end-date actions, payment mirror.
- **Collectives** (`collectives`): co-shop list/detail, supplier add/remove, resync, sync-result diagnostics.
- Relation widget for membership plans; form widget for `mushop` pricing on `core:product`.

## Architecture

| Area              | Path                                  | Responsibility                                                        |
| ------------------ | -------------------------------------- | ------------------------------------------------------------------------ |
| Navigation/routes  | `src/config.tsx`, `src/modules/MushopNavigation.tsx`, `src/modules/MushopMain.tsx` | Module Federation `CONFIG`, sidebar nav (gated by `<Can module="...">`), lazy route table |
| Supplier           | `src/modules/supplier/`                | Supplier list/detail/select components, hooks, GraphQL                |
| Product            | `src/modules/product/`                 | Product list/detail, category/status actions                          |
| Order              | `src/modules/order/`                   | Orders-to-supplier list/detail (read-only), status filter select      |
| Member             | `src/modules/member/`                  | Membership list/detail, grant-membership flow (`components/grant/*`)  |
| Membership plan    | `src/modules/membership-plan/`         | Plan detail sheet used from the relation widget                       |
| Collective         | `src/modules/collective/`              | Co-shop list/detail, sync-error humanizer                             |
| Widgets            | `src/widgets/`                         | Module Federation `formWidgets`/`relationWidgets` exposes              |

Each domain module follows the same internal shape: `types.ts`, `constants/cursorSessionKey.ts`, `graphql/{queries,detailQuery}.ts`, `hooks/use<Thing>.ts` + `use<Thing>Detail.ts`, `components/<Thing>Table.tsx` + `<Thing>Columns.tsx` + `<Thing>Filter.tsx` + `<Thing>DetailSheet.tsx`, `pages/<Thing>Page.tsx`.

## Contracts

### Provides

- Module Federation exposes (see `module-federation.config.ts`): `./config` → `src/config.tsx`, `./mushop` → `src/modules/MushopMain.tsx`, plus widget/relation-widget exposes under `./widgets`.
- Dev port: `3013` (see `project.json` `serve` target).

### Consumes

- `erxes-ui` (`RecordTable`, `FocusSheet`, `Filter`, `Combobox`, `InfoCard`, `Sheet`, `Table`, cursor-pagination helpers, `useQueryState`/`useMultiQueryState`) and `ui-modules` (`PageHeader`, `Can`, `ActivityLogs`, `usePermissionCheck`).
- `mushop_api` GraphQL only (queries/mutations prefixed `mushop`/`cp`); never calls another plugin's backend directly.

## Data and State

- Apollo Client for all server state (no REST calls from this plugin).
- `useQueryState`/`useMultiQueryState` (URL-driven) for filters and the active-record id per module (`activeSupplierId`, `activeOrderId`, `activeCollectiveId`, …) — this is how list → detail sheets communicate, not local component state.
- Cursor position for each table is persisted via a per-module session key in `constants/cursorSessionKey.ts` (e.g. `mushop-orders-cursor`) through `useRecordTableCursor`.
- No plugin-wide Jotai atoms currently; state is either Apollo cache or URL query state.

## Local Invariants

- New GraphQL operation names are prefixed `mushop` (admin) or `cp` (client portal) and are unique repo-wide.
- Every list page follows list+filter+`RecordTable.Provider`+`CursorProvider` → row click opens a `FocusSheet` via a query-state id; every create/update path relies on Apollo refetch/cache update, never a manual page refresh.
- Cross-module imports inside this plugin use the `@/<module>/...` alias (`@/*` → `src/modules/*`); do not import from another plugin.
- Nav entries in `MushopNavigation.tsx` are wrapped in `<Can module="...">` matching the backend permission module name exactly (e.g. `order` ↔ `mushop_api`'s `order` permission module).
- `config.tsx`'s top-level `modules` array **must** contain exactly one entry whose `path` equals the plugin's own root path (`'mushop'`), not one entry per sub-page. Since `core-ui`'s navigation shell redesign (`663309a`, "redesign navigation shell"), `NavigationPanel` only renders a plugin's sidebar content when `findNavigationActivityByPath` prefix-matches the current URL against this flat `modules` list — the actual list of clickable sub-pages always comes from `navigationGroup.content` (`MushopNavigation.tsx`), never from `modules` itself. Listing per-page unprefixed paths there (as this plugin did before 2026-08-08) makes the match fail for every URL and the whole sub-sidebar silently renders nothing. Follow the same one-entry shape used by `onefit_ui`/`blockagency_ui`/`blockadmin_ui`.

## Validation

- `pnpm nx build mushop_ui`
- `pnpm nx lint mushop_ui` (no dedicated `test` target defined in `project.json` as of this writing)
- Smoke: open `/mushop/orders`, filter by status `failed`, open a row and confirm the sheet shows the supplier, customer, and error text.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-08` — Order resync action

- **Summary:** Added `OrderResyncButton` — an icon button next to the status badge (list column and detail sheet General card) that calls the new `mushopResyncOrder` mutation to re-send the order to its supplier. Only renders when the current user has the `mushopResyncOrder` action and the order's status is `pending`/`failed`. Refetches both the order detail query and the list query on completion. Note: the list's dedicated Error column was removed (errors are still visible in the detail sheet's General card via `OrderErrorText`).
- **Affected areas:** `src/modules/order/graphql/mutations.ts` (new), `src/modules/order/hooks/useResyncOrder.ts` (new), `src/modules/order/components/OrderResyncButton.tsx` (new), `src/modules/order/components/OrdersColumns.tsx`, `src/modules/order/components/OrderDetailSheet.tsx`.
- **Contracts changed:** None (consumes the new `mushopResyncOrder` mutation added to `mushop_api`).

### `2026-08-08` — Raw payload log styling + product name/customer fixes

- **Summary:** Raw payload now renders through `OrderRawPayload` — `react-json-view` (already a root dependency) themed and card-styled to match core-ui's System Log detail "Changes" panel (`frontend/core-ui/.../logs/components/LogDetailPrimitives.tsx`: `twilight`/`rjv-default` theme by app light/dark mode, nested `bg-muted/20` → `bg-background` rounded cards) instead of a plain `<pre>` — collapsible tree (collapsed one level deep by default), syntax-colored keys/values, built-in copy. Can't import core-ui's component directly across the plugin boundary, so the pattern is replicated locally. Items table falls back to a muted product id (with a "Product not found" title) when `productName` isn't resolved. Both fixes pair with the backend's `MushopOrder.order`/`.customer` resolver fix (see `mushop_api/AGENTS.md`) that actually populates `productName` and resolves `customer` from orders whose `customerId` only lived in the raw payload.
- **Affected areas:** `src/modules/order/components/OrderRawPayload.tsx` (new), `src/modules/order/components/OrderDetailSheet.tsx`.
- **Contracts changed:** None.

### `2026-08-08` — Order detail sheet: sidebar tab layout

- **Summary:** `OrderDetailSheet` now uses the same `FocusSheet.SideBar` + `Sidebar.Menu` + `Tabs` layout as `SupplierDetailSheet`/`CollectiveDetailSheet` (previously a single flat scroll area). Split into two tabs: **Overview** (status/error/timestamps, supplier, customer) and **Payload** (parsed items, amounts, raw JSON) — each independently scrollable, tab selection persisted via `orderTab` query state.
- **Affected areas:** `src/modules/order/components/OrderDetailSheet.tsx`.
- **Contracts changed:** None.

### `2026-08-08` — Human-readable order forwarding errors

- **Summary:** Order `error` text (table column + detail sheet row) now renders through `humanizeOrderError` (matches the raw `sendSupplierMessage` failure shapes — HTTP status, timeout, unreachable host, not-configured — to a plain-language reason) via the `OrderErrorText` component; clicking the text toggles between the friendly reason and the actual raw error.
- **Affected areas:** `src/modules/order/utils/humanizeOrderError.ts` (new), `src/modules/order/components/OrderErrorText.tsx` (new), `src/modules/order/components/OrdersColumns.tsx`, `src/modules/order/components/OrderDetailSheet.tsx`.
- **Contracts changed:** None.

### `2026-08-08` — Fix: whole plugin sub-sidebar rendering nothing

- **Summary:** `config.tsx`'s `modules` array listed one entry per sub-page with unprefixed paths (`'suppliers'`, `'products'`, …), which never prefix-matches the real `mushop/*` URLs the post-navigation-shell-redesign `NavigationPanel` uses to decide whether to render `navigationGroup.content` at all — so the entire mushop sub-sidebar (all pages, not just the new Orders one) silently rendered nothing. Replaced it with the single root-path entry (`path: 'mushop'`) every other multi-page plugin uses.
- **Affected areas:** `src/config.tsx`.
- **Contracts changed:** None.

### `2026-08-08` — Orders-to-supplier admin page

- **Summary:** Added a new read-only "Orders" module (list + filter + detail sheet) surfacing `mushop_api`'s order-forwarding log, wired into the nav (`<Can module="order">`), routes, and `config.tsx` module registry.
- **Affected areas:** `src/modules/order/**` (new), `src/modules/MushopNavigation.tsx`, `src/modules/MushopMain.tsx`, `src/config.tsx`.
- **Contracts changed:** None (frontend-only addition consuming the new `mushopOrders`/`mushopOrderDetail` queries added to `mushop_api`).
