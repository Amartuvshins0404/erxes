import { useState } from 'react';
import { Popover, PopoverScoped, RecordTableInlineCell, Table } from 'erxes-ui';

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const HtmlPreview = ({
  label,
  html,
}: {
  label: string;
  html: string;
}) => {
  const [open, setOpen] = useState(false);
  const plain = stripHtml(html);

  return (
    <Table.Row>
      <Table.Cell className="bg-sidebar p-2 w-44 h-auto min-h-10 text-muted-foreground align-middle">
        {label}
      </Table.Cell>
      <Table.Cell className="p-0 h-auto min-h-10">
        <PopoverScoped open={open} onOpenChange={setOpen}>
          <RecordTableInlineCell.Trigger className="py-2 w-full">
            <span className="text-sm truncate">{plain || '-'}</span>
          </RecordTableInlineCell.Trigger>
          <Popover.Content
            align="start"
            sideOffset={-4}
            className="p-0 w-(--radix-popper-anchor-width)"
          >
            <textarea
              readOnly
              value={plain}
              className="block bg-transparent p-2 outline-none w-full h-48 text-foreground text-sm resize-none"
            />
          </Popover.Content>
        </PopoverScoped>
      </Table.Cell>
    </Table.Row>
  );
};
