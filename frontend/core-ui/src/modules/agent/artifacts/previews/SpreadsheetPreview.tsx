import { Table } from 'erxes-ui';
import { useMemo } from 'react';

import { parseDelimitedTable } from '../converters/csv';

interface ISpreadsheetPreviewProps {
  content: string;
}

export const SpreadsheetPreview = ({ content }: ISpreadsheetPreviewProps) => {
  const { rows } = useMemo(() => parseDelimitedTable(content), [content]);

  if (rows.length === 0) {
    return (
      <div className="flex h-full min-h-[120px] items-center justify-center text-sm text-muted-foreground">
        Empty table
      </div>
    );
  }

  const [header, ...body] = rows;

  return (
    <div className="max-h-[60vh] w-full overflow-auto rounded-2xl border bg-card">
      <Table className="text-[13px]">
        <Table.Header className="sticky top-0 bg-muted/40">
          <Table.Row>
            {header.map((cell, columnIndex) => (
              <Table.Head key={columnIndex} scope="col">
                {cell}
              </Table.Head>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {body.map((row, rowIndex) => (
            <Table.Row key={rowIndex}>
              {row.map((cell, columnIndex) => (
                <Table.Cell key={columnIndex} className="align-top">
                  {cell}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};
