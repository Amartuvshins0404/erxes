import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  Button,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
} from 'erxes-ui';
import { useSchedules } from '../hooks/useSchedules';
import { ScheduleTemplateFilters } from '../types/schedule';
import { SCHEDULE_TEMPLATES_CURSOR_SESSION_KEY } from '../constants/scheduleCursorSessionKey';
import { EditScheduleTemplateDialog } from './ScheduleTemplateDialog';
import { RemoveScheduleTemplateDialog } from './RemoveDialog';
import { useState } from 'react';
import { getLocalizedString } from '~/modules/activity-type/utils/localization';
import { ListTotalsLabel } from '~/components/ListTotalsLabel';

interface ScheduleTemplatesListProps {
  filters?: ScheduleTemplateFilters;
}

const getMonthName = (month: number) => {
  return new Date(2000, month - 1, 1).toLocaleString('default', {
    month: 'long',
  });
};

export const ScheduleTemplatesList = ({
  filters,
}: ScheduleTemplatesListProps) => {
  const {
    scheduleTemplates,
    handleFetchMore,
    loading,
    error,
    pageInfo,
    filteredTotalCount,
    overallTotalCount,
  } = useSchedules(filters);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'providerId',
      header: 'Provider',
      cell: ({ row }) => {
        const template = row.original;
        const providerName = template.provider?.businessName
          ? getLocalizedString(template.provider.businessName, 'en')
          : template.providerId;
        return (
          <RecordTableInlineCell className="text-xs font-medium text-muted-foreground">
            {providerName}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'month',
      header: 'Month',
      cell: ({ cell, row }) => {
        const month = cell.getValue() as number;
        const year = row.original.year;
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            {getMonthName(month)} {year}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'dailySchedules',
      header: 'Daily Schedules',
      cell: ({ cell }) => {
        const schedules = cell.getValue() as any[];
        return (
          <RecordTableInlineCell className="text-xs font-medium text-muted-foreground">
            {schedules?.length || 0} schedule(s)
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ cell }) => {
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            <RelativeDateDisplay value={cell.getValue() as string} asChild>
              <RelativeDateDisplay.Value value={cell.getValue() as string} />
            </RelativeDateDisplay>
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'modifiedAt',
      header: 'Modified At',
      cell: ({ cell }) => {
        const modifiedAt = cell.getValue() as string | undefined;
        return (
          <RecordTableInlineCell className="text-xs font-medium text-muted-foreground">
            {modifiedAt ? (
              <RelativeDateDisplay value={modifiedAt} asChild>
                <RelativeDateDisplay.Value value={modifiedAt} />
              </RelativeDateDisplay>
            ) : (
              '-'
            )}
          </RecordTableInlineCell>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const template = row.original;

        return (
          <RecordTableInlineCell>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTemplate(template._id);
                  setEditDialogOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTemplate(template._id);
                  setRemoveDialogOpen(true);
                }}
              >
                Remove
              </Button>
            </div>
          </RecordTableInlineCell>
        );
      },
    },
  ];

  return (
    <>
      {error && (
        <div className="m-3 p-4 bg-destructive/10 text-destructive rounded-md">
          <p className="font-medium">Error loading schedule templates</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      )}
      <ListTotalsLabel
        filteredTotalCount={filteredTotalCount}
        overallTotalCount={overallTotalCount}
        loading={loading}
      />
      <RecordTable.Provider
        columns={columns}
        data={scheduleTemplates || []}
        className="m-3"
      >
        <RecordTable.CursorProvider
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          dataLength={scheduleTemplates?.length}
          sessionKey={SCHEDULE_TEMPLATES_CURSOR_SESSION_KEY}
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
      </RecordTable.Provider>

      {selectedTemplate && (
        <>
          <EditScheduleTemplateDialog
            templateId={selectedTemplate}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onClose={() => {
              setEditDialogOpen(false);
              setSelectedTemplate(null);
            }}
          />
          <RemoveScheduleTemplateDialog
            templateId={selectedTemplate}
            open={removeDialogOpen}
            onOpenChange={setRemoveDialogOpen}
            onClose={() => {
              setRemoveDialogOpen(false);
              setSelectedTemplate(null);
            }}
          />
        </>
      )}
    </>
  );
};
