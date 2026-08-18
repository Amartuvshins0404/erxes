import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  Button,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
} from 'erxes-ui';
import { useState } from 'react';
import { usePromoCodes } from '../hooks/usePromoCodes';
import { PromoCodeFilters as PromoCodeFiltersType } from '../types/promoCode';
import { PROMO_CODES_CURSOR_SESSION_KEY } from '../constants/promoCodeCursorSessionKey';
import { PromoCodeDiscountType } from '../types/promoCode';
import { EditPromoCodeDialog } from './PromoCodeDialog';
import { RemovePromoCodeDialog } from './RemovePromoCodeDialog';
import { ListTotalsLabel } from '~/components/ListTotalsLabel';

interface PromoCodesListProps {
  filters?: PromoCodeFiltersType;
}

const getStatusBadgeVariant = (isActive: boolean) =>
  isActive ? 'success' : 'secondary';

const formatDiscount = (discountType: string, value: number) => {
  if (discountType === PromoCodeDiscountType.PERCENT) {
    return `${value}%`;
  }
  return `${value}`;
};

export const PromoCodesList = ({ filters }: PromoCodesListProps) => {
  const {
    promoCodes,
    handleFetchMore,
    loading,
    pageInfo,
    filteredTotalCount,
    overallTotalCount,
  } = usePromoCodes(filters);
  const [selectedPromoCodeId, setSelectedPromoCodeId] = useState<string | null>(
    null,
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  const columns: ColumnDef<{
    _id: string;
    code: string;
    discountType: string;
    value: number;
    isCompanyTag: boolean;
    validFrom?: string;
    validTo?: string;
    usageLimit?: number;
    usedCount: number;
    isActive: boolean;
    createdAt: string;
  }>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ cell }) => (
        <RecordTableInlineCell className="font-mono font-medium">
          {cell.getValue() as string}
        </RecordTableInlineCell>
      ),
    },
    {
      accessorKey: 'discountType',
      header: 'Discount',
      cell: ({ row }) => {
        const discountType = row.original.discountType;
        const value = row.original.value;
        return (
          <RecordTableInlineCell>
            {formatDiscount(discountType, value)}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'validFrom',
      header: 'Valid From',
      cell: ({ cell }) => {
        const value = cell.getValue() as string | undefined;
        return (
          <RecordTableInlineCell className="text-xs">
            {value ? (
              <RelativeDateDisplay value={value} asChild>
                <RelativeDateDisplay.Value value={value} />
              </RelativeDateDisplay>
            ) : (
              '—'
            )}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'validTo',
      header: 'Valid To',
      cell: ({ cell }) => {
        const value = cell.getValue() as string | undefined;
        return (
          <RecordTableInlineCell className="text-xs">
            {value ? (
              <RelativeDateDisplay value={value} asChild>
                <RelativeDateDisplay.Value value={value} />
              </RelativeDateDisplay>
            ) : (
              '—'
            )}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'usageLimit',
      header: 'Usage',
      cell: ({ row }) => {
        const usedCount = row.original.usedCount;
        const usageLimit = row.original.usageLimit;
        const label =
          usageLimit != null ? `${usedCount} / ${usageLimit}` : `${usedCount}`;
        return (
          <RecordTableInlineCell className="text-xs">
            {label}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'isCompanyTag',
      header: 'Audience',
      cell: ({ cell }) => {
        const isCompanyTag = cell.getValue() as boolean;
        return (
          <RecordTableInlineCell>
            <Badge variant={isCompanyTag ? 'default' : 'secondary'}>
              {isCompanyTag ? 'B2B' : 'B2C'}
            </Badge>
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
            <Badge variant={getStatusBadgeVariant(isActive)}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ cell }) => (
        <RecordTableInlineCell className="text-xs">
          <RelativeDateDisplay value={cell.getValue() as string} asChild>
            <RelativeDateDisplay.Value value={cell.getValue() as string} />
          </RelativeDateDisplay>
        </RecordTableInlineCell>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const promoCode = row.original;
        return (
          <RecordTableInlineCell>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPromoCodeId(promoCode._id);
                  setEditDialogOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPromoCodeId(promoCode._id);
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
        data={promoCodes || []}
        className="m-3"
      >
        <RecordTable.CursorProvider
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          dataLength={promoCodes?.length}
          sessionKey={PROMO_CODES_CURSOR_SESSION_KEY}
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

      {selectedPromoCodeId && (
        <>
          <EditPromoCodeDialog
            promoCodeId={selectedPromoCodeId}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onClose={() => {
              setEditDialogOpen(false);
              setSelectedPromoCodeId(null);
            }}
          />
          <RemovePromoCodeDialog
            promoCodeId={selectedPromoCodeId}
            open={removeDialogOpen}
            onOpenChange={setRemoveDialogOpen}
            onClose={() => {
              setRemoveDialogOpen(false);
              setSelectedPromoCodeId(null);
            }}
          />
        </>
      )}
    </>
  );
};
