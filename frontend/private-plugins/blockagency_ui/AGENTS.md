# `blockagency_ui` Plugin Guide

## Identity

- **Plugin:** `blockagency`
- **Project:** `blockagency_ui`
- **Layer:** `Frontend UI`
- **Path:** `frontend/private-plugins/blockagency_ui`
- **Last synchronized:** `2026-08-21`

## Scope

### Owns

- Agency profile surfaces: general info, verification status, and the
  Frontline integration panel that binds an erxes messenger integration to the
  agency.
- Property listing management: list, create, detail, general info, location,
  pricing, specs.
- Unit management: unit table, status counts/KPI, status updates, assigning a
  unit to a member.
- Agency member management: member list, member profile, create/update/remove.
- Agency dashboard: listing stats.
- `blockagency` navigation group, settings navigation entry, and every route
  under the `blockagency` path.

### Does not own

- Any backend contract. The paired `blockagency_api` project owns the schema,
  the data model, and the block-admin synchronization; this project only
  consumes the gateway schema.
- The erxes messenger integration picker itself — it is owned by
  `frontline_ui` and only consumed here at runtime.
- Core shell chrome (breadcrumbs, page container, navigation host), which comes
  from `erxes-ui` / `ui-modules`.

## Current Capabilities

- Agency profile page with editable general info and a Frontline integrations
  card that stores `messengerIntegrationId` and `widgetBundleUrl`.
- Introduction card edits `brief` and `description` in the shared block editor
  (`Editor` from `erxes-ui`), storing serialized blocks.
- Runtime loading of `frontline_ui/selectErxesMessenger` with skeleton,
  unavailable, and error states — the page stays usable when `frontline` is
  disabled.
- Listing index with cursor pagination, create sheet, and detail page with
  section forms.
- Unit index with status filters, KPI counts, status mutation, and member
  assignment.
- Member index with profile view and create/update/remove mutations. The
  profile form manages certificate photos in a three column certificate grid
  that uploads images and pdfs and previews each one.
- Dashboard index with listing stats.
- `./blockagencySettings` and `./widgets` are still generated placeholders and
  render static text; they are not wired to real behavior yet.

## Architecture

| Area                  | Path                                                | Responsibility                                                       |
| --------------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| Federation config     | `module-federation.config.ts`                       | Remote name `blockagency_ui` and the four exposes                     |
| Plugin config         | `src/config.tsx`                                    | `CONFIG: IUIConfig` — navigation group, settings navigation, modules   |
| Route host            | `src/modules/BlockagencyMain.tsx`                   | Lazy `Routes` for every `AgencyPaths` entry                            |
| Route paths           | `src/modules/types/AgencyPaths.ts`                  | Single source of truth for in-plugin route segments                    |
| Pages                 | `src/pages/blockagency/`                            | Page shells that compose module components                            |
| Agency module         | `src/modules/agency/`                               | Agency info, verification, profile forms, Frontline integration panel  |
| Listing module        | `src/modules/listing/`                              | Listing table, forms, sheets, Jotai listing state                      |
| Unit module           | `src/modules/unit/`                                 | Unit table, status filters/KPI, assignment                             |
| Member module         | `src/modules/member/`                               | Member table, profile, member mutations                                |
| Dashboard module      | `src/modules/dashboard/`                            | Listing statistics                                                     |
| Cross-plugin loading  | `src/modules/agency/hooks/useRemoteComponent.ts`    | Resolves the federation host that owns a remote, then loads the module |

## Contracts

### Provides

- Module Federation exposes:
  - `./config` → `src/config.tsx`
  - `./blockagency` → `src/modules/BlockagencyMain.tsx`
  - `./blockagencySettings` → `src/modules/BlockagencySettings.tsx`
  - `./widgets` → `src/widgets/Widgets.tsx`
- Dev server on port `3005` (`project.json` → `serve`).

### Consumes

- `erxes-ui` and `ui-modules` for every UI primitive, form, table, and page
  layout; `@module-federation/enhanced/runtime` for remote resolution.
- GraphQL through the gateway. Queries: `GetAgencyInfo`,
  `GetAgencyVerificationStatus`, `GetListings`, `GetListing`,
  `GetListingStats`, `BlockAgencyGetUnits`, `BlockAgencyGetUnitsTotalCount`,
  `BlockAgencyGetUnitStatusCounts`, `BlockAgentGetMembers`,
  `BlockAgentGetMemberProfile`. Mutations: `UpdateAgencyInfo`,
  `BlockCreateListing`, `BlockUpdateListingGeneralInfo`, `BlockRemoveListing`,
  `BlockAgencyUpdateUnitStatus`, `BlockAgencyAssignUnitToMember`,
  `BlockAgentCreateMember`, `BlockAgentUpdateMember`,
  `BlockAgentUpdateMemberProfile`, `BlockAgentRemoveMember`.
- `frontline_ui/selectErxesMessenger` — an **optional** runtime remote. It is
  deliberately absent from `module-federation.config.ts` `remotes` so this
  plugin still builds and runs when `frontline` is not enabled.

## Data and State

- Server state lives in Apollo Client; documents sit beside their feature in
  each module's `graphql/` directory.
- Jotai is used only for plugin-wide UI state: `createListingSheetAtom` and
  `editListingAtom` in `src/modules/listing/states/listing.ts`.
- Forms use React Hook Form with Zod resolvers; schemas live in each module's
  `schema/` or `form/` directory.
- The agency profile cards persist through `UpdateAgencyInfo` instead of an
  explicit submit button. Free-text fields commit on blur; discrete controls
  (select, upload, toggle) commit on change.
- `UpdateAgencyInfo` selects the `BlockAgencyInfoFields` fragment — the same
  selection as `GetAgencyInfo` — and `useUpdateAgency` writes the response into
  the cache with `cache.writeQuery`, so no card refetches after a save.
- `logo`, `coverImage`, `documents`, and a member's `certificatePhotos` are
  `Attachment` objects, described by `agencyAttachmentSchema` in
  `src/modules/agency/schema/form.ts`. Only `url` and `name` are guaranteed;
  `type`, `size`, and `duration` are missing on files uploaded before the
  attachment migration.
- `brief` and `description` are stored as the block editor's serialized JSON.
  Agencies that wrote them before the editor still hold plain strings, so both
  values are read through `getBlockPlainText`
  (`src/modules/agency/utils/blockText.ts`) or rendered with a component that
  accepts either shape.

## Local Invariants

- Never add another plugin to `remotes` in `module-federation.config.ts`. Load
  cross-plugin components through `useRemoteComponent`, which finds the
  federation instance that already registered the remote (the core-ui host) and
  loads through it. `loadRemote` imported directly from
  `@module-federation/enhanced/runtime` resolves against this plugin's own
  instance, which has no remotes, and always fails.
- Every cross-plugin component must degrade gracefully: render a loading state
  while resolving and an explicit unavailable state on error.
- Route segments must come from `AgencyPaths`, never inline strings.
- Every expose in `module-federation.config.ts` must point at a file with a
  default export, because `useRemoteComponent` and the core-ui plugin loader
  read `default`.
- GraphQL operation names stay prefixed so they remain unique repo-wide.
- Member management controls (role select, delete, add) render only for agency
  admins, resolved by `useIsAgencyAdmin` (`src/modules/member/hooks/`) as
  `currentUser.isOwner || myMemberProfile.role === 'admin'`. This mirrors the
  API rule rather than replacing it — the mutations reject non-admins anyway.
- The `brief` limit is measured on `getBlockPlainText(value)`, never on the
  stored string — serialized blocks are far longer than the text the agency
  typed, so a raw `.max()` would reject a one-line brief. `BRIEF_MAX_LENGTH` in
  `src/modules/agency/schema/form.ts` is the single source for that limit and
  the character counter.
- Never fire `UpdateAgencyInfo` from a text input's `onChange`. One mutation
  per keystroke races with its own responses, and the response that lands last
  is not the one sent last, which drops and reorders typed characters. Commit
  free text on blur (or on popover close) and send only the changed fields —
  the resolver `$set`s exactly what it receives.
- A form that mirrors `getAgencyInfo` must never reset itself from the query
  while the user is editing. Sync with
  `form.reset(values, { keepDirtyValues: true })`, and clear a single field's
  dirty state with `form.resetField` once its own save comes back.
- Anything read through Apollo carries `__typename`, which every `*Input` in
  the schema rejects — `fieldsOfExpertise`, `operationArea`, and attachments
  all reach mutation variables through form defaults seeded from
  `getAgencyInfo`. `useUpdateAgency` strips it from `input` with `omitTypename`
  (`src/modules/agency/utils/input.ts`); any other mutation that echoes query
  data back must do the same.
- `toAttachmentInput` / `toAttachmentInputs` in
  `src/modules/agency/utils/attachment.ts` still narrow attachments to the
  input shape — use them so an attachment carries exactly the input fields,
  not merely a `__typename`-free copy of whatever was in the cache.
- An uploaded file's name, type, and size come from the `fileInfo` argument of
  `useUpload`'s `afterUpload`; the upload response itself is only the url.
- `src/modules/agency/form/upload.tsx` exports two photo grids over the same
  markup: `UploadAttachments` for fields still stored as url strings (listing
  media) and `MultipleImageUpload` for `Attachment` fields. Pick the one that
  matches the field's graphql type — the provider underneath always works on
  urls, so `AttachmentUploadProvider` reconciles removals against the url list
  it gets back and re-attaches the file info collected while uploading.
- A grid that renders `Attachment` values with its own markup (the certificate
  grid) wraps `AttachmentUploadProvider` and reads `remove` from
  `useUploadContext`; never re-implement that url/attachment reconciliation.
- `Certificate` (`src/modules/member/components/Certificate.tsx`) is a compound
  component: `Certificate` (context for `onRemove`/`disabled`),
  `Certificate.Group` (three column grid whose `uploader` prop is rendered
  through `Slot.Root` as the trailing cell), and `Certificate.Item` (name,
  preview, `type · size` and the verification badge). The uploader is passed in
  as a `Slot` child, so it must accept `className` and a ref — `Upload` does.
- `Certificate.Item`'s `verified` prop has no backing field yet; every stored
  certificate renders the `Pending` badge until the api returns a verification
  status. Wire that prop to real data instead of adding a second badge.
- `CertificateGroup` equalizes rows with `auto-rows-fr` so the uploader cell is
  as tall as the cards when it wraps onto a row of its own; its `aspect-square`
  is only the floor for the empty state. Do not replace that with a fixed
  height.
- `CertificatePreview` renders a pdf in an `iframe` pointed at the browser's own
  viewer, with `#toolbar=0&navpanes=0&view=Fit&zoom=page-fit` for the thumbnail
  look and `pointer-events-none` so the frame does not swallow the card's
  clicks. `@react-pdf/renderer` (a workspace dep) only *writes* pdfs and cannot
  display one; a real rendered thumbnail would mean `pdfjs-dist` plus a worker
  asset and a plugin-local rspack rule, as `erxes-agent_ui` needed.
- Every non-image preview goes through `readImage(key, undefined, true)`, which
  ignores `inline` when `REACT_APP_IMAGE_CDN_URL` is set and returns an
  image-resize url instead. Deployments with that CDN configured will not
  preview pdfs; the same already applies to `DocumentPreview`, and fixing it
  means changing `erxes-ui`, which is outside this plugin.
- To render a stored file in an `img`/`video`/`iframe`, build its url with
  `readImage(key, undefined, true)`. Core's `/read-file` sends
  `Content-Disposition: attachment` unless `inline=true`, so the plain url
  downloads the file instead of previewing it. Use the plain url for download
  links, the inline one for previews.

## Validation

- `pnpm nx lint blockagency_ui`
- `pnpm nx build blockagency_ui`
- Smoke: run `pnpm nx serve core-ui` with `ENABLED_PLUGINS` containing both
  `blockagency` and `frontline`, open the agency profile page, and confirm the
  "Erxes Messenger" field renders the Frontline picker and saves a selection.
  Repeat with `frontline` removed from `ENABLED_PLUGINS` and confirm the field
  reports that the plugin is unavailable instead of hanging on a skeleton.

`project.json` defines no `test` target, so `pnpm nx test blockagency_ui` does
not apply.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-21` — Favorite toggles carry a breadcrumb

- **Summary:** Every `PageHeader.FavoriteToggleButton` in the plugin now passes
  the required `breadcrumb` (built with `createFavoriteBreadcrumb` from the
  page's own breadcrumb text, with the listing title appended on the detail
  page) plus the matching navigation `icon`, so favoriting a screen stores a
  readable label.
- **Affected areas:** `src/pages/blockagency/IndexPage.tsx`,
  `src/pages/blockagency/DashboardIndexPage.tsx`,
  `src/pages/blockagency/MemberIndexPage.tsx`,
  `src/pages/blockagency/ListingPage.tsx`,
  `src/pages/blockagency/ListingDetailPage.tsx`,
  `src/pages/blockagency/UnitPage.tsx`
- **Contracts changed:** `None`

### `2026-08-21` — Certificate grid for member certificate photos

- **Summary:** The member profile form renders certificate photos through a new
  `Certificate` compound component — a three column grid of cards showing the
  attachment name, a preview (image inline, pdf in the browser's viewer, icon
  otherwise), `type · size`, and a verification badge — with the upload trigger
  slotted in as the trailing cell; the attachment/url reconciliation moved into
  a reusable `AttachmentUploadProvider` so the grid does not duplicate it.
- **Affected areas:** `src/modules/member/components/Certificate.tsx`,
  `src/modules/member/components/ProfileForm.tsx`,
  `src/modules/agency/form/upload.tsx`
- **Contracts changed:** None. The `verified` badge state is a prop with no
  backing field yet, so every certificate renders as `Pending`.

### `2026-08-21` — Member certificate photos are attachments

- **Summary:** The profile form's certificate photos are `Attachment` objects
  like the agency's logo, cover image, and documents: a new
  `MultipleImageUpload` keeps the uploaded file info, the form schema validates
  it with `agencyAttachmentSchema`, and `useUpdateMemberProfile` narrows the
  list with `toAttachmentInputs` before sending it.
- **Affected areas:** `src/modules/agency/form/upload.tsx`,
  `src/modules/member/{schema,types,graphql,hooks,components}/`,
  `src/modules/agency/{types/member.ts,graphql}/`
- **Contracts changed:** `BlockMember.certificatePhotos` is selected with its
  `Attachment` subfields, and `MemberInput.certificatePhotos` now takes
  `[AttachmentInput]`.

### `2026-08-21` — `SocialLinkInput` accepts nullable values and forwards its ref

- **Summary:** The social link field takes `string | null | undefined` and
  normalizes it to `''`, so nullable form values bind without a cast, and the
  component forwards its ref to the underlying `Input` for React Hook Form.
- **Affected areas:** `src/modules/agency/form/SocialLinkInput.tsx`
- **Contracts changed:** None.

### `2026-08-21` — Member management limited to agency admins

- **Summary:** The agency members table hides the delete and add-member controls
  and disables the role select unless the signed-in user is an agency admin or
  the tenant owner, matching the rule the API now enforces.
- **Affected areas:** `src/modules/agency/components/AgencyMembers.tsx`,
  `src/modules/member/hooks/useIsAgencyAdmin.ts`
- **Contracts changed:** None.

### `2026-08-21` — Introduction fields moved to the block editor

- **Summary:** `brief` and `description` are edited with `Editor` from
  `erxes-ui` instead of textareas, so agencies can format their introduction.
  The brief character limit and counter now measure the extracted plain text
  through the new `getBlockPlainText`, and the description field no longer
  saves its value into `brief`.
- **Affected areas:** `src/modules/agency/components/AgencyProfileIntroduction.tsx`,
  `src/modules/agency/schema/form.ts`,
  `src/modules/agency/utils/blockText.ts`
- **Contracts changed:** None. `AgencyInput.brief`/`description` stay `String`,
  now carrying serialized editor blocks.

### `2026-08-20` — `UpdateAgencyInfo` variables are stripped of `__typename`

- **Summary:** `useUpdateAgency` runs the mutation input through
  `omitTypename`, so cards seeded from `getAgencyInfo` — the fields of
  expertise card in particular — stop sending `__typename` inside
  `fieldsOfExpertise` and failing input validation.
- **Affected areas:** `src/modules/agency/utils/input.ts`,
  `src/modules/agency/hooks/useUpdateAgency.ts`
- **Contracts changed:** `None`

### `2026-08-20` — Agency name and general info save on blur

- **Summary:** The general info card and the profile header name no longer
  mutate on every keystroke; they commit the changed field on blur (or popover
  close), send only that field, keep in-progress edits when the query updates,
  and report a failed save with a toast.
- **Affected areas:**
  `src/modules/agency/components/AgencyProfileGeneral.tsx`,
  `src/modules/agency/components/AgencyProfileDetailHeader.tsx`,
  `src/modules/agency/hooks/useUpdateAgency.ts`,
  `src/modules/agency/graphql/fragments.ts`,
  `src/modules/agency/graphql/queries.ts`,
  `src/modules/agency/graphql/mutations.ts`
- **Contracts changed:** `UpdateAgencyInfo` now selects the full agency through
  the new `BlockAgencyInfoFields` fragment instead of only `_id`, and
  `GetAgencyInfo` selects the same fragment; `useUpdateAgency` writes the
  result into the cache instead of refetching `GetAgencyInfo`.

### `2026-08-20` — Agency logo, cover image, and documents are attachments

- **Summary:** The identity and documents forms now read and write
  `Attachment` objects instead of url strings, `UploadImage` emits the uploaded
  file's info, mutation input is stripped of `__typename`, and each uploaded
  document opens a dialog preview (image/video/audio/pdf inline, download
  fallback for everything else).
- **Affected areas:** `src/modules/agency/schema/form.ts`,
  `src/modules/agency/types/form.ts`,
  `src/modules/agency/utils/attachment.ts`,
  `src/modules/agency/form/upload.tsx`,
  `src/modules/agency/form/MultipleDocumentUpload.tsx`,
  `src/modules/agency/components/AgencyProfileIdentity.tsx`,
  `src/modules/agency/components/AgencyProfileDocuments.tsx`,
  `src/modules/agency/graphql/queries.ts`
- **Contracts changed:** `GetAgencyInfo` selects attachment subfields for
  `logo`, `coverImage`, and `documents`; `UpdateAgencyInfo` sends
  `AttachmentInput` values for those fields.

### `2026-08-11` — Fix cross-plugin loading of the erxes messenger picker

- **Summary:** `useRemoteComponent` now resolves the federation instance that
  owns the requested remote before loading, so
  `frontline_ui/selectErxesMessenger` loads from the agency profile instead of
  failing with "Unable to locate … in blockagency_ui", and the integrations
  field renders an unavailable state instead of a permanent skeleton.
- **Affected areas:** `src/modules/agency/hooks/useRemoteComponent.ts`,
  `src/modules/agency/components/AgencyProfileIntegrations.tsx`
- **Contracts changed:** `None`
