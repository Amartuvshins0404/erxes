# `oroltsooadmin_api` Plugin Guide

## Identity

- **Plugin:** `oroltsooadmin`
- **Project:** `oroltsooadmin_api`
- **Layer:** `Backend API`
- **Path:** `backend/plugins/oroltsooadmin_api`
- **Last synchronized:** `2026-08-31`

## Scope

### Owns

- The central mirror of politician profiles received from `oroltsoo` tenants
  (`oroltsoo_admin_profiles`).
- Admin-side review state on each mirrored profile (`reviewStatus`,
  `reviewNote`).
- The central mirror of politician posts (`oroltsoo_admin_posts`).
- The citizen meeting schedule (`oroltsoo_admin_meetings`). Unlike profiles and
  posts, meetings are **authored here** and pushed down to the tenant, so this
  service is their source of truth.
- The signed webhook receiver that keeps the mirror in sync. Each `oroltsoo`
  tenant owns exactly one profile, so the mirror holds one row per tenant.
- Read-only admin GraphQL queries over the mirror.
- The public client-portal read surface over the same mirror: the `cp*`
  queries a citizen-facing site calls to list politicians and their posts.

### Does not own

- The source profile record — that lives in `oroltsoo_api` and is edited there.
- Any create/update path for profile content. This service never authors
  profile fields; it only stores what a tenant sent.
- `oroltsoo_api` implementation — never import it; the signed webhook is the
  only link.
- Any client-portal write path. The `cp*` surface is read-only; a portal
  write would be erased by the tenant's next sync.
- Core, shared libraries, or another plugin.

## Current Capabilities

- Verifies `X-Signature` on every `/webhook` request with a timing-safe HMAC
  comparison before any model is touched.
- Resolves tenant models from the `subdomain` carried inside the signed body.
- Upserts a mirrored profile by `{ subdomain, entityId }`, so repeated webhooks
  are idempotent and a tenant edit never resets an administrator's decision.
- Cursor-paginated admin listing filtered by search text, tenant subdomain,
  review status, party, district and a `syncedAt` date range; plus detail read
  by `_id`.
- Verify and reject mutations that record a review decision with an optional
  note, and push it back to the originating tenant over a signed webhook.
- `fullName` and `promiseProgress` are computed on `OroltsooAdminProfile`;
  `totalDonations` is computed on `OroltsooAdminProfileFinance`.
- Mirrors the tenant's mandate type, education, career, bills, attendance and
  finance sub-documents verbatim.
- Client-portal queries (`forClientPortal`) that expose only published
  profiles and posts, offset-paginated, with `CpOroltsooProfile` and
  `CpOroltsooPost` projections that omit mirror bookkeeping and the private
  `reviewNote`.
- `cpGetOroltsooPosts` accepts `profileId` and resolves it to the author's
  `subdomain` through the profile mirror, so a portal can list one
  politician's posts without knowing tenant keys.
- Meetings: cursor-paginated admin listing filtered by search text, tenant
  subdomain, status and a scheduled-date range, plus detail, create, edit and
  bulk remove. A meeting is created against a tenant that already has a
  mirrored profile, and every write is pushed to that tenant.

## Architecture

| Area          | Path                                                     | Responsibility                                       |
| ------------- | -------------------------------------------------------- | ---------------------------------------------------- |
| Bootstrap     | `src/main.ts`                                            | `startPlugin` on port `33019`, mounts the webhook router |
| Webhook auth  | `src/middlewares/validationMiddleware.ts`                | Timing-safe HMAC check against `OROLTSOO_ADMIN_SECRET` |
| Tenant sync   | `src/utils/tenantSync.ts`                                | Signed fire-and-forget push back to a tenant         |
| Webhook ctx   | `src/middlewares/contextMiddleware.ts`                   | Loads tenant models from the body's `subdomain`      |
| Routes        | `src/routes/index.ts`, `src/modules/profile/routes/webhook.ts` | `/webhook/syncProfile`, `/webhook/removeProfile` |
| Models        | `src/connectionResolvers.ts`                             | Binds `Profile` to `oroltsoo_admin_profiles`         |
| Types         | `src/modules/profile/@types/profile.ts`                  | Sync input vs. mirrored-record interfaces            |
| Schema        | `src/modules/profile/db/definitions/profile.ts`          | Explicit `new Schema(...)` with mirror keys          |
| Model class   | `src/modules/profile/db/models/Profile.ts`               | Idempotent upsert, delete, review-status statics     |
| GraphQL SDL   | `src/modules/profile/graphql/schemas/profile.ts`         | Admin types, queries and review mutations            |
| Resolvers     | `src/modules/profile/graphql/resolvers/**`               | Filters, review decisions, computed fields           |
| Constants     | `src/constants.ts`                                       | Profile, promise and review status enums             |
| Webhook types | `src/types.ts`                                           | Typed webhook request/response shapes                |
| Client portal | `src/modules/clientportal/graphql/**`                    | Public `cp*` types, queries and computed fields      |
| Meetings      | `src/modules/meeting/**`                                 | Admin-authored schedule, model, GraphQL API, push    |

## Contracts

### Provides

- HTTP `POST /webhook/syncProfile` — body `{ subdomain, payload: { entityId, data: { input } } }`.
- HTTP `POST /webhook/syncPost` and `POST /webhook/removePost` — same envelope.
- Both require `X-Signature: sha256=<hmac-sha256 of the exact JSON body>`.
- GraphQL queries `oroltsooAdminProfiles`, `oroltsooAdminProfileDetail`,
  `oroltsooAdminPosts`, `oroltsooAdminPostDetail`; type `OroltsooAdminPost`.
- GraphQL mutations `oroltsooAdminProfileVerify`, `oroltsooAdminProfileReject`.
- GraphQL queries `oroltsooAdminMeetings`, `oroltsooAdminMeetingDetail`;
  mutations `oroltsooAdminMeetingAdd`, `oroltsooAdminMeetingEdit`,
  `oroltsooAdminMeetingRemove`; type `OroltsooAdminMeeting`.
- Outbound webhooks `POST /webhook/syncMeeting` and
  `POST /webhook/removeMeeting` to the tenant, signed the same way as the
  review push, with `payload.entityId` carrying this service's meeting `_id`.
- GraphQL type `OroltsooAdminProfile` (federated `@key(fields: "_id")`) and
  `OroltsooAdminProfileListResponse`.
- Client-portal GraphQL queries `cpGetOroltsooProfiles`,
  `cpGetOroltsooProfile`, `cpGetOroltsooPosts`, `cpGetOroltsooPost`; types
  `CpOroltsooProfile` and `CpOroltsooPost`. No client-portal mutation.

### Consumes

- `erxes-api-shared/utils`: `startPlugin`, `cursorPaginate`, `paginate`,
  `escapeRegExp`, `mongooseStringRandomId`, `ExpectedError`, `markResolvers`,
  `GQL_CURSOR_PARAM_DEFS`, `GQL_OFFSET_PARAM_DEFS`, `apolloCommonTypes`.
- `erxes-api-shared/core-types`: `IMainContext`, `ICursorPaginateParams`,
  `IOffsetPaginateParams`, `Resolver`.
- The platform's client-portal context: `markResolvers` with
  `wrapperConfig.forClientPortal` makes a resolver public but requires the
  gateway-supplied `clientPortal` header context.
- Env `OROLTSOO_ADMIN_SECRET`, shared with every `oroltsoo` tenant in both
  directions, and `OROLTSOO_API_URL` (supports a `<subdomain>` placeholder) for
  the push back.

## Data and State

- Collections `oroltsoo_admin_profiles`, `oroltsoo_admin_posts` and
  `oroltsoo_admin_meetings`, generated per `subdomain` through
  `generateModels`. The two mirrors are keyed by `{ subdomain, entityId }` with
  a unique compound index; a meeting is authored here, so it carries only the
  owning `subdomain` and its own `_id`.
- Mirror keys `subdomain` + `entityId` carry a unique compound index; a second
  index covers `{ reviewStatus, syncedAt }` for the default admin list.
- `syncedAt` records when the last webhook landed.
- No migrations.

## Local Invariants

- Profile content fields are write-only from the webhook path. Never expose a
  GraphQL mutation that edits mirrored tenant fields — the tenant would
  overwrite it on its next sync.
- `syncProfile` seeds `reviewStatus` with `$setOnInsert` only, so a tenant edit
  never resets an administrator's verify/reject decision.
- Meetings run the opposite way to profiles and posts: this service writes, the
  tenant mirrors. Never accept a meeting over the webhook path, and never let a
  tenant edit reach `oroltsoo_admin_meetings` — a second writer would let a
  workspace overwrite the schedule the platform owns.
- A meeting write is only pushed to the tenant at the moment of the change.
  The push is fire-and-forget, so a delivery lost while the tenant was down
  stays unsynced until the meeting is saved again.
- `createMeeting` rejects a subdomain with no mirrored profile, so a typo can
  never produce a meeting no politician will ever see.
- The subdomain comes from the signed body, not the request host, because the
  webhook is service-to-service.
- Every `cp*` resolver is registered through `markResolvers(..., { wrapperConfig:
  { forClientPortal: true } })` and stays read-only, matching `blockadmin_api`.
  Never add a `cp*` mutation: the mirror is not the source of truth, so a
  portal write would be overwritten by the tenant's next `syncProfile`.
- The `cp*` surface is public. It must return only `status: 'published'`
  records, and `CpOroltsooProfile` must never carry `reviewNote`, `entityId` or
  `syncedAt`. Adding a field to `OroltsooAdminProfile` does not add it here —
  the portal projection is deliberately separate.
- A `cp*` list resolver returns `[]` for a filter that can never match (an
  unknown `profileId`, an unpublished author, an unknown `reviewStatus`) rather
  than dropping the filter and leaking the full list.
- Schemas are declared with explicit `new Schema(...)` fields. Do not adopt the
  local `schemaWrapper` helper that `blockadmin_api` uses.
- This plugin registers no `meta.permissions`, matching `blockadmin_api`. Adding
  permissions would make core-ui hide its navigation entry from every non-owner
  who lacks an `oroltsooadmin` action.
- The plugin listens on port `33019` — do not reuse a port already taken by
  another plugin's `main.ts`.

## Validation

- `pnpm nx build oroltsooadmin_api`
- `pnpm nx docker-build oroltsooadmin_api` (the image the CI workflow publishes)
- Smoke: create a profile in `oroltsoo`, then run `oroltsooAdminProfiles` here
  and confirm one record appears with `reviewStatus: "pending"`. Re-save the
  profile in `oroltsoo` and confirm no duplicate is created.
- Smoke: run `oroltsooAdminMeetingAdd` for a mirrored tenant, then
  `oroltsooMeetings` in that `oroltsoo` tenant and confirm the same meeting
  appears; edit it here and confirm the tenant row updates rather than
  duplicating.
- Smoke: with a `clientPortal` context, run `cpGetOroltsooProfiles` and confirm
  only published profiles come back and no `reviewNote` is selectable; without
  that context the query must fail with `Client portal required`.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-31` — Admin-owned meeting schedule

- **Summary:** Meetings are now created, edited and removed here and pushed to
  the owning `oroltsoo` tenant over the signed webhook channel.
- **Affected areas:** `src/modules/meeting/**`, `src/connectionResolvers.ts`,
  `src/constants.ts`, `src/apollo/**`
- **Contracts changed:** Added `oroltsooAdminMeetings`,
  `oroltsooAdminMeetingDetail`, `oroltsooAdminMeetingAdd`,
  `oroltsooAdminMeetingEdit`, `oroltsooAdminMeetingRemove`, the
  `OroltsooAdminMeeting` type and the outbound `POST /webhook/syncMeeting` and
  `POST /webhook/removeMeeting`.

### `2026-08-31` — Client-portal read surface

- **Summary:** Added a `clientportal` module exposing published mirrored
  profiles and posts to a citizen-facing site through `forClientPortal`
  queries, following `blockadmin_api`'s `cp*` pattern.
- **Affected areas:** `src/modules/clientportal/**`, `src/apollo/schema/schema.ts`,
  `src/apollo/resolvers/queries.ts`, `src/apollo/resolvers/resolvers.ts`
- **Contracts changed:** Added `cpGetOroltsooProfiles`, `cpGetOroltsooProfile`,
  `cpGetOroltsooPosts`, `cpGetOroltsooPost` and the `CpOroltsooProfile` /
  `CpOroltsooPost` types.

### `2026-08-27` — Dockerfile and CI pipeline

- **Summary:** Added the runtime `Dockerfile` the `docker-build` target already
  referenced, and a GitHub Actions workflow that builds the plugin and pushes a
  multi-platform image on `main`.
- **Affected areas:** `Dockerfile`, `.github/workflows/ci-api-oroltsooadmin.yml`
- **Contracts changed:** None.

### `2026-08-27` — Surface failed webhook deliveries

- **Summary:** The webhook sender now logs a non-2xx response. `fetch` only
  rejects on a network failure, so a 404 or 401 from the receiver was being
  discarded silently and a drifting mirror gave no clue why.
- **Affected areas:** `src/utils/tenantSync.ts`
- **Contracts changed:** None.

### `2026-08-26` — Push review decisions back to the tenant

- **Summary:** Verify and reject now notify the originating `oroltsoo` tenant
  over a signed webhook so the politician can see the badge.
- **Affected areas:** `src/utils/tenantSync.ts`,
  `src/modules/profile/graphql/resolvers/mutations/profile.ts`
- **Contracts changed:** Added outbound `POST /webhook/syncReviewStatus` and the
  `OROLTSOO_API_URL` environment variable.

### `2026-08-26` — Post mirror

- **Summary:** Added a mirror of politician posts, fed by signed webhooks and
  exposed through read-only admin queries.
- **Affected areas:** `src/modules/post/**`, `src/connectionResolvers.ts`,
  `src/routes/index.ts`, `src/apollo/**`, `src/constants.ts`
- **Contracts changed:** Added `POST /webhook/syncPost`,
  `POST /webhook/removePost`, `oroltsooAdminPosts`, `oroltsooAdminPostDetail`
  and the `OroltsooAdminPost` type.

### `2026-08-26` — Drop mirrored meetings

- **Summary:** `oroltsoo` moved the meeting schedule into its own tenant-local
  module, so the mirror no longer carries `meetings`.
- **Affected areas:** `src/modules/profile/@types/profile.ts`,
  `src/modules/profile/db/definitions/profile.ts`,
  `src/modules/profile/graphql/schemas/profile.ts`
- **Contracts changed:** Removed `meetings` from `OroltsooAdminProfile` and from
  the `/webhook/syncProfile` payload.

### `2026-08-26` — Last-synced date filter

- **Summary:** `oroltsooAdminProfiles` accepts a `syncedFrom`/`syncedTo` range so
  the admin list can be narrowed to recently mirrored profiles.
- **Affected areas:** `src/modules/profile/@types/profile.ts`,
  `src/modules/profile/graphql/schemas/profile.ts`,
  `src/modules/profile/graphql/resolvers/queries/profile.ts`
- **Contracts changed:** Added `syncedFrom` and `syncedTo` to
  `oroltsooAdminProfiles`.

### `2026-08-26` — Drop the remove receiver

- **Summary:** `oroltsoo` no longer deletes profiles — each tenant owns exactly
  one — so the unreachable `/webhook/removeProfile` endpoint and its model
  static were removed.
- **Affected areas:** `src/modules/profile/routes/webhook.ts`,
  `src/modules/profile/db/models/Profile.ts`
- **Contracts changed:** Removed `POST /webhook/removeProfile`.

### `2026-08-26` — Mirror mandate type, biography, bills, attendance, finance

- **Summary:** Extended the mirror schema and admin GraphQL surface with the
  fields `oroltsoo_api` now sends: mandate type, education, career, bills,
  attendance and finance.
- **Affected areas:** `src/constants.ts`, `src/modules/profile/@types/profile.ts`,
  `src/modules/profile/db/definitions/profile.ts`,
  `src/modules/profile/graphql/schemas/profile.ts`,
  `src/modules/profile/graphql/resolvers/customResolvers/profile.ts`,
  `src/apollo/resolvers/resolvers.ts`
- **Contracts changed:** `OroltsooAdminProfile` gained `mandateType`,
  `education`, `career`, `bills`, `attendance` and `finance`; added the matching
  `OroltsooAdminProfile*` sub-types. The `/webhook/syncProfile` payload now
  carries these fields.
