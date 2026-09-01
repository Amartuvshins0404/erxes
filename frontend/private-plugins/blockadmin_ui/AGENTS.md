# `blockadmin_ui` Plugin Guide

## Identity

- **Plugin:** `blockadmin`
- **Project:** `blockadmin_ui`
- **Layer:** `Frontend UI`
- **Path:** `frontend/private-plugins/blockadmin_ui`
- **Last synchronized:** `2026-09-01`

## Scope

### Owns

- Blockadmin admin routes, navigation, supplier review screens, supplier product review screens, agency review screens, membership UI, pricing UI, and blockadmin detail sheets.

### Does not own

- Supplier tenant source data.
- Backend webhook delivery or blockadmin persistence rules.
- Mushop UI behavior, POS client UI behavior, or shared UI library internals.

## Current Capabilities

- Provides module federation entry points for blockadmin routes and settings.
- Shows admin supplier lists, supplier profile detail sheets, verification actions, and supplier product review screens with editable product categories.
- Displays supplier profile fields synced from supplier tenants, including industry.
- Filters the agency listing review screen by search value, status, agency, city, and district, all held in the url query string.
- Reviews agencies through a read-only detail screen (profile, sidebar tabs, general/activity/operation area/contact/documents/social links panels, plus Agents and Integrations under internal settings) with verify and reject actions.
- Uses `erxes-ui` and `ui-modules` components for tables, sheets, filters, navigation, and feedback.

## Architecture

| Area              | Path                                                                   | Responsibility                                                                        |
| ----------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Module federation | `frontend/private-plugins/blockadmin_ui/module-federation.config.ts`   | Exposes blockadmin modules to the host                                                |
| Runtime config    | `frontend/private-plugins/blockadmin_ui/src/config.tsx`                | Registers blockadmin route/navigation entries                                         |
| Main routes       | `frontend/private-plugins/blockadmin_ui/src/modules/Main.tsx`          | Defines blockadmin page routing                                                       |
| Supplier profile  | `frontend/private-plugins/blockadmin_ui/src/modules/supplier/profile/` | Supplier list, filters, detail sheet, GraphQL documents, and verification actions     |
| Supplier products | `frontend/private-plugins/blockadmin_ui/src/modules/supplier/product/` | Supplier product list, filters, detail sheet, status actions, and category assignment |
| Agencies          | `frontend/private-plugins/blockadmin_ui/src/modules/agencies/`         | Agency grid/list, read-only agency detail tabs (including the synced agents list), verify/reject actions, listing review  |

## Contracts

### Provides

- Module federation exposes `./blockadmin` and `./blockadminSettings`.
- Blockadmin routes under `/blockadmin`, including supplier profile and supplier product pages.

### Consumes

- `baSuppliers`, `baSupplierDetail`, `baUpdateSupplierVerificationStatus`, and `baUpdateSupplierTier` GraphQL operations from `blockadmin_api`.
- Supplier detail consumes nullable `BaSupplier.industry`.
- Supplier product `ba*` GraphQL operations from `blockadmin_api`, plus core `productCategories` lookup for category assignment.
- `GetAgencies`, `GetBlockAdminAgenciesInline`, `GetAgencyInfo`, `BlockAdminAgencyAgents`, `BlockAdminAgencyVerify`, and `BlockAdminAgencyReject` GraphQL operations from `blockadmin_api`; `blockadmin_api` exposes no agency update mutation and no agent mutation — agents are owned by the agency tenant.
- Public components and hooks from `erxes-ui` and `ui-modules`.

## Data and State

- Apollo Client owns blockadmin supplier and supplier product server state.
- Query-string state stores active supplier/product detail sheet IDs and filters.
- Supplier detail displays nullable synced `industry`.
- Supplier product category edits refetch the active detail query and update Apollo mutation results.

## Local Invariants
- The admin listing filters live in the url query string (`searchValue`, `status`, `agencyId`, `city`, `district`) and every listings consumer — `AdminListingList`, `AdminListingGrid`, and `AgenciesListingsTotalCount` — must read the same key set through `useMultiQueryState`, or the grid, list, and count fall out of sync. `agencyId` is the blockadmin `Agency._id`, resolved to the agency's subdomain by `blockadmin_api`.

- Supplier profile UI displays supplier-owned synced values for admin review.
- Agency `logo`, `coverImage`, and `documents` are `Attachment` objects typed as `AgencyAttachment` in `src/modules/agencies/types/agencyTypes.ts`; only `url` and `name` are guaranteed. Read images through `attachment.url`, never by passing the attachment itself to `readImage`, and derive icons/labels through `src/modules/agencies/utils/attachment.ts` plus `components/attachment-type.tsx`.
- Agency `brief` and `description` hold the block editor's serialized JSON, written by `blockagency_ui`; records predating that editor hold plain strings. Render them with `BlockEditorReadOnly` (it accepts both), and use `getBlockPlainText` (`src/modules/agencies/utils/blockText.ts`) anywhere the value must be plain text, such as the card and list-row summaries — printing the raw value there leaks serialized blocks into the UI.
- The agency detail screen is a read-only review surface: `blockadmin_api` exposes no agency update mutation, so agency fields must never be rendered as editable inputs. The only agency write paths are `blockAdminAgencyVerify` and `blockAdminAgencyReject`.
- Agency detail follows the `ProjectDetail` composition: `AgencyDetailPage` owns the page shell, `AgencyDetail` owns profile + sidebar + tab body, and every `AgencyDetail*` tab panel reads the shared `useAgencyDetail()` Apollo cache entry instead of receiving props.
- `useAgencyDetail()` defaults to the `:id` route param; pass `variables.id` (with `skip`) to read another agency from a non-agency route. `useAgencyAgents()` follows the same rule with `variables.agencyId`.
- Agents are mirrored into block admin from the agency's own workspace, so the Agents tab is read-only and renders only the denormalized `user` summary the sync provides — never assume a federated core `User` is resolvable for an agent.
- Keep GraphQL documents near the supplier feature and preserve unique `ba*` operation names.
- Use `erxes-ui` / `ui-modules` components instead of direct Radix imports or custom UI primitives.
- Detail sheets must include loading and not-found states.

## Validation

- `pnpm nx lint blockadmin_ui`
- `pnpm nx build blockadmin_ui`
- Agency listing smoke scenario: open `/blockadmin/agencies/listing`, pick an agency from the Agency filter, and confirm the list, grid, and records-found count all narrow to that agency and reset when the chip is removed.
- Agency detail smoke scenario: open an agency from the agency grid, switch through the sidebar tabs (the `tab` query param must persist the selection), and confirm the profile badge flips after Verify without a manual refresh.
- Supplier profile smoke scenario: open a supplier detail sheet and confirm synced Industry renders in the General section.
- Supplier product smoke scenario: open the product table/detail, assign and clear a category, and confirm the selected category changes without refresh.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-09-01` — Agency listing/agent operations renamed

- **Summary:** Followed `blockadmin_api`'s rename of the agency-owned operations: the listing documents now call `getBlockAdminAgencyListings`/`getBlockAdminAgencyListing`/`getBlockAdminAgencyListingStats` and `blockAdminUpdateAgencyListingStatus`/`blockAdminRemoveAgencyListing`, the agents document calls `getBlockAdminAgencyAgents`, and each document's operation name was renamed to match.
- **Affected areas:** `src/modules/agencies/listing/graphql/{queries,mutations}.ts`, `src/modules/agencies/listing/hooks/{useAdminListings,useAdminListingDetail,useAdminListingStats}.ts`, `src/modules/agencies/graphql/queries.ts`, `src/modules/agencies/hooks/useAgencyAgents.ts`
- **Contracts changed:** Consumes the renamed operations; the old names no longer exist.

### `2026-09-01` — Agency filter on the listing review screen

- **Summary:** The admin listing filter bar gained an Agency filter (popover item, view, and removable chip) backed by a searchable, cursor-paginated agency combobox, and the `agencyId` query param is now passed to the listings query by the list, grid, and total-count consumers.
- **Affected areas:** `src/modules/agencies/components/SelectAgency.tsx`, `src/modules/agencies/hooks/useAgencies.ts`, `src/modules/agencies/graphql/queries.ts`, `src/modules/agencies/listing/components/{AdminListingFilter,AdminListingList,AdminListingGrid,AgenciesListingsTotalCount}.tsx`, `src/modules/agencies/listing/graphql/queries.ts`, `src/modules/agencies/listing/types/listingTypes.ts`
- **Contracts changed:** Consumes the new `GetBlockAdminAgenciesInline` operation and the new `agencyId` argument of `GetBlockAdminAgencyListings`.

### `2026-08-21` — Favorite toggles in the agencies module carry a breadcrumb

- **Summary:** The agencies, agency listing, and admin listing detail pages pass the now-required `breadcrumb` (built with `createFavoriteBreadcrumb`) plus an `icon` to `PageHeader.FavoriteToggleButton`, so favoriting those screens stores a readable label.
- **Affected areas:** `src/pages/AgenciesPage.tsx`, `src/pages/AgencyListingPage.tsx`, `src/pages/AdminListingDetailPage.tsx`
- **Contracts changed:** None.

### `2026-08-21` — Introduction rendered as editor content

- **Summary:** The agency detail Introduction card renders `brief` and `description` with `BlockEditorReadOnly` now that agencies write them in the block editor, and the agency card/list row render the extracted plain text so serialized blocks never reach those summaries.
- **Affected areas:** `src/modules/agencies/components/AgencyDetailGeneral.tsx`, `src/modules/agencies/components/AgencyCard.tsx`, `src/modules/agencies/components/AgencyListItem.tsx`, `src/modules/agencies/utils/blockText.ts`
- **Contracts changed:** None.

### `2026-08-21` — Agents tab on the agency detail screen

- **Summary:** Internal settings gained an Agents tab listing the agency members synced into block admin, with avatar, name, role, email, and location plus loading, empty, and error states.
- **Affected areas:** `src/modules/agencies/components/AgencyDetailAgents.tsx`, `src/modules/agencies/components/AgencyDetailTabs.tsx`, `src/modules/agencies/constants/agency-detail.ts`, `src/modules/agencies/hooks/useAgencyAgents.ts`, `src/modules/agencies/graphql/queries.ts`, `src/modules/agencies/types/agencyTypes.ts`
- **Contracts changed:** Consumes the new `getBlockAdminAgencyAgents` query as `BlockAdminAgencyAgents`.

### `2026-08-21` — Agency detail rebuilt on the `ProjectDetail` composition

- **Summary:** The agency detail screen is now a read-only review surface — profile header with verification badge and verify/reject actions, sidebar tab navigation, and lazy-loaded `InfoCard` tab panels for general, activity, operation area, contact, documents, social links, and integrations — replacing the non-submitting agency form.
- **Affected areas:** `src/pages/AgencyDetailPage.tsx`, `src/modules/agencies/components/AgencyDetail*.tsx`, `src/modules/agencies/components/attachment-type.tsx`, `src/modules/agencies/constants/agency-detail.ts`, `src/modules/agencies/hooks/useAgencyDetail.ts`, `src/modules/agencies/utils/attachment.ts`, `src/modules/agencies/graphql/queries.ts`, `src/modules/agencies/types/agencyTypes.ts`; removed `AgencyInfoForm`, `AgencyActionBar`, `AgencyEmails`, `AgencyPhones`, `MultipleDocumentUpload`, `SocialLinkInput`, `useAgencyForm`, `useRemoteComponent`, and the zod-only `schema.ts`.
- **Contracts changed:** `GetAgencyInfo` additionally selects `entityId`, `verificationStatus`, `rejectionReasons`, and `rejectionNotes`.

### `2026-08-20` — Agency attachments in the admin agency screens

- **Summary:** Agency `logo`, `coverImage`, and `documents` are read as `Attachment` objects: the queries and mutations select the attachment subfields, the form schema and `IAgency` describe them, and the cards, list rows, and document list render `url`/`name`.
- **Affected areas:** `src/modules/agencies/graphql/queries.ts`, `src/modules/agencies/graphql/mutations.ts`, `src/modules/agencies/schema.ts`, `src/modules/agencies/types/agencyTypes.ts`, `src/modules/agencies/components/AgencyCard.tsx`, `src/modules/agencies/components/AgencyListItem.tsx`, `src/modules/agencies/components/AgencyInfoForm.tsx`, `src/modules/agencies/components/MultipleDocumentUpload.tsx`
- **Contracts changed:** Consumes `BlockAdminAgency.logo`/`coverImage` as `Attachment` and `documents` as `[Attachment]`.

### `2026-08-10` — `Supplier product category editing`

- **Summary:** Supplier product table and detail views can now assign or clear categories through the existing `baAssignProductCategory` mutation.
- **Affected areas:** `src/modules/supplier/product/components/ProductCategoryAssign.tsx`, `src/modules/supplier/product/components/ProductColumns.tsx`, `src/modules/supplier/product/components/ProductDetailSheet.tsx`, `src/modules/supplier/product/hooks/useAssignProductCategory.ts`, `src/modules/supplier/product/graphql/queries.ts`
- **Contracts changed:** Consumes core `productCategories` and existing `baAssignProductCategory`.

### `2026-08-10` — `Supplier industry displayed`

- **Summary:** Supplier detail now queries and displays the synced supplier industry field.
- **Affected areas:** `src/modules/supplier/profile/graphql/queries.ts`, `src/modules/supplier/profile/types.ts`, `src/modules/supplier/profile/components/SupplierDetailSheet.tsx`
- **Contracts changed:** Consumes nullable `BaSupplier.industry`.
