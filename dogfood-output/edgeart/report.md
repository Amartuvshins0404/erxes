# EdgeArt — Adversarial Artifact/Preview QA Report

**Agent under test:** Amaraa testaa
**Target:** http://localhost:3001/erxes-agent/chat
**Scope:** chart(ECharts) / diagram(Mermaid) / document(pdf/docx/xlsx/pptx) artifacts + preview pipeline
**Code refs:** frontend/plugins/erxes-agent_ui/src/modules/chat/{preview,charts,lib}
**IDs:** EDGEART-###

## Summary
**5 real defects** (3 high · 2 medium · 0 critical · 0 low) + 3 investigated-not-a-bug.

| ID | Severity | One-liner |
|----|----------|-----------|
| EDGEART-003 | high | Generated PDF silently drops emoji & corrupts CJK/Arabic (only Noto Sans embedded) |
| EDGEART-004 | high | Generated PPTX slides render emoji/CJK as tofu boxes (same font root cause) |
| EDGEART-007 | high | pptx decks lose Present mode + slide images permanently after reload (slides not persisted) |
| EDGEART-001 | medium | Failed tool call (`{error:true}` output) shows a green success ✓ in the run trace |
| EDGEART-005 | medium | Files panel stays empty for artifacts made this session until a reload |
| EDGEART-002 | — | Malformed Mermaid → graceful error (not a bug; low note: error detail truncated) |
| EDGEART-006 | — | Rapid artifact switching + reload handled gracefully (not a bug) |
| Attack #3 | — | Empty/degenerate artifacts rejected by backend `.min(1)` schemas (same path as 001) |

**Observation (out of pipeline scope):** the assigned agent's model (kimi-for-coding) twice claimed "the chart is ready" while the trace shows only a "Reasoning" step and **no `renderChart` call / no card** — a model tool-calling reliability issue, not a preview-pipeline defect, so not filed. The one time it *did* call `renderChart` (500 rows) drove EDGEART-001.

**Environment note:** file storage falls back to inline `data:` URLs here (`backend/.../mastra/files/persist.ts:54-63`), so downloads are same-origin and the `download` attribute works; the cross-origin `inline=true` download concern was therefore not reproducible in this env. All artifact downloads verified non-zero & correct type (attack #6 pass): PDF 8,275 B valid `%PDF`, PPTX 303,696 B valid PK/OOXML zip with 65 entries.

---

### EDGEART-001 — Failed tool call (`{error:true}` output) shows a green success ✓ in the run trace
**Severity:** medium
**Category:** functional / misleading status
**Kind:** chart (generalizes to ALL soft-error tool results)

**Repro:**
1. Open agent "Amaraa testaa", new chat.
2. Send: "Make a bar chart with 500 data points, labels Item 1 through Item 500 with random values. Use the chart artifact tool."
3. Agent calls `renderChart` with 500 `data` rows. The backend Zod schema caps `data` at 200.
4. The `renderChart` trace row renders a green **check** (✓, `text-success`) — looks like it succeeded.
5. Expand the row: RESPONSE is `{"error": true, "message": "Tool input validation failed for renderChart ... data: Array must contain at most 200 element(s)", "validationErrors": {...}}`. No artifact was produced; Files panel stays "No charts or documents yet."

**Root cause (code):**
- `lib/uiParts.ts:60` — `isError: state === 'output-error'`. The flag is ONLY true when the AI SDK marks the part `output-error` (a thrown tool). A validation failure is returned as a **normal successful output payload** `{error:true,...}`, so the SDK state is `output-available` and `isError` stays `false`.
- `components/ToolCallRow.tsx:45-49` — `pending ? null : call.isError ? <IconAlertCircle destructive> : settled ? <IconCheck text-success>`. Because `isError` is false and state is `output-available` (`settled`), the row shows the **green success check** for a call that actually failed.
- The UI never inspects `output.error`, so any tool that returns `{error:true}` as its result (input-validation failures, artifact-generation soft errors) is painted as a success. When the agent doesn't narrate the failure, the user has no signal at all except expanding the JSON.

**Evidence:** screenshots/chart500-rendered.png (agent explains the limit), screenshots/renderchart-expanded.png (REQUEST), screenshots/files-panel.png (Files empty despite ✓). Tool RESPONSE JSON captured above.

**Note (attack #1 huge-chart):** the backend schema `data.max(200)` means a chart artifact can never exceed 200 points, so the "500-point lag/blank" scenario is not reachable through `renderChart` — the request is rejected before any artifact is built.

### EDGEART-002 — Malformed Mermaid renders a graceful error (INVESTIGATED — not a bug)
**Severity:** n/a (working as intended) · one low note below
**Repro:** ask agent to `render-diagram` with invalid syntax (`graph TD; A--> ; B[[[ unclosed`). The backend `renderDiagramTool` (backend/.../mastra/tools/builtins.ts:286-310) passes `definition` through verbatim (no validation). The frontend `MermaidViewer` catches the compile failure (`preview/MermaidViewer.tsx:150-161`) and shows `phase='error'` → "Diagram syntax error: …" + a "Show source" `<details>` (MermaidViewer.tsx:198-213). Both the inline card and the opened Preview panel degrade gracefully — no crash, no white-screen. Evidence: screenshots/mermaid-invalid2.png.

**Low note:** the shown detail is truncated to just `Parse error on line 1:` (nothing after the colon) because `MermaidViewer.tsx:154` takes `err.message.replace(/^Error:\s*/i,'').split('\n')[0]` — Mermaid puts the actual error detail on the *following* lines, which are discarded. The error message is therefore uninformative; "Show source" is the only recourse.

### EDGEART-003 — Generated PDF silently drops emoji and corrupts CJK/Arabic (only Noto Sans embedded)
**Severity:** high
**Category:** data loss / i18n
**Kind:** document (pdf) — same root cause affects pptx slides (see EDGEART-004)

**Repro:**
1. Agent "Amaraa testaa", new chat.
2. Send: generate a one-page PDF whose body has four lines — Emoji `🎉🔥😀🚀❤️`, Chinese `中文测试文档`, Arabic `مرحبا بالعالم`, Cyrillic `Сайн байна уу`.
3. `generatePdf` succeeds (✓), auto-opens in the Preview panel, agent says "Your multi-language test PDF is ready."
4. The rendered PDF (and the downloaded bytes) contain:
   - **Emoji line: empty** — all 5 emoji dropped.
   - **Chinese: `-‡KÕ‡c`** — mojibake (CJK codepoints map to wrong Latin glyphs).
   - **Arabic: `‫('(ا‬-1E ED'9D`** — garbled, unshaped, wrong direction.
   - **Cyrillic control: `Сайн байна уу.`** — renders perfectly.

**Root cause (code):**
- `backend/.../mastra/documents/pdf.ts:23-35` registers a SINGLE font family "Noto Sans" with only `NotoSans-{Regular,Bold,Italic,BoldItalic}.ttf`. `NotoSans-Regular.ttf` covers Latin + Cyrillic + Greek only — **no CJK, no Arabic, no emoji glyphs** (the font dir at `mastra/documents/fonts/` contains only those 4 TTFs).
- `pdf.ts:56` forces `fontFamily: 'Noto Sans'` on the whole document. `@react-pdf/renderer` does no system-font fallback, so any codepoint absent from Noto Sans is dropped or mismapped. The module comment itself scopes the intent to "full Cyrillic coverage… Mongolian Cyrillic" — CJK/Arabic/emoji were never covered.
- The tool reports success and the agent asserts the content is present, so the loss is **silent** — no warning to the user that half the requested text is gone.

**Evidence:** screenshots/pdf-unicode.png (preview shows mojibake), screenshots/unicode-generated.pdf (decoded artifact; `pdftotext` output quoted above). Download integrity OK: artifact is a valid non-zero (8,275-byte) `data:application/pdf` (attack #6 pass for inline storage).

### EDGEART-004 — Generated PPTX slides render emoji & CJK as tofu boxes (server-side slide PNGs)
**Severity:** high
**Category:** data loss / i18n
**Kind:** document (pptx)

**Repro:**
1. Agent "Amaraa testaa", new chat.
2. Send: `generate-pptx` "Unicode Deck", 6 slides — slide 1 title `Emoji 🎉🔥🚀😀❤️`, slide 2 `Chinese 中文测试`, slide 3 `Arabic مرحبا بالعالم`, etc.
3. Deck generates (✓), auto-opens in Preview (SlideImageDeck).
4. Slide 1 shows "Emoji □□□□□□" (every emoji a tofu box); slide 2 shows "Chinese □□□□" (CJK as boxes). Cyrillic/Latin/numbers render fine.

**Root cause (code):**
- Slides are rendered **server-side** to PNGs by satori→resvg: `backend/.../mastra/documents/presentation/renderSlide.ts:353-365`. `satori(..., { fonts: getFonts() })` is given ONLY Noto Sans (`theme.ts:54-62`, same 4 Latin/Cyrillic TTFs as the PDF) with **no emoji/CJK fallback** (`loadAdditionalAsset` is not provided), and `Resvg(..., { font: { loadSystemFonts: false } })` (`renderSlide.ts:363`) explicitly disables OS font fallback. Any glyph outside Noto Sans → notdef box.
- `renderSlide.ts:320` forces `fontFamily = 'Noto Sans'` when unset, so slide text can't opt into another family even if one existed.
- Tool succeeds and the deck downloads fine — the glyph loss is silent.

**Evidence:** screenshots/pptx-deck.png. Artifact: PPTX · 303.7 KB (non-zero, valid — attack #6 pass). Same font-coverage root cause as EDGEART-003 (PDF); the fix (bundle Noto Sans CJK/Arabic + an emoji font, or enable system fallback) covers both.

### EDGEART-005 — Files panel stays "No charts or documents yet" for artifacts created during the live session (needs reload)
**Severity:** medium
**Category:** functional / stale state
**Kind:** all (chart/diagram/document)

**Repro:**
1. Agent "Amaraa testaa", open a thread whose persisted artifact list is currently empty.
2. In this session generate 3 artifacts (render-diagram → "Broken Mermaid Diagram", generatePdf → "Multi-language Test Document", generatePptx → "Unicode Deck"). Each renders an inline card successfully.
3. Click the **Files** button. Panel shows the empty state: "No charts or documents yet. Ask the agent to chart data or generate a report." — despite 3 artifacts existing in the thread. (screenshots/files-panel.png, files-list.png)
4. Reload the page, open **Files** again → now shows **"Files · 3"** with all three. (screenshots/files-after-reload.png)

**Root cause (code):**
- `hooks/useThreadArtifacts.ts:44-51` reads the artifacts via `useQuery(MASTRA_THREAD_ARTIFACTS, { variables:{threadId}, fetchPolicy:'cache-and-network' })`. When the thread loads with zero artifacts, `[]` is cached and this observer (mounted at `ChatPage.tsx:207`) stays active for the thread's lifetime.
- Creating an artifact happens through the chat SSE/tool-part stream into `chatStore`/messages — it never writes the new artifact into the Apollo `MASTRA_THREAD_ARTIFACTS` cache and never refetches it. A repo-wide search shows `MASTRA_THREAD_ARTIFACTS` has **no** `refetch`, `refetchQueries`, `writeQuery`, or `pollInterval` (the only "turn-end refetch" in the code targets the *threads list*, not artifacts). So the Files panel + fullscreen sidebar (both driven by `useThreadArtifacts`) keep serving the stale empty cache until a full reload re-initializes the observer.
- Consequence: the primary "Files" affordance for browsing generated artifacts is empty mid-session even though the artifacts exist and downloaded fine; only the inline chat cards expose them until reload.

**Evidence:** screenshots/files-panel.png & files-list.png (empty during session), screenshots/files-after-reload.png (Files · 3 after reload).

### EDGEART-006 — Lifecycle races: rapid artifact switching & reload (INVESTIGATED — handled gracefully)
**Severity:** n/a (working as intended)
- **Rapid switching:** in fullscreen (sidebar pinned), clicked pptx→pdf→mermaid→…×8 with no delay. Panel settled correctly on the final artifact (PDF fully rendered), no white-screen, no stuck spinner, and `errors`/`console` were clean. `preview/DocumentViewer.tsx:124-135` cancels the in-flight fetch (`cancelled` flag), destroys the prior viewer, clears `container.innerHTML`, and `URL.revokeObjectURL`s the blob on every effect teardown, so switching mid-render is safe. Evidence: screenshots/rapid-switch2.png.
- **Reload with an artifact open:** `previewStore` is in-memory (not persisted), so a reload starts with the panel closed and re-fetches the artifact list — no orphaned/throwing panel. (Also surfaced EDGEART-005.)
- **Delete conversation owning an open artifact:** NOT run — the only available thread pre-existed this session (contains other content), and deleting shared data violates the no-contamination rule. Code path: `ChatPage.tsx:198-200` runs `previewStore.close()` in an effect keyed on `[agentId, activeThreadId]`, so the bootstrap's re-selection of the next thread after a delete closes the preview.

### Attack #3 (empty/degenerate artifacts) — grounded in code, same soft-error path as EDGEART-001
Requesting a 0-row chart / 0-slide deck / empty workbook is **rejected by the backend schemas before any artifact is built**: chart `data` is `.min(1).max(200)` (backend/.../mastra/charts/chartSpec.ts:76-78), pptx `slides` `.min(1).max(40)` and xlsx `sheets` `.min(1).max(20)` (backend/.../mastra/tools/documentTools.ts:198-201,227-229). The failure returns the same `{error:true}` payload as EDGEART-001 → shown with a green ✓ in the trace, no artifact produced. No crash/blank; the degenerate-empty viewer states are unreachable via the tools.

### EDGEART-007 — pptx decks lose Present mode + slide images permanently after reload (slides not persisted)
**Severity:** high
**Category:** functional / data loss on persist
**Kind:** document (pptx)

**Repro:**
1. Agent "Amaraa testaa" → generate a pptx deck (e.g. the 6-slide "Unicode Deck").
2. Live: Preview panel shows a **Present** button and renders the deck via the pixel-faithful backend slide PNGs; subtitle shows the slide count; Present mode works (counter "1 / 6", thumbnails). (screenshots/pptx-deck.png, present-slide1.png)
3. **Reload the page.** Open Files → open the same "Unicode Deck".
4. The **Present button is gone**; the header only has Back / Download / Fullscreen. The Files subtitle is now "PPTX · 303.7 KB" (no "6 slides"). The deck still shows but is rendered by the fallback OOXML parser, not the backend slide images. (screenshots/pptx-after-reload.png)

**Root cause (code):**
- `backend/.../mastra/artifactStore.ts:28-35` — when recording a **document** artifact, `storeArtifact` writes only `{format, fileName, mimeType, fileKey, inline, size}` and **omits `slides` and `slideCount`**. (The chart branch stores `spec`, the diagram branch stores `definition`, but the pptx slide-image array is silently dropped.)
- `frontend/.../hooks/useThreadArtifacts.ts` `ArtifactRow` (≈lines 14-30) likewise has no `slides`/`slideCount` fields, matching the non-persistence; `normalizeArtifact` (`lib/artifactNormalize.ts:84-100`) therefore yields a deck with `slides: undefined`.
- Frontend gates that then fail: `preview/PreviewPanel.tsx:26-27` `canPresent` (needs `slides?.length`) → Present button hidden; `preview/DocumentViewer.tsx:55` (needs `slides?.length`) → falls from `SlideImageDeck` (exact backend PNGs) to the `@aiden0z/pptx-renderer` OOXML fallback; `PreviewPanel.tsx:29-32` `slideLabel` → empty, so the subtitle loses the slide count.
- Net: every persisted deck permanently loses Present mode and its high-fidelity rendering after the first reload — live-only features that silently vanish.

**Evidence:** screenshots/pptx-deck.png (live: Present present), screenshots/present-slide1.png (Present mode 1/6), screenshots/pptx-after-reload.png (after reload: no Present, fallback render).
