import { useMemo, useState } from 'react';
import { Select, Skeleton, cn } from 'erxes-ui';
import { type CompanyUserStatItem } from '~/components/dashboard/main-indicators-dashboard/types';

interface CompanyFilterOption {
  companyId: string;
  companyName: string;
}

interface CompanyCreditUsageSectionProps {
  loading: boolean;
  hasStats: boolean;
  selectedCompanyId: string;
  onSelectedCompanyIdChange: (value: string) => void;
  companyFilterOptions: CompanyFilterOption[];
  companyUserStats: CompanyUserStatItem[];
}

export function CompanyCreditUsageSection({
  loading,
  hasStats,
  selectedCompanyId,
  onSelectedCompanyIdChange,
  companyFilterOptions,
  companyUserStats,
}: CompanyCreditUsageSectionProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('all');
  const hasCompanyUserStats = companyUserStats.length > 0;
  const companyFilteredUserStats =
    selectedCompanyId === 'all'
      ? companyUserStats
      : companyUserStats.filter((item) => item.companyId === selectedCompanyId);
  const planFilterOptions = useMemo(
    () =>
      Array.from(
        new Map(
          companyFilteredUserStats.map((item) => [item.planId, item.planName]),
        ).entries(),
      )
        .map(([planId, planName]) => ({ planId, planName }))
        .sort((a, b) => a.planName.localeCompare(b.planName)),
    [companyFilteredUserStats],
  );
  const filteredCompanyUserStats =
    selectedPlanId === 'all'
      ? companyFilteredUserStats
      : companyFilteredUserStats.filter(
          (item) => item.planId === selectedPlanId,
        );
  const hasFilteredCompanyUserStats = filteredCompanyUserStats.length > 0;

  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900">
          Компанийн хэрэглэгчийн кредит ашиглалт
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedCompanyId}
            onValueChange={(value) => {
              onSelectedCompanyIdChange(value);
              setSelectedPlanId('all');
            }}
          >
            <Select.Trigger className="min-w-[220px] border-gray-200">
              <Select.Value placeholder="Компани сонгох" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">Бүх компани</Select.Item>
              {companyFilterOptions.map((company) => (
                <Select.Item key={company.companyId} value={company.companyId}>
                  {company.companyName}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <Select.Trigger className="min-w-[220px] border-gray-200">
              <Select.Value placeholder="Багц сонгох" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">Бүх багц</Select.Item>
              {planFilterOptions.map((plan) => (
                <Select.Item key={plan.planId} value={plan.planId}>
                  {plan.planName}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
      </div>

      {loading && !hasStats ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !hasCompanyUserStats ? (
        <p className="mt-4 text-sm text-gray-500">
          Компанийн хэрэглэгчийн кредитийн өгөгдөл алга байна.
        </p>
      ) : !hasFilteredCompanyUserStats ? (
        <p className="mt-4 text-sm text-gray-500">
          Сонгосон компанид тохирох кредитийн өгөгдөл алга байна.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-3 pr-4 font-medium">Компани</th>
                <th className="py-3 pr-4 font-medium">Хэрэглэгч</th>
                <th className="py-3 pr-4 font-medium">Багц</th>
                <th className="py-3 pr-4 font-medium">
                  Сүүлийн худалдан авалт
                </th>
                <th className="py-3 pr-4 font-medium">Багцын кредит</th>
                <th className="py-3 pr-4 font-medium">
                  Сүүлийн худалдан <br />
                  авалтын өмнөх үлдэгдэл
                </th>
                <th className="py-3 pr-4 font-medium">
                  Сүүлийн expiration <br />
                  кредит дүн
                </th>
                <th className="py-3 pr-4 font-medium">Одоогийн кредит</th>
                <th className="py-3 pr-4 font-medium">Ашигласан кредит</th>
                <th className="py-3 font-medium">Ашиглалтын хувь</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCompanyUserStats.map((item) => {
                const safeUsedCredit = Math.max(item.usedCredit || 0, 0);
                const usagePercent =
                  item.planCredit > 0
                    ? Math.min(
                        Math.max((safeUsedCredit / item.planCredit) * 100, 0),
                        100,
                      )
                    : 0;
                const usageBarColorClass =
                  usagePercent >= 80
                    ? 'bg-red-500'
                    : usagePercent >= 50
                      ? 'bg-amber-500'
                      : 'bg-emerald-500';
                const usageTextColorClass =
                  usagePercent >= 80
                    ? 'text-red-600'
                    : usagePercent >= 50
                      ? 'text-amber-600'
                      : 'text-emerald-600';

                return (
                  <tr
                    key={`${item.companyId}-${item.userId}-${item.planId}`}
                    className="text-gray-900"
                  >
                    <td className="py-3 pr-4">{item.companyName}</td>
                    <td className="py-3 pr-4">
                      {item.userName}
                      {item.userPhone ? ` (${item.userPhone})` : ''}
                    </td>
                    <td className="py-3 pr-4">{item.planName}</td>
                    <td className="py-3 pr-4 tabular-nums">
                      {item.lastPurchaseDate
                        ? new Date(item.lastPurchaseDate).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {Math.round(item.planCredit || 0).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {Math.round(
                        item.creditBeforeLastPurchase || 0,
                      ).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {Math.round(
                        item.lastExpirationCredit || 0,
                      ).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {Math.round(item.currentCredit || 0).toLocaleString()}
                    </td>
                    <td className="py-3 tabular-nums">
                      {Math.round(safeUsedCredit).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <div className="flex min-w-[180px] items-center gap-3">
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className={cn(
                              'h-2 rounded-full',
                              usageBarColorClass,
                            )}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            'min-w-[40px] text-right tabular-nums font-medium',
                            usageTextColorClass,
                          )}
                        >
                          {Math.round(usagePercent)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
