import { Spinner, cn } from 'erxes-ui';
import { useNewsDetail } from '../hooks/useNewsDetail';
import { IconClockFilled } from '@tabler/icons-react';
import { NewsDetailName } from './NewsDetailName';
import { NewsDetailActions } from '~/modules/news/components/NewsDetailActions';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:    { label: 'Шалгаж байна',             className: 'bg-yellow-100 text-yellow-800' },
  need_info:  { label: 'Нэмэлт мэдээлэл',          className: 'bg-blue-100 text-blue-800' },
  approved:   { label: 'Зөвшөөрөгдсөн',            className: 'bg-green-100 text-green-800' },
  rejected:   { label: 'Зөвшөөрөгдөөгүй',          className: 'bg-red-100 text-red-800' },
  violation:  { label: 'Дүрэм зөрчсөн',            className: 'bg-orange-100 text-orange-800' },
};

export const VerificationStatusBadge = ({ status }: { status?: string }) => {
  const config = STATUS_CONFIG[status || 'pending'] || STATUS_CONFIG['pending'];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
};

export const NewsDetailProfile = () => {
  const { news, loading } = useNewsDetail();

  if (loading) return <Spinner containerClassName="py-12" />;

  return (
    <div className="flex border-b">
      <div className="p-8 space-y-3">
        <div className="flex items-center gap-3">
          <NewsDetailName id={news?._id || ''} name={news?.name || ''} />
          <VerificationStatusBadge status={news?.verificationStatus} />
        </div>
        <div className="flex items-center gap-2 text-accent-foreground">
          <IconClockFilled className="size-4" />
          <p className="text-sm">Last updated by Carl Marx, 2024-12-01 14:30</p>
        </div>
      </div>
      <div className="ml-auto p-8">
        <NewsDetailActions />
      </div>
    </div>
  );
};
