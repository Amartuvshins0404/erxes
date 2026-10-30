import { Button, cn } from 'erxes-ui';
import { useTranslation } from 'react-i18next';

export const SegmentConjunctionRail = ({
  conjunction,
  onToggle,
}: {
  conjunction: 'and' | 'or';
  onToggle: () => void;
}) => {
  const { t } = useTranslation('segment', { keyPrefix: 'detail' });
  const isAnd = conjunction === 'and';

  return (
    <div className="relative flex w-9 shrink-0 items-center justify-center">
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-1 left-1/2 right-1 rounded-l-md border-y border-l',
          isAnd ? 'border-success/40' : 'border-warning/40',
        )}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        title={isAnd ? t('all-conditions-match') : t('any-condition-matches')}
        className={cn(
          'relative w-10 rounded-full px-0 uppercase',
          isAnd
            ? 'bg-success/10 text-success hover:bg-success/20'
            : 'bg-warning/10 text-warning hover:bg-warning/20',
        )}
      >
        {isAnd ? t('and') : t('or')}
      </Button>
    </div>
  );
};
