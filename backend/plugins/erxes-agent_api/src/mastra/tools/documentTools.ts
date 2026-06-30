import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { chartSpecSchema } from '~/mastra/charts/chartSpec';
import { renderPdfDocument } from '~/mastra/documents/pdf';
import { renderDocxDocument } from '~/mastra/documents/docx';
import { renderXlsxDocument, xlsxSheetSchema } from '~/mastra/documents/xlsx';
import { renderPptxDocument } from '~/mastra/documents/pptx';
import { persistGeneratedFile, type PersistedFile } from '~/mastra/files/persist';
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

// A single slide: a self-contained HTML body authored with the house
// vocabulary (see documents/presentation/theme.ts). Charts are referenced as
// <img src="chart:ID">.
const pptxSlideSchema = z.object({
  html: z
    .string()
    .min(1)
    .describe(
      'One slide as a self-contained HTML body using the house class ' +
        'vocabulary (flexbox only). Reference a chart with <img src="chart:ID">.',
    ),
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

// Aggregate ceiling on inline (base64 data:) bytes across the whole deck. The
// per-file cap in persist.ts can't catch N slides each individually under it
// summing to tens of MB stuffed into one stored message.
const INLINE_DECK_MAX_BYTES = 12 * 1024 * 1024; // 12 MB

// PPTX persists the deck AND each slide PNG (so the chat can render a Preview +
// Present mode). Slide refs follow the SAME convention as fileKey: a storage key
// or an inline data:/http URL.
async function finalizePptx(
  title: string,
  pptx: Buffer,
  slidePngs: Buffer[],
): Promise<{ artifact: DocumentArtifact }> {
  const slug = slugify(title);
  const fileName = `${slug}.pptx`;
  const mimeType = MIME_BY_FORMAT.pptx;
  const persisted = await persistGeneratedFile({ buffer: pptx, fileName, mimeType });

  // Slide uploads are independent — run them concurrently. allSettled (not
  // Promise.all) so one failure never throws mid-batch leaving earlier uploads
  // orphaned; we keep the slides that succeeded, in order, and drop the rest.
  const settled = await Promise.allSettled(
    slidePngs.map((buffer, i) =>
      persistGeneratedFile({
        buffer,
        fileName: `${slug}-slide-${i + 1}.png`,
        mimeType: 'image/png',
      }),
    ),
  );
  const persistedSlides = settled
    .filter(
      (r): r is PromiseFulfilledResult<PersistedFile> =>
        r.status === 'fulfilled',
    )
    .map((r) => r.value);

  // Bail if the inline-only fallback would bloat one stored message with tens of
  // MB of base64 (data: URLs only — real cloud uploads carry no aggregate cost).
  const inlineBytes = [persisted, ...persistedSlides]
    .filter((p) => p.fileKey.startsWith('data:'))
    .reduce((sum, p) => sum + p.size, 0);
  if (inlineBytes > INLINE_DECK_MAX_BYTES) {
    throw new Error(
      `The generated deck is too large (${Math.round(
        inlineBytes / 1024 / 1024,
      )} MB) to attach inline. Configure cloud file storage (S3/R2/GCS/Azure) to enable presentation downloads.`,
    );
  }

  const slides = persistedSlides.map((p) => p.fileKey);
  const artifact: DocumentArtifact = {
    id: newArtifactId('doc'),
    kind: 'document',
    format: 'pptx',
    title,
    fileName,
    mimeType,
    fileKey: persisted.fileKey,
    inline: persisted.inline,
    size: persisted.size,
    slides,
    slideCount: slides.length,
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
    'Generate a downloadable, designer-quality PowerPoint (.pptx) slide deck. ' +
    'Use when the user wants a presentation or slides. Author each slide as a ' +
    'self-contained HTML body using the documented house class vocabulary ' +
    '(flexbox only, on-brand erxes indigo) — ONE idea per slide. Reference a ' +
    'chart on a slide with <img src="chart:ID">. The deck renders to branded ' +
    'slide images and opens in the Preview panel (with Present mode) and is ' +
    'downloadable.',
  inputSchema: z.object({
    title: z.string().min(1).max(200).describe('Deck title / file name.'),
    slides: z
      .array(pptxSlideSchema)
      .min(1)
      .max(40)
      .describe('Ordered slides; each a self-contained HTML body (max 40).'),
    charts: z
      .array(chartRefSchema)
      .optional()
      .describe('Charts referenced from slides as <img src="chart:ID">.'),
  }),
  outputSchema: z.object({ artifact: documentArtifactSchema }),
  execute: async ({ title, slides, charts }) => {
    const { pptx, slidePngs } = await renderPptxDocument(
      title,
      slides,
      charts ?? [],
    );
    return finalizePptx(title, pptx, slidePngs);
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
