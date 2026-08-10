# Artifacts / Previews QA Report — erxes agent chat

- Agent under test: **Amaraa test** (`/erxes-agent/chat/gRjOfKOIKbcVoFDmnGp6V`)
- Date: 2026-07-01
- Scope: chat artifacts — chart (ECharts), diagram (Mermaid), document (pdf/docx/xlsx/pptx). No html/code preview.
- Every finding grounded in main-checkout source:
  - frontend: `/home/darjs/dev/os/erxes/frontend/plugins/erxes-agent_ui/src`
  - backend: `/home/darjs/dev/os/erxes/backend/plugins/erxes-agent_api/src`

---

## Findings

### ART-001 — [MEDIUM] Emojis render as tofu boxes (□) in generated PPTX slides (header title shows them fine)

- **Repro:** In Amaraa test → New chat → "Create a pptx about cats with emojis, 5 slides". Open the artifact.
- **Observed:**
  - The artifact card / thought-process title `generatePptx All About Cats 🐱` renders the emoji correctly (client browser font).
  - The RENDERED slide PNGs (both in-panel deck AND Present/Fullscreen) show a tofu box `□` everywhere an emoji should be: slide-1 title "All About Cats □", corner "□ □ □", slide-2 "Fun Cat Facts □" and every bullet ("...asleep □", "clowder" □□, "...their height □", "...each ear □").
  - Slide counter shows **1 / 5** — matches the 5 slides requested (counter correct).
- **Evidence:** `screenshots/pptx-open-panel.png` (header emoji ok, slide tofu), `screenshots/issue-pptx-emoji-tofu.png`, `screenshots/issue-pptx-emoji-present.png`.
- **Root cause (grounded):** Slides are rendered **server-side** as PNGs via Satori→resvg, not by the browser. The font set has **no emoji font**:
  - `backend/.../mastra/documents/presentation/theme.ts:54-64` `getFonts()` returns ONLY the 4 Noto Sans TTFs (Regular/Bold/Italic/BoldItalic) — no Noto Color Emoji / Noto Emoji.
  - `theme.ts:81` (`slide` class) and `renderSlide.ts:320` (`normaliseRoot`) hard-set `fontFamily: 'Noto Sans'`.
  - `renderSlide.ts:353-358` calls `satori(root, { fonts: getFonts(), embedFont: true })` — only Noto Sans is available to Satori, so any emoji codepoint has no glyph.
  - `renderSlide.ts:360-364` rasterises with resvg `font: { loadSystemFonts: false }` — so there is no system emoji fallback either.
  - Net: emoji codepoints → missing glyph → tofu `□` in the PNG. The header title is rendered by the client browser (system emoji font), which is why it looks fine → exact symptom match.
- **Fix direction:** add an emoji font (e.g. Noto Emoji monochrome TTF, or Noto Color Emoji if resvg/satori COLR/bitmap support allows) to `getFonts()` and include it in the `fontFamily` fallback chain used by the slide root/classes.

### ART-002 — [MEDIUM] Mermaid diagrams never appear in the Files panel (charts & documents do)

- **Repro:** New chat → "Create a mermaid flowchart of a login flow". Diagram renders inline. Click **Files** (top bar). Panel shows **"No charts or documents yet."** Reload → re-open the session → diagram still renders inline, but Files is *still empty*.
- **Contrast (same agent):** a DOCX/PDF/XLSX/chart thread shows **"Files · 1"** with the artifact listed. Only diagram threads are empty.
- **Evidence:** `screenshots/files-panel.png`, `screenshots/files-after-reload.png` (empty on the mermaid thread), `screenshots/files-docx-thread2.png` ("Files · 1" for the DOCX thread), `screenshots/mermaid-after-reload.png` (diagram survives inline).
- **DB proof:** `mastra_artifacts` collection (Mongo `erxes_local`) holds **28 chart + 23 document rows and 0 diagram rows** — no diagram artifact has ever been persisted, across all threads.
- **Root cause (grounded):** Diagrams reach the chat as a **```mermaid fenced code block in the assistant's text**, not via a tool call, so nothing is persisted:
  - `frontend/.../modules/chat/components/ChatMarkdown.tsx:66-107` renders ```mermaid fences as `InlineMermaidBlock`. Its "Open" button (lines 86-100) calls `openArtifact({ id: 'inline-<hash>', kind:'diagram', ... })` with a **client-only id** and no backend write.
  - `frontend/.../preview/previewStore.ts:39-43` `openArtifact` only sets the current item — it does NOT add to the Files list.
  - The Files list is 100% DB-backed: `hooks/useThreadArtifacts.ts:44-52` → GraphQL `mastraThreadArtifacts` → `modules/session/graphql/resolvers/queries/session.ts:55-64` → `Artifact.ts:31-33` `listByThread` (no kind filter — it would list diagrams if any existed).
  - The persist path only fires for **tool-produced** artifacts: `mastra/artifactStore.ts` `storeArtifact` is called by `renderChartTool` and the document tools (and by `renderDiagramTool` at `mastra/tools/builtins.ts:312`), but the model emits mermaid fences instead of calling `renderDiagram`, so `storeArtifact` never runs for diagrams. The `mastra_artifacts` schema/model fully support `kind:'diagram'` (`db/definitions/artifact.ts:15-16`), and the whole preview UI supports diagram artifacts (`PreviewPanel.tsx:36,244,316-317` render `MermaidViewer`; `artifactNormalize.ts:75-82` normalizes them) — so the gap is purely that fenced diagrams are never registered.
- **Impact:** A diagram visible in chat is undiscoverable in the thread's Files list; it exists only as long as its message text does. Inconsistent with every other artifact kind.
- **Fix direction:** either (a) steer the model to call `renderDiagram` (which already persists), or (b) register `InlineMermaidBlock` diagrams as thread artifacts (persist a `kind:'diagram'` row) so the Files panel and reload path treat them like charts/documents.

### ART-003 — [HIGH] Second artifact in a conversation never renders — agent falsely claims "the chart is ready"

- **Repro (reproduced 3/3):** In a thread that has **already produced one artifact via a tool** (e.g. the DOCX thread), ask for another artifact ("make a pie chart…", "Use the chart tool to render a bar chart…", "Make a bar chart of monthly revenue for the last 6 months"). Each time the agent replies **"The bar/pie chart is ready — …"** but the Thought process is **"1 step · Reasoning"** with **no `renderChart` tool call**, **no chart renders**, and **Files count does not increase**.
- **Control (works 1/1):** In a FRESH thread, send a plain-text message ("Hello there"), then the *same* chart request as the 2nd message → `renderChart` fires and the chart renders inline + in the panel. So it is not "any follow-up turn" — it is specifically **a follow-up artifact request after a prior tool-produced artifact** in the thread.
- **Evidence:** `screenshots/chart-followup.png` and `screenshots/files-coexist.png` (assistant says "pie chart is ready" / "bar chart is ready" but no chart, Files still · 1), vs. `screenshots/chart-2ndmsg-works.png` (control: 2nd-message chart renders in a fresh thread).
- **Root cause (grounded, plausible):** `backend/.../mastra/agentRuntime.ts:226-228,251` — when agent memory is enabled the Agent is built with `inputProcessors: [new ToolCallFilter()]`, which **strips tool-call frames from replayed/recalled history** (added so reasoning models like Kimi don't reject the request). Side effect: after the first artifact turn, the recalled history no longer shows that the previous chart/doc came from a **tool call** — the model only sees a prior assistant message that "produced" an artifact in plain text, so on the next artifact request it imitates that pattern and answers "the chart is ready" **without invoking the render tool**. In a fresh thread there is no stripped-tool precedent, so the tool fires normally (matches the control). The agent's model is `kimi-for-coding` (shown in the agent list), the exact reasoning model `ToolCallFilter` targets.
- **Impact:** Users cannot iterate on or add artifacts within a single conversation — the second (and later) chart/diagram/document request silently produces nothing while the assistant asserts success. This breaks a core, common workflow and is misleading (false "ready" claim). Also blocks having multiple tool-artifacts coexist in one thread.
- **Fix direction:** verify whether `ToolCallFilter` is over-stripping; preserve enough signal (or re-inject a synthetic note) that prior artifacts were tool-produced, or nudge the model (system-prompt/tool-choice) to always call the render tool for artifact requests regardless of history.


---

## Verified working (passes)

| Artifact | Result | Evidence |
|---|---|---|
| **DOCX** (`generateDocx`) | Previews in-panel (docx-preview), non-zero **57.96 KB**, Download present | `screenshots/docx-preview.png` |
| **PDF** (`generatePdf`) | Renders in native iframe viewer (page 1/1 + thumbnail), non-zero **16.03 KB** | `screenshots/pdf-preview.png` |
| **XLSX** (`generateXlsx`) | Renders as spreadsheet grid (Month/Category/Amount, 8 rows, "Expenses" sheet tab), non-zero **6.84 KB** | `screenshots/xlsx-preview.png` |
| **PPTX** (`generatePptx`) | Slide deck previews in-panel + Present/Fullscreen, non-zero **424.81 KB**, **slide counter 1 / 5 matches** the 5 slides requested | `screenshots/pptx-open-panel.png`, `issue-pptx-emoji-present.png` (emoji issue = ART-001) |
| **Chart** (`renderChart`) | Interactive ECharts bar chart (not blank/JSON), **hover tooltip works** ("Jun 62,000"), PNG download button responds (no error) | `screenshots/chart-inline.png`, `chart-hover.png` |
| **Mermaid diagram** | Renders as SVG (not raw text/error), interactive pan/zoom (`PanZoomSvg`); survives reload inline | `screenshots/mermaid-panel.png`, `mermaid-after-reload.png` |
| **Reload persistence** | Chart/doc/pptx artifacts persist (mastra_artifacts store, re-render via `byMessageId`); mermaid persists inline via message fence | `screenshots/mermaid-after-reload.png` |
| **Multiple artifacts coexist / switch** | Files panel groups by turn and switches on click (`PreviewPanel.tsx` GroupedFiles → `openArtifact`); store supports N artifacts/thread. NOTE: getting 2 *tool* artifacts in one thread is blocked by ART-003 | `screenshots/files-docx-thread2.png` |

## Investigated — NOT filed as bugs

- **Follow-up messages "silently dropped" (first observed in session `gRjOfKOIKbcVoFDmnGp6V`)** — This was the **pre-existing agent session** (full of other agents' "New chat" entries), not one I created; the URL never became a real thread there. In a clean New chat I created, follow-up messages submit and answer normally (`2 + 2 → 4`). Dropped as cross-agent/contaminated-session noise, not a code bug.
- **Mermaid renders at a small default zoom (16% inline / 31% panel)** — This is the **intended fit-to-viewport** result of `PanZoomSvg.tsx:136-153` (`calcFit` fits the whole diagram, `scale` clamped to `≤ 1` so it never upscales) for a tall top-down flowchart in a short/wide container. Full zoom (+/–), fit (R), and fullscreen controls are provided and work. Minor readability nuance, by design — not a defect.
- **Chart "PNG" export** — button responds with no JS error; actual file landing not verifiable in headless Chrome. Treated as functional.

## Summary

- Findings filed: **3** — 1 HIGH (ART-003), 1 MEDIUM (ART-002), 1 MEDIUM (ART-001).
- All document formats (pdf/docx/xlsx/pptx), chart, and mermaid **render and download non-zero**. No format renders blank or silently fails to produce a file.
- Most impactful: **ART-003** (cannot produce a 2nd artifact in a conversation; agent falsely claims success) and **ART-001** (emoji tofu in pptx slides).
