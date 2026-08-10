# `blockadmin_ui` Plugin Guide

## Identity

- **Plugin:** `blockadmin`
- **Project:** `blockadmin_ui`
- **Layer:** `Frontend UI`
- **Path:** `frontend/private-plugins/blockadmin_ui`
- **Last synchronized:** `2026-08-10`

## Scope

### Owns

- Blockadmin admin routes, navigation, supplier review screens, supplier product review screens, membership UI, pricing UI, and blockadmin detail sheets.

### Does not own

- Supplier tenant source data.
- Backend webhook delivery or blockadmin persistence rules.
- Mushop UI behavior, POS client UI behavior, or shared UI library internals.

## Current Capabilities

- Provides module federation entry points for blockadmin routes and settings.
- Shows admin supplier lists, supplier profile detail sheets, verification actions, and supplier product review screens with editable product categories.
- Displays supplier profile fields synced from supplier tenants, including industry.
- Uses `erxes-ui` and `ui-modules` components for tables, sheets, filters, navigation, and feedback.

## Architecture

| Area              | Path                                                                   | Responsibility                                                                        |
| ----------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Module federation | `frontend/private-plugins/blockadmin_ui/module-federation.config.ts`   | Exposes blockadmin modules to the host                                                |
| Runtime config    | `frontend/private-plugins/blockadmin_ui/src/config.tsx`                | Registers blockadmin route/navigation entries                                         |
| Main routes       | `frontend/private-plugins/blockadmin_ui/src/modules/Main.tsx`          | Defines blockadmin page routing                                                       |
| Supplier profile  | `frontend/private-plugins/blockadmin_ui/src/modules/supplier/profile/` | Supplier list, filters, detail sheet, GraphQL documents, and verification actions     |
| Supplier products | `frontend/private-plugins/blockadmin_ui/src/modules/supplier/product/` | Supplier product list, filters, detail sheet, status actions, and category assignment |

## Contracts

### Provides

- Module federation exposes `./blockadmin` and `./blockadminSettings`.
- Blockadmin routes under `/blockadmin`, including supplier profile and supplier product pages.

### Consumes

- `baSuppliers`, `baSupplierDetail`, `baUpdateSupplierVerificationStatus`, and `baUpdateSupplierTier` GraphQL operations from `blockadmin_api`.
- Supplier detail consumes nullable `BaSupplier.industry`.
- Supplier product `ba*` GraphQL operations from `blockadmin_api`, plus core `productCategories` lookup for category assignment.
- Public components and hooks from `erxes-ui` and `ui-modules`.

## Data and State

- Apollo Client owns blockadmin supplier and supplier product server state.
- Query-string state stores active supplier/product detail sheet IDs and filters.
- Supplier detail displays nullable synced `industry`.
- Supplier product category edits refetch the active detail query and update Apollo mutation results.

## Local Invariants

- Supplier profile UI displays supplier-owned synced values for admin review.
- Keep GraphQL documents near the supplier feature and preserve unique `ba*` operation names.
- Use `erxes-ui` / `ui-modules` components instead of direct Radix imports or custom UI primitives.
- Detail sheets must include loading and not-found states.

## Validation

- `pnpm nx build blockadmin_ui`
- Supplier profile smoke scenario: open a supplier detail sheet and confirm synced Industry renders in the General section.
- Supplier product smoke scenario: open the product table/detail, assign and clear a category, and confirm the selected category changes without refresh.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-10` — `Supplier product category editing`

- **Summary:** Supplier product table and detail views can now assign or clear categories through the existing `baAssignProductCategory` mutation.
- **Affected areas:** `src/modules/supplier/product/components/ProductCategoryAssign.tsx`, `src/modules/supplier/product/components/ProductColumns.tsx`, `src/modules/supplier/product/components/ProductDetailSheet.tsx`, `src/modules/supplier/product/hooks/useAssignProductCategory.ts`, `src/modules/supplier/product/graphql/queries.ts`
- **Contracts changed:** Consumes core `productCategories` and existing `baAssignProductCategory`.

### `2026-08-10` — `Supplier industry displayed`

- **Summary:** Supplier detail now queries and displays the synced supplier industry field.
- **Affected areas:** `src/modules/supplier/profile/graphql/queries.ts`, `src/modules/supplier/profile/types.ts`, `src/modules/supplier/profile/components/SupplierDetailSheet.tsx`
- **Contracts changed:** Consumes nullable `BaSupplier.industry`.
