// Static skills shipped IN the codebase (runtime), NOT the DB. Unlike the
// user-authored skills the native SkillsProcessor surfaces, these travel WITH
// their tools: when the triggering builtin tools are bound, the skill's
// instructions are injected into the system prompt. So a static skill is always
// present and reliable for every tenant (no per-subdomain seed that a new user
// could be missing) and never appears in the skills UI.
//
// Every line below describes THIS plugin's real tool contracts — the input
// schemas in tools/documentTools.ts and the markdown/slide conventions in
// documents/*.ts — not generic advice. Keep it in sync with those files.

export interface StaticSkill {
  name: string;
  description: string;
  // Builtin tool keys (BUILTIN_TOOLS keys) whose presence activates the skill.
  triggerTools: string[];
  instructions: string;
}

const DOCUMENT_CREATION_SKILL: StaticSkill = {
  name: 'document-creation',
  description:
    'Produce polished PDF / Word / Excel / PowerPoint files with the generate tools.',
  triggerTools: ['generatePdf', 'generateDocx', 'generateXlsx', 'generatePptx'],
  instructions: `
When the user wants a file — a report, document, spreadsheet, or slide deck —
ALWAYS produce it by calling the matching generate tool below. Never paste the
file's contents into the chat as a substitute, and never hand-format raw HTML,
CSV, or XML yourself — the tools do the rendering.

## Pick the tool
- **generatePdf** — a read-only formatted report, summary, letter, or document.
- **generateDocx** — the same, when the user wants an EDITABLE Word file.
- **generateXlsx** — a spreadsheet or tabular export (numbers, lists, data dumps).
- **generatePptx** — a presentation / slide deck.

## generatePdf / generateDocx — input { title, markdown, charts? }
- Write \`markdown\` as clean GitHub-flavored Markdown: \`#\`/\`##\`/\`###\` headings,
  \`-\` bullet lists, \`|\` tables, \`**bold**\`, links. That markdown is converted
  to the file — so structure the document with real headings and lists, not one
  long paragraph.
- \`title\` is the document title and the download file name.

## generateXlsx — input { title, sheets, charts? }
- \`sheets\` is an array; each sheet has a header row (columns) and data rows.
  Put one logical table per sheet; name sheets meaningfully.
- Do NOT encode a table as markdown here — use the structured sheets.

## generatePptx — input { title, slides, charts? }
Produce a designer-quality, on-brand deck. \`slides\` is an ordered array (1–40);
each slide is a self-contained HTML body string. Slides render to branded images
server-side — author with the FIXED house class vocabulary below (Satori applies
inline styles + these classes only; flexbox layout, NO grid/float/<style>).

Rules:
- ONE idea per slide. Short headlines, few bullets. Text does NOT auto-shrink —
  it wraps but can overflow, so keep copy tight and within bounds.
- Every slide's root element is \`<div class="slide ...">\`. Make TITLE and SECTION
  slides distinct (indigo field, white headline) — do NOT repeat one bland
  white-title-plus-bullets layout on every slide.
- Layout is flexbox: compose with \`row\`/\`col\`/\`grow\`/\`gap-*\`/\`between\`/\`items-center\`.
- Reference a chart with \`<img src="chart:ID">\` (pass it in \`charts\`).

House vocabulary (compose freely, space-separated):
- Root: \`slide\` (light). Variants: \`slide-indigo\`, \`slide-dark\`, \`slide-soft\`,
  \`slide-center\` (vertically center content).
- Flex: \`row\`, \`col\`, \`grow\`, \`grow2\`, \`center\`, \`items-center\`, \`items-start\`,
  \`between\`, \`justify-center\`, \`justify-end\`, \`wrap\`, \`gap-xs|sm|md|lg\`,
  \`full-h\`, \`full-w\`, \`mt-auto\`.
- Spacing: \`mt-sm|md|lg\`, \`mb-sm|md|lg\`.
- Type: \`eyebrow\` (indigo kicker), \`title\` (hero), \`h1\`, \`h2\`, \`h3\`, \`lead\`,
  \`body\`, \`small\`, \`bold\`; colors \`text-white\`, \`text-indigo\`, \`text-ink\`,
  \`text-muted\`, \`text-soft\` (on dark), \`text-center\`.
- Decoration: \`accent-bar\` (indigo) / \`accent-bar-white\`.
- Bullets: \`bullets\` wrapper; each item \`<div class="bullet"><span class="dot">
  </span><span>…</span></div>\` (use \`dot-white\` on dark/indigo).
- Surfaces: \`card\`, \`card-outline\`, \`card-indigo\`, \`card-soft-indigo\`.
- Stats: \`stat\` (huge number) + \`stat-label\`.
- Badges: \`pill\` / \`pill-white\`. Footer: \`footer\`.
- Chart: wrap the image — \`<div class="chart-frame"><img class="chart" src="chart:ID"></div>\`.

Worked examples (match this shape EXACTLY):

Title slide —
\`<div class="slide slide-indigo slide-center"><div class="eyebrow text-white">erxes · 2026</div><div class="title text-white mt-md">Customer Growth Review</div><div class="lead text-soft mt-md">Q2 performance and the road ahead</div><div class="footer text-soft">Prepared for the leadership team</div></div>\`

Bullet slide —
\`<div class="slide"><div class="accent-bar mb-md"></div><div class="h1">What changed this quarter</div><div class="bullets mt-lg"><div class="bullet"><span class="dot"></span><span>Net revenue retention climbed to 118%</span></div><div class="bullet"><span class="dot"></span><span>Onboarding time cut from 14 to 6 days</span></div><div class="bullet"><span class="dot"></span><span>Support CSAT held above 4.6 / 5</span></div></div></div>\`

Two-column with chart —
\`<div class="slide"><div class="h2 mb-md">Revenue by segment</div><div class="row grow gap-lg items-center"><div class="grow gap-sm"><div class="body">Enterprise overtook SMB for the first time, driving most of the quarter's lift.</div><div class="pill mt-md">+24% QoQ</div></div><div class="grow2"><div class="chart-frame"><img class="chart" src="chart:revenue"></div></div></div></div>\`

Big-stat / section slide —
\`<div class="slide slide-dark slide-center"><div class="eyebrow">Outcome</div><div class="row items-center gap-lg mt-md"><div class="stat text-white">3.2x</div><div class="col"><div class="h2 text-white">Pipeline created</div><div class="small text-soft">vs. same period last year</div></div></div></div>\`

## Embedding a chart in any document or slide
1. Call **renderChart** first to create the chart; keep its returned chart id + spec.
2. Pass that chart in the tool's \`charts\` array (each entry is \`{ id, spec }\`).
3. Reference it where the file is authored: in markdown as \`![Chart title](chart:THAT_ID)\`
   (generatePdf/generateDocx), or in slide HTML as \`<img src="chart:THAT_ID">\`
   (generatePptx).
   (For generateXlsx, passed charts are added on a "Charts" tab — no ref needed.)
The same chart then appears identically in chat and in the file.

## Reading a file (file_reader)
- Every generate tool returns an artifact with an \`id\`. To re-read a file you
  just produced (to verify it or build a follow-up), call **file_reader** with
  that \`artifactId\`. To read a file the USER attached, call file_reader with the
  \`key\` from the message's "Attached files" manifest. To read a file from a
  public link, call file_reader with its \`url\`. It handles pdf, docx, xlsx,
  pptx, csv, txt, md, json, and html.
- To LOOK at an image given by URL (so you can describe or use it), call
  file_reader with that image's \`url\` — png/jpeg/gif/webp images are shown to you
  visually. (An image the user ATTACHED to the message is already visible — no
  call needed for that.) file_reader fetches only images and documents by URL;
  other file types are refused.

## After a successful generate call
- Tell the user, in ONE plain sentence, that the file is ready in the Preview
  panel and can be downloaded. Never expose file keys, URLs, JSON, artifact ids,
  or tool names to the user.
`.trim(),
};

export const STATIC_SKILLS: StaticSkill[] = [DOCUMENT_CREATION_SKILL];

/** Static skills whose trigger tools are present in the bound tool set. */
export function staticSkillsFor(toolKeys: Iterable<string>): StaticSkill[] {
  const keys = new Set(toolKeys);
  return STATIC_SKILLS.filter((s) => s.triggerTools.some((t) => keys.has(t)));
}

/** Render the active static skills as a system-prompt section. */
export function staticSkillsBlock(toolKeys: Iterable<string>): string {
  const skills = staticSkillsFor(toolKeys);
  if (!skills.length) return '';
  return skills
    .map((s) => `## Skill: ${s.name}\n\n${s.instructions}`)
    .join('\n\n');
}
