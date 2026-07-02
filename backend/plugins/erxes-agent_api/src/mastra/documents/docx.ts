import HTMLtoDOCX from 'html-to-docx';
import { markdownToHtmlDocument, type DocumentChartRef } from './markdown';

// ---------------------------------------------------------------------------
// Markdown → HTML → DOCX using html-to-docx (pure JS, returns a Buffer). It
// parses the same styled HTML the PDF path uses and embeds the chart <img>
// data URLs, so the Word document matches the PDF and the in-chat chart.
// ---------------------------------------------------------------------------

export async function renderDocxDocument(
  title: string,
  markdown: string,
  charts: DocumentChartRef[] = [],
): Promise<Buffer> {
  const html = markdownToHtmlDocument(title, markdown, charts);

  const result = await HTMLtoDOCX(html, null, {
    title,
    table: { row: { cantSplit: true } },
    footer: false,
    pageNumber: false,
  });

  // Node builds return a Buffer; normalize ArrayBuffer/Blob defensively.
  if (Buffer.isBuffer(result)) return result;
  if (result instanceof ArrayBuffer) return Buffer.from(new Uint8Array(result));
  return Buffer.from(await (result as Blob).arrayBuffer());
}
