import { Skeleton } from 'erxes-ui';
import { type PackageStatItem } from '~/components/dashboard/main-indicators-dashboard/types';

interface PackageDetailsTableSectionProps {
  loading: boolean;
  hasStats: boolean;
  packageStats: PackageStatItem[];
}

export function PackageDetailsTableSection({
  loading,
  hasStats,
  packageStats,
}: PackageDetailsTableSectionProps) {
  const hasPackageData = packageStats.length > 0;

  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-base font-semibold text-gray-900">
        Багц бүрийн дэлгэрэнгүй мэдээлэл
      </h3>

      {loading && !hasStats ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !hasPackageData ? (
        <p className="mt-4 text-sm text-gray-500">
          Идэвхтэй багцын өгөгдөл алга байна.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-3 pr-4 font-medium">Багц нэр</th>
                <th className="py-3 pr-4 font-medium">Идэвхтэй хэрэглэгч</th>
                <th className="py-3 pr-4 font-medium">Одоогийн кредит</th>
                <th className="py-3 pr-4 font-medium">Нийт кредит</th>
                <th className="py-3 pr-4 font-medium">Кредит ашиглалт</th>
                <th className="py-3 pr-4 font-medium">Check-in тоо</th>
                <th className="py-3 font-medium">Ашиглалтын хувь</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {packageStats.map((item) => {
                const safeUsagePercent = Math.min(
                  Math.max(item.usagePercent, 0),
                  100,
                );

                return (
                  <tr key={item.planId} className="text-gray-900">
                    <td className="py-3 pr-4">{item.planName}</td>
                    <td className="py-3 pr-4 tabular-nums">
                      {Math.round(item.activeCustomerCount).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {Math.round(item.currentCreditTotal).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {Math.round(item.totalCredit).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {Math.round(item.consumedCredit).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      <div className="flex flex-col gap-1 text-xs sm:text-sm">
                        <span>
                          attended:{' '}
                          {Math.round(
                            item.checkInCount.attended,
                          ).toLocaleString()}
                        </span>
                        <span>
                          no_show:{' '}
                          {Math.round(
                            item.checkInCount.noShow,
                          ).toLocaleString()}
                        </span>
                        <span>
                          cancelled:{' '}
                          {Math.round(
                            item.checkInCount.cancelled,
                          ).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex min-w-[180px] items-center gap-3">
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-[#04051f]"
                            style={{ width: `${safeUsagePercent}%` }}
                          />
                        </div>
                        <span className="min-w-[40px] text-right tabular-nums">
                          {Math.round(safeUsagePercent)}%
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
