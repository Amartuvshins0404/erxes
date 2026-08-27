# `oroltsooadmin_ui` Plugin Guide

## Identity

- **Plugin:** `oroltsooadmin`
- **Project:** `oroltsooadmin_ui`
- **Layer:** `Frontend UI`
- **Path:** `frontend/private-plugins/oroltsooadmin_ui`
- **Last synchronized:** `2026-08-27`

## Scope

### Owns

- The `/oroltsooadmin/profiles` list and `/oroltsooadmin/profiles/:profileId`
  detail routes.
- The `/oroltsooadmin/posts` list and `/oroltsooadmin/posts/:postId` detail
  routes, showing posts mirrored from tenants.
- The admin review surface for politician profiles mirrored from `oroltsoo`
  tenants, including the verify and reject actions.

### Does not own

- Any profile editing form. Profile content is authored in `oroltsoo_ui`; here
  it is strictly read-only.
- A settings surface or widgets — neither is exposed.

## Current Capabilities

- Card grid of mirrored profiles (cover image, avatar, name, review badge,
  position, party, district, source tenant, promise progress), following the
  `blockadmin/developers` layout: `PageContainer` → `PageHeader` →
  `PageSubHeader` filter bar → `ScrollArea` grid.
- Filter bar driven by query-string state: free-text search, review status,
  source tenant subdomain and a last-synced date range.
- "Цааш нь ачаалах" appends the next cursor page.
- Post card grid with the same shell, filtered by search, status, source tenant
  and tag; the detail page renders the mirrored content with
  `BlockEditorReadOnly`.
- Read-only detail page rendering every mirrored section — including biography,
  bills, attendance and finance — plus the standing review note when one exists.
- Verify action, and a reject action that requires a written reason captured in
  a dialog.
- Loading, empty, error and toast feedback on the list, detail and both review
  mutations.

## Architecture

| Area        | Path                                                     | Responsibility                              |
| ----------- | -------------------------------------------------------- | ------------------------------------------- |
| Plugin config | `src/config.tsx`                                       | Navigation group, module entry              |
| Routes      | `src/modules/OroltsooAdminMain.tsx`                      | `/` redirect, `profiles`, `profiles/:id`    |
| Navigation  | `src/modules/OroltsooAdminNavigation.tsx`                | Sidebar link to `oroltsooadmin/profiles`    |
| Pages       | `src/pages/profile/{IndexPage,DetailPage}.tsx`           | Page shells and header actions              |
| GraphQL     | `src/modules/profile/graphql/**`                         | `OroltsooAdminProfile*` documents           |
| Hooks       | `src/modules/profile/hooks/**`                           | List, detail, verify/reject                 |
| Shared      | `src/modules/shared/**`                            | Status-filter factory, cursor hook, formatters |
| List        | `src/modules/profile/components/AdminProfile{Grid,Card}.tsx` | Card grid and its cards          |
| Filters     | `src/modules/profile/components/AdminProfileFilter.tsx` and `components/select/SelectReviewStatus.tsx` | Query-state filter bar |
| Breadcrumb  | `src/modules/profile/components/AdminProfileBreadcrumb.tsx` | Shared list/detail breadcrumb   |
| Posts       | `src/modules/post/**`, `src/pages/post/**`          | Post grid, filters and read-only detail  |
| Review      | `src/modules/profile/components/AdminProfileReviewActions.tsx` | Verify / reject with reason dialog     |
| Detail      | `src/modules/profile/components/detail/**`               | Header and section rendering                |

## Contracts

### Provides

- Module Federation exposes: `./config`, `./oroltsooadmin`.
- Routes `/oroltsooadmin/profiles`, `/oroltsooadmin/profiles/:profileId`,
  `/oroltsooadmin/posts` and `/oroltsooadmin/posts/:postId`.

### Consumes

- `oroltsooadmin_api` GraphQL: `oroltsooAdminProfiles` (with `searchValue`,
  `reviewStatus`, `subdomain`, `syncedFrom`, `syncedTo`),
  `oroltsooAdminProfileDetail`, `oroltsooAdminProfileVerify`,
  `oroltsooAdminProfileReject`.
- `erxes-ui`: `RecordTable`, `Dialog`, `Select`, `Input`, `Textarea`, `Empty`,
  `Badge`, `Avatar`, `Spinner`, `useToast`, `useRecordTableCursor`,
  `mergeCursorData`, `readImage`.
- `ui-modules`: `PageHeader`.

## Data and State

- Apollo Client is the only server-state store; no Jotai atoms are defined here.
- Every list filter lives in the query string (`searchValue`, `reviewStatus`,
  `subdomain`, `synced`) and is read through `useMultiQueryState`, so a filtered
  view is shareable by URL. Only the reject dialog is local `useState`.
- The `synced` chip holds a date token; `parseDateRangeFromString` turns it into
  the `syncedFrom`/`syncedTo` variables.
- Verify and reject refetch the `OroltsooAdminProfiles` list; the returned
  record updates the detail view through Apollo normalization.

## Local Invariants

- This is a review surface. Never render a mirrored profile field as an
  editable input — `oroltsooadmin_api` exposes no mutation that writes tenant
  content, and the next tenant sync would overwrite it anyway.
- Reject always requires a non-empty reason; it is stored as `reviewNote` and
  shown on the detail header.
- All user-facing copy is hard-coded Mongolian, matching `oroltsoo_ui`.
  Translation namespaces live outside this plugin's write boundary.
- Never import from `oroltsoo_ui`; duplicate the small amount of shared
  presentation instead.
- Every filter chip must map to a real query variable. Adding a `Filter.Item`
  without wiring it through `useAdminProfileVariables` leaves a control that
  silently does nothing.
- The plugin identifier stays lowercase everywhere it addresses something:
  `CONFIG.name` (module-federation remote and permission plugin), `CONFIG.path`
  (route prefix), the Nx project, the directory and the Docker tag — Docker
  rejects a repository name with uppercase letters. Only
  `navigationGroup.name` carries the `OroltsooAdmin` display casing, because
  core-ui's `getDisplayName` passes a name through untouched once it contains an
  uppercase letter.
- The exposed remote component's export name is not one of the keys
  `resolveRemoteComponent` looks up for `oroltsooadmin`, so the host finds it
  through its single-component fallback. Keep `OroltsooAdminMain.tsx` exporting
  exactly one component.
- Dev server port is `3014`.
- Keep `module-federation.config.ts` exposes, `config.tsx` paths and the routes
  in `OroltsooAdminMain.tsx` aligned.

## Validation

- `pnpm nx lint oroltsooadmin_ui`
- `pnpm nx build oroltsooadmin_ui`
- Smoke: create a profile in `/oroltsoo/profile`, open
  `/oroltsooadmin/profiles`, confirm it appears as "Хүлээгдэж буй", open its
  detail, reject it with a reason and confirm the badge and note update.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-27` — Shared filter factory, cursor hook and formatters

- **Summary:** The two ~97-line status filter components became one
  `createSelectStatusFilter` factory; both list hooks now wrap
  `useAdminCursorList`; `formatDate`/`formatMoney`/`formatYearRange`/
  `SourceLink`/`MetaLine`/`MetaItem` moved into `shared/utils/format`.
- **Affected areas:** `src/modules/shared/**`,
  `src/modules/post/**`, `src/modules/profile/**`, `src/pages/post/DetailPage.tsx`
- **Contracts changed:** None.

### `2026-08-27` — CI pipeline

- **Summary:** Added a GitHub Actions workflow that builds the remote and syncs
  `dist/frontend/private-plugins/oroltsooadmin_ui` to Cloudflare R2.
- **Affected areas:** `.github/workflows/ci-ui-oroltsooadmin.yml`
- **Contracts changed:** None.

### `2026-08-27` — Moved under `private-plugins`

- **Summary:** The project moved from `frontend/plugins/oroltsooadmin_ui` to
  `frontend/private-plugins/oroltsooadmin_ui`, alongside the other private UI plugins.
- **Affected areas:** `project.json`, `tsconfig.json`, `AGENTS.md`
- **Contracts changed:** None. The Nx project name, module-federation remote
  name, routes and dev port are unchanged; only the build output moved to
  `dist/frontend/private-plugins/oroltsooadmin_ui`.

### `2026-08-27` — `OroltsooAdmin` display casing

- **Summary:** The sidebar now reads "OroltsooAdmin", and the React components
  were renamed to match; every addressable identifier stays lowercase.
- **Affected areas:** `src/config.tsx`,
  `src/modules/OroltsooAdmin{Main,Navigation}.tsx`,
  `module-federation.config.ts`
- **Contracts changed:** None. The `./oroltsooadmin` federation expose key,
  `CONFIG.name`, `CONFIG.path` and all routes are unchanged.

### `2026-08-26` — Post mirror screens

- **Summary:** Added a post card grid and a read-only post detail page over the
  `oroltsooAdminPosts` mirror.
- **Affected areas:** `src/modules/post/**`, `src/pages/post/**`,
  `src/modules/OroltsooAdmin{Main,Navigation}.tsx`, `src/config.tsx`
- **Contracts changed:** Routes `/oroltsooadmin/posts` and
  `/oroltsooadmin/posts/:postId` added.

### `2026-08-26` — Drop the mirrored meeting list

- **Summary:** The detail page no longer renders meetings, which `oroltsoo` now
  keeps in its own tenant-local module.
- **Affected areas:** `src/modules/profile/types/profile.ts`,
  `src/modules/profile/graphql/queries/profileQueries.ts`,
  `src/modules/profile/components/detail/AdminProfileContent.tsx`
- **Contracts changed:** The detail query no longer selects `meetings`.

### `2026-08-26` — Card grid list in the `blockadmin/developers` style

- **Summary:** Replaced the record table with a card grid and a query-state
  filter bar, and moved both pages onto the `PageContainer`/`PageSubHeader`
  shell.
- **Affected areas:** `src/pages/profile/**`,
  `src/modules/profile/components/AdminProfile{Grid,Card,Filter,Breadcrumb}.tsx`,
  `src/modules/profile/components/select/SelectReviewStatus.tsx`,
  `src/modules/profile/hooks/useAdminProfiles.ts`,
  `src/modules/profile/graphql/queries/profileQueries.ts`
- **Contracts changed:** The list query now also sends `subdomain`,
  `syncedFrom` and `syncedTo`.

### `2026-08-26` — Show mandate type, biography, bills, attendance, finance

- **Summary:** The review detail page now renders the newly mirrored fields:
  mandate-type badge, Намтар section, bills list, attendance figures and a
  finance section with declarations, campaign expense and donations.
- **Affected areas:** `src/modules/profile/types/profile.ts`,
  `src/modules/profile/constants/profileConstants.ts`,
  `src/modules/profile/graphql/queries/profileQueries.ts`,
  `src/modules/profile/components/detail/**`
- **Contracts changed:** The admin profile detail query selects `mandateType`,
  `education`, `career`, `bills`, `attendance` and `finance`.

### `2026-08-26` — Politician profile review surface

- **Summary:** Replaced the generated placeholder page with an admin review
  surface for profiles mirrored from `oroltsoo`: filtered table, read-only
  detail, and verify/reject actions.
- **Affected areas:** `src/config.tsx`,
  `src/modules/OroltsooAdmin{Main,Navigation}.tsx`,
  `src/modules/profile/**`, `src/pages/profile/**`,
  `module-federation.config.ts`, `project.json`
- **Contracts changed:** Removed the `./oroltsooadminSettings` and `./widgets`
  exposes together with `CONFIG.settingsNavigation`; module path moved from
  `profile` to `oroltsooadmin/profiles`; dev port moved from `3005` to `3014`.
