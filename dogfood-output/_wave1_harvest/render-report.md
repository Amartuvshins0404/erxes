# Dogfood Report: erxes AI Agent — Chat Message Rendering

| Field | Value |
|-------|-------|
| **Date** | 2026-07-01 |
| **App URL** | http://localhost:3001/erxes-agent/chat |
| **Session** | render (isolated headless) |
| **Scope** | Chat message rendering: markdown, code, tables, math, mixed/long content, light/dark |
| **Agent used** | "Amaraa testttt" (kimi-for-coding) |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| **Total** | **0** |

## Issues

### RENDER-001: Markdown heading levels (h1/h2/h3) render at identical 14px — no visual hierarchy

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | visual |
| **URL** | http://localhost:3001/erxes-agent/chat |
| **Repro Video** | N/A (static) |

**Description**

When the assistant returns markdown headings, all heading levels render at the SAME font-size as body text (14px). Computed styles captured live:

- `h1` → font-size **14px**, font-weight 700, margin 4px
- `h2` → font-size **14px**, font-weight 600, margin 4px
- `h3` → font-size **14px**, font-weight 600, margin 4px

Body text is also 14px. So `# Heading 1` looks the same size as a normal paragraph, and `h2` is visually indistinguishable from `h3` (both weight 600). Users get no document structure/hierarchy — headings are effectively just slightly-bold lines. Expected: decreasing sizes (e.g. h1 ~1.5em, h2 ~1.3em, h3 ~1.15em) so structure is scannable.

**Evidence**

![Headings all same size](screenshots/render-001-headings.png)
![Markdown render](screenshots/01-markdown-view.png)

---
### RENDER-002: Fenced code blocks have NO syntax highlighting despite showing a language label

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | visual |
| **URL** | http://localhost:3001/erxes-agent/chat |
| **Repro Video** | N/A (static) |

**Description**

A ```` ```python ```` fenced block renders with a "python" language label in the header bar, which sets the expectation of syntax highlighting — but the code is rendered as a single monochrome color. Live DOM inspection of the `<code>` element:

- `code.children.length` = **0** (no token `<span>`s at all)
- distinct text colors inside the block = **1** (everything one gray)

Keywords (`def`, `for`, `if`, `return`, `not`), strings (`"USD"`), comments (`# ...`), and numbers all share one color. For a coding-focused agent (model `kimi-for-coding`), unhighlighted code hurts readability. Expected: tokenized highlighting (e.g. Shiki/Prism/highlight.js) to match the advertised language.

**Notes verified (NOT bugs):**
- Copy-code button: present, top-right of header, reveals on hover (`opacity-0 group-hover/code:opacity-100`), and **works** — clicking it copied the full 702-char block via `navigator.clipboard.writeText`. ✓
- Long-line overflow: `pre` has `overflow-x:auto`, `white-space:pre`, `scrollWidth 1536 > clientWidth 690` → horizontal scroll works, code stays inside the bubble (no bleed). ✓

**Evidence**

![No syntax highlighting](screenshots/render-002-nohighlight.png)
![Code block](screenshots/02-code-view.png)

---
### RENDER-003: LaTeX math is not rendered — shown as raw `$...$` / `$$...$$` source

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | functional |
| **URL** | http://localhost:3001/erxes-agent/chat |
| **Repro Video** | N/A (static) |

**Description**

Neither inline nor block LaTeX renders. The assistant returned standard delimiters and they appear verbatim as text:

- Inline: `The Pythagorean theorem is $a^2 + b^2 = c^2$.` → the `$a^2 + b^2 = c^2$` is shown literally.
- Block: `$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$` → shown literally with raw `\frac`, `\sqrt`, `\pm`, `$$`.

Live DOM check: `.katex, .katex-display, mjx-container, .MathJax` node count = **0** → no math renderer (KaTeX/MathJax) is wired into the markdown pipeline. Any math/scientific answer is unreadable. Expected: `$...$` → inline rendered math, `$$...$$` → centered display equation.

**Evidence**

![Raw LaTeX not rendered](screenshots/render-003-rawmath.png)
![Math view](screenshots/04-math-view.png)

---
