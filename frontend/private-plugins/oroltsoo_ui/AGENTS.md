# `oroltsoo_ui` Plugin Guide

## Identity

- **Plugin:** `oroltsoo`
- **Project:** `oroltsoo_ui`
- **Layer:** `Frontend UI`
- **Path:** `frontend/private-plugins/oroltsoo_ui`
- **Last synchronized:** `2026-08-27`

## Scope

### Owns

- The single `/oroltsoo/profile` route: profile banner, left sidebar tab
  navigation and the editable panel for the active tab.
- The politician profile data-entry form (six sections) and its Zod schema.
- The `/oroltsoo/posts` route: post list, filters and a create/edit sheet built
  on the shared `Editor`.
- The `/oroltsoo/meetings` route: a read-only view of the citizen meeting
  schedule, with its own search and status filter.
- Profile and meeting GraphQL documents and Apollo hooks.

### Does not own

- A settings surface — the plugin exposes no `oroltsooSettings` module.
- Widgets — `CONFIG.widgets` is unset and no widget entry is exposed.
- Any citizen-facing portal; these routes are the internal admin surface.
- The central review surface — that is `oroltsooadmin_ui`, which reads a mirror
  synced from this plugin's backend.

## Current Capabilities

- One profile per workspace, edited in place — no list, no create sheet, no
  delete.
- A verification badge in the banner (Хяналтад хүлээгдэж буй / Баталгаажсан /
  Татгалзсан) decided by `oroltsooadmin`, plus the rejection reason when there
  is one.
- A banner reading live form values (name, badges, position, party, district,
  term) so it reflects what is being typed before it is saved.
- Left sidebar navigation over six panels: Үндсэн мэдээлэл, Намтар,
  Үйл ажиллагаа, Мэдээлэл, Санхүү, Холбоо барих. The active panel is held in the
  `tab` query param. The two descriptive engagement texts live under
  Холбоо барих.
- Posts list with cover thumbnail, status badge, tags and excerpt; search and
  status filter; create/edit sheet with rich-text content, cover upload, tag
  input and publish date; delete with confirmation.
- Read-only meetings list with search, status filter and a "Цааш нь ачаалах"
  cursor page. Meetings are authored on the public website; the sub-header says
  so explicitly.
- Autosave: an edit is written 900 ms after the form settles, with an inline
  status line (Өөрчлөлт хийгдэж байна… / Хадгалж байна… / хадгалсан цаг /
  Хадгалагдаагүй). There is no Save button.
- Repeatable rows for promises, bills, education, career, meetings, reports,
  news links and donations.
- Mandate type select, attendance figures, and a finance tab covering asset and
  interest declarations, campaign expense and donations.
- Avatar and cover image upload via `Upload`.
- Loading and error feedback on the read path; save failures raise a toast,
  successes stay silent so autosave is not noisy.

## Architecture

| Area        | Path                                                | Responsibility                                  |
| ----------- | --------------------------------------------------- | ----------------------------------------------- |
| Plugin config | `src/config.tsx`                                  | Navigation group, module entry                  |
| Routes      | `src/modules/OroltsooMain.tsx`                      | `/` redirect, `profile`, `profile/:profileId`   |
| Navigation  | `src/modules/OroltsooNavigation.tsx`                | Sidebar link to `oroltsoo/profile`              |
| Pages       | `src/pages/profile/{IndexPage,DetailPage}.tsx`      | Page shells, header, sheet wiring               |
| GraphQL     | `src/modules/profile/graphql/**`                    | `OroltsooProfiles*` documents                   |
| Hooks       | `src/modules/profile/hooks/**`                      | List, detail, add, edit, remove                 |
| Shared      | `src/modules/shared/**`                             | `useCursorList` and the date/money formatters   |
| Shell       | `src/modules/profile/components/ProfileEditor.tsx`  | Form provider, banner, sidebar, active panel, autosave |
| Save status | `src/modules/profile/components/ProfileSaveStatus.tsx` | Inline autosave state line                  |
| Banner      | `src/modules/profile/components/ProfileHeader.tsx`  | Live identity summary from form values          |
| Navigation  | `src/modules/profile/components/ProfileSidebar.tsx` and `constants/profileTabs.ts` | Panel switching via the `tab` query param |
| Panels      | `src/modules/profile/components/form/**`            | One section component per tab                   |
| Posts       | `src/modules/post/**`, `src/pages/post/IndexPage.tsx` | Post list, filters and form sheet             |
| Meetings    | `src/modules/meeting/**`, `src/pages/meeting/IndexPage.tsx` | Read-only meeting list and filters      |
| Schema      | `src/modules/profile/constants/profileFormSchema.ts`| Zod validation                                  |
| Mapping     | `src/modules/profile/utils/profileFormValues.ts`    | Profile ↔ form ↔ GraphQL input                  |

## Contracts

### Provides

- Module Federation exposes: `./config`, `./oroltsoo`.
- Routes `/oroltsoo/profile`, `/oroltsoo/posts` and `/oroltsoo/meetings`.
- Query param `tab` selects the active profile panel.

### Consumes

- `erxes-ui`: `RecordTable`, `Form`, `Sheet`, `Tabs`, `Select`, `Input`,
  `Textarea`, `DatePicker`, `Upload`, `Empty`, `CommandBar`, `Badge`, `Avatar`,
  `Popover`, `Command`, `Combobox`, `Spinner`, `useToast`, `useConfirm`,
  `useQueryState`, `useRecordTableCursor`, `mergeCursorData`, `readImage`.
- `ui-modules`: `PageHeader`.
- Backend `oroltsoo_api` GraphQL operations listed in its plugin guide.

## Data and State

- Apollo Client is the only server-state store; no Jotai atoms are defined here.
- The active tab lives in the `tab` query param; everything else is React Hook
  Form state.
- Saving relies on Apollo normalization of the returned `OroltsooProfile`, so no
  refetch is needed.
- The form is never reset from the server after mount. A save clears the dirty
  flag with `reset(values, { keepDirtyValues: true })`, which preserves anything
  typed while the request was in flight.

## Local Invariants

- All user-facing copy is hard-coded Mongolian. Translation namespaces are
  served from `backend/gateway/src/locales`, which is outside this plugin's
  write boundary, so do not introduce `useTranslation` here without that
  repository-level change.
- There is exactly one profile. Never reintroduce a list, create or delete
  surface for it.
- `status` and `reviewStatus` are different things and both appear in the
  banner: `status` is the politician's own publish choice and is editable;
  `reviewStatus` is the platform's verification, is read from the saved record
  rather than the form, and must never be added to the form schema.
- Records that accumulate over time belong in their own module, not as a
  `useFieldArray` on the profile: the profile autosaves the whole document, so
  an embedded collection is both unpaginatable and unsafe to share with another
  writer. Meetings moved out for exactly this reason.
- Post content is the shared `Editor`'s serialized BlockNote JSON. Store it
  as-is; never convert it to HTML, and read it back with `BlockEditorReadOnly`.
- The meetings page is a read surface. `oroltsoo_api` exposes no meeting
  mutation, so never add an create/edit/delete control here.
- The form always submits the complete profile because the API replaces the
  whole document; keep `EMPTY_PROFILE_FORM_VALUES` and `toProfileFormValues` in
  sync with the schema whenever a field is added.
- Every panel shares one `useForm` instance in `ProfileEditor`, so one autosave
  commits edits made across all tabs at once. A new panel must be added to
  `profileTabs.ts` and rendered in `ProfileEditor`, never given its own form.
- Autosave gates on `profileFormSchema.safeParse`, not `form.trigger()`: the
  latter would mark every untouched field as errored on a barely-filled profile.
- The `form.watch` autosave subscription ignores callbacks with no `type`, which
  is how a programmatic `reset` reports itself — reacting to those would loop.
- Anything the autosave effect depends on must be referentially stable
  (`updateProfile` is memoized); an unstable dependency resubscribes the watcher
  and fires the unmount flush on every render.
- Field components accept only paths of the matching value type
  (`FieldPathByValue`); do not widen them with casts.
- Optional numbers use `ProfileOptionalNumberField`, which keeps a blank input
  as `null` rather than `0`, so "not recorded" stays distinct from zero.
- `ProfileOptionalSelectField` maps the empty value to a sentinel option,
  because Radix rejects a `Select.Item` with an empty string value.
- The finance tab collects only publicly declared pointers — URLs, dates and
  amounts. Never add an upload for declaration documents there.
- Dev server port is `3013`.
- Keep `module-federation.config.ts` exposes, `config.tsx` paths and the routes
  in `OroltsooMain.tsx` aligned.

## Validation

- `pnpm nx lint oroltsoo_ui`
- `pnpm nx build oroltsoo_ui`
- Smoke: open `/oroltsoo/profile` on a fresh workspace, confirm an empty draft
  loads, type a name and watch the banner update, wait for the status line to
  read the saved time, reload and confirm the value persisted.
- Smoke: verify the profile in `oroltsooadmin`, reload `/oroltsoo/profile` and
  confirm the Баталгаажсан badge appears next to the unchanged Ноорог badge.
- Smoke: open `/oroltsoo/meetings`, confirm the empty state explains that
  meetings come from the website, then insert one server-side and confirm it
  lists, searches and filters.

## Recent Changes

<!-- Newest first. Keep at most 10 entries. -->

### `2026-08-27` — Shared cursor hook and formatters

- **Summary:** `usePosts` and `useMeetings` were identical apart from names, so
  both now wrap one generic `useCursorList`; the three copies of `formatDate`
  collapsed into `shared/utils/format`.
- **Affected areas:** `src/modules/shared/**`,
  `src/modules/post/hooks/usePosts.ts`,
  `src/modules/meeting/hooks/useMeetings.ts`,
  `src/modules/{post,meeting,profile}/components/**`
- **Contracts changed:** None.

### `2026-08-27` — CI pipeline

- **Summary:** Added a GitHub Actions workflow that builds the remote and syncs
  `dist/frontend/private-plugins/oroltsoo_ui` to Cloudflare R2.
- **Affected areas:** `.github/workflows/ci-ui-oroltsoo.yml`
- **Contracts changed:** None.

### `2026-08-27` — Moved under `private-plugins`

- **Summary:** The project moved from `frontend/plugins/oroltsoo_ui` to
  `frontend/private-plugins/oroltsoo_ui`, alongside the other private UI plugins.
- **Affected areas:** `project.json`, `tsconfig.json`, `AGENTS.md`
- **Contracts changed:** None. The Nx project name, module-federation remote
  name, routes and dev port are unchanged; only the build output moved to
  `dist/frontend/private-plugins/oroltsoo_ui`.

### `2026-08-26` — Verification badge

- **Summary:** The banner now shows the review decision pushed back by
  `oroltsooadmin`, and the rejection reason when the profile was rejected.
- **Affected areas:** `src/modules/profile/types/profile.ts`,
  `src/modules/profile/constants/profileConstants.ts`,
  `src/modules/profile/graphql/queries/profileQueries.ts`,
  `src/modules/profile/components/ProfileHeader.tsx`
- **Contracts changed:** The profile query now selects `reviewStatus`,
  `reviewNote` and `reviewedAt`.

### `2026-08-26` — Posts page

- **Summary:** Added `/oroltsoo/posts`: a list with search and status filter,
  and a sheet for writing posts with the shared rich-text `Editor`, cover
  upload, tags and publish date.
- **Affected areas:** `src/modules/post/**`, `src/pages/post/IndexPage.tsx`,
  `src/modules/Oroltsoo{Main,Navigation}.tsx`, `src/config.tsx`
- **Contracts changed:** Route `/oroltsoo/posts` added.

### `2026-08-26` — Meetings page becomes read-only

- **Summary:** Meetings are created on the public website, so the add button,
  form sheet, edit and delete controls were removed; the page now only lists,
  searches and filters.
- **Affected areas:** `src/modules/meeting/**`, `src/pages/meeting/IndexPage.tsx`
- **Contracts changed:** Dropped the meeting mutation documents.

### `2026-08-26` — Meetings moved to their own page

- **Summary:** The Иргэдтэй харилцах tab is gone: its two descriptive texts moved
  into Холбоо барих, and the meeting schedule became `/oroltsoo/meetings` with a
  list, filters and an add/edit sheet.
- **Affected areas:** `src/modules/meeting/**`, `src/pages/meeting/IndexPage.tsx`,
  `src/modules/Oroltsoo{Main,Navigation}.tsx`, `src/config.tsx`,
  `src/modules/profile/**`
- **Contracts changed:** Route `/oroltsoo/meetings` added; profile documents no
  longer select or send `meetings`.

### `2026-08-26` — Autosave instead of a Save button

- **Summary:** Edits now save themselves 900 ms after the form settles, with an
  inline status line replacing the Save button.
- **Affected areas:** `src/modules/profile/components/ProfileEditor.tsx`,
  `src/modules/profile/components/ProfileSaveStatus.tsx`,
  `src/modules/profile/hooks/useProfileInfo.ts`
- **Contracts changed:** None.

### `2026-08-26` — Single profile with sidebar navigation

- **Summary:** Replaced the list, record table and create/edit sheet with one
  in-place editor: a live banner, a left sidebar of panels, and a single Save.
- **Affected areas:** `src/modules/profile/components/**`,
  `src/modules/profile/constants/profileTabs.ts`,
  `src/modules/profile/hooks/useProfileInfo.ts`,
  `src/modules/profile/graphql/**`, `src/pages/profile/IndexPage.tsx`,
  `src/modules/Oroltsoo{Main,Navigation}.tsx`
- **Contracts changed:** Route `/oroltsoo/profile/:profileId` removed; documents
  now use `oroltsooProfileInfo` and `oroltsooProfileUpdate`.

### `2026-08-26` — Mandate type, biography, bills, attendance, finance

- **Summary:** Added the Намтар and Санхүү tabs, a mandate-type select, a bills
  editor and attendance figures, plus matching detail-page sections.
- **Affected areas:** `src/modules/profile/types/profile.ts`,
  `src/modules/profile/constants/**`, `src/modules/profile/utils/profileFormValues.ts`,
  `src/modules/profile/graphql/queries/profileQueries.ts`,
  `src/modules/profile/components/form/**`,
  `src/modules/profile/components/ProfileFormSheet.tsx`,
  `src/modules/profile/components/detail/**`
- **Contracts changed:** The profile query and mutation documents now select and
  send `mandateType`, `education`, `career`, `bills`, `attendance` and `finance`.

### `2026-08-26` — Politician profile list, form and detail page

- **Summary:** Replaced the generated placeholder page with a working profile
  module: record table with filters and bulk delete, a five-tab create/edit
  sheet, and a detail page laid out by section.
- **Affected areas:** `src/config.tsx`, `src/modules/Oroltsoo{Main,Navigation}.tsx`,
  `src/modules/profile/**`, `src/pages/profile/**`,
  `module-federation.config.ts`, `project.json`
- **Contracts changed:** Removed the `./oroltsooSettings` and `./widgets`
  exposes together with `CONFIG.settingsNavigation`; module path moved from
  `profile` to `oroltsoo/profile`; dev port moved from `3005` to `3013`.
