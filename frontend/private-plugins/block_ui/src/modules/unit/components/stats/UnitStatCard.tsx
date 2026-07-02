import { Card, Skeleton } from 'erxes-ui';
import type { ComponentType } from 'react';

interface UnitStatCardProps {
  label: string;
  count: number | undefined;
  loading: boolean;
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

export const UnitStatCard = ({
  label,
  count,
  loading,
  icon: Icon,
  color,
}: UnitStatCardProps) => (
  <Card className="flex items-center gap-4 p-4">
    <div
      className="rounded-full p-2.5 shrink-0"
      style={{ backgroundColor: `${color}20` }}
    >
      <Icon className="size-5" style={{ color }} />
    </div>
    <div className="min-w-0">
      {loading ? (
        <Skeleton className="h-7 w-10 mb-1" />
      ) : (
        <div className="text-2xl font-bold tabular-nums">
          {count ?? 0}
        </div>
      )}
      <div className="text-sm text-muted-foreground truncate">{label}</div>
    </div>
  </Card>
);
