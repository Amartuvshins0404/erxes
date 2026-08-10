# Upstream patch — normalize dashed plugin names in the automations builder

**Target repo:** `erxes/erxes` (public monorepo) — these files are mirrored into
`erxes-private` and MUST NOT be edited here (they are overwritten on merge).

**Patch file:** [`automations-dash-plugin-normalization.patch`](./automations-dash-plugin-normalization.patch)
Apply in an `erxes/erxes` checkout with:

```bash
git apply automations-dash-plugin-normalization.patch
```

## Problem

Any automation action/trigger contributed by a plugin whose name contains a
dash (today only **`erxes-agent`**) renders as **"Plugin erxes-agent disabled"**
in the automations builder, even though the plugin is installed, enabled, and
its chat works.

## Root cause

Module-federation container names can't contain dashes, so `core-api`'s
`/get-frontend-plugins` maps the plugin name to underscores:

```js
// backend/core-api/src/modules/organization/routes.ts
const remoteName = (p) => `${p.replace(/-/g, '_')}_ui`;   // erxes-agent -> erxes_agent_ui
```

Consequently the UI config is stored with `name: 'erxes_agent'` and the runtime
remote is `erxes_agent_ui`. But the **automation node type** keeps the real
dashed service name (`erxes-agent:workflow.workflows.create`), because that
prefix is the backend service id used to route the action RPC — it cannot
change.

`RenderPluginsComponentWrapper` / `useAutomationsRemoteModules` then use the raw
dashed `pluginName` **without normalizing**, so:

1. `useAutomationsRemoteModules('erxes-agent')` compares `CONFIG.name` (`'erxes_agent'`) against `'erxes-agent'` → no match → `isEnabled = false` → "disabled" fallback.
2. Even past that gate, `loadRemote('erxes-agent_ui/automationsWidget')` would miss the real container `erxes_agent_ui`.

Non-dashed plugins (sales, frontline, loyalty, operation) are unaffected because
their name has no dash — which is why this only ever manifested on `erxes-agent`.

## Fix

Normalize `-` → `_` in the two automation call sites, mirroring the backend
`remoteName()`:

- `useAutomationsModules.ts` — normalize before the `CONFIG.name` match.
- `RenderPluginsComponentWrapper.tsx` — normalize when building the `_ui` remote container name.

The change is idempotent for already-underscore/dashless names, so it is safe
for every existing plugin. All wrapper call sites (action config, node content,
trigger content, history name/result) funnel through these two, so both dashed
and non-dashed plugins resolve correctly after the patch.

## Paired change (already in erxes-private, in scope)

The `erxes-agent_ui` plugin now ships the automations widget this patch loads:

- `frontend/plugins/erxes-agent_ui/module-federation.config.ts` — exposes `./automationsWidget`.
- `frontend/plugins/erxes-agent_ui/src/config.tsx` — `workflows` module marked `hasAutomation: true`.
- `frontend/plugins/erxes-agent_ui/src/widgets/automations/**` — the "Run agent workflow" action config form (workflow picker) + node summary.

**Until this upstream patch lands in the mirror, the widget will still show
"Plugin erxes-agent disabled"** — the plugin side is necessary but not
sufficient on its own.
