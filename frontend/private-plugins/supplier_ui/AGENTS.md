# `supplier_ui` Plugin Guide

## Identity

- **Plugin:** `supplier`
- **Project:** `supplier_ui`
- **Layer:** `Frontend UI`
- **Path:** `frontend/private-plugins/supplier_ui`
- **Last synchronized:** `2026-08-10`

## Scope

### Owns

- Supplier-facing profile UI, collective profile UI, collective suppliers, collective packages, and supplier navigation under `/supplier`.

### Does not own

- Supplier backend persistence or webhook delivery.
- Consumer admin UIs such as mushop or blockadmin.
- Shared UI primitives or core product/POS ownership.

## Current Capabilities

- Lets supplier users edit their profile, including branding, industry, business information, address, contact, payment method, POS selection, and attachments.
- Uses supplier GraphQL profile queries/mutations and sends updates through `supplierUpdateProfile`.
- Lets collective users manage collective profile, supplier list, and packages when the tenant is collective-enabled.

## Architecture

| Area | Path | Responsibility |
| ---- | ---- | -------------- |
| Config | `frontend/private-plugins/supplier_ui/src/config.tsx` | Registers supplier navigation and module path |
| Routes | `frontend/private-plugins/supplier_ui/src/modules/SupplierMain.tsx` | Chooses supplier or collective profile routes |
| Supplier profile | `frontend/private-plugins/supplier_ui/src/modules/supplier/` | Supplier profile form, GraphQL documents, hooks, validation, uploads, POS/payment selectors |
| Collective | `frontend/private-plugins/supplier_ui/src/modules/collective/` | Collective profile, suppliers, packages, POS products |

## Contracts

### Provides

- Module federation supplier UI exposed by the project configuration.
- Supplier profile page at `/supplier/profile`.

### Consumes

- `getSupplier` and `supplierUpdateProfile` GraphQL operations from `supplier_api`.
- POS and payment selection queries through local supplier UI hooks.
- Public components from `erxes-ui` and `ui-modules`.

## Data and State

- React Hook Form with Zod validates supplier profile edits.
- Apollo Client owns supplier profile server state.
- Supplier profile form includes nullable `industry` and submits it in `SupplierInput`.

## Local Invariants

- Supplier profile form fields must be present in the Zod schema, GraphQL fragment, and default values before being rendered.
- Profile save must use `supplierUpdateProfile`; do not write directly to consumer plugins.
- Use `erxes-ui` and `ui-modules` components instead of direct Radix imports or custom UI primitives.

## Validation

- `pnpm nx build supplier_ui`
- Supplier smoke scenario: open `/supplier/profile`, enter Industry, save, and confirm the value remains after refetch.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-10` — `Supplier industry field`

- **Summary:** Supplier profile form now edits and persists the optional Industry field.
- **Affected areas:** `src/modules/supplier/components/SupplierProfileForm.tsx`, `src/modules/supplier/constants/supplierProfileSchema.ts`, `src/modules/supplier/graphql/queries.ts`
- **Contracts changed:** Consumes nullable `Supplier.industry` and submits nullable `SupplierInput.industry`.
