import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { chartSpecSchema } from '~/mastra/charts/chartSpec';
import { renderPdfDocument } from '~/mastra/documents/pdf';
import { renderDocxDocument } from '~/mastra/documents/docx';
import { renderXlsxDocument, xlsxSheetSchema } from '~/mastra/documents/xlsx';
import { renderPptxDocument } from '~/mastra/documents/pptx';
import { persistGeneratedFile } from '~/mastra/files/persist';
import { storeArtifact } from '~/mastra/artifactStore';
import {
  documentArtifactSchema,
  MIME_BY_FORMAT,
  newArtifactId,
  type DocumentArtifact,
  type DocumentFormat,
} from './artifacts';

// ---------------------------------------------------------------------------
// Document generation tools — PDF / DOCX / XLSX.
//
// PDF & DOCX take agent-authored Markdown; XLSX takes tabular sheets. A chart
// produced earlier by render-chart (or authored inline) can be embedded: pass
// its spec in `charts` and reference it in the Markdown as ![Title](chart:ID)
// (PDF/DOCX) — XLSX renders every passed chart onto a "Charts" tab.
//
// Each tool renders → persists to storage → returns a `document` artifact the
// chat shows in the Preview panel with a download.
// ---------------------------------------------------------------------------

// Charts the agent wants available to a document, by the id it references.
const chartRefSchema = z.object({
  id: z
    .string()
    .describe('Reference id used in markdown as ![alt](chart:ID).'),
  spec: chartSpecSchema,
});

const markdownDocInput = z.object({
  title: z.string().min(1).max(200).describe('Document title / file name.'),
  markdown: z
    .string()
    .min(1)
    .describe(
      'Document body as GitHub-flavored Markdown (headings, lists, tables, ' +
        'bold/italic, links). Embed a chart with ![Title](chart:ID).',
    ),
  charts: z
    .array(chartRefSchema)
    .optional()
    .describe('Charts referenced from the markdown, each with its id + spec.'),
});

async function finalize(
  format: DocumentFormat,
  title: string,
  buffer: Buffer,
): Promise<{ artifact: DocumentArtifact }> {
  const fileName = `${slugify(title)}.${format}`;
  const mimeType = MIME_BY_FORMAT[format];
  const persisted = await persistGeneratedFile({ buffer, fileName, mimeType });
  const artifact: DocumentArtifact = {
    id: newArtifactId('doc'),
    kind: 'document',
    format,
    title,
    fileName,
    mimeType,
    fileKey: persisted.fileKey,
    inline: persisted.inline,
    size: persisted.size,
  };
  await storeArtifact(artifact);
  return { artifact };
}

export const generatePdfTool = createTool({
  id: 'generate-pdf',
  description:
    'Generate a downloadable PDF report from Markdown content. Use for ' +
    'formatted reports, summaries, or documents. Embed charts with ' +
    '![Title](chart:ID). The file opens in the Preview panel and is downloadable.',
  inputSchema: markdownDocInput,
  outputSchema: z.object({ artifact: documentArtifactSchema }),
  execute: async ({ title, markdown, charts }) => {
    const buffer = await renderPdfDocument(title, markdown, charts ?? []);
    return finalize('pdf', title, buffer);
  },
});

export const generateDocxTool = createTool({
  id: 'generate-docx',
  description:
    'Generate a downloadable Word (.docx) document from Markdown content. Use ' +
    'when the user wants an editable document. Embed charts with ' +
    '![Title](chart:ID). The file opens in the Preview panel and is downloadable.',
  inputSchema: markdownDocInput,
  outputSchema: z.object({ artifact: documentArtifactSchema }),
  execute: async ({ title, markdown, charts }) => {
    const buffer = await renderDocxDocument(title, markdown, charts ?? []);
    return finalize('docx', title, buffer);
  },
});

export const generatePptxTool = createTool({
  id: 'generate-pptx',
  description:
    'Generate a downloadable PowerPoint (.pptx) slide deck from Markdown content. ' +
    'Use when the user wants a presentation or slides. Separate slides with a ' +
    '`---` line (or start each slide with a `#`/`##` heading); the first heading ' +
    'is the slide title and the rest become bullet points. Embed a chart on a ' +
    'slide with ![Title](chart:ID). The deck opens in the Preview panel and is ' +
    'downloadable.',
  inputSchema: markdownDocInput,
  outputSchema: z.object({ artifact: documentArtifactSchema }),
  execute: async ({ title, markdown, charts }) => {
    const buffer = await renderPptxDocument(title, markdown, charts ?? []);
    return finalize('pptx', title, buffer);
  },
});

export const generateXlsxTool = createTool({
  id: 'generate-xlsx',
  description:
    'Generate a downloadable Excel (.xlsx) spreadsheet from tabular data. ' +
    'Provide one or more sheets (columns + rows). Any charts passed are added ' +
    'on a "Charts" tab. The file opens in the Preview panel and is downloadable.',
  inputSchema: z.object({
    title: z.string().min(1).max(200).describe('Workbook title / file name.'),
    sheets: z
      .array(xlsxSheetSchema)
      .min(1)
      .max(20)
      .describe('Worksheets, each with a header row and data rows.'),
    charts: z
      .array(chartRefSchema)
      .optional()
      .describe('Charts to render onto a dedicated "Charts" tab.'),
  }),
  outputSchema: z.object({ artifact: documentArtifactSchema }),
  execute: async ({ title, sheets, charts }) => {
    const buffer = await renderXlsxDocument(sheets, charts ?? []);
    return finalize('xlsx', title, buffer);
  },
});

// Heterogeneous createTool instances; registered into BUILTIN_TOOLS.
export const DOCUMENT_BUILTIN_TOOLS: Record<
  string,
  ReturnType<typeof createTool>
> = {
  generatePdf: generatePdfTool,
  generateDocx: generateDocxTool,
  generateXlsx: generateXlsxTool,
  generatePptx: generatePptxTool,
};

function slugify(title: string): string {
  return (
    (title || 'document')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60) || 'document'
  );
}
