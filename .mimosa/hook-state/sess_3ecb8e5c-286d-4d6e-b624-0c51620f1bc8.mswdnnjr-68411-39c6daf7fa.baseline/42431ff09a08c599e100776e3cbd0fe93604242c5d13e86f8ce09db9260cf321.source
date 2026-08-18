import React from 'react';
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import { cn } from 'erxes-ui';
import { type MetricField } from '~/components/dashboard/main-indicators-dashboard/types';
import { formatMetricValue } from '~/components/dashboard/main-indicators-dashboard/utils';

interface KpiCardProps {
  title: string;
  subtitle: string;
  metric?: MetricField;
  icon: React.ComponentType<{ className?: string; stroke?: string | number }>;
  valueIsAverage?: boolean;
}

export function KpiCard({
  title,
  subtitle,
  metric,
  icon: Icon,
  valueIsAverage,
}: KpiCardProps) {
  const pct = metric?.changePercent;
  const isUp = pct != null && pct > 0;
  const isDown = pct != null && pct < 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <Icon className="size-5 shrink-0 text-gray-400" stroke={1.5} />
      </div>
      <div className="text-3xl font-bold tabular-nums text-gray-900">
        {metric
          ? formatMetricValue(metric.value, Boolean(valueIsAverage))
          : '—'}
      </div>
      <p className="text-xs text-gray-500">{subtitle}</p>
      <div className="flex items-center gap-1 text-sm">
        {pct == null ? (
          <span className="text-gray-400">—</span>
        ) : (
          <>
            {isUp ? (
              <IconTrendingUp className="size-4 text-emerald-600" />
            ) : isDown ? (
              <IconTrendingDown className="size-4 text-red-600" />
            ) : (
              <span className="text-gray-400">—</span>
            )}
            <span
              className={cn(
                'font-medium tabular-nums',
                isUp && 'text-emerald-600',
                isDown && 'text-red-600',
                !isUp && !isDown && 'text-gray-500',
              )}
            >
              {pct > 0 ? '+' : ''}
              {pct.toFixed(1)}%
            </span>
          </>
        )}
      </div>
    </div>
  );
}
