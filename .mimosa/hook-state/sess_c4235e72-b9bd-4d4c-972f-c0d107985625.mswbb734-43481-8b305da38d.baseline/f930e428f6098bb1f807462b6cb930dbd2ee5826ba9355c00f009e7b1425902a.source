import { Skeleton } from 'erxes-ui';
import { Cell, Pie, PieChart, Tooltip } from 'recharts';
import {
  B2B_COLOR,
  B2C_COLOR,
} from '~/components/dashboard/main-indicators-dashboard/constants';
import { type B2bB2cSalesStats } from '~/components/dashboard/main-indicators-dashboard/types';

interface SalesDistributionCardProps {
  loading: boolean;
  hasStats: boolean;
  sales?: B2bB2cSalesStats;
}

export function SalesDistributionCard({
  loading,
  hasStats,
  sales,
}: SalesDistributionCardProps) {
  const totalSalesCount = (sales?.b2bCount || 0) + (sales?.b2cCount || 0);
  const hasB2bB2cSales = totalSalesCount > 0;

  const chartData = [
    {
      name: 'B2B',
      value: sales?.b2bCount || 0,
      percent: sales?.b2bPercent || 0,
      color: B2B_COLOR,
    },
    {
      name: 'B2C',
      value: sales?.b2cCount || 0,
      percent: sales?.b2cPercent || 0,
      color: B2C_COLOR,
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-base font-semibold text-gray-900">
        B2B болон B2C борлуулт
      </h3>

      {loading && !hasStats ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-60 w-full max-w-xl" />
          <Skeleton className="h-6 w-full max-w-sm" />
          <Skeleton className="h-6 w-full max-w-sm" />
        </div>
      ) : !hasB2bB2cSales ? (
        <p className="mt-4 text-sm text-gray-500">
          Сонгосон хугацаанд B2B/B2C борлуулалтын өгөгдөл алга байна.
        </p>
      ) : (
        <div className="mt-4">
          <div className="h-72 w-full max-w-xl">
            <PieChart width={460} height={280}>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name}: ${(percent ?? 0).toFixed(1)}%`
                }
                labelLine={false}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => value.toLocaleString()}
                cursor={{ fill: '#f4f4f5' }}
              />
            </PieChart>
          </div>

          <div className="mt-2 max-w-sm space-y-3">
            <div className="flex items-center justify-between text-base">
              <span className="text-gray-700">B2B борлуулт:</span>
              <span className="font-semibold tabular-nums text-gray-900">
                {(sales?.b2bCount || 0).toLocaleString()} (
                {(sales?.b2bPercent || 0).toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="text-gray-700">B2C борлуулт:</span>
              <span className="font-semibold tabular-nums text-gray-900">
                {(sales?.b2cCount || 0).toLocaleString()} (
                {(sales?.b2cPercent || 0).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
