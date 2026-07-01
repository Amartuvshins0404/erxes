import { marked } from 'marked';
import type { ChartSpec } from '~/mastra/charts/chartSpec';
import { renderChartPngDataUrl } from '~/mastra/charts/renderPng';

// ---------------------------------------------------------------------------
// Markdown is the document authoring format the agent writes. We convert it to
// HTML once with `marked`, then the per-format renderers turn that HTML into a
// PDF (@react-pdf/renderer via react-pdf-html) or DOCX (html-to-docx). Charts
// are referenced in the markdown as image placeholders — ![Alt](chart:CHART_ID)
// — and swapped for the rendered PNG (a data URL) before conversion, so the same
// chart appears in chat and in the file.
//
// Two shapes are produced: a body-only fragment for react-pdf-html (which has no
// <head> renderer and prefers single font families), and a full standalone HTML
// document for html-to-docx.
// ---------------------------------------------------------------------------

export interface DocumentChartRef {
  id: string;
  spec: ChartSpec;
}

const CHART_REF = /\]\(\s*chart:([a-zA-Z0-9_-]+)\s*\)/g;

// react-pdf-html supports a <style> block but only single font families and a
// limited CSS subset — keep this conservative so it renders without warnings.
const DOC_CSS = `
  body { font-family: 'Noto Sans'; font-size: 11pt; color: #1f2937; line-height: 1.5; }
  h1 { font-size: 22pt; margin: 0 0 12px; }
  h2 { font-size: 16pt; margin: 18px 0 8px; }
  h3 { font-size: 13pt; margin: 14px 0 6px; }
  p { margin: 0 0 8px; }
  img { max-width: 100%; }
  table { width: 100%; margin: 8px 0; }
  th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; font-size: 10pt; }
  th { background-color: #f3f4f6; font-weight: 700; }
  code { font-family: 'Noto Sans'; background-color: #f3f4f6; }
  blockquote { margin: 8px 0; padding: 4px 12px; border-left: 3px solid #d1d5db; color: #4b5563; }
`;

// Replace every ](chart:ID) target with the chart's PNG data URL. Unknown ids
// are left as an empty image so conversion never breaks on a typo.
function inlineChartImages(
  markdown: string,
  charts: DocumentChartRef[],
): string {
  if (!charts.length) return markdown.replace(CHART_REF, ']()');

  const dataUrlById = new Map<string, string>();
  for (const chart of charts) {
    if (!dataUrlById.has(chart.id)) {
      dataUrlById.set(chart.id, renderChartPngDataUrl(chart.spec));
    }
  }

  return markdown.replace(CHART_REF, (_match, id: string) => {
    const dataUrl = dataUrlById.get(id);
    return dataUrl ? `](${dataUrl})` : ']()';
  });
}

/** The marked-rendered HTML body for the document (chart images inlined). */
function markdownBody(markdown: string, charts: DocumentChartRef[]): string {
  const withCharts = inlineChartImages(markdown || '', charts);
  marked.setOptions({ gfm: true, breaks: false });
  return marked.parse(withCharts, { async: false }) as string;
}

/** Body fragment + inline <style>, for react-pdf-html (no <head>/<html>). */
export function markdownToPdfHtml(
  markdown: string,
  charts: DocumentChartRef[] = [],
): string {
  return `<style>${DOC_CSS}</style>${markdownBody(markdown, charts)}`;
}

/** A full standalone HTML document, for html-to-docx. */
export function markdownToHtmlDocument(
  title: string,
  markdown: string,
  charts: DocumentChartRef[] = [],
): string {
  const safeTitle = escapeHtml(title || 'Document');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<style>${DOC_CSS}</style>
</head>
<body>${markdownBody(markdown, charts)}</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
