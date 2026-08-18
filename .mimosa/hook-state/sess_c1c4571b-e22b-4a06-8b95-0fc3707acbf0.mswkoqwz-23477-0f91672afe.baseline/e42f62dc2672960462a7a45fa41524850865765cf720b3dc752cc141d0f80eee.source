import { Card, Skeleton } from 'erxes-ui';
import { CountUp } from './CountUp';
import { useListingStats } from '../hooks/useListingStats';

const KPI_CONFIG = [
  { key: 'total', label: 'Total Listings' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
  { key: 'totalViews', label: 'Total Views' },
] as const;

export const ListingKPI = () => {
  const { stats, loading } = useListingStats();

  return (
    <div className="grid grid-cols-4 gap-3 p-3 bg-sidebar">
      {KPI_CONFIG.map(({ key, label }, idx) => (
        <Card key={key} className="shrink flex flex-col justify-between">
          <Card.Header>
            <Card.Title className="font-medium text-sm text-accent-foreground uppercase font-mono">
              {label}
            </Card.Title>
          </Card.Header>
          <Card.Content className="text-2xl font-semibold text-foreground self-end">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <CountUp to={stats?.[key] ?? 0} delay={0.1 * idx} />
            )}
          </Card.Content>
        </Card>
      ))}
    </div>
  );
};
