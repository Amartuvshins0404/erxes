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
  BOOKINGS_COLOR,
  COMPLETED_COLOR,
  NO_SHOW_COLOR,
} from '~/components/dashboard/main-indicators-dashboard/constants';
import { type BookingStatusDayRow } from '~/components/dashboard/main-indicators-dashboard/types';

interface BookingStatusChartSectionProps {
  loading: boolean;
  hasStats: boolean;
  rangeLabel: string;
  bookingStatusByDay: BookingStatusDayRow[];
}

export function BookingStatusChartSection({
  loading,
  hasStats,
  rangeLabel,
  bookingStatusByDay,
}: BookingStatusChartSectionProps) {
  const bookingStatusChartData = bookingStatusByDay.map((row) => ({
    ...row,
    dayLabel: format(parse(row.dayKey, 'yyyy-MM-dd', new Date()), 'MMM dd'),
  }));

  const hasBookingStatusChartData = bookingStatusChartData.some(
    (row) => row.bookings > 0 || row.completed > 0 || row.noShow > 0,
  );

  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Захиалгын төлөвийн динамик
        </h3>
        <p className="mt-1 text-sm text-gray-500">{rangeLabel}</p>
      </div>

      {loading && !hasStats ? (
        <Skeleton className="h-[320px] w-full" />
      ) : !hasBookingStatusChartData ? (
        <p className="mt-4 text-sm text-gray-500">
          Сонгосон хугацаанд захиалгын төлөвийн өгөгдөл алга байна.
        </p>
      ) : (
        <div className="mt-4 h-[320px] w-full">
          <LineChart
            data={bookingStatusChartData}
            width={1000}
            height={400}
            margin={{ top: 10, right: 16, left: 4, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" />
            <XAxis
              dataKey="dayLabel"
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
              name="Bookings"
              dataKey="bookings"
              stroke={BOOKINGS_COLOR}
              strokeWidth={2}
              dot={{ r: 3, fill: BOOKINGS_COLOR, stroke: BOOKINGS_COLOR }}
              activeDot={{ r: 5, fill: BOOKINGS_COLOR, stroke: BOOKINGS_COLOR }}
            />
            <Line
              type="monotone"
              name="Completed"
              dataKey="completed"
              stroke={COMPLETED_COLOR}
              strokeWidth={2}
              dot={{ r: 3, fill: COMPLETED_COLOR, stroke: COMPLETED_COLOR }}
              activeDot={{
                r: 5,
                fill: COMPLETED_COLOR,
                stroke: COMPLETED_COLOR,
              }}
            />
            <Line
              type="monotone"
              name="No Show"
              dataKey="noShow"
              stroke={NO_SHOW_COLOR}
              strokeWidth={2}
              dot={{ r: 3, fill: NO_SHOW_COLOR, stroke: NO_SHOW_COLOR }}
              activeDot={{ r: 5, fill: NO_SHOW_COLOR, stroke: NO_SHOW_COLOR }}
            />
          </LineChart>
        </div>
      )}
    </div>
  );
}
