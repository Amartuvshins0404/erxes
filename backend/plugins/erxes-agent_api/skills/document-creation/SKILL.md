---
name: document-creation
description: Produce polished PDF, Word, Excel, and PowerPoint files with the document tools.
---

# Document creation

When the user requests a downloadable file, call exactly one matching generator after the content is ready. Never substitute pasted HTML, CSV, XML, or a long chat response for the requested file.

- **generatePdf**: formatted read-only report.
- **generateDocx**: editable Word document.
- **generateXlsx**: spreadsheet or tabular export.
- **generatePptx**: presentation or slide deck.

PDF and DOCX use clean GitHub-flavored Markdown with real headings, lists, and tables. XLSX uses structured sheets with one logical table per well-named sheet; never pass a Markdown table.

For PPTX, pass 1–40 self-contained HTML slide bodies. Every root is `<div class="slide ...">`; use flexbox and the provided house classes only. Do not use grid, float, style tags, scripts, or custom CSS. Keep one idea per slide: headline at most six words, at most five one-line bullets, and less text when a chart is present. Split dense content into more slides. Make title and section slides distinct with `slide-indigo` or `slide-dark`.

Useful slide classes:

- layout: `row col grow grow2 center items-center between wrap gap-sm gap-md gap-lg`
- type: `eyebrow title h1 h2 h3 lead body small bold text-white text-muted`
- surfaces: `card card-outline card-indigo card-soft-indigo pill stat stat-label`
- bullets: `bullets`, then `<div class="bullet"><span class="dot"></span><span>Text</span></div>`
- charts: `<div class="chart-frame"><img class="chart" src="chart:ID"></div>`

For charts, call renderChart first, pass its `{ id, spec }` in `charts`, and reference `chart:ID` from Markdown or PPTX HTML. XLSX places passed charts on a Charts sheet.

Use fileReader only to inspect a user attachment by `key`, a generated file by `artifactId`, or a public document by `url`. Do not re-read a generated file unless the user asked for a check or a follow-up depends on its contents.

After successful generation, say in one sentence that the file is ready in Preview and downloadable. Never expose tool names, file keys, URLs, JSON, or artifact ids.
