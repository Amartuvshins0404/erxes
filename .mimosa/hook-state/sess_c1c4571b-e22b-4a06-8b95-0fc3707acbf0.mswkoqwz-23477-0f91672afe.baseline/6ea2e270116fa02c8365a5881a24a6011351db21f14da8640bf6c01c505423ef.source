import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  Button,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
  Sheet,
  Spinner,
} from 'erxes-ui';
import { useQuery } from '@apollo/client';
import { useOneFitCustomers } from '../hooks/useOneFitCustomers';
import {
  OneFitCustomerFilters,
  OneFitMembershipStatus,
} from '../types/onefitCustomer';
import { ONEFIT_CUSTOMERS_CURSOR_SESSION_KEY } from '../constants/onefitCustomerCursorSessionKey';
import { useState, useMemo } from 'react';
import { UpdateMembershipDialog } from './UpdateMembershipDialog';
import { UpdateCreditBalanceDialog } from './UpdateCreditBalanceDialog';
import { UpdateBookingPreferencesDialog } from './UpdateBookingPreferencesDialog';
import { ONE_FIT_MEMBERSHIP_PLANS } from '~/modules/membership/graphql/membershipPlanQueries';
import { CreateMembershipPurchaseDialog } from '~/modules/membership-purchase/components/CreateMembershipPurchaseDialog';
import { OneFitCustomerDetailContent } from './OneFitCustomerDetailContent';
import { useOneFitCustomerDetail } from '../hooks/useOneFitCustomerDetail';
import { ListTotalsLabel } from '~/components/ListTotalsLabel';

interface OneFitCustomersListProps {
  filters?: OneFitCustomerFilters;
}

type MembershipPlanOption = {
  _id: string;
  name: string;
  creditAmount?: number | null;
};

const getMembershipStatusBadgeVariant = (status?: OneFitMembershipStatus) => {
  switch (status) {
    case OneFitMembershipStatus.ACTIVE:
      return 'success';
    case OneFitMembershipStatus.EXPIRED:
      return 'destructive';
    case OneFitMembershipStatus.NONE:
      return 'secondary';
    default:
      return 'secondary';
  }
};

export const OneFitCustomersList = ({ filters }: OneFitCustomersListProps) => {
  const {
    customers,
    handleFetchMore,
    loading,
    pageInfo,
    filteredTotalCount,
    overallTotalCount,
  } = useOneFitCustomers(filters);
  const [paidNotActivatedSortDir, setPaidNotActivatedSortDir] = useState<
    'asc' | 'desc' | null
  >(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<
    'membership' | 'credit' | 'preferences' | 'purchase'
  >('membership');

  const openDetailSheet = (customerId: string) => {
    setSelectedCustomer(customerId);
    setDetailSheetOpen(true);
  };

  const closeDetailSheet = (open: boolean) => {
    setDetailSheetOpen(open);
    if (!open) setSelectedCustomer(null);
  };

  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  const {
    oneFitCustomer: detailCustomer,
    loading: detailLoading,
    refetch: refetchDetail,
  } = useOneFitCustomerDetail({
    variables: { _id: selectedCustomer ?? '' },
    skip: !selectedCustomer || !detailSheetOpen,
  });

  const detailCustomerName =
    detailCustomer?.firstName || detailCustomer?.lastName
      ? [detailCustomer?.firstName, detailCustomer?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim()
      : detailCustomer?.primaryEmail ||
        detailCustomer?.primaryPhone ||
        'Customer';

  // Fetch all membership plans to map IDs to names
  const { data: membershipPlansData } = useQuery(ONE_FIT_MEMBERSHIP_PLANS, {
    variables: { limit: 100 },
  });
  const membershipPlans: MembershipPlanOption[] =
    membershipPlansData?.oneFitMembershipPlans?.list || [];

  const membershipPlanMap = useMemo(() => {
    const map = new Map();
    membershipPlans.forEach((plan) => {
      map.set(plan._id, plan.name);
    });
    return map;
  }, [membershipPlans]);

  const membershipPlanCreditMap = useMemo(() => {
    const map = new Map();
    membershipPlans.forEach((plan) => {
      map.set(plan._id, Number(plan.creditAmount) || 0);
    });
    return map;
  }, [membershipPlans]);

  const sortedCustomers = useMemo(() => {
    const baseCustomers = customers || [];

    if (!paidNotActivatedSortDir) {
      return baseCustomers;
    }

    return [...baseCustomers].sort((a: any, b: any) => {
      const aCount = Number(a.oneFitPaidNotActivatedPurchasesCount) || 0;
      const bCount = Number(b.oneFitPaidNotActivatedPurchasesCount) || 0;

      if (paidNotActivatedSortDir === 'asc') {
        return aCount - bCount;
      }

      return bCount - aCount;
    });
  }, [customers, paidNotActivatedSortDir]);

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: 'firstName',
        header: 'Name',
        cell: ({ row }) => {
          const customer = row.original;
          const name =
            customer.firstName || customer.lastName
              ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
              : customer.primaryEmail || customer.primaryPhone || 'Unknown';
          return (
            <RecordTableInlineCell className="text-xs font-medium">
              <Button
                variant="link"
                className="p-0 h-auto text-xs font-medium"
                onClick={() => openDetailSheet(customer._id)}
              >
                {name}
              </Button>
            </RecordTableInlineCell>
          );
        },
      },
      {
        accessorKey: 'primaryEmail',
        header: 'Email',
        cell: ({ cell }) => {
          return (
            <RecordTableInlineCell className="text-xs text-muted-foreground">
              {(cell.getValue() as string) || '-'}
            </RecordTableInlineCell>
          );
        },
      },
      {
        accessorKey: 'primaryPhone',
        header: 'Phone',
        cell: ({ cell }) => {
          return (
            <RecordTableInlineCell className="text-xs text-muted-foreground">
              {(cell.getValue() as string) || '-'}
            </RecordTableInlineCell>
          );
        },
      },
      {
        accessorKey: 'oneFitMembershipPlanId',
        header: 'Membership Plan',
        cell: ({ row }) => {
          const planId = row.original.oneFitMembershipPlanId;
          const planName = planId ? membershipPlanMap.get(planId) : null;
          return (
            <RecordTableInlineCell className="text-xs font-medium">
              {planName || '-'}
            </RecordTableInlineCell>
          );
        },
      },
      {
        accessorKey: 'oneFitMembershipStatus',
        header: 'Membership Status',
        cell: ({ cell }) => {
          const status = cell.getValue() as OneFitMembershipStatus;
          return (
            <RecordTableInlineCell>
              <Badge
                variant={getMembershipStatusBadgeVariant(status)}
                className="capitalize"
              >
                {status || 'none'}
              </Badge>
            </RecordTableInlineCell>
          );
        },
      },
      {
        accessorKey: 'graceMode',
        header: 'Grace Mode',
        cell: ({ cell }) => {
          const isInGraceMode = Boolean(cell.getValue());
          return (
            <RecordTableInlineCell>
              <Badge variant={isInGraceMode ? 'warning' : 'secondary'}>
                {isInGraceMode ? 'On' : 'Off'}
              </Badge>
            </RecordTableInlineCell>
          );
        },
      },
      {
        accessorKey: 'oneFitMembershipExpiresAt',
        header: 'Membership Expires',
        cell: ({ cell }) => {
          const date = cell.getValue() as string;
          if (!date) return <RecordTableInlineCell>-</RecordTableInlineCell>;
          return (
            <RecordTableInlineCell>
              <RelativeDateDisplay value={date}>
                <RelativeDateDisplay.Value value={date} />
              </RelativeDateDisplay>
            </RecordTableInlineCell>
          );
        },
      },
      {
        accessorKey: 'oneFitCurrentCreditBalance',
        header: 'Credit Balance',
        cell: ({ cell }) => {
          const balance = cell.getValue() as number;
          return (
            <RecordTableInlineCell className="text-xs font-medium">
              {balance ?? 0}
            </RecordTableInlineCell>
          );
        },
      },
      {
        accessorKey: 'oneFitTotalCreditsEarned',
        header: 'Total Credits Earned',
        cell: ({ cell }) => {
          const earned = cell.getValue() as number;
          return (
            <RecordTableInlineCell className="text-xs font-medium text-green-600">
              {earned ?? 0}
            </RecordTableInlineCell>
          );
        },
      },
      {
        accessorKey: 'oneFitTotalCreditsUsed',
        header: 'Total Credits Used',
        cell: ({ cell }) => {
          const used = cell.getValue() as number;
          return (
            <RecordTableInlineCell className="text-xs font-medium text-red-600">
              {used ?? 0}
            </RecordTableInlineCell>
          );
        },
      },
      {
        id: 'creditUsagePercent',
        header: 'Credit Usage ',
        cell: ({ row }) => {
          const planId = row.original.oneFitMembershipPlanId;
          const currentPlanCredit = planId
            ? Number(membershipPlanCreditMap.get(planId)) || 0
            : 0;
          const currentBalance =
            Number(row.original.oneFitCurrentCreditBalance) || 0;
          const used = Math.max(0, currentPlanCredit - currentBalance);
          const usagePercentRaw =
            currentPlanCredit > 0 ? (used / currentPlanCredit) * 100 : 0;
          const usagePercent = Math.max(0, Math.min(100, usagePercentRaw));
          const usageBarColor =
            usagePercent >= 80
              ? '#ef4444'
              : usagePercent >= 50
                ? '#f59e0b'
                : '#10b981';
          const fillWidth = usagePercent > 0 ? Math.max(2, usagePercent) : 0;

          return (
            <RecordTableInlineCell>
              <div
                className="flex items-center gap-2"
                style={{ width: 120, minWidth: 120 }}
              >
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${fillWidth}%`,
                      backgroundColor: usageBarColor,
                    }}
                  />
                </div>
                <span className="min-w-[40px] text-right text-xs font-medium tabular-nums">
                  {Math.round(usagePercent)}%
                </span>
              </div>
            </RecordTableInlineCell>
          );
        },
      },
      {
        accessorKey: 'oneFitTotalBookings',
        header: 'Total Bookings',
        cell: ({ cell }) => {
          const count = cell.getValue() as number;
          return (
            <RecordTableInlineCell className="text-xs font-medium">
              {count ?? 0}
            </RecordTableInlineCell>
          );
        },
      },
      {
        accessorKey: 'oneFitPaidNotActivatedPurchasesCount',
        header: () => (
          <button
            type="button"
            className="relative z-20 pointer-events-auto inline-flex items-center gap-1 text-xs font-medium"
            onClick={() =>
              setPaidNotActivatedSortDir((prev) =>
                prev === 'desc' ? 'asc' : prev === 'asc' ? null : 'desc',
              )
            }
          >
            <span>Paid Not Activated</span>
            <span className="text-muted-foreground">
              {paidNotActivatedSortDir === 'desc'
                ? '↓'
                : paidNotActivatedSortDir === 'asc'
                  ? '↑'
                  : '↕'}
            </span>
          </button>
        ),
        cell: ({ cell }) => {
          const count = cell.getValue() as number;
          return (
            <RecordTableInlineCell className="text-xs font-medium">
              {count ?? 0}
            </RecordTableInlineCell>
          );
        },
      },
      {
        accessorKey: 'oneFitLastBookingDate',
        header: 'Last Booking',
        cell: ({ cell }) => {
          const date = cell.getValue() as string;
          if (!date) return <RecordTableInlineCell>-</RecordTableInlineCell>;
          return (
            <RecordTableInlineCell>
              <RelativeDateDisplay value={date}>
                <RelativeDateDisplay.Value value={date} />
              </RelativeDateDisplay>
            </RecordTableInlineCell>
          );
        },
      },
      // {
      //   id: 'actions',
      //   header: 'Actions',
      //   cell: ({ row }) => {
      //     const customer = row.original;

      //     return (
      //       <RecordTableInlineCell>
      //         <div className="flex gap-2">
      //           <Button
      //             variant="outline"
      //             size="sm"
      //             onClick={() => {
      //               setSelectedCustomer(customer._id);
      //               setActionType('purchase');
      //               setPurchaseDialogOpen(true);
      //             }}
      //           >
      //             Purchase membership
      //           </Button>
      //         </div>
      //       </RecordTableInlineCell>
      //     );
      //   },
      // },
    ],
    [membershipPlanMap, membershipPlanCreditMap, paidNotActivatedSortDir],
  );

  return (
    <>
      <ListTotalsLabel
        filteredTotalCount={filteredTotalCount}
        overallTotalCount={overallTotalCount}
        loading={loading}
      />
      <RecordTable.Provider
        columns={columns}
        data={sortedCustomers}
        stickyColumns={['firstName']}
        className="m-3 overflow-x-auto"
      >
        <RecordTable.CursorProvider
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          dataLength={customers?.length}
          sessionKey={ONEFIT_CUSTOMERS_CURSOR_SESSION_KEY}
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
      <Sheet open={detailSheetOpen} onOpenChange={closeDetailSheet}>
        <Sheet.View className="w-full sm:max-w-[min(56rem,calc(100vw-2rem))]">
          <Sheet.Header>
            <Sheet.Title>{detailCustomerName}</Sheet.Title>
            <Sheet.Close />
          </Sheet.Header>
          <Sheet.Content className="flex-auto overflow-y-auto">
            {selectedCustomer ? (
              <>
                <div className="p-4 flex flex-wrap gap-2 border-b">
                  {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActionType('membership');
                      setMembershipDialogOpen(true);
                    }}
                  >
                    Update membership
                  </Button> */}
                  {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActionType('credit');
                      setCreditDialogOpen(true);
                    }}
                  >
                    Update credit
                  </Button> */}
                  {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActionType('preferences');
                      setPreferencesDialogOpen(true);
                    }}
                  >
                    Update preferences
                  </Button> */}
                  {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActionType('purchase');
                      setPurchaseDialogOpen(true);
                    }}
                  >
                    Purchase membership
                  </Button> */}
                </div>
                <div className="p-4">
                  {detailLoading && !detailCustomer ? (
                    <Spinner containerClassName="py-20" />
                  ) : (
                    <OneFitCustomerDetailContent
                      customerId={selectedCustomer}
                      oneFitCustomer={detailCustomer}
                      loading={detailLoading}
                      refetch={refetchDetail}
                      bookingsScrollable
                    />
                  )}
                </div>
              </>
            ) : null}
          </Sheet.Content>
        </Sheet.View>
      </Sheet>
      {selectedCustomer && (
        <>
          <UpdateMembershipDialog
            customerId={selectedCustomer}
            open={membershipDialogOpen && actionType === 'membership'}
            onOpenChange={setMembershipDialogOpen}
          />
          <UpdateCreditBalanceDialog
            customerId={selectedCustomer}
            open={creditDialogOpen && actionType === 'credit'}
            onOpenChange={setCreditDialogOpen}
          />
          <UpdateBookingPreferencesDialog
            customerId={selectedCustomer}
            open={preferencesDialogOpen && actionType === 'preferences'}
            onOpenChange={setPreferencesDialogOpen}
          />
          <CreateMembershipPurchaseDialog
            defaultUserId={selectedCustomer}
            open={purchaseDialogOpen && actionType === 'purchase'}
            onOpenChange={setPurchaseDialogOpen}
          />
        </>
      )}
    </>
  );
};
