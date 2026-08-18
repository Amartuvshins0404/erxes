import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  Badge,
  Button,
  RecordTable,
  RecordTableInlineCell,
  ToggleGroup,
} from 'erxes-ui';
import { IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react';
import { ONE_FIT_SCHEDULE_COVERAGE_SUMMARY } from '~/modules/schedule/graphql/scheduleCoverageQueries';
import type { ScheduleTemplateFilters } from '~/modules/schedule/types/schedule';
import { SelectProviderSearchable } from '~/modules/provider/components/SelectProviderSearchable';
import { ONE_FIT_ACTIVITY_TYPES } from '~/modules/activity-type/graphql/activityTypeQueries';
import { getLocalizedString } from '~/modules/activity-type/utils/localization';
import { FilterField } from '~/components/shared/FilterField';
import { OneFitFilterBase } from '~/components/OneFitFilterBase';
import { ScheduleTemplateDialog } from '~/modules/schedule/components/ScheduleTemplateDialog';

type CoverageMode = 'provider' | 'providerActivity';

interface ScheduleCoverageTabProps {
  initialFilters?: ScheduleTemplateFilters;
}

interface CoverageRow {
  providerId: string;
  provider?: {
    _id: string;
    businessName?: {
      en?: string;
      mn?: string;
    };
  };
  providerIsActive: boolean;
  providerStatus: string | null;
  templateId?: string | null;
  activityTypeId?: string | null;
  activityType?: {
    _id: string;
    name?: {
      en?: string;
      mn?: string;
    };
  } | null;
  year: number;
  month: number;
  hasTemplate: boolean;
  hasAnySchedule: boolean;
  missingDaysCount: number;
}

export function ScheduleCoverageTab({
  initialFilters,
}: ScheduleCoverageTabProps) {
  const now = new Date();
  const [mode, setMode] = useState<CoverageMode>('provider');
  const [providerId, setProviderId] = useState<string | undefined>(
    initialFilters?.providerId,
  );
  const [activityTypeId, setActivityTypeId] = useState<string | undefined>();
  const [year, setYear] = useState<number>(
    initialFilters?.year ?? now.getFullYear(),
  );
  const [month, setMonth] = useState<number>(
    initialFilters?.month ?? now.getMonth() + 1,
  );
  const [providerStatus, setProviderStatus] = useState<
    'all' | 'active' | 'inactive'
  >('active');
  const [approvalStatus, setApprovalStatus] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('approved');
  const [nameFilter, setNameFilter] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [dialogDefaults, setDialogDefaults] = useState<{
    providerId?: string;
    year?: number;
    month?: number;
    activityTypeId?: string | null;
  }>({});

  const { data: activityTypesData } = useQuery(ONE_FIT_ACTIVITY_TYPES, {
    variables: {
      providerId: providerId || undefined,
      isActive: true,
    },
    skip: !providerId,
  });
  const activityTypes = activityTypesData?.oneFitActivityTypes?.list ?? [];

  const { data, loading, error, refetch } = useQuery(
    ONE_FIT_SCHEDULE_COVERAGE_SUMMARY,
    {
      variables: {
        providerId: providerId || null,
        activityTypeId:
          mode === 'providerActivity' ? activityTypeId || null : null,
        year,
        month,
      },
    },
  );

  const rows: CoverageRow[] = useMemo(
    () => data?.oneFitScheduleCoverageSummary ?? [],
    [data],
  );

  function handleResetToCurrentMonth() {
    const current = new Date();
    setYear(current.getFullYear());
    setMonth(current.getMonth() + 1);
    void refetch({
      providerId: providerId || null,
      activityTypeId:
        mode === 'providerActivity' ? activityTypeId || null : null,
      year: current.getFullYear(),
      month: current.getMonth() + 1,
    });
  }

  function getProviderName(row: CoverageRow): string {
    const businessName = row.provider?.businessName;
    if (!businessName) return row.providerId;
    return businessName.en || businessName.mn || row.providerId;
  }

  function getActivityTypeName(row: CoverageRow): string {
    if (row.activityType) {
      return getLocalizedString(row.activityType.name);
    }
    if (row.activityTypeId) {
      return row.activityTypeId;
    }
    return '—';
  }

  function handleStatusClick(row: CoverageRow) {
    if (row.hasTemplate && row.templateId) {
      setDialogMode('edit');
      setSelectedTemplateId(row.templateId);
      setDialogOpen(true);
      return;
    }

    setDialogMode('create');
    setSelectedTemplateId(null);
    setDialogDefaults({
      providerId: row.providerId,
      year: row.year,
      month: row.month,
      activityTypeId: row.activityTypeId ?? null,
    });
    setDialogOpen(true);
  }

  const filteredRows = useMemo(() => {
    let result: CoverageRow[] =
      mode === 'provider'
        ? rows.filter((row) => !row.activityTypeId)
        : rows.filter((row) => row.activityTypeId);

    if (mode === 'providerActivity' && activityTypeId) {
      result = result.filter((row) => row.activityTypeId === activityTypeId);
    }

    if (providerStatus === 'active') {
      result = result.filter((row) => row.providerIsActive);
    } else if (providerStatus === 'inactive') {
      result = result.filter((row) => !row.providerIsActive);
    }

    if (approvalStatus !== 'all') {
      result = result.filter((row) => row.providerStatus === approvalStatus);
    }

    if (nameFilter.trim()) {
      const query = nameFilter.trim().toLowerCase();
      result = result.filter((row) => {
        const providerName = getProviderName(row).toLowerCase();
        const activityName = getActivityTypeName(row).toLowerCase();
        return providerName.includes(query) || activityName.includes(query);
      });
    }

    const sorted = [...result].sort((a, b) => {
      if (mode === 'providerActivity') {
        const providerCmp = (a.providerId ?? '').localeCompare(
          b.providerId ?? '',
        );
        if (providerCmp !== 0) return providerCmp;
      }

      const aHasSchedule = a.hasTemplate && a.hasAnySchedule;
      const bHasSchedule = b.hasTemplate && b.hasAnySchedule;

      if (aHasSchedule === bHasSchedule) {
        return a.missingDaysCount - b.missingDaysCount;
      }

      return aHasSchedule ? -1 : 1;
    });

    return sorted;
  }, [rows, mode, activityTypeId, providerStatus, approvalStatus, nameFilter]);

  const summary = useMemo(() => {
    const total = filteredRows.length;
    const covered = filteredRows.filter(
      (row) => row.hasTemplate && row.hasAnySchedule,
    ).length;

    return {
      total,
      covered,
    };
  }, [filteredRows]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Mode
            </span>
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(value) => {
                if (!value) return;
                setMode(value as CoverageMode);
              }}
              variant="outline"
              size="sm"
            >
              <ToggleGroup.Item value="provider">By provider</ToggleGroup.Item>
              <ToggleGroup.Item value="providerActivity">
                By provider + activity
              </ToggleGroup.Item>
            </ToggleGroup>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToCurrentMonth}
          >
            Reset to current month
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-64">
            <FilterField label="Search by name">
              <input
                type="text"
                placeholder="Filter by provider or activity type"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={nameFilter}
                onChange={(event) => setNameFilter(event.target.value)}
              />
            </FilterField>
          </div>
        </div>

        <OneFitFilterBase
          filters={{
            providerId,
            year,
            month,
          }}
          onFiltersChange={() => undefined}
        >
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <FilterField label="Provider">
              <SelectProviderSearchable
                value={providerId || ''}
                onValueChange={(value: string) =>
                  setProviderId(value || undefined)
                }
              />
            </FilterField>

            <FilterField label="Year">
              <input
                type="number"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={year}
                onChange={(event) =>
                  setYear(
                    event.target.value
                      ? Number.parseInt(event.target.value, 10)
                      : now.getFullYear(),
                  )
                }
              />
            </FilterField>

            <FilterField label="Month">
              <input
                type="number"
                min={1}
                max={12}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={month}
                onChange={(event) =>
                  setMonth(
                    event.target.value
                      ? Number.parseInt(event.target.value, 10)
                      : now.getMonth() + 1,
                  )
                }
              />
            </FilterField>

            <FilterField label="Provider status">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={providerStatus}
                onChange={(event) =>
                  setProviderStatus(
                    event.target.value as 'all' | 'active' | 'inactive',
                  )
                }
              >
                <option value="all">All providers</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </FilterField>

            <FilterField label="Approval status">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={approvalStatus}
                onChange={(event) =>
                  setApprovalStatus(
                    event.target.value as
                      | 'all'
                      | 'pending'
                      | 'approved'
                      | 'rejected',
                  )
                }
              >
                <option value="all">All approval statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </FilterField>

            {mode === 'providerActivity' && (
              <FilterField label="Activity Type">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={activityTypeId || '__all__'}
                  onChange={(event) =>
                    setActivityTypeId(
                      event.target.value === '__all__'
                        ? undefined
                        : event.target.value,
                    )
                  }
                >
                  <option value="__all__">All activity types</option>
                  {activityTypes.map((item: any) => (
                    <option key={item._id} value={item._id}>
                      {getLocalizedString(item.name)}
                    </option>
                  ))}
                </select>
              </FilterField>
            )}
          </div>
        </OneFitFilterBase>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">{summary.total}</span>
            <span>
              {mode === 'provider'
                ? 'providers in result'
                : 'provider + activity pairs'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">
              {summary.covered}
            </span>
            <span>covered</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="m-3 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          Failed to load schedule coverage: {error.message}
        </div>
      )}

      <div className="flex-1 min-h-0">
        <RecordTable.Provider
          columns={[
            {
              id: 'provider',
              header: 'Provider',
              cell: ({ row }) => {
                const record = row.original as CoverageRow;
                const isFirstForProvider =
                  mode !== 'providerActivity' ||
                  row.index === 0 ||
                  filteredRows[row.index - 1]?.providerId !== record.providerId;

                if (!isFirstForProvider) {
                  return (
                    <RecordTableInlineCell className="text-xs font-medium border-t-0" />
                  );
                }

                return (
                  <RecordTableInlineCell className="text-xs font-medium">
                    {getProviderName(record)}
                  </RecordTableInlineCell>
                );
              },
            },

            {
              id: 'activityType',
              header: 'Activity Type',
              cell: ({ row }) => {
                const record = row.original as CoverageRow;
                return (
                  <RecordTableInlineCell className="text-xs">
                    {getActivityTypeName(record)}
                  </RecordTableInlineCell>
                );
              },
            },
            {
              id: 'month',
              header: 'Month',
              cell: ({ row }) => {
                const record = row.original as CoverageRow;
                const date = new Date(record.year, record.month - 1, 1);
                const label = date.toLocaleString('default', {
                  month: 'long',
                  year: 'numeric',
                });
                return (
                  <RecordTableInlineCell className="text-xs font-medium">
                    {label}
                  </RecordTableInlineCell>
                );
              },
            },
            {
              id: 'status',
              header: 'Status',
              cell: ({ row }) => {
                const record = row.original as CoverageRow;
                if (!record.hasTemplate || !record.hasAnySchedule) {
                  return (
                    <RecordTableInlineCell>
                      <Badge
                        className="border-amber-500 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1 cursor-pointer"
                        variant="warning"
                        onClick={() => handleStatusClick(record)}
                      >
                        <IconAlertTriangle className="h-3 w-3" />
                        Missing schedule
                      </Badge>
                    </RecordTableInlineCell>
                  );
                }

                return (
                  <RecordTableInlineCell>
                    <Badge
                      className="border-emerald-600 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-1 cursor-pointer"
                      variant="success"
                      onClick={() => handleStatusClick(record)}
                    >
                      <IconCircleCheck className="h-3 w-3" />
                      Covered
                    </Badge>
                  </RecordTableInlineCell>
                );
              },
            },
            {
              id: 'providerMeta',
              header: 'Provider status / approval',
              cell: ({ row }) => {
                const record = row.original as CoverageRow;
                const approvalLabel = record.providerStatus ?? 'unknown';
                const approvalVariant =
                  approvalLabel === 'approved'
                    ? 'success'
                    : approvalLabel === 'pending'
                    ? 'warning'
                    : approvalLabel === 'rejected'
                    ? 'destructive'
                    : 'secondary';

                return (
                  <RecordTableInlineCell className="flex flex-wrap gap-1">
                    <Badge
                      variant={
                        record.providerIsActive ? 'success' : 'secondary'
                      }
                      className="text-[11px] px-2 py-0.5"
                    >
                      {record.providerIsActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge
                      variant={approvalVariant}
                      className="text-[11px] px-2 py-0.5"
                    >
                      {approvalLabel.charAt(0).toUpperCase() +
                        approvalLabel.slice(1)}
                    </Badge>
                  </RecordTableInlineCell>
                );
              },
            },
          ]}
          data={filteredRows}
          className="m-3"
        >
          <RecordTable>
            <RecordTable.Header />
            <RecordTable.Body>
              {loading && <RecordTable.RowSkeleton rows={20} />}
              <RecordTable.RowList />
            </RecordTable.Body>
          </RecordTable>
        </RecordTable.Provider>
      </div>
      {dialogMode && (
        <ScheduleTemplateDialog
          mode={dialogMode}
          templateId={
            dialogMode === 'edit' && selectedTemplateId
              ? selectedTemplateId
              : undefined
          }
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setDialogMode(null);
              setSelectedTemplateId(null);
            }
          }}
          onClose={() => {
            setDialogOpen(false);
            setDialogMode(null);
            setSelectedTemplateId(null);
            void refetch({
              providerId: providerId || null,
              activityTypeId:
                mode === 'providerActivity' ? activityTypeId || null : null,
              year,
              month,
            });
          }}
          initialProviderId={
            dialogMode === 'create' ? dialogDefaults.providerId : undefined
          }
          initialYear={
            dialogMode === 'create' ? dialogDefaults.year : undefined
          }
          initialMonth={
            dialogMode === 'create' ? dialogDefaults.month : undefined
          }
          initialActivityTypeId={
            dialogMode === 'create'
              ? dialogDefaults.activityTypeId ?? undefined
              : undefined
          }
        />
      )}
    </div>
  );
}
