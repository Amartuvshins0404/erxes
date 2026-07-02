import { z } from 'zod';
import { renderChartPng } from '~/mastra/charts/renderPng';
import type { DocumentChartRef } from './markdown';

// ---------------------------------------------------------------------------
// Tabular data → XLSX using exceljs (already a dependency; same import style as
// files/extract.ts). Each sheet becomes a worksheet with a bold header row and
// roughly auto-sized columns. Charts (if any) are rendered to PNG and dropped
// onto a dedicated "Charts" worksheet, so the workbook carries the same
// visuals as the PDF/DOCX and the in-chat chart.
// ---------------------------------------------------------------------------

export const xlsxSheetSchema = z.object({
  name: z.string().min(1).max(31).describe('Worksheet/tab name (max 31 chars).'),
  columns: z
    .array(z.string())
    .min(1)
    .describe('Header row — one label per column.'),
  rows: z
    .array(z.array(z.union([z.string(), z.number(), z.null()])))
    .describe('Data rows. Each row is an array of cell values, by column.'),
});

export type XlsxSheet = z.infer<typeof xlsxSheetSchema>;

const CHART_PX_WIDTH = 720;
const CHART_PX_HEIGHT = 420;

export async function renderXlsxDocument(
  sheets: XlsxSheet[],
  charts: DocumentChartRef[] = [],
): Promise<Buffer> {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'erxes agent';
  workbook.created = new Date();

  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sanitizeSheetName(sheet.name));

    const header = worksheet.addRow(sheet.columns);
    header.font = { bold: true };
    header.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' },
      };
    });

    for (const row of sheet.rows) {
      worksheet.addRow(row.map((cell) => (cell === null ? '' : cell)));
    }

    // Rough auto-fit: widest cell per column, clamped.
    worksheet.columns.forEach((column, index) => {
      let widest = String(sheet.columns[index] ?? '').length;
      for (const row of sheet.rows) {
        const value = row[index];
        if (value !== null && value !== undefined) {
          widest = Math.max(widest, String(value).length);
        }
      }
      column.width = Math.min(60, Math.max(10, widest + 2));
    });

    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  if (charts.length) {
    const chartSheet = workbook.addWorksheet('Charts');
    let topRow = 1;
    for (const chart of charts) {
      const png = renderChartPng(chart.spec, {
        width: CHART_PX_WIDTH,
        height: CHART_PX_HEIGHT,
      });
      const imageId = workbook.addImage({ buffer: png, extension: 'png' });
      chartSheet.addImage(imageId, {
        tl: { col: 0, row: topRow },
        ext: { width: CHART_PX_WIDTH, height: CHART_PX_HEIGHT },
      });
      // Leave room (in rows) below each image for the next one.
      topRow += 24;
    }
  }

  const written = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(written)
    ? written
    : Buffer.from(written as ArrayBuffer);
}

// Excel forbids \ / ? * [ ] : in tab names and caps at 31 chars.
function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, ' ').trim() || 'Sheet';
  return cleaned.slice(0, 31);
}
