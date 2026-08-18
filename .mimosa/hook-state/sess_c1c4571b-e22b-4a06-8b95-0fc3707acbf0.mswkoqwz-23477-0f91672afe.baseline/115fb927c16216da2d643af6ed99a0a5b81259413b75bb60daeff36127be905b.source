import { SUBMISSIONS_CURSOR_SESSION_KEY } from '@/form/constants/submissionCursorSessionKey';
import { useSubmissions } from '@/form/hooks/useSubmissions';
import { IconTrash } from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/table-core';
import {
  Button,
  CommandBar,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
  Separator,
  Tooltip,
} from 'erxes-ui';
import { Link, useParams } from 'react-router-dom';
import { BLOCK_FORMS } from '../constants/blockForms';
import { useRemoveSubmissions } from '../hooks/useRemoveSubmissions';

export const SubmissionRecordTable = () => {
  const { id } = useParams();
  const { submissions, handleFetchMore, loading, pageInfo } = useSubmissions();

  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  const questions: { text: string }[] = BLOCK_FORMS[Number(id)]?.questions;

  const columns: ColumnDef<any>[] = [
    RecordTable.checkboxColumn as ColumnDef<any>,
    {
      accessorKey: 'lead',
      header: 'Lead',
      cell: ({ cell }) => {
        const lead = cell.getValue() as any;

        if (!lead) {
          return (
            <RecordTableInlineCell className="text-xs font-medium text-muted-foreground">
              Unknown
            </RecordTableInlineCell>
          );
        }

        return (
          <RecordTableInlineCell className="text-xs font-medium text-muted-foreground">
            <Link to={`/contacts/${lead.state}s?contactId=${lead._id}`}>
              {lead.firstName ||
                lead.lastName ||
                lead.primaryPhone ||
                lead.primaryEmail ||
                'Unknown'}
            </Link>
          </RecordTableInlineCell>
        );
      },
    },

    ...(questions?.map((question, index) => ({
      accessorKey: `answer${index + 1}`,
      header: () => <RecordTable.InlineHead label={question.text} />,
      cell: ({ cell }: any) => {
        const value = cell.getValue() as string;

        return (
          <Tooltip.Provider delayDuration={0}>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <RecordTableInlineCell className="text-xs font-medium text-muted-foreground">
                  {value}
                </RecordTableInlineCell>
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p>{value}</p>
              </Tooltip.Content>
            </Tooltip>
          </Tooltip.Provider>
        );
      },
    })) || []),

    {
      accessorKey: 'submittedAt',
      header: 'Submitted At',
      cell: ({ cell }) => {
        return (
          <RelativeDateDisplay value={cell.getValue() as string} asChild>
            <RecordTableInlineCell className="text-xs font-medium text-muted-foreground">
              <RelativeDateDisplay.Value value={cell.getValue() as string} />
            </RecordTableInlineCell>
          </RelativeDateDisplay>
        );
      },
    },
  ];

  return (
    <RecordTable.Provider
      columns={columns}
      data={submissions || []}
      className="m-3"
    >
      <RecordTable.CursorProvider
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        dataLength={submissions?.length}
        sessionKey={SUBMISSIONS_CURSOR_SESSION_KEY}
      >
        <RecordTable>
          <RecordTable.Header />
          <RecordTable.Body>
            <RecordTable.CursorBackwardSkeleton
              handleFetchMore={handleFetchMore}
            />
            {loading && <RecordTable.RowSkeleton rows={40} />}
            <RecordTable.RowList />
            <RecordTable.CursorForwardSkeleton
              handleFetchMore={handleFetchMore}
            />
          </RecordTable.Body>
        </RecordTable>
      </RecordTable.CursorProvider>
      <SubmissionCommandBar />
    </RecordTable.Provider>
  );
};

export const SubmissionCommandBar = () => {
  const { table } = RecordTable.useRecordTable();

  const submissionIds = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original._id);

  const { removeSubmissions } = useRemoveSubmissions(submissionIds);

  return (
    <CommandBar open={table.getFilteredSelectedRowModel().rows.length > 0}>
      <CommandBar.Bar>
        <CommandBar.Value>
          {table.getFilteredSelectedRowModel().rows.length} selected
        </CommandBar.Value>
        <Separator.Inline />
        <Button
          variant="secondary"
          className="text-destructive"
          onClick={() => removeSubmissions()}
        >
          <IconTrash />
          Delete
        </Button>
      </CommandBar.Bar>
    </CommandBar>
  );
};
