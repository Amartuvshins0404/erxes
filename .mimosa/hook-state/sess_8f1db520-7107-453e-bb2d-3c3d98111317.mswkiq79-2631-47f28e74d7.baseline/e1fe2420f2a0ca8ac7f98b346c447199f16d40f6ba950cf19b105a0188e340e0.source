import { Badge } from 'erxes-ui';

export const ClientStatus = ({ status }: { status: string }) => {
  const statusMap: Record<
    string,
    { label: string; variant: 'warning' | 'info' | 'success' | 'destructive' }
  > = {
    new: { label: 'New', variant: 'warning' },
    negotiation: { label: 'Negotiation', variant: 'info' },
    won: { label: 'Won', variant: 'success' },
    lost: { label: 'Lost', variant: 'destructive' },
  };

  const badgeStatus = statusMap[status];

  if (!badgeStatus) return null;

  return (
    <Badge variant={badgeStatus.variant} className="capitalize">
      {badgeStatus.label}
    </Badge>
  );
};
