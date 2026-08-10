# `event_api` Plugin Guide

## Identity

- **Plugin:** `event`
- **Project:** `event_api`
- **Layer:** `Backend API`
- **Path:** `backend/plugins/event_api`
- **Last synchronized:** `2026-08-05` (attendance-aware knowledge doc)

## Scope

### Owns

- Members-club event data: `Event` (with embedded `agenda[]` slots and
  location/online details) and `SavedEvent` bookmarks.
- Event attendance: `Invitation` (one row per `eventId` + `cpUserId`,
  `status` pending/going/maybe/declined).
- Admin GraphQL surface (`events`, `eventsAdd/Edit/Remove`,
  `eventAttendanceSummary`, `eventInvitations`) and a client-portal surface
  (`cpEvents`, `cpEventDetail`, `cpEventRespond`, `cpEventToggleSave`,
  `cpEventAttendees`) marked `forClientPortal + cpUserRequired`.
- A tRPC `event` router (`find`, `findPublished`) for other services to read
  events without a GraphQL round trip.
- AI knowledge-source integration for published events (see Contracts).

### Does not own

- Member directory / club profile fields (Компани, Албан тушаал, Салбар) —
  deferred; would need `core:cpUser` changes out of this plugin's scope.
- Client-portal identity, login, profile, or notifications — those stay in
  core; this plugin proxies none of them.
- Send-Invitation flows, announcements, dashboard, analytics — not built yet.

## Current Capabilities

- Admin CRUD for events with an embedded agenda editor's backend
  (`EventAgendas.replaceForEvent` swaps the whole agenda atomically).
- Cursor-paginated event listing with `searchValue`, `status`, `tab`
  (`upcoming`/`past`/`invited`/`joined`), owner and date-range filters.
- Attendance: `Invitations.respond` upserts by `(eventId, cpUserId)` so
  repeat taps never duplicate; capacity is enforced only on the transition
  into `going`.
- `cpEventAttendees` mirrors the admin attendee list but 404s unless the
  event is `PUBLISHED` and server-side clamps `status` to `going`/`maybe`.
- Published events (agenda, location, capacity, and live attendance/seats
  remaining with an explanation of the no-deadline, capacity-gated RSVP rule)
  are indexed as AI agent knowledge: `eventsAdd`/`eventsEdit`/`eventsRemove`
  **and** `cpEventRespond` each enqueue a refresh job for that event's
  knowledge-source id, and the automations service can batch-load event
  documents by id on demand.

## Architecture

| Area                | Path                                                | Responsibility                                            |
| -------------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| Event model          | `src/modules/event/db/models/Events.ts`             | CRUD, list/filter, `getEvent`                              |
| Event agenda model   | `src/modules/event/db/models/EventAgendas.ts`       | Per-event agenda slots, replaced as a whole on save         |
| Saved events model   | `src/modules/event/db/models/SavedEvents.ts`        | Member bookmarks                                            |
| Event GraphQL        | `src/modules/event/graphql/**`                      | Admin + `cp*` queries/mutations, `Event` custom resolvers    |
| Event AI knowledge    | `src/modules/event/meta/automations.ts`             | `EVENT_KNOWLEDGE_SOURCE_KEY`, event→`TKnowledgeDocument`, `loadAiKnowledgeDocumentBatch` |
| Invitation model     | `src/modules/invitation/db/models/Invitations.ts`   | Attendance rows, capacity checks, attendance summary         |
| Invitation GraphQL   | `src/modules/invitation/graphql/**`                 | Admin + `cp*` queries/mutations                              |
| Plugin automations   | `src/meta/automations.ts`                           | Wires `event` module's knowledge provider into `startPlugin`'s `automations` config |
| Permissions          | `src/meta/permissions.ts`                           | `event`/`invitation` modules, default groups                 |
| Notifications        | `src/meta/notifications.ts`                         | `newEvent`, `eventReminder` event types                      |
| tRPC                 | `src/trpc/init-trpc.ts`                             | `event.find`, `event.findPublished` for service-to-service reads |

## Contracts

### Provides

- GraphQL admin: `events`, `eventDetail`, `eventsAdd`, `eventsEdit`,
  `eventsRemove`, `eventInvitations`, `eventAttendanceSummary`.
- GraphQL client portal (`forClientPortal + cpUserRequired`): `cpEvents`,
  `cpEventDetail`, `cpEventSavedEvents`, `cpEventAttendees`,
  `cpEventToggleSave`, `cpEventRespond`.
- Federation: `Event.owner` resolves `{ __typename: 'User', _id: ownerId }`;
  `__resolveReference` on `Event`.
- tRPC: `event.find(query)`, `event.findPublished(limit)`.
- AI agent knowledge source (`erxes-api-shared/core-modules` automations
  contract): registers `{ pluginName: 'event', moduleName: 'event', key:
  'event.event' }` with `sourceSelector: 'remote-module'` in
  `automations.constants.ai.knowledgeSources`, and implements
  `loadAiKnowledgeDocumentBatch` (only `status: PUBLISHED` events are
  indexed; each document's content includes description, date range,
  location/online link, live going-count vs. capacity with the RSVP-rule
  wording, and agenda). `eventsAdd`/`eventsEdit`/`eventsRemove` **and**
  `cpEventRespond` call `refreshEventKnowledgeSource` (a thin wrapper around
  `enqueueAiKnowledgeSourceRefreshJob`, exported from
  `event/meta/automations.ts`) so an agent's index stays current — including
  the seats-remaining count — without a manual reindex.

### Consumes

- `erxes-api-shared/utils`: `startPlugin`, `mongooseStringRandomId`,
  `cursorPaginate`, `buildKnowledgeSourceType`,
  `enqueueAiKnowledgeSourceRefreshJob`, `markResolvers`.
- `erxes-api-shared/core-modules`: `AutomationConfigs`,
  `createCoreModuleProducerHandler`, `TAutomationProducers`,
  `TAutomationProducersInput`.
- `erxes-api-shared/core-types`: `IMainContext`, `ICursorPaginateParams`,
  `ICursorPaginateResult`, `Resolver`, `IPermissionConfig`.
- Core `User` type via Apollo Federation (`owner` field only).

## Data and State

- Mongo collections: `event_events`, `event_agendas`, `event_saved_events`,
  `event_invitations` — all tenant-scoped through the request `subdomain`
  (`generateModels(subdomain)`).
- No plugin-owned migrations yet.
- The AI knowledge index itself lives in the `automations` service's own
  store, reached only through the `loadAiKnowledgeDocumentBatch` /
  `enqueueAiKnowledgeSourceRefreshJob` contract — this plugin never writes to
  it directly.

## Local Invariants

- `EventAgendas.replaceForEvent` is the only way agenda rows change — it
  deletes and reinserts for a given `eventId`, so partial/duplicate agenda
  rows cannot accumulate.
- Only `status: EventStatus.PUBLISHED` events are ever surfaced to the AI
  knowledge index or to `cp*` queries; draft/cancelled events stay
  admin-only.
- `EVENT_KNOWLEDGE_SOURCE_KEY` (`'event.event'`) is the stable source key —
  changing it silently orphans any agent's existing selection and index.
- Knowledge-source refresh jobs are best-effort (`try/catch` + `console.error`
  in `refreshEventKnowledgeSource`) so a queue outage never fails an
  event mutation or an RSVP.
- Attendance is intentionally *not* excluded from the knowledge document
  despite changing frequently — the going-count/capacity numbers are what
  make "will I still get in" answerable. Any future call site that changes
  `Invitations` status for an event (beyond `cpEventRespond`) must also call
  `refreshEventKnowledgeSource`, or the indexed seats-remaining figure goes
  stale silently.

## Validation

- `pnpm nx lint event_api`
- `pnpm nx build event_api`
- No `test` target defined in `project.json` yet.
- Smoke: create an event with `status: published`, confirm an
  `enqueueAiKnowledgeSourceRefreshJob` call is queued (check the
  `automations` BullMQ queue), then select the "Events" knowledge source for
  an AI agent in core-ui and confirm the event appears in the picker.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-05` — Attendance/RSVP-rule content in the knowledge document

- **Summary:** The knowledge document now includes live going-count vs.
  capacity plus plain-language RSVP-rule wording (no deadline, first-come
  first-served on capacity), batch-fetched via one `Invitations.aggregate`
  per index batch instead of per-event queries; `cpEventRespond` now also
  triggers a refresh so this stays current on every RSVP, not just on event
  edits. `refreshEventKnowledgeSource` moved from `event.ts` mutations into
  `event/meta/automations.ts` (exported) so both `event.ts` and
  `invitation.ts` mutations can call the same helper.
- **Affected areas:** `src/modules/event/meta/automations.ts`,
  `src/modules/event/graphql/resolvers/mutations/event.ts`,
  `src/modules/invitation/graphql/resolvers/mutations/invitation.ts`.
- **Contracts changed:** None (same knowledge-source key/shape; the
  `loadAiKnowledgeDocumentBatch` response's document content changed, not its
  type).

### `2026-08-05` — Register events as an AI agent knowledge source

- **Summary:** Published events (with agenda, location, capacity) are now
  indexable as AI agent knowledge, matching the pattern frontline's
  knowledgebase module uses; `eventsAdd`/`eventsEdit`/`eventsRemove` keep the
  index fresh automatically.
- **Affected areas:** `src/modules/event/meta/automations.ts` (new),
  `src/meta/automations.ts` (new), `src/main.ts`,
  `src/modules/event/graphql/resolvers/mutations/event.ts`.
- **Contracts changed:** Added AI knowledge-source contract
  (`pluginName: 'event', moduleName: 'event', key: 'event.event'`,
  `sourceSelector: 'remote-module'`) and `loadAiKnowledgeDocumentBatch`.
