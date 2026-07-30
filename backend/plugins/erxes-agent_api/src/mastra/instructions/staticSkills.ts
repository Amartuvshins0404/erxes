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

## generatePptx — input { title, markdown, charts? }
- Author the deck as Markdown, ONE slide per section. Separate slides with a line
  containing only \`---\`, OR start each slide with a \`#\` / \`##\` heading.
- On each slide the FIRST heading becomes the slide title; the remaining lines
  (bullets / short paragraphs) become the slide's bullet points. Keep bullets
  short — slides are not paragraphs.

## Embedding a chart in any document or slide
1. Call **renderChart** first to create the chart; keep its returned chart id + spec.
2. Pass that chart in the tool's \`charts\` array (each entry is \`{ id, spec }\`).
3. Reference it in the markdown as an image: \`![Chart title](chart:THAT_ID)\`.
   (For generateXlsx, passed charts are added on a "Charts" tab — no markdown ref.)
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
