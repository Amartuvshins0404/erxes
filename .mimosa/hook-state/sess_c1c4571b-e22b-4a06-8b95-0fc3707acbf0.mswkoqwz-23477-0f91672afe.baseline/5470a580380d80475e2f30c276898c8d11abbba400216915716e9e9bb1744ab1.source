import { Badge } from 'erxes-ui';

export const MarketStatus = ({ status }: { status: string }) => {
  const statusMap: Record<
    string,
    { label: string; variant: 'warning' | 'info' | 'success' | 'destructive' }
  > = {
    pending: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'destructive' },
  };

  const badgeStatus = statusMap[status];

  if (!badgeStatus) return null;

  return (
    <Badge variant={badgeStatus.variant} className="capitalize">
      {badgeStatus.label}
    </Badge>
  );
};

