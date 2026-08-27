import { IconExternalLink } from '@tabler/icons-react';
import { ElementType } from 'react';

export const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('mn-MN') : '';

export const formatMoney = (value?: number | null) =>
  value === null || value === undefined
    ? null
    : `${value.toLocaleString('mn-MN')}₮`;

export const formatYearRange = (start?: number | null, end?: number | null) =>
  [start, end].some(Boolean) ? `${start ?? '…'} – ${end ?? 'одоог хүртэл'}` : '';

export const SourceLink = ({ url }: { url?: string }) =>
  url ? (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
    >
      <IconExternalLink className="size-3.5" />
      Эх сурвалж
    </a>
  ) : null;

export const MetaLine = ({
  icon: Icon,
  value,
  className = 'flex items-center gap-2 text-accent-foreground',
}: {
  icon: ElementType<{ className?: string }>;
  value?: string;
  className?: string;
}) =>
  value ? (
    <div className={className}>
      <Icon className="size-4 flex-none" />
      <p className="truncate text-sm">{value}</p>
    </div>
  ) : null;

export const MetaItem = ({
  icon: Icon,
  value,
}: {
  icon: ElementType<{ className?: string }>;
  value?: string;
}) =>
  value ? (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className="size-4" />
      {value}
    </span>
  ) : null;
