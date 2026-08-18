# event_ui — Plugin Rules

Admin panel for the members-club event platform. Pairs with
`backend/plugins/event_api` (port 33017). Dev server runs on **3015**.

## Scope of this plugin

Round 1 delivers the **Events vertical only**: the events list, the create/edit
form with its agenda editor, and the event detail sheet with the attendance
donut and CSV export.

Deliberately **not** here yet — do not stub them, and do not add nav entries for
them until they are actually built:

| Deferred | Why |
|---|---|
| Members page | Club fields (Компани / Албан тушаал / Салбар) are properties, and `core:cpUser` cannot store or filter them without `core-api` changes that are currently out of scope. |
| Send Invitation flow | Needs the member directory to resolve "all members". The backend `invitation` model already reserves `message` / `sentAt` / `sentBy`. |
| Announcements, Dashboard, Analytics, Settings | Not built this round. |

## Where things live

```
src/modules/events/{components,graphql,hooks}   the one feature module
src/pages/events/EventsPage.tsx                 route component
src/modules/Main.tsx                            <Routes>, named export
src/modules/MainNavigation.tsx                  sidebar entry
src/lib/                                        csv, datetime, constants
src/types/event.ts                              shared interfaces
src/widgets/automations/components/             AI agent automations widget (see below)
```

Aliases: `~/*` → `src`, `@/*` → `src/modules`.

## Non-negotiables that bite here

- **Named exports only**, including `Main.tsx` and everything listed in
  `module-federation.config.ts`. The host resolves remotes by trying
  `['default', PascalName, …]`, so `export const Main` works — do not "fix" a
  loading error by adding a default export.
- Exposes are `./config` (must export `CONFIG`) and `./event` (must match
  `CONFIG.name`). Renaming either breaks routing in `core-ui`.
- No `any`, no direct `@radix-ui/*` imports, no hand-rolled UI primitives.
- Every mutation shows a toast **and** refreshes the list. Mutations refetch the
  `Events` operation by name; keep that operation name if you touch the query.
- Deletes go through `useConfirm`.

## UI composition

Everything comes from `erxes-ui` / `ui-modules` — no raw `@radix-ui` imports, no
local primitives.

| Concern | Components |
|---|---|
| Filter bar | `Filter` compound: `Filter.Bar`, `Filter.Popover`, `Filter.Trigger`, `Filter.View`, `Filter.Item`, `Filter.CommandItem`, `Filter.CommandInput`, `Filter.BarItem`, `Filter.BarName`, `Filter.BarButton`, `Filter.Date`, `Filter.DateView`, `Filter.Dialog`, `Filter.DialogStringView`, `Filter.DialogDateView`, `Filter.SearchValueBarItem` |
| Table | `RecordTable.Provider / .CursorProvider / .Scroll / .Header / .Body / .RowList / .RowSkeleton / .InlineHead / .checkboxColumn`, `RecordTableInlineCell` |
| Sheets | `FocusSheet` — `.View` (has built-in `loading` / `error` / `notFound`), `.Header title description`, `.Content`; `Sheet.Footer` for actions. Not plain `Sheet`. |
| Forms | `FocusSheet` + `InfoCard` sections + `Form.Field / .Item / .Label / .Control / .Description / .Message` + `react-hook-form` + `zodResolver` |
| Date & time | `DatePicker` (date) + `TimeField` / `DateInput` (time) with `parseTime` from `@internationalized/date`. **Never** `<input type="date/time/datetime-local">`. `DateTimeField.tsx` pairs them over one ISO value. |
| Charts | `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` wrapping Recharts primitives — the shape `erxes-ui`'s own `chat-viz` uses |
| Map | `@vis.gl/react-google-maps` + `REACT_APP_GOOGLE_MAP_API_KEY` from `erxes-ui`, same as block's `GoogleMap`. Needs `"google.maps"` in `tsconfig.app.json` `types`. |
| Misc | `Alert`, `Empty`, `Badge`, `InfoCard`, `Table`, `Upload`, `Switch`, `Select`, `ScrollArea`, `Spinner`, `Dialog`, `CommandBar`, `useConfirm`, `useToast` |
| Icons | `@tabler/icons-react` only. Don't add `className="size-4"` inside a `Button` — `buttonVariants` already sets `[&>svg]:size-4`. |

Filter state lives in the URL. `Filter.Date` writes a **token** (`today`,
`2024-Aug`, `from,to`) — `useEvents` runs it through `parseDateRangeFromString`
before sending `startDateFrom` / `startDateTo` to the backend.

The Upcoming / Past / Draft `Tabs` sit inside `Filter.Bar`. `draft` is a status,
not a date range, so the hook maps that tab to `status` and the other two to the
backend's `EVENT_TAB` enum; an explicit status filter overrides the tab's.

## Form sections

`EventFormSheet` is a `FocusSheet` with a `FocusSheet.SideBar` of four sections —
General, Media, Location, Agenda — each its own component. Only the active
section renders, so `handleSubmit`'s invalid callback jumps to the section that
owns the first failing field (`SECTION_BY_FIELD`), and sections with errors show
a dot in the sidebar. Add a field → add it to `SECTION_BY_FIELD` too, or its
error will be invisible.

`location` is an object (`city`, `district`, `address`, `lat`, `lng`), not a
string. The form always submits it whole — the map's reverse geocoding merges
into the current value rather than replacing it, so a manually typed address
survives a pin move.

**Gotcha:** never spread a Mongoose subdocument (`{...event.location}`) — that
yields internal keys only and the update silently no-ops. Use `.toObject()`.

## Specifics worth knowing

- **Attendance colours** use `--success` / `--warning` / `--destructive` /
  `--muted-foreground`, not `--chart-N`. The chart palette is four shades of
  violet, which makes the four states indistinguishable.
- **Agenda times** are `HH:mm` strings, never `Date`s, so a slot cannot shift
  when the event is read in another timezone. `eventFormSchema.ts` mirrors the
  backend's overlap and ordering rules so the user sees errors before submitting.
- **CSV export** is generated client-side in `src/lib/csv.ts`; cells that could
  be read as formulas are prefixed so a pasted name starting with `=` cannot
  execute in Excel. A real `.xlsx` path would go through core's import-export.
- `tsconfig.json` intentionally omits `ignoreDeprecations: "6.0"`, which is
  invalid on TypeScript 5.7 and blocks `tsc --noEmit` in the sibling plugins.

## Validation

```bash
pnpm nx lint event_ui
pnpm nx build event_ui
pnpm exec tsc --noEmit -p frontend/private-plugins/event_ui/tsconfig.app.json
```

`tsc` reports pre-existing errors from `frontend/libs`; filter to
`private-plugins/event_ui` and keep that count at zero.

Note `.agents/scripts/validate-scaffold.sh` hardcodes `frontend/plugins/…` and
cannot see this plugin — the commands above are the validation.

## AI agent automations widget

`config.tsx`'s `modules[0]` (`name: 'event'`) sets `hasAutomation: true`, and
`module-federation.config.ts` exposes `./automationsWidget` →
`src/widgets/automations/components/AutomationRemoteEntry.tsx`. Together these
let core-ui's AI Agent settings panel load this plugin's remote and offer
"Events" as a selectable knowledge source — the same platform contract
`frontline_ui`'s knowledgebase module uses.

- `AutomationRemoteEntry.tsx` exports **named** `AutomationRemoteEntries`
  (no default export — `resolveRemoteComponent` on the host matches that
  literal name). It only handles `moduleName === 'event'`; there is no
  per-module dispatch table because this plugin integrates exactly one
  automations module.
- It routes `componentType: 'aiKnowledgeSourceSelector'` to
  `EventKnowledgeSourceSelector.tsx`, a `Command`-based picker that reuses the
  existing `EVENTS` query (`~/modules/events/graphql/queries`) filtered to
  `status: 'published'` — no new GraphQL operation was added.
- The backend half of this contract (`pluginName: 'event', moduleName:
  'event', key: 'event.event'`, `sourceSelector: 'remote-module'`) lives in
  `backend/plugins/event_api/src/meta/automations.ts` — see that plugin's
  `AGENTS.md` for the indexing/refresh details. The two `moduleName`s must
  stay in sync (`'event'`) or the picker never mounts.
- This plugin has no i18n setup (`react-i18next` is not wired up anywhere in
  `event_ui`), so the selector's copy is plain English, matching the rest of
  this plugin rather than the `useTranslation('automations')` pattern
  `frontline_ui`'s equivalent selector uses.
