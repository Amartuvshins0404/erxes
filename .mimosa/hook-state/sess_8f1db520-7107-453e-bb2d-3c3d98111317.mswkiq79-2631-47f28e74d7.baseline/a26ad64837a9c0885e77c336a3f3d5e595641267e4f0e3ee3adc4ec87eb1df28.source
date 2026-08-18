import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  Button,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
} from 'erxes-ui';
import { useMembershipPlans } from '../hooks/useMembershipPlans';
import { MembershipPlanFilters } from '../types/membership';
import { MEMBERSHIP_PLANS_CURSOR_SESSION_KEY } from '../constants/membershipPlanCursorSessionKey';
import { MembershipPlanDialog } from './MembershipPlanDialog';
import { RemoveMembershipPlanDialog } from './RemoveMembershipPlanDialog';
import { useState } from 'react';
import { ListTotalsLabel } from '~/components/ListTotalsLabel';

interface MembershipPlansListProps {
  filters?: MembershipPlanFilters;
}

export const MembershipPlansList = ({ filters }: MembershipPlansListProps) => {
  const {
    membershipPlans,
    handleFetchMore,
    loading,
    pageInfo,
    filteredTotalCount,
    overallTotalCount,
  } = useMembershipPlans(filters);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ cell }) => {
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            {cell.getValue() as string}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ cell }) => {
        const description = cell.getValue() as string | undefined;
        return (
          <RecordTableInlineCell className="text-xs font-medium text-muted-foreground">
            {description || '-'}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'planType',
      header: 'Type',
      cell: ({ cell }) => {
        const planType = (cell.getValue() as string) || 'normal';
        return (
          <RecordTableInlineCell>
            <Badge variant={planType === 'credit' ? 'secondary' : 'default'}>
              {planType === 'credit' ? 'Credit only' : 'Normal'}
            </Badge>
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'creditAmount',
      header: 'Credit Amount',
      cell: ({ cell }) => {
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            {cell.getValue() as number}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'duration',
      header: 'Duration (days)',
      cell: ({ cell, row }) => {
        const planType = (row.original as { planType?: string }).planType;
        if (planType === 'credit') {
          return (
            <RecordTableInlineCell className="text-xs font-medium text-muted-foreground">
              -
            </RecordTableInlineCell>
          );
        }
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            {(cell.getValue() as number) ?? '-'}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ cell }) => {
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            {(cell.getValue() as number).toLocaleString()}
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
        const plan = row.original;

        return (
          <RecordTableInlineCell>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPlan(plan._id);
                  setEditDialogOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPlan(plan._id);
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
        data={membershipPlans || []}
        className="m-3"
      >
        <RecordTable.CursorProvider
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          dataLength={membershipPlans?.length}
          sessionKey={MEMBERSHIP_PLANS_CURSOR_SESSION_KEY}
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

      {selectedPlan && (
        <>
          <MembershipPlanDialog
            planId={selectedPlan}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onClose={() => {
              setEditDialogOpen(false);
              setSelectedPlan(null);
            }}
          />
          <RemoveMembershipPlanDialog
            planId={selectedPlan}
            open={removeDialogOpen}
            onOpenChange={setRemoveDialogOpen}
            onClose={() => {
              setRemoveDialogOpen(false);
              setSelectedPlan(null);
            }}
          />
        </>
      )}
    </>
  );
};
