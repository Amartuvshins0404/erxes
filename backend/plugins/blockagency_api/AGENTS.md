# `blockagency_api` Plugin Guide

## Identity

- **Plugin:** `blockagency`
- **Project:** `blockagency_api`
- **Layer:** `Backend API`
- **Path:** `backend/plugins/blockagency_api`
- **Last synchronized:** `2026-08-24`

## Scope

### Owns

- The agency profile record of a tenant: identity (`logo`, `coverImage`),
  documents, contact info, introduction, operation area, fields of expertise,
  social links, messenger integration binding, and verification status.
- Property listings owned by the agency.
- Agency members and their profiles.
- Unit assignments between a block unit and an agency/member.
- Outbound synchronization of every agency mutation to the block-admin service.

### Does not own

- The verification decision itself. `blockadmin_api` decides, this plugin
  records the decision it receives on the signed webhook.
- Units and projects. Only the assignment record lives here.
- File storage. Uploads go through the core `/upload-file` endpoint; this
  plugin stores the resulting `Attachment` values.
- Users. `User` is a federated `@key(fields: "_id")` stub resolved by core.

## Current Capabilities

- `getAgencyInfo` creates the tenant's single agency document on first read, so
  the profile page always has a record to edit. Creating it also seeds the
  tenant's erxes owners as its `admin` members, so an agency is never left
  without one.
- `updateAgencyInfo` patches any subset of profile fields and is mirrored to
  block-admin by `wrapMutationResolver`. It requires the `agencyUpdate`
  permission, as the two agency reads require `agencyRead`.
- Attachment fields (`logo`, `coverImage`, `documents`) are stored as
  `Attachment` subdocuments and normalized on read, so records written before
  the migration — which held plain url strings — still resolve.
- Verification status changes arrive on the HMAC-signed webhook and are pushed
  to the UI through the `blockAgencyVerificationStatusChanged` subscription.
- Listing, member, and unit-assignment CRUD with cursor pagination.
- Member mutations resolve the member's core user and write the resulting
  snapshot back onto the mutation arguments (`args.members` on create,
  `args.member` on update/profile-update), so block-admin's mirror receives the
  full member record plus a `user` summary it could not resolve itself.
- tRPC procedures for reading agencies and upserting unit assignments. None are
  annotated with `.meta({ agent })`, so none are agent-callable.

## Architecture

| Area                | Path                                     | Responsibility                                                        |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| Bootstrap           | `src/main.ts`                            | `startPlugin` — name `blockagency`, port `33015`, subscriptions, tRPC  |
| Models              | `src/connectionResolvers.ts`             | Subdomain-scoped models `BlockAgency`, `BlockListing`, `BlockAgencyMember`, `BlockUnitAssignment` |
| Schema aggregation  | `src/apollo/schema/schema.ts`            | Merges per-module types, queries, mutations                            |
| Custom resolvers    | `src/apollo/resolvers/resolvers.ts`      | Field resolvers per graphql type                                       |
| Agency module       | `src/modules/agency/`                    | Profile model, schema, resolvers, attachment normalizers, webhook      |
| Listing module      | `src/modules/listing/`                   | Listing model, schema, resolvers, webhook routes                       |
| Member module       | `src/modules/member/`                    | Member model, schema, resolvers, permission config, `utils.ts` core-user resolution for the block-admin mirror |
| Unit module         | `src/modules/unit/`                      | Unit queries/mutations built on unit assignments                       |
| Unit assignment     | `src/modules/unit-assignment/`           | `block_agency_unit_assignments` schema and model                       |
| Block-admin bridge  | `src/modules/admin/utils.ts`             | `wrapMutationResolver` + HMAC-signed outbound webhook                  |
| Webhook auth        | `src/middlewares/validationMiddleware.ts`| Verifies `X-Signature` against `BLOCK_ADMIN_SECRET`                    |

## Contracts

### Provides

- GraphQL queries: `getAgencyInfo`, `getAgencies`,
  `getAgencyVerificationStatus`, `blockGetListing`, `blockGetListings`,
  `blockGetListingStats`, `blockAgentGetMember`, `blockAgentGetMembers`,
  `blockAgentGetMembersTotalCount`, `blockAgentGetMemberProfile`,
  `blockAgencyGetUnits`, `blockAgencyGetUnitsTotalCount`,
  `blockAgencyGetUnitStatusCounts`.
- GraphQL mutations: `updateAgencyInfo`, `updateAgencyVerificationStatus`,
  `blockCreateListing`, `blockUpdateListingGeneralInfo`, `blockRemoveListing`,
  `blockAgentCreateMember`, `blockAgentUpdateMember`, `blockAgentRemoveMember`,
  `blockAgentUpdateMemberProfile`, `blockAgencyAssignUnitToMember`,
  `blockAgencyUpdateUnitStatus`, `blockAgencyRemoveUnit`.
- Subscription `blockAgencyVerificationStatusChanged`.
- Inbound webhooks under `/webhook`, all signature-verified:
  `updateAgencyVerificationStatus`, `updateListingStatus`, `removeListing`.
- tRPC router: `agency.getAgencies`, `agency.getAgencyById`, `unit.assign`.
- Permission config for the `blockagency` plugin (`src/modules/member/permissions.ts`).

### Consumes

- `erxes-api-shared/utils` (`startPlugin`, `cursorPaginate`, `graphqlPubsub`,
  `apolloCommonTypes`, `getSubdomain`) and `erxes-api-shared/core-types`.
- `erxes-api-shared/core-modules` `attachmentSchema` for attachment fields.
- The shared `Attachment` / `AttachmentInput` graphql types, injected through
  `apolloCommonTypes`.
- block-admin over HTTP: `BLOCK_ADMIN_API_URL` + `BLOCK_ADMIN_SECRET`.

## Data and State

- Collections: `block_agencies`, `block_listing`, `block_agencies_members`,
  `block_agency_unit_assignments`. Every model is generated from the request
  subdomain; there is one agency document per tenant.
- `logo` and `coverImage` are `attachmentSchema` subdocuments, `documents` and
  the member `certificatePhotos` are arrays of them. Documents written before
  the migration still hold plain url strings; nothing rewrites them in place.
- No migration scripts exist in this plugin.

## Local Invariants

- Attachment fields must be read through `.lean()` and resolved by the
  `BlockAgency` / `BlockMember` custom resolvers. A hydrated mongoose document
  drops a legacy string value on cast, and `Attachment.url` is non-nullable, so
  an unnormalized string surfaces as `Cannot return null for non-nullable field
  Attachment.url`.
- `normalizeAttachment` / `normalizeAttachments` in `src/modules/agency/utils.ts`
  are the only place that accepts the legacy string shape. Never widen the
  graphql schema or the mongoose schema back to `String`.
- Every mutation exposed through `resolvers.Mutation` is wrapped by
  `wrapMutationResolver` and mirrored to block-admin. Any new field added to
  `AgencyInput` reaches `blockadmin_api` unchanged, so both sides must agree on
  its shape.
- `wrapMutationResolver` forwards only the mutation *arguments* plus the result
  `_id` (and the whole array when a resolver returns one) — a single-object
  result body never reaches block-admin. Anything the mirror needs must be
  written onto `args`, the way `blockCreateListing` sets `input.agent` and the
  member mutations set `args.member`/`args.members`.
- A tenant owns exactly one agency document, and
  `src/modules/agency/utils.ts#ensureTenantAgency` is the only place that
  resolves or creates it. Every creation path goes through it, because creating
  the agency is also what seeds the owners; never call `BlockAgency.create`
  directly. It returns a lean document, which agency reads require anyway.
- `agencyId` is never taken from the client on a self-service path:
  `blockAgentUpdateMemberProfile` overwrites `input.agencyId` with the tenant's
  agency, and `blockAgentCreateMember` falls back to it when the optional
  `agencyId` argument is omitted. A member row without `agencyId` is invisible
  to `blockAgentGetMembers(agencyId)` and to block-admin's agency-scoped agent
  lists, so it must never be created.
- `blockAgentUpdateMemberProfile` edits only the fields a member owns about
  themselves (description, location, social links, certificates). `role` and
  `agencyId` are dropped from its input on purpose — role changes belong to
  `blockAgentUpdateMember`, or a member could promote themselves to `admin`.
- The erxes permission group (`memberCreate`/`memberUpdate`/`memberRemove`) and
  the agency `role` are different questions: the group says what a user may do
  in the org, the role says what they are inside this agency. Every member
  management mutation checks both — `checkPermissionGroup` first, then
  `assertAgencyAdmin`. A plain `member` holding the org permission must still be
  refused.
- The tenant owner (`user.isOwner`) is always treated as an agency admin, the
  same way core treats `isOwner` as holding every permission. The check must
  come before the stored role is read, or an owner whose row says `member` could
  not repair their own agency.
- Owners are resolved from core with `users.find({ isOwner: true })`. There is
  no `roles` tRPC module in core — addressing one returns the default value, so
  the lookup silently finds nobody.
- `ensureOwnerMembership` runs on the member reads and repairs the owner's row
  (`role: 'admin'`) for agencies created before owners were seeded. It writes
  only when something actually changes, because it sits on a read path.
- Owner seeding runs outside `wrapMutationResolver`, so it notifies block-admin
  itself through `sendBlockAdminMessage` on the same `blockAgentCreateMember`
  path the mutation uses. Any other write that happens outside a mutation must
  do the same or block-admin will silently miss it.
- A member's core user lives in this tenant only. Block-admin cannot resolve it,
  so `src/modules/member/utils.ts` denormalizes `{_id, firstName, lastName,
  avatar, email}` into every mirrored member payload. Keep that shape in sync
  with `blockadmin_api`'s `BlockAdminAgentUser`.
- The `blockagency:agency` default group is named `Blockagency Agent` and holds
  `member` permissions only. Its `id` must stay `blockagency:agency`: a user is
  linked to a default group by id (`user.permissionGroupIds`), and the id is
  resolved live against this config, so renaming it would leave every already
  assigned user matching nothing and silently holding no permissions. The
  agency profile and agency dashboard nav entries are gated by
  `Can module="agency"` in `blockagency_ui`, which passes on *any* action in the
  `agency` module, so granting that group even `agencyRead` puts both pages back
  in its sidebar. Agency-module actions belong to `blockagency:admin`.
- Default groups are not stored per tenant: `currentUserPermissions` and
  `canGroup` read them live out of this plugin's config by id (`plugin:group`),
  so editing `src/modules/member/permissions.ts` changes what every user already
  assigned to that group can do as soon as the plugin restarts — no migration,
  and no way to keep an old grant for existing users.
- Every `agency` module resolver enforces its declared permission:
  `getAgencyInfo` and `getAgencyVerificationStatus` require `agencyRead`,
  `updateAgencyInfo` requires `agencyUpdate`, each after `checkLogin`. Without
  that, hiding a page from a permission group would only remove the sidebar
  entry while the query still answered anyone. `getAgencyInfo` also creates the
  agency and seeds owners, so the permission gate sits in front of a write —
  internal callers must keep using `ensureTenantAgency` directly, never the
  resolver.
- `listing` and `unit` resolvers call `checkLogin` only: the plugin declares no
  permission module for either, so there is no action to check yet. Anything
  finer-grained there needs new actions in `src/modules/member/permissions.ts`
  plus a decision about which default groups receive them — do not invent one
  silently.
- Inbound webhook routes stay behind `validationMiddleware`.
- tRPC procedures stay unannotated unless the procedure is deliberately made
  agent-callable with a permission this plugin registers.

## Validation

- `pnpm nx lint blockagency_api`
- `pnpm nx build blockagency_api`
- Smoke: open the agency profile in `blockagency_ui`, upload a logo and a
  document, reload, and confirm both render and that `getAgencyInfo` returns no
  `Attachment.url` errors for an agency created before the migration.
- Smoke: assign a non-owner team member only the `Blockagency Agency` group and
  confirm the sidebar shows `profile`/`listing`/`units` but neither `agency
  profile` nor `dashboard`, while a `Blockagency Admin` user still sees both.
- Smoke: as that same `Blockagency Agency` user, call `getAgencyInfo` and
  `updateAgencyInfo` directly against the gateway and confirm both fail with
  `Permission required` (`FORBIDDEN`), and that an anonymous call to
  `blockGetListings` fails with `Login required`.

`project.json` defines no `test` target, so `pnpm nx test blockagency_api` does
not apply.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-24` — Agency permissions enforced, listing/unit require login

- **Summary:** `getAgencyInfo`/`getAgencyVerificationStatus` now check
  `agencyRead` and `updateAgencyInfo` checks `agencyUpdate` (all behind
  `checkLogin`), so the declared agency permissions are actually enforced
  instead of being advisory; every `listing` and `unit` resolver gained
  `checkLogin`, which were previously reachable without any session.
- **Affected areas:** `src/modules/agency/graphql/resolvers/{queries,mutations}/agency.ts`,
  `src/modules/listing/graphql/resolvers/{queries,mutations}/listing.ts`,
  `src/modules/unit/graphql/resolvers/{queries,mutations}/unit.ts`
- **Contracts changed:** None in shape. `getAgencyInfo`,
  `getAgencyVerificationStatus`, and `updateAgencyInfo` now return `FORBIDDEN`
  for users without the matching agency action — including the
  `blockagency:agency` group — and every listing/unit operation returns
  `Login required` for anonymous callers.

### `2026-08-24` — `Blockagency Agent` group no longer sees the agency profile

- **Summary:** Removed the `agency` module block from the `blockagency:agency`
  default group, so users in it keep member access only; the agency profile and
  agency dashboard sidebar entries (both gated by `Can module="agency"`)
  disappear for them and stay with `blockagency:admin`. Renamed it to
  `Blockagency Agent` to match what it now grants, keeping the `id` unchanged so
  existing assignments survive.
- **Affected areas:** `src/modules/member/permissions.ts`
- **Contracts changed:** `blockagency:agency` no longer grants `agencyRead`,
  `agencyCreate`, or `agencyUpdate`, and its display name is now
  `Blockagency Agent`. Default groups resolve live from this config, so the
  change applies to everyone already in that group on restart.

### `2026-08-21` — Member `certificatePhotos` are attachments

- **Summary:** A member's certificate photos are stored as `Attachment`
  subdocuments instead of url strings, and the `BlockMember` custom resolvers —
  moved out of `apollo/resolvers/resolvers.ts` into the member module next to
  the agency ones — normalize rows written before the change.
- **Affected areas:** `src/modules/member/@types/member.ts`,
  `src/modules/member/db/definitions/member.ts`,
  `src/modules/member/graphql/schemas/member.ts`,
  `src/modules/member/graphql/resolvers/customResolvers/member.ts`,
  `src/apollo/resolvers/resolvers.ts`
- **Contracts changed:** `BlockMember.certificatePhotos` is now `[Attachment]`
  and `MemberInput.certificatePhotos` is `[AttachmentInput]`. The member payload
  mirrored to `blockadmin_api` carries the same shape.

### `2026-08-21` — Agency role enforced on member management

- **Summary:** Adding, editing, and removing members now require the acting user
  to be an agency `admin` (or the tenant owner) on top of the erxes permission
  group, so a plain member can no longer manage other members. Owner resolution
  moved from the non-existent core `roles` tRPC module to
  `users.find({ isOwner: true })` — the reason owner seeding never happened —
  and the member reads repair an owner's row to `admin` for agencies that
  predate seeding.
- **Affected areas:** `src/modules/member/utils.ts`,
  `src/modules/member/graphql/resolvers/mutations/member.ts`,
  `src/modules/member/graphql/resolvers/queries/member.ts`
- **Contracts changed:** None. `blockAgentCreateMember`,
  `blockAgentUpdateMember`, and `blockAgentRemoveMember` now return a
  `FORBIDDEN` error for non-admins.

### `2026-08-21` — Agency owners seeded as admins, member agency resolved server-side

- **Summary:** Creating the tenant's agency now seeds its erxes owners as
  `admin` members (mirrored to block-admin through the member webhook), and all
  agency creation paths funnel through the new `ensureTenantAgency`.
  `blockAgentUpdateMemberProfile` — which upserts the acting user's own row, so
  a first profile save could insert a member with no `agencyId`, invisible in
  the agency's member list and in block-admin's agents tab — now takes
  `agencyId` from that agency and ignores `role`/`agencyId` in its input;
  `blockAgentCreateMember` falls back to the same agency when its optional
  `agencyId` argument is omitted.
- **Affected areas:** `src/modules/agency/utils.ts`,
  `src/modules/agency/graphql/resolvers/{queries,mutations}/agency.ts`,
  `src/modules/member/utils.ts`,
  `src/modules/member/graphql/resolvers/mutations/member.ts`,
  `src/modules/admin/utils.ts`
- **Contracts changed:** None. `blockAgentCreateMember`'s `agencyId` argument
  stays optional but now defaults to the tenant's agency, and
  `MemberInput.role`/`MemberInput.agencyId` are ignored by
  `blockAgentUpdateMemberProfile`.

### `2026-08-21` — Mirror agency members to block-admin

- **Summary:** Member create/update/profile-update mutations now resolve the
  member's core user and attach the synced member snapshot to the mutation
  arguments, so `wrapMutationResolver`'s existing webhook carries everything
  block-admin needs to mirror the member into `block_admin_members`.
- **Affected areas:** `src/modules/member/utils.ts` (new),
  `src/modules/member/@types/member.ts`,
  `src/modules/member/graphql/resolvers/mutations/member.ts`,
  `src/modules/member/db/models/Member.ts`
- **Contracts changed:** None on the graphql surface. The outbound webhook
  payloads for `blockAgentCreateMember` / `blockAgentUpdateMember` /
  `blockAgentUpdateMemberProfile` now carry `data.members` / `data.member`
  including a `user` summary.

### `2026-08-20` — Store agency logo, cover image, and documents as attachments

- **Summary:** `logo`, `coverImage`, and `documents` moved from plain url
  strings to `Attachment` values in the mongoose schema, the graphql schema, and
  the agency input, with read-time normalization so pre-migration records keep
  resolving.
- **Affected areas:** `src/modules/agency/@types/agency.ts`,
  `src/modules/agency/db/definitions/agency.ts`,
  `src/modules/agency/graphql/schemas/agency.ts`,
  `src/modules/agency/graphql/resolvers/customResolvers/agency.ts`,
  `src/modules/agency/graphql/resolvers/queries/agency.ts`,
  `src/modules/agency/utils.ts`
- **Contracts changed:** `BlockAgency.logo`, `BlockAgency.coverImage`, and
  `BlockAgency.documents` are now `Attachment` / `[Attachment]`;
  `AgencyInput.logo`, `AgencyInput.coverImage`, and `AgencyInput.documents` are
  now `AttachmentInput` / `[AttachmentInput]`.
