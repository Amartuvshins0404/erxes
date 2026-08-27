# `oroltsoo_api` Plugin Guide

## Identity

- **Plugin:** `oroltsoo`
- **Project:** `oroltsoo_api`
- **Layer:** `Backend API`
- **Path:** `backend/plugins/oroltsoo_api`
- **Last synchronized:** `2026-08-27`

## Scope

### Owns

- The workspace's **single** politician profile record (`oroltsoo_profiles`):
  identity, mandate type,
  education and career history, activity narrative, promises with progress,
  sponsored bills, attendance figures, citizen-engagement notes, report and
  news links, financial disclosures, and contact details.
- The politician's posts (`oroltsoo_posts`): title, excerpt, BlockNote content,
  cover image, tags, status and publish date.
- The read side of the citizen meeting schedule (`oroltsoo_meetings`): the
  schema, indexes and query API. Meetings themselves are authored on the public
  website, not here.
- The `oroltsooProfile` permission module and its two actions.
- Agent-callable read tools for politician profiles.

### Does not own

- Citizen request intake, ticketing, or approval workflow.
- Voting-record ingestion from an external parliament source; individual votes
  are still only a free-text summary.
- Committee memberships and multi-term history.
- Citizen requests and their workflow — not built yet.
- Creating, editing or deleting meetings. This plugin exposes no meeting
  mutation; the website owns that write path.
- The review decision itself. `reviewStatus` is authored in `oroltsooadmin`;
  this plugin only stores what that service sends.
- CMS articles — only outbound links to news and reports are stored here.
- Anything in `oroltsooadmin_api`, core, or another plugin.

## Current Capabilities

- One profile per tenant. `getProfileInfo` returns it, creating an empty draft
  on first read so the editor always has a record to write into.
- A single permission-checked update that writes the whole profile.
- No create, list or delete: the workspace belongs to one politician.
- Server-side normalization: trimmed strings, clamped promise progress
  (0–100), dropped array rows with an empty required field, and a term-date
  order check.
- `fullName` and `promiseProgress` are computed on `OroltsooProfile`;
  `totalDonations` is computed on `OroltsooProfileFinance`.
- Structured education, career, bills, attendance and finance (asset and
  interest declarations, campaign expense, donations) sub-documents.
- One agent tool (`oroltsooProfile.get`) returning the single profile.
- Receives the review decision `oroltsooadmin` pushes back
  (`reviewStatus`, `reviewNote`, `reviewedAt`) so the politician can see whether
  the platform verified them.
- Meetings: read-only, cursor-paginated listing filtered by search text, status
  and a scheduled-date range, plus detail by `_id`.
- Posts: cursor-paginated listing filtered by search text, status, tag and a
  publish-date range, plus detail, create, edit and bulk remove. Every write is
  pushed to the `oroltsooadmin` mirror.
- Pushes every profile create/update/remove to the `oroltsooadmin` plugin as an
  HMAC-signed webhook, following the `block` → `blockadmin` mirror pattern.

## Architecture

| Area          | Path                                                       | Responsibility                                     |
| ------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| Bootstrap     | `src/main.ts`                                              | `startPlugin` on port `33018`, registers permissions |
| Models        | `src/connectionResolvers.ts`                               | Binds `Profile` to the `oroltsoo_profiles` model    |
| Types         | `src/modules/profile/@types/profile.ts`                    | Document, sub-document and list-param interfaces    |
| Schema        | `src/modules/profile/db/definitions/profile.ts`            | Mongoose schema and sub-schemas                     |
| Model class   | `src/modules/profile/db/models/Profile.ts`                 | Validation, normalization and CRUD statics          |
| GraphQL SDL   | `src/modules/profile/graphql/schemas/profile.ts`           | Types, inputs, queries, mutations                   |
| Resolvers     | `src/modules/profile/graphql/resolvers/**`                 | Permission checks, filter building, custom fields   |
| Agent tools   | `src/modules/profile/trpc/profile.ts`                      | Annotated, bounded read procedures                  |
| Permissions   | `src/meta/permissions.ts`                                  | `oroltsooProfile` module actions                    |
| Normalize     | `src/utils/normalize.ts`                                   | `trim`, `toDate`, `clampOptional` shared by the models |
| Constants     | `src/constants.ts`                                         | Profile, promise, bill and meeting status enums     |
| Meetings      | `src/modules/meeting/**`                                   | Meeting schema, model, read-only GraphQL API        |
| Posts         | `src/modules/post/**`                                      | Post schema, model, GraphQL API, admin sync         |
| Admin sync    | `src/utils/adminSync.ts`                                   | HMAC-signed fire-and-forget webhook sender          |
| Webhook in    | `src/routes/**`, `src/middlewares/**`, `src/modules/profile/routes/webhook.ts` | Signed `syncReviewStatus` receiver |

## Contracts

### Provides

- HTTP `POST /webhook/syncReviewStatus` — body
  `{ subdomain, payload: { entityId, data: { input: { reviewStatus, reviewNote, reviewedAt } } } }`,
  signed `X-Signature: sha256=<hmac>`. Only `oroltsooadmin` calls it.
- GraphQL query: `oroltsooProfileInfo` (no arguments).
- GraphQL mutation: `oroltsooProfileUpdate(input)`.
- GraphQL queries: `oroltsooMeetings`, `oroltsooMeetingDetail`; type
  `OroltsooMeeting`. No meeting mutation is exposed.
- GraphQL queries: `oroltsooPosts`, `oroltsooPostDetail`; mutations
  `oroltsooPostAdd`, `oroltsooPostEdit`, `oroltsooPostRemove`; type
  `OroltsooPost`.
- GraphQL type: `OroltsooProfile` (federated `@key(fields: "_id")`) and its
  nested types/inputs.
- Permissions: `showOroltsooProfiles`/`manageOroltsooProfiles` under module
  `oroltsooProfile`, `showOroltsooMeetings` under `oroltsooMeeting`,
  `showOroltsooPosts`/`manageOroltsooPosts` under `oroltsooPost`, plus the `oroltsoo:admin` and `oroltsoo:viewer` default
  groups offered in Settings → Permissions.
- Agent tool: `oroltsooProfile.get`.
- One outbound webhook to `${OROLTSOO_ADMIN_API_URL}/webhook/syncProfile`,
  signed `X-Signature: sha256=<hmac>` over the exact JSON body
  `{ subdomain, payload }`, with
  `payload = { entityId, data: { input } }` where `input` is the whole profile
  without `_id`/`createdAt`/`updatedAt`.
- Outbound webhooks to `/webhook/syncPost` and `/webhook/removePost`, signed the
  same way.

### Consumes

- `erxes-api-shared/utils`: `startPlugin`, `cursorPaginate`, `escapeRegExp`,
  `mongooseStringRandomId`, `ExpectedError`, `GQL_CURSOR_PARAM_DEFS`,
  `apolloCommonTypes`, `ITRPCContext`.
- `erxes-api-shared/core-types`: `IMainContext`, `IPermissionConfig`,
  `ICursorPaginateParams`, `Resolver`.
- Env `OROLTSOO_ADMIN_API_URL` and `OROLTSOO_ADMIN_SECRET` for the admin mirror.
  The same secret verifies the inbound review webhook.

## Data and State

- Collections `oroltsoo_profiles`, `oroltsoo_meetings` and `oroltsoo_posts`,
  generated per
  `subdomain` through `generateModels`, so every read and write stays
  tenant-scoped.
- Indexes: `{ status, createdAt }` for the default list, `{ firstName, lastName }`
  for name lookups.
- Promises, meetings, reports and news links are embedded arrays without their
  own `_id`.
- No migrations.

## Local Invariants

- There is exactly one profile per tenant. Never add a create, list or delete
  operation; `getProfileInfo` is the only way to reach the record.
- `oroltsooProfileUpdate` writes a **whole** normalized profile. A field omitted
  from the input is cleared, so callers must submit the full record.
- `status` (draft/published/archived) and `reviewStatus` (pending/verified/
  rejected) are independent. `status` is the politician's own publish choice;
  `reviewStatus` is the platform's verification. Never derive one from the other.
- `reviewStatus`, `reviewNote` and `reviewedAt` are admin-owned. They are absent
  from `normalizeProfile`, so the editor's whole-document `$set` leaves them
  alone, and they are destructured out of the outbound `syncProfile` payload so
  a tenant echo cannot overwrite the administrator's decision. Keep both
  exclusions in place when adding fields.
- `firstName` is not required in the schema, because the auto-created draft has
  none yet, but `updateProfileInfo` rejects a blank name with `BAD_USER_INPUT`.
- Promise `progress` is always stored as an integer within 0–100; attendance
  rates are clamped to 0–100 and years to 1900–2200.
- Optional numbers use `clampOptional`, which returns `undefined` for a blank
  value so "not recorded" stays distinct from zero.
- The finance section stores only publicly declared pointers — declaration
  URLs, dates and amounts. Never store declaration documents themselves here.
- Operational records that grow over time — meetings today, citizen requests
  later — live in their own collection, never as an embedded array on the
  profile. The profile is rewritten wholesale on every save, so an embedded
  record written by anyone else would be silently erased.
- Meetings are deliberately **not** mirrored to `oroltsooadmin`; profiles and
  posts are.
- `Post.content` holds the serialized BlockNote document produced by the shared
  `Editor`, never HTML. Render it with `BlockEditorReadOnly`.
- A post update writes the whole document, so `publishedAt` round-trips through
  the editor. The model only stamps the very first publish, and reuses a date
  the post already earned rather than moving it.
- The meeting module is read-only by design. Never add a create/edit/remove
  mutation or model static here — meetings are authored on the public website,
  and a second writer would let this workspace overwrite what the site owns.
  A write path for the site is still missing; it belongs behind a
  client-portal-scoped entry point, not an internal mutation.
- Every query and mutation calls `checkPermission` before touching data.
- Agent-callable procedures stay read-only and bounded; never annotate a
  mutation here.
- Admin sync is fire-and-forget: a failed or unconfigured webhook logs and
  returns, and must never fail the user's mutation. A webhook fires only at the
  moment of the change — it never backfills, so a decision made while the
  channel was down stays unsynced until it is made again. `oroltsooadmin` holds a
  mirror, not the source of truth.
- Never import `oroltsooadmin_api` source. The signed webhook contract above is
  the only link between the two plugins, so any payload change must be shipped
  together with the receiver.
- The plugin listens on port `33018` — do not reuse a port already taken by
  another plugin's `main.ts`.
- Because this plugin declares permissions, core-ui hides its navigation entry
  from any non-owner whose permission groups grant no `oroltsoo` action
  (`hasPluginPermission`). Assign one of the default groups in
  Settings → Permissions before expecting the sidebar entry to appear.

## Validation

- `pnpm nx build oroltsoo_api`
- `pnpm nx docker-build oroltsoo_api` (the image the CI workflow publishes)
- Smoke: run `oroltsooProfileInfo` twice on a fresh tenant and confirm the same
  `_id` comes back with `status: "draft"`; then `oroltsooProfileUpdate` and
  confirm no second record is created.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-27` — Shared normalize helpers

- **Summary:** `trim`, `toDate` and `clampOptional` were duplicated across the
  profile and post models; they now live in one place.
- **Affected areas:** `src/utils/normalize.ts`,
  `src/modules/profile/db/models/Profile.ts`,
  `src/modules/post/db/models/Post.ts`
- **Contracts changed:** None.

### `2026-08-27` — Dockerfile and CI pipeline

- **Summary:** Added the runtime `Dockerfile` the `docker-build` target already
  referenced, and a GitHub Actions workflow that builds the plugin and pushes a
  multi-platform image on `main`.
- **Affected areas:** `Dockerfile`, `.github/workflows/ci-api-oroltsoo.yml`
- **Contracts changed:** None.

### `2026-08-27` — Surface failed webhook deliveries

- **Summary:** The webhook sender now logs a non-2xx response. `fetch` only
  rejects on a network failure, so a 404 or 401 from the receiver was being
  discarded silently and a drifting mirror gave no clue why.
- **Affected areas:** `src/utils/adminSync.ts`
- **Contracts changed:** None.

### `2026-08-26` — Review decision reaches the tenant

- **Summary:** `oroltsooadmin` now pushes its verify/reject decision back over a
  signed webhook, and the profile stores and exposes it read-only.
- **Affected areas:** `src/types.ts`, `src/middlewares/**`, `src/routes/**`,
  `src/modules/profile/routes/webhook.ts`,
  `src/modules/profile/{@types,db,graphql}/**`, `src/main.ts`,
  `src/constants.ts`
- **Contracts changed:** Added `POST /webhook/syncReviewStatus`, the read-only
  `reviewStatus`/`reviewNote`/`reviewedAt` fields on `OroltsooProfile`, and the
  `OROLTSOO_API_URL` environment variable on the admin side.

### `2026-08-26` — Posts module

- **Summary:** Added a posts module: BlockNote content, cover image, tags,
  draft/published/archived status, auto-stamped first publish, and a webhook
  push to the `oroltsooadmin` mirror on every write.
- **Affected areas:** `src/modules/post/**`, `src/connectionResolvers.ts`,
  `src/apollo/**`, `src/meta/permissions.ts`, `src/constants.ts`
- **Contracts changed:** Added `oroltsooPosts`, `oroltsooPostDetail`,
  `oroltsooPostAdd`, `oroltsooPostEdit`, `oroltsooPostRemove`, the
  `OroltsooPost` type/input, the `oroltsooPost` permission module and the
  `syncPost`/`removePost` outbound webhooks.

### `2026-08-26` — Meetings become read-only

- **Summary:** Meetings are authored on the public website, so this plugin now
  only reads them: the mutations, their resolvers and the write model statics
  were removed.
- **Affected areas:** `src/modules/meeting/**`, `src/apollo/**`,
  `src/meta/permissions.ts`
- **Contracts changed:** Removed `oroltsooMeetingAdd`, `oroltsooMeetingEdit`,
  `oroltsooMeetingRemove`, the `OroltsooMeetingInput` type and the
  `manageOroltsooMeetings` permission.

### `2026-08-26` — Meetings moved out of the profile

- **Summary:** The citizen meeting schedule became its own module and
  collection; the profile keeps only the two descriptive engagement texts.
- **Affected areas:** `src/modules/meeting/**`, `src/connectionResolvers.ts`,
  `src/apollo/**`, `src/meta/permissions.ts`, `src/constants.ts`,
  `src/modules/profile/**`
- **Contracts changed:** Removed `meetings` from `OroltsooProfile` and
  `OroltsooProfileInput` (so it no longer reaches the admin mirror); added
  `oroltsooMeetings`, `oroltsooMeetingDetail`, `oroltsooMeetingAdd`,
  `oroltsooMeetingEdit`, `oroltsooMeetingRemove`, the `OroltsooMeeting` type and
  the `oroltsooMeeting` permission module.

### `2026-08-26` — Single profile per workspace

- **Summary:** Collapsed the profile module from a directory of politicians to
  one record per tenant, auto-created on first read.
- **Affected areas:** `src/modules/profile/db/models/Profile.ts`,
  `src/modules/profile/db/definitions/profile.ts`,
  `src/modules/profile/graphql/**`, `src/modules/profile/trpc/profile.ts`
- **Contracts changed:** Replaced `oroltsooProfiles`/`oroltsooProfileDetail`
  with `oroltsooProfileInfo`, and `oroltsooProfileAdd`/`oroltsooProfileEdit`/
  `oroltsooProfileRemove` with `oroltsooProfileUpdate`; removed
  `OroltsooProfileListResponse`; replaced the `oroltsooProfile.find`/`findOne`
  agent tools with `oroltsooProfile.get`; stopped sending
  `/webhook/removeProfile`.

### `2026-08-26` — Mandate type, biography, bills, attendance, finance

- **Summary:** Added mandate type, structured education/career history,
  sponsored bills, attendance figures, and a finance block (asset and interest
  declarations, campaign expense, donations) to the profile record.
- **Affected areas:** `src/constants.ts`, `src/modules/profile/@types/profile.ts`,
  `src/modules/profile/db/definitions/profile.ts`,
  `src/modules/profile/db/models/Profile.ts`,
  `src/modules/profile/graphql/schemas/profile.ts`,
  `src/modules/profile/graphql/resolvers/customResolvers/profile.ts`,
  `src/apollo/resolvers/resolvers.ts`
- **Contracts changed:** `OroltsooProfile` and `OroltsooProfileInput` gained
  `mandateType`, `education`, `career`, `bills`, `attendance` and `finance`;
  added the `OroltsooProfileBill`, `OroltsooProfileDonation`,
  `OroltsooProfileFinance`, `OroltsooProfileAttendance`,
  `OroltsooProfileEducation` and `OroltsooProfileCareer` type/input families.
  The admin sync payload carries these fields, so `oroltsooadmin_api` must ship
  together with this change.

### `2026-08-26` — Admin mirror sync

- **Summary:** Profile create/update/remove now pushes an HMAC-signed webhook to
  `oroltsooadmin`, mirroring the `block` → `blockadmin` pattern.
- **Affected areas:** `src/utils/adminSync.ts`,
  `src/modules/profile/graphql/resolvers/mutations/profile.ts`
- **Contracts changed:** Added outbound `POST /webhook/syncProfile` and
  `POST /webhook/removeProfile` calls; added the `OROLTSOO_ADMIN_API_URL` and
  `OROLTSOO_ADMIN_SECRET` environment variables.

### `2026-08-26` — Default permission groups

- **Summary:** Added `oroltsoo:admin` and `oroltsoo:viewer` default permission
  groups so administrators can grant profile access in one step.
- **Affected areas:** `src/meta/permissions.ts`
- **Contracts changed:** Added two entries to `permissionDefaultGroups`.

### `2026-08-26` — Politician profile module

- **Summary:** Replaced the generated `profile` sample with a full politician
  profile record: schema, validation, permission-checked CRUD, cursor listing,
  computed fields and two agent read tools.
- **Affected areas:** `src/main.ts`, `src/constants.ts`,
  `src/connectionResolvers.ts`, `src/meta/permissions.ts`, `src/trpc/**`,
  `src/modules/profile/**`, `src/apollo/resolvers/resolvers.ts`
- **Contracts changed:** Added `oroltsooProfiles`, `oroltsooProfileDetail`,
  `oroltsooProfileAdd`, `oroltsooProfileEdit`, `oroltsooProfileRemove`, the
  `OroltsooProfile` type family, the `oroltsooProfile` permission module and the
  `oroltsooProfile` agent tools; removed the generated `getProfile`/`getProfiles`
  /`createProfile`/`updateProfile`/`removeProfile` operations, the `Profile`
  type and the unused `oroltsoo.hello` tRPC procedure. Port moved from `33010`
  to `33018`.
