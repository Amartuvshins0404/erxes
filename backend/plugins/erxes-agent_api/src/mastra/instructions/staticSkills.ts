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
When the user requests a downloadable file, call exactly one matching generator
after the content is ready. Never substitute pasted HTML, CSV, XML, or a long
chat response for the requested file.

- **generatePdf**: formatted read-only report.
- **generateDocx**: editable Word document.
- **generateXlsx**: spreadsheet or tabular export.
- **generatePptx**: presentation or slide deck.

PDF/DOCX use clean GitHub-flavored Markdown with real headings, lists, and
tables. XLSX uses structured sheets with one logical table per meaningfully
named sheet; never pass a Markdown table.

For PPTX, pass 1–40 self-contained HTML slide bodies. Every root is
\`<div class="slide ...">\`; use flexbox and the provided house classes only
(no grid, float, style tags, scripts, or custom CSS). Keep one idea per slide:
headline ≤6 words, ≤5 one-line bullets, and less text when a chart is present.
Split dense content into additional slides. Make title/section slides visually
distinct with \`slide-indigo\` or \`slide-dark\`.

Useful slide classes:
- layout: \`row col grow grow2 center items-center between wrap gap-sm gap-md gap-lg\`
- type: \`eyebrow title h1 h2 h3 lead body small bold text-white text-muted\`
- surfaces: \`card card-outline card-indigo card-soft-indigo pill stat stat-label\`
- bullets: \`bullets\`, then \`<div class="bullet"><span class="dot"></span><span>Text</span></div>\`
- charts: \`<div class="chart-frame"><img class="chart" src="chart:ID"></div>\`

For charts, call renderChart first, pass its \`{ id, spec }\` in \`charts\`, and
reference \`chart:ID\` from Markdown or PPTX HTML. XLSX places passed charts on a
Charts sheet.

Use fileReader only to inspect a user attachment by \`key\`, a generated file by
\`artifactId\`, or a public document by \`url\`. Do not re-read a generated file
unless the user asked for verification or a follow-up depends on its contents.

After successful generation, say in one sentence that the file is ready in
Preview and downloadable. Never expose tool names, file keys, URLs, JSON, or
artifact ids.
`.trim(),
};

const WEBSITE_CREATION_SKILL: StaticSkill = {
  name: 'website-creation',
  description:
    'Build and publish a complete static website from the isolated workspace.',
  triggerTools: ['workspaceWrite', 'publishWebsite'],
  instructions: `
When the user asks for a website, deliver one complete static site with this
bounded workflow:
1. Research first only when the requested content requires current facts.
2. Call **workspaceWrite ONCE** with all complete source files. Never write source
   through terminal commands, shell heredocs, base64, printf, or repeated patches.
3. Call **terminal** only for one short build or validation command when needed.
   Static HTML/CSS/JavaScript that needs no build should skip terminal entirely.
4. Call **publishWebsite ONCE**, only after every file is ready. Pass the
   workspace-relative site root and its HTML entry. Do not start a web server.

After publishWebsite succeeds, tell the user in one plain sentence that the site
is ready in Preview and Files. A tool result is not delivery evidence: only the
returned website artifact is success. If publishWebsite fails, STOP, report that
the preview was not delivered and describe the actionable failure. Never retry
publishWebsite in the same turn and never claim the site is ready after an error.
`.trim(),
};

const PRODUCT_IMAGE_SKILL: StaticSkill = {
  name: 'product-image-cleanup',
  description:
    'Remove photo backgrounds and set the cut-out as a product image.',
  triggerTools: ['removeImageBackground'],
  instructions: `
When the user wants an image's background removed (typically a product photo),
call **removeImageBackground**:
- For an image the user ATTACHED to the message, pass \`key\` — the exact key
  from the message's "Attached files" manifest.
- For an image given as a public link, pass \`url\`.
- \`title\`: a short human name for the result (e.g. the product name).

The transparent PNG opens in the Preview panel automatically. Tell the user in
ONE plain sentence that it is ready there — never expose file keys, URLs,
artifact ids, or tool names.

## Setting it as a product image
Only when the user asks for the cut-out to be put on a product:
1. Find the product (search by name if you only have a name).
2. Call the erxes operation \`productsEdit\` with the product's \`_id\` and pass
   the tool result's \`attachment\` object VERBATIM as the \`attachment\`
   argument. Do not invent or rewrite its fields.
If the tool result has NO \`attachment\` field, this instance has no cloud file
storage — the image can still be downloaded from the Preview panel, but cannot
be attached to a product; say so plainly.

## Batches
For several photos, process them one at a time (each call returns its own
preview + attachment) and keep the user posted on progress.
`.trim(),
};

export const STATIC_SKILLS: StaticSkill[] = [
  DOCUMENT_CREATION_SKILL,
  WEBSITE_CREATION_SKILL,
  PRODUCT_IMAGE_SKILL,
];

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
