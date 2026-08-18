import { format, parse } from 'date-fns';
import { Skeleton } from 'erxes-ui';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  B2B_COLOR,
  B2C_COLOR,
  NEW_USERS_COLOR,
} from '~/components/dashboard/main-indicators-dashboard/constants';
import { type UserGrowthMonthRow } from '~/components/dashboard/main-indicators-dashboard/types';

interface UserGrowthChartSectionProps {
  loading: boolean;
  hasStats: boolean;
  userGrowthByMonth: UserGrowthMonthRow[];
}

export function UserGrowthChartSection({
  loading,
  hasStats,
  userGrowthByMonth,
}: UserGrowthChartSectionProps) {
  const growthMonthKeys = Array.from(
    new Set(userGrowthByMonth.map((row) => row.monthKey).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const growthByMonthKey = new Map(
    userGrowthByMonth.map((row) => [row.monthKey, row]),
  );

  let cumulativeB2bUsers = 0;
  let cumulativeB2cUsers = 0;
  let cumulativeNewUsers = 0;

  const growthChartData = growthMonthKeys.map((monthKey) => {
    const row = growthByMonthKey.get(monthKey);
    const b2bUsers = row?.b2bUsers || 0;
    const b2cUsers = row?.b2cUsers || 0;
    const newUsers = row?.newUsers || 0;

    cumulativeB2bUsers += b2bUsers;
    cumulativeB2cUsers += b2cUsers;
    cumulativeNewUsers += newUsers;

    return {
      monthKey,
      monthLabel: format(
        parse(`${monthKey}-01`, 'yyyy-MM-dd', new Date()),
        'MMM yyyy',
      ),
      cumulativeB2bUsers,
      cumulativeB2cUsers,
      cumulativeNewUsers,
    };
  });

  const hasGrowthChartData = growthChartData.length > 0;

  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Хэрэглэгчийн өсөлтийн динамик
        </h3>
        <p className="mt-1 text-sm text-gray-500">All time</p>
      </div>

      {loading && !hasStats ? (
        <Skeleton className="h-[320px] w-full" />
      ) : !hasGrowthChartData ? (
        <p className="mt-4 text-sm text-gray-500">
          Сонгосон хугацаанд үзүүлэх сарын өгөгдөл алга байна.
        </p>
      ) : (
        <div className="mt-4 h-[320px] w-full">
          <LineChart
            data={growthChartData}
            width={1000}
            height={400}
            margin={{ top: 10, right: 16, left: 4, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" />
            <XAxis
              dataKey="monthLabel"
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={{ stroke: '#d4d4d8' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#a1a1aa', fontSize: 12 }}
              axisLine={{ stroke: '#d4d4d8' }}
              tickLine={false}
              width={40}
              domain={[0, 'dataMax + 1']}
            />
            <Tooltip
              formatter={(value: number) => value.toLocaleString()}
              labelFormatter={(label) => String(label)}
            />
            <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 16 }} />
            <Line
              type="monotone"
              name="B2B"
              dataKey="cumulativeB2bUsers"
              stroke={B2B_COLOR}
              strokeWidth={2}
              dot={{ r: 4, fill: B2B_COLOR, stroke: B2B_COLOR }}
              activeDot={{ r: 5, fill: B2B_COLOR, stroke: B2B_COLOR }}
            />
            <Line
              type="monotone"
              name="B2C"
              dataKey="cumulativeB2cUsers"
              stroke={B2C_COLOR}
              strokeWidth={2}
              dot={{ r: 4, fill: B2C_COLOR, stroke: B2C_COLOR }}
              activeDot={{ r: 5, fill: B2C_COLOR, stroke: B2C_COLOR }}
            />
            <Line
              type="monotone"
              name="Шинэ хэрэглэгчид"
              dataKey="cumulativeNewUsers"
              stroke={NEW_USERS_COLOR}
              strokeWidth={2}
              dot={{ r: 4, fill: NEW_USERS_COLOR, stroke: NEW_USERS_COLOR }}
              activeDot={{
                r: 5,
                fill: NEW_USERS_COLOR,
                stroke: NEW_USERS_COLOR,
              }}
            />
          </LineChart>
        </div>
      )}
    </div>
  );
}
