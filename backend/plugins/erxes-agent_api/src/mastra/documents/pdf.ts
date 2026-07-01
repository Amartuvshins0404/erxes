import path from 'path';
import { createElement } from 'react';
import { Document, Font, Page, renderToBuffer } from '@react-pdf/renderer';
import Html from 'react-pdf-html';
import { markdownToPdfHtml, type DocumentChartRef } from './markdown';

// ---------------------------------------------------------------------------
// Markdown → HTML → PDF using @react-pdf/renderer (already a workspace dep) plus
// react-pdf-html's <Html> bridge. No headless browser, no native canvas. We
// build the element tree with React.createElement so the backend needs no JSX
// build step. Charts are embedded as PNG data URLs by markdownToHtmlDocument.
//
// @react-pdf's built-in fonts (Helvetica/Courier) are Latin-only, so Cyrillic —
// notably Mongolian Cyrillic (Өө U+04E8/9, Үү U+04AE/AF) — renders as mojibake.
// Embed Noto Sans (full Cyrillic coverage) and reference it from the document
// CSS (see markdown.ts DOC_CSS). The TTFs live next to this module; __dirname
// resolves correctly under both tsx-dev (src/) and the compiled build (dist/),
// and the build script copies the fonts/ dir into dist.
// ---------------------------------------------------------------------------

const FONT_DIR = path.join(__dirname, 'fonts');

Font.register({
  family: 'Noto Sans',
  fonts: [
    { src: path.join(FONT_DIR, 'NotoSans-Regular.ttf'), fontWeight: 'normal' },
    { src: path.join(FONT_DIR, 'NotoSans-Bold.ttf'), fontWeight: 'bold' },
    { src: path.join(FONT_DIR, 'NotoSans-Italic.ttf'), fontStyle: 'italic' },
    {
      src: path.join(FONT_DIR, 'NotoSans-BoldItalic.ttf'),
      fontWeight: 'bold',
      fontStyle: 'italic',
    },
  ],
});

// Disable hyphenation: the default splits Cyrillic words at odd points.
Font.registerHyphenationCallback((word) => [word]);

export async function renderPdfDocument(
  title: string,
  markdown: string,
  charts: DocumentChartRef[] = [],
): Promise<Buffer> {
  const html = markdownToPdfHtml(markdown, charts);

  const element = createElement(
    Document,
    { title },
    createElement(
      Page,
      { size: 'A4', style: { paddingTop: 48, paddingBottom: 56, paddingHorizontal: 48 } },
      // react-pdf-html ignores the <style> body{} rule (the fragment has no
      // <body>), so set the embedded family on <Html> directly — it inherits to
      // every rendered tag and keeps the body off the Latin-only Helvetica.
      createElement(Html, { style: { fontFamily: 'Noto Sans' }, children: html }),
    ),
  );

  // renderToBuffer accepts a Document element; the cast keeps us off `any`
  // while tolerating react-pdf-html's loose child typing.
  return renderToBuffer(element as Parameters<typeof renderToBuffer>[0]);
}
