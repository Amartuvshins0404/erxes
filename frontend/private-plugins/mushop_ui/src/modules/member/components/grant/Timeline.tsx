import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/grantHelpers';

export const Timeline = ({
  start,
  end,
  today = new Date(),
}: {
  start: Date;
  end: Date;
  today?: Date;
}) => {
  const { t } = useTranslation('mushop');
  const total = end.getTime() - start.getTime();
  const elapsed = today.getTime() - start.getTime();
  const pct =
    total <= 0 ? 100 : Math.max(0, Math.min(100, (elapsed / total) * 100));

  return (
    <div className="mt-3 pt-3 border-border border-t">
      <div
        className="relative rounded-full h-2 overflow-hidden"
        style={{ backgroundColor: 'rgb(167 243 208)' }}
      >
        <div
          className="top-0 bottom-0 left-0 absolute bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-[11px] text-muted-foreground">
        <span>{formatDate(start.toISOString())}</span>
        <span className="font-medium text-primary">{t('today')}</span>
        <span>{formatDate(end.toISOString())}</span>
      </div>
    </div>
  );
};
