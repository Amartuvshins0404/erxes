import { Badge, Label, cn } from 'erxes-ui';
import { ReactNode } from 'react';

const EMPTY_VALUE = '—';

export const AgencyDetailField = ({
  label,
  value,
  className,
  children,
}: {
  label: string;
  value?: string | number | null;
  className?: string;
  children?: ReactNode;
}) => (
  <div className={cn('space-y-1.5', className)}>
    <Label className="text-muted-foreground text-xs">{label}</Label>
    {children ?? (
      <p className="text-sm font-medium break-words">
        {value === undefined || value === null || value === ''
          ? EMPTY_VALUE
          : String(value)}
      </p>
    )}
  </div>
);

export const AgencyDetailBadgeField = ({
  label,
  values,
  className,
}: {
  label: string;
  values?: string[];
  className?: string;
}) => (
  <AgencyDetailField label={label} className={className}>
    {values?.length ? (
      <div className="flex flex-wrap gap-1.5">
        {values.map((value) => (
          <Badge key={value} variant="secondary">
            {value}
          </Badge>
        ))}
      </div>
    ) : (
      <p className="text-sm font-medium">{EMPTY_VALUE}</p>
    )}
  </AgencyDetailField>
);
