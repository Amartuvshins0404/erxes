import '@univerjs/presets/lib/styles/preset-sheets-core.css';

import { useEffect, useId, useRef, useState } from 'react';

import { parseDelimitedTable } from '../converters/csv';

export interface ISpreadsheetHandle {
  readValues: () => (string | number)[][];
}

interface ISpreadsheetEditorProps {
  content: string;
  handleRef: { current: ISpreadsheetHandle | null };
}

const MAX_EXPORT_ROWS = 500;
const MAX_EXPORT_COLUMNS = 50;

const isBlankCell = (value: string | number | null): boolean =>
  value === null || value === '';

const normalizeCell = (value: string | number | boolean | null): string | number => {
  if (typeof value === 'number') {
    return value;
  }
  return value === null ? '' : String(value);
};

const trimEmptyEdges = (values: (string | number)[][]): (string | number)[][] => {
  const rows = [...values];

  while (rows.length && rows[rows.length - 1].every(isBlankCell)) {
    rows.pop();
  }

  if (!rows.length) {
    return [['']];
  }

  let lastColumn = 0;

  for (const row of rows) {
    for (let c = row.length - 1; c >= lastColumn; c--) {
      if (!isBlankCell(row[c])) {
        lastColumn = c;
        break;
      }
    }
  }

  return rows.map((row) => row.slice(0, lastColumn + 1));
};

export const SpreadsheetEditor = ({ content, handleRef }: ISpreadsheetEditorProps) => {
  const containerId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let disposeUniver: (() => void) | null = null;

    const mount = async () => {
      try {
        const [{ createUniver, defaultTheme, LocaleType }, { UniverSheetsCorePreset }, localeModule] =
          await Promise.all([
            import('@univerjs/presets'),
            import('@univerjs/presets/preset-sheets-core'),
            import('@univerjs/presets/preset-sheets-core/locales/en-US'),
          ]);

        if (disposed || !containerRef.current) {
          return;
        }

        const { univerAPI } = createUniver({
          locale: LocaleType.EN_US,
          locales: { [LocaleType.EN_US]: localeModule.default },
          theme: defaultTheme,
          presets: [
            UniverSheetsCorePreset({
              container: containerRef.current,
              header: false,
              toolbar: false,
              footer: false,
            }),
          ],
        });

        const workbook = univerAPI.getActiveWorkbook();
        const sheet = workbook?.getActiveSheet();

        if (sheet) {
          const { rows } = parseDelimitedTable(content);
          const columnCount = Math.max(...rows.map((row) => row.length), 1);
          const padded = rows.map((row) => [
            ...row,
            ...Array<string>(columnCount - row.length).fill(''),
          ]);

          sheet.getRange(0, 0, rows.length, columnCount).setValues(padded);
        }

        const unitId = workbook?.getId();

        handleRef.current = {
          readValues: () => {
            const active = univerAPI.getActiveWorkbook()?.getActiveSheet();

            if (!active) {
              return parseDelimitedTable(content).rows;
            }

            const values = active
              .getRange(
                0,
                0,
                Math.min(active.getMaxRows(), MAX_EXPORT_ROWS),
                Math.min(active.getMaxColumns(), MAX_EXPORT_COLUMNS),
              )
              .getValues()
              .map((row: (string | number | boolean | null)[]) =>
                row.map(normalizeCell),
              );

            return trimEmptyEdges(values);
          },
        };

        disposeUniver = () => {
          if (unitId) {
            univerAPI.disposeUnit(unitId);
          }
        };
      } catch {
        if (!disposed) {
          setFailed(true);
        }
      }
    };

    mount();

    return () => {
      disposed = true;
      handleRef.current = null;
      disposeUniver?.();
    };
  }, [content, handleRef]);

  if (failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6">
        <p className="text-sm text-muted-foreground">
          The spreadsheet editor could not be loaded.
        </p>
      </div>
    );
  }

  return (
    <div id={containerId} ref={containerRef} className="h-full w-full rounded-lg" />
  );
};
