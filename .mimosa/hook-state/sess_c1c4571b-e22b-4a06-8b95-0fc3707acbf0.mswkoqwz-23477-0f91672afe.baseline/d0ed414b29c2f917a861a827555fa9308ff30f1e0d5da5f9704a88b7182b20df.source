import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  Button,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
} from 'erxes-ui';
import { useActivityTypes } from '../hooks/useActivityTypes';
import { ActivityTypeFilters, GenderRestriction } from '../types/activityType';
import { ACTIVITY_TYPES_CURSOR_SESSION_KEY } from '../constants/activityTypeCursorSessionKey';
import { EditActivityTypeDialog } from './ActivityTypeDialog';
import { RemoveActivityTypeDialog } from './RemoveActivityTypeDialog';
import { useState } from 'react';
import { getLocalizedString } from '../utils/localization';
import { getLocalizedString as getCategoryLocalizedString } from '~/modules/category/utils/localization';
import { ListTotalsLabel } from '~/components/ListTotalsLabel';

interface ActivityTypesListProps {
  filters?: ActivityTypeFilters;
}

const getGenderRestrictionBadgeVariant = (restriction: GenderRestriction) => {
  switch (restriction) {
    case GenderRestriction.MALE:
      return 'info';
    case GenderRestriction.FEMALE:
      return 'warning';
    case GenderRestriction.MIXED:
      return 'success';
    default:
      return 'secondary';
  }
};

const formatDuration = (duration: number) => {
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const ActivityTypesList = ({ filters }: ActivityTypesListProps) => {
  const {
    activityTypes,
    handleFetchMore,
    loading,
    pageInfo,
    filteredTotalCount,
    overallTotalCount,
  } = useActivityTypes(filters);
  const [selectedActivityType, setSelectedActivityType] = useState<
    string | null
  >(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const activityType = row.original;
        const name = getLocalizedString(activityType.name, 'en');
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            {name}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'providerId',
      header: 'Provider',
      cell: ({ row }) => {
        const activityType = row.original;
        const providerName = activityType.provider?.businessName
          ? getLocalizedString(activityType.provider.businessName, 'en')
          : activityType.providerId;
        return (
          <RecordTableInlineCell className="text-xs font-medium text-muted-foreground">
            {providerName}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const activityType = row.original;
        const description = getLocalizedString(activityType.description, 'en');
        return (
          <RecordTableInlineCell className="text-xs font-medium text-muted-foreground">
            {description || '-'}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'creditCost',
      header: 'Credit Cost',
      cell: ({ cell }) => {
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            {cell.getValue() as number}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ cell }) => {
        const value = cell.getValue() as number | undefined;
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            {value != null ? value : '-'}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: ({ cell }) => {
        const duration = cell.getValue() as number;
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            {formatDuration(duration)}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'genderRestriction',
      header: 'Gender Restriction',
      cell: ({ cell }) => {
        const restriction = cell.getValue() as GenderRestriction;
        return (
          <RecordTableInlineCell>
            <Badge
              variant={getGenderRestrictionBadgeVariant(restriction)}
              className="capitalize"
            >
              {restriction}
            </Badge>
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'categoryIds',
      header: 'Categories',
      cell: ({ row }) => {
        const activityType = row.original;
        if (!activityType.categories || activityType.categories.length === 0) {
          return (
            <RecordTableInlineCell className="text-xs font-medium text-muted-foreground">
              -
            </RecordTableInlineCell>
          );
        }
        const categoryNames = activityType.categories
          .map((cat: { _id: string; name: { en: string; mn: string } }) =>
            getCategoryLocalizedString(cat.name, 'en'),
          )
          .join(', ');
        return (
          <RecordTableInlineCell className="text-xs font-medium text-muted-foreground">
            {categoryNames}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ cell }) => {
        const isActive = cell.getValue() as boolean;
        return (
          <RecordTableInlineCell>
            <Badge variant={isActive ? 'success' : 'secondary'}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
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
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const activityType = row.original;

        return (
          <RecordTableInlineCell>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedActivityType(activityType._id);
                  setEditDialogOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedActivityType(activityType._id);
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
      <ListTotalsLabel
        filteredTotalCount={filteredTotalCount}
        overallTotalCount={overallTotalCount}
        loading={loading}
      />
      <RecordTable.Provider
        columns={columns}
        data={activityTypes || []}
        className="m-3"
      >
        <RecordTable.CursorProvider
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          dataLength={activityTypes?.length}
          sessionKey={ACTIVITY_TYPES_CURSOR_SESSION_KEY}
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

      {selectedActivityType && (
        <>
          <EditActivityTypeDialog
            activityTypeId={selectedActivityType}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onClose={() => {
              setEditDialogOpen(false);
              setSelectedActivityType(null);
            }}
          />
          <RemoveActivityTypeDialog
            activityTypeId={selectedActivityType}
            open={removeDialogOpen}
            onOpenChange={setRemoveDialogOpen}
            onClose={() => {
              setRemoveDialogOpen(false);
              setSelectedActivityType(null);
            }}
          />
        </>
      )}
    </>
  );
};
