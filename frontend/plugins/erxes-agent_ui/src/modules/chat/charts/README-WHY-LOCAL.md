# Why the chart renderer is bundled here (not imported from `erxes-ui`)

`erxes-ui` is a Module-Federation **shared singleton provided by the host
`core_ui`** (see the plugin's `module-federation.config.ts` `coreLibraries`).
At runtime the plugin uses whatever `erxes-ui` the host shell loaded — NOT the
version this plugin was built against. `erxes-ui`'s `package.json` version is a
static `1.0.0`, so MF cannot tell two builds apart and always serves the host's
copy.

The `charts` module (`EChart`, `chartSpecToEChartsOption`, `parseChartViz`, …)
was added to `erxes-ui` in 3.0.45. Hosts running an older `core_ui` (e.g.
officenext was on 3.0.44) provide an `erxes-ui` **without** those exports, so
`import { EChart } from 'erxes-ui'` resolved to `undefined` → `<undefined/>` →
React error #130 → the whole agent console crashed when opening a chart.

Crucially, **no published `erxes-next-ui` (core_ui) image contains the chart
code** — it is built from the public `erxes/erxes` repo, while the charts module
lives in `erxes-private`. So the host cannot provide it by redeploy alone.

**Fix:** render charts from code bundled INTO this plugin. `echarts` /
`echarts-for-react` are NOT in `coreLibraries`, so importing them here bundles
them into the plugin chunk — making charts work against ANY `core_ui` version
and immune to this host/plugin skew going forward.

**Keep in sync:** these files are copies of
`frontend/libs/erxes-ui/src/modules/charts/*` and
`backend/plugins/erxes-agent_api/src/mastra/charts/echartsOption.ts`. The mapper
must stay behavior-identical across all three so a chart looks the same in chat,
in the Preview panel, and inside generated PDFs/DOCX/XLSX.
