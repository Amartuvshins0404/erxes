import React, { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  IconBuilding,
  IconCalendar,
  IconFlame,
  IconUsers,
} from '@tabler/icons-react';
import { Input, Select } from 'erxes-ui';
import { endOfDay, format, startOfDay } from 'date-fns';
import { ONE_FIT_DASHBOARD_STATS } from '~/modules/dashboard/graphql/dashboardQueries';
import { useOneFitMode } from '~/modules/config/hooks/useOneFitMode';
import { BookingStatusChartSection } from '~/components/dashboard/main-indicators-dashboard/BookingStatusChartSection';
import { CategoryDistributionSection } from '~/components/dashboard/main-indicators-dashboard/CategoryDistributionSection';
import { CompanyCreditUsageSection } from '~/components/dashboard/main-indicators-dashboard/CompanyCreditUsageSection';
import { KpiCard } from '~/components/dashboard/main-indicators-dashboard/KpiCard';
import { KpiSkeleton } from '~/components/dashboard/main-indicators-dashboard/KpiSkeleton';
import { PackageDetailsTableSection } from '~/components/dashboard/main-indicators-dashboard/PackageDetailsTableSection';
import { SalesDistributionCard } from '~/components/dashboard/main-indicators-dashboard/SalesDistributionCard';
import { UserGrowthChartSection } from '~/components/dashboard/main-indicators-dashboard/UserGrowthChartSection';
import {
  type B2bB2cSalesStats,
  type BookingStatusDayRow,
  type CategoryDistributionItem,
  type CompanyUserStatItem,
  type DashboardPreset,
  type PackageStatItem,
  type UserGrowthMonthRow,
} from '~/components/dashboard/main-indicators-dashboard/types';
import {
  getRangeByPreset,
  parseDateInputValue,
  toDateInputValue,
} from '~/components/dashboard/main-indicators-dashboard/utils';

export function MainIndicatorsDashboard() {
  const { mode, loading: modeLoading } = useOneFitMode();
  const isMaster = mode === 'master';

  const [preset, setPreset] = useState<DashboardPreset>('1w');
  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<string[]>(
    [],
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string>('all');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const range = useMemo(() => getRangeByPreset(preset), [preset]);
  const [startDate, setStartDate] = useState<string>(
    toDateInputValue(range.from),
  );
  const [endDate, setEndDate] = useState<string>(toDateInputValue(range.to));
  const from = useMemo(() => {
    const parsedDate = parseDateInputValue(startDate);
    if (!parsedDate) {
      return range.from;
    }

    return startOfDay(parsedDate);
  }, [range.from, startDate]);
  const to = useMemo(() => {
    const parsedDate = parseDateInputValue(endDate);
    if (!parsedDate) {
      return range.to;
    }

    return endOfDay(parsedDate);
  }, [endDate, range.to]);

  const { data, loading, error } = useQuery(ONE_FIT_DASHBOARD_STATS, {
    variables: {
      startDate: from.toISOString(),
      endDate: to.toISOString(),
      planId: selectedPlanId === 'all' ? null : selectedPlanId,
    },
    skip: !isMaster || modeLoading,
    fetchPolicy: 'cache-and-network',
  });

  const stats = data?.oneFitDashboardStats;
  const categoryDistribution = (stats?.categoryDistribution ||
    []) as CategoryDistributionItem[];
  const rootLevelCategoryDistribution = useMemo(() => {
    if (!categoryDistribution.length) {
      return [];
    }

    const minDepth = Math.min(
      ...categoryDistribution.map((item) => item.depth),
    );

    return categoryDistribution.filter((item) => item.depth === minDepth);
  }, [categoryDistribution]);
  const packageStats = (stats?.packageStats || []) as PackageStatItem[];
  const categoryPlanOptions = useMemo(
    () =>
      packageStats
        .map((item) => ({
          value: item.planId,
          label: item.planName,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [packageStats],
  );
  const companyUserStats = (stats?.companyUserStats ||
    []) as CompanyUserStatItem[];
  const companyFilterOptions = useMemo(() => {
    const uniqueCompanies = Array.from(
      new Map(
        companyUserStats.map((item) => [item.companyId, item.companyName]),
      ).entries(),
    )
      .map(([companyId, companyName]) => ({ companyId, companyName }))
      .sort((a, b) => a.companyName.localeCompare(b.companyName));

    return uniqueCompanies;
  }, [companyUserStats]);
  const b2bB2cSales = stats?.b2bB2cSales as B2bB2cSalesStats | undefined;
  const categoryById = useMemo(
    () =>
      new Map(
        categoryDistribution.map((category) => [category.categoryId, category]),
      ),
    [categoryDistribution],
  );
  const categoryChildrenByParentId = useMemo(() => {
    const result = new Map<string, number>();

    for (const category of categoryDistribution) {
      if (!category.parentId) {
        continue;
      }

      const prevCount = result.get(category.parentId) || 0;
      result.set(category.parentId, prevCount + 1);
    }

    return result;
  }, [categoryDistribution]);
  const visibleCategoryDistribution = useMemo(() => {
    const collapsedIds = new Set(collapsedCategoryIds);

    return categoryDistribution.filter((category) => {
      let parentId = category.parentId;

      while (parentId) {
        if (collapsedIds.has(parentId)) {
          return false;
        }

        parentId = categoryById.get(parentId)?.parentId;
      }

      return true;
    });
  }, [categoryById, categoryDistribution, collapsedCategoryIds]);
  const categoryChartSource = useMemo(() => {
    if (!selectedCategoryId) {
      return rootLevelCategoryDistribution;
    }

    if (collapsedCategoryIds.includes(selectedCategoryId))
      return rootLevelCategoryDistribution;

    const children = categoryDistribution.filter(
      (category) => category.parentId === selectedCategoryId,
    );

    if (children.length) {
      return children;
    }

    const selectedCategory = categoryDistribution.filter(
      (category) => category.categoryId === selectedCategoryId,
    );

    return selectedCategory.length
      ? selectedCategory
      : rootLevelCategoryDistribution;
  }, [
    selectedCategoryId,
    categoryDistribution,
    collapsedCategoryIds,
    rootLevelCategoryDistribution,
  ]);
  const categoryChartItems = useMemo(() => {
    const chartTotal = categoryChartSource.reduce(
      (total, category) => total + category.count,
      0,
    );

    return categoryChartSource.slice(0, 8).map((category) => ({
      ...category,
      percent: chartTotal > 0 ? (category.count / chartTotal) * 100 : 0,
    }));
  }, [categoryChartSource]);
  const selectedCategoryLabel = useMemo(() => {
    if (!selectedCategoryId) {
      return 'Бүх категори';
    }

    const selected = categoryDistribution.find(
      (category) => category.categoryId === selectedCategoryId,
    );

    return selected?.label || 'Бүх категори';
  }, [categoryDistribution, selectedCategoryId]);

  const userGrowthByMonth = (stats?.userGrowthByMonth ||
    []) as UserGrowthMonthRow[];
  const bookingStatusByDay = (stats?.bookingStatusByDay ||
    []) as BookingStatusDayRow[];

  const rangeLabel =
    from && to
      ? `${format(from, 'MMM dd, yyyy')} - ${format(to, 'MMM dd, yyyy')}`
      : 'Select range';

  const toggleCollapse = (categoryId: string) => {
    setCollapsedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };
  const handleCategoryToggle = (categoryId: string, hasChildren: boolean) => {
    if (!hasChildren) {
      return;
    }

    const isCurrentlyCollapsed = collapsedCategoryIds.includes(categoryId);
    if (!isCurrentlyCollapsed && selectedCategoryId === categoryId) {
      setSelectedCategoryId(null);
    }

    toggleCollapse(categoryId);
  };

  if (modeLoading) {
    return null;
  }

  if (!isMaster) {
    return null;
  }

  return (
    <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Үндсэн үзүүлэлтүүд
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Шүүлт:</span>
          <div className="flex items-center gap-2">
            <Select
              value={preset}
              onValueChange={(value) => {
                const selectedPreset = value as DashboardPreset;
                const selectedRange = getRangeByPreset(selectedPreset);
                setPreset(selectedPreset);
                setStartDate(toDateInputValue(selectedRange.from));
                setEndDate(toDateInputValue(selectedRange.to));
              }}
            >
              <Select.Trigger className="min-w-[220px] border-gray-200">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="1w">1 week ago</Select.Item>
                <Select.Item value="2w">2 weeks ago</Select.Item>
                <Select.Item value="1m">1 month ago</Select.Item>
                <Select.Item value="2m">2 months ago</Select.Item>
                <Select.Item value="1y">1 year ago</Select.Item>
              </Select.Content>
            </Select>
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value || '')}
              className="w-[170px]"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value || '')}
              className="w-[170px]"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600">
          Unable to load dashboard statistics. Please try again.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {loading && !stats ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              title="Нийт хэрэглэгчид"
              subtitle="ONEFIT хэрэглэсэн"
              metric={stats?.totalOneFitUsers}
              icon={IconUsers}
            />
            <KpiCard
              title="Идэвхтэй хэрэглэгчид"
              subtitle="Сонгосон хугацаанд"
              metric={stats?.activeUsersInPeriod}
              icon={IconFlame}
            />
            <KpiCard
              title="B2B байгууллага"
              subtitle="Идэвхтэй компани"
              metric={stats?.b2bOrganizationsActive}
              icon={IconBuilding}
            />
            <KpiCard
              title="Шинэ хэрэглэгчид"
              subtitle="Сонгосон хугацаанд"
              metric={stats?.newUsersInPeriod}
              icon={IconUsers}
            />
            <KpiCard
              title="Дундаж арр зочилт"
              subtitle="Нэг хэрэглэгчид"
              metric={stats?.averageBookingsPerActiveUserInPeriod}
              icon={IconCalendar}
              valueIsAverage
            />
          </>
        )}
      </div>

      <BookingStatusChartSection
        loading={loading}
        hasStats={Boolean(stats)}
        rangeLabel={rangeLabel}
        bookingStatusByDay={bookingStatusByDay}
      />

      <UserGrowthChartSection
        loading={loading}
        hasStats={Boolean(stats)}
        userGrowthByMonth={userGrowthByMonth}
      />

      <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SalesDistributionCard
          loading={loading}
          hasStats={Boolean(stats)}
          sales={b2bB2cSales}
        />
        <CategoryDistributionSection
          loading={loading}
          hasStats={Boolean(stats)}
          selectedPlanId={selectedPlanId}
          onSelectedPlanIdChange={setSelectedPlanId}
          categoryPlanOptions={categoryPlanOptions}
          categoryDistribution={categoryDistribution}
          categoryDropdownOpen={categoryDropdownOpen}
          onCategoryDropdownOpenChange={setCategoryDropdownOpen}
          selectedCategoryId={selectedCategoryId}
          onSelectedCategoryIdChange={setSelectedCategoryId}
          collapsedCategoryIds={collapsedCategoryIds}
          onToggleCategory={handleCategoryToggle}
          categoryChildrenByParentId={categoryChildrenByParentId}
          visibleCategoryDistribution={visibleCategoryDistribution}
          selectedCategoryLabel={selectedCategoryLabel}
          categoryChartItems={categoryChartItems}
        />
      </div>
      <PackageDetailsTableSection
        loading={loading}
        hasStats={Boolean(stats)}
        packageStats={packageStats}
      />
      <CompanyCreditUsageSection
        loading={loading}
        hasStats={Boolean(stats)}
        selectedCompanyId={selectedCompanyId}
        onSelectedCompanyIdChange={setSelectedCompanyId}
        companyFilterOptions={companyFilterOptions}
        companyUserStats={companyUserStats}
      />
    </section>
  );
}
