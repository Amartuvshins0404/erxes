import { Button, cn, Tooltip, useMultiQueryState } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { broadcastMethodDisplay } from '../../utils/broadcastMethod';
import {
  calendarEntryDisplay,
  entrySummary,
  entryTime,
  TCalendarEntry,
} from '../../utils/calendarMonth';

export const BroadcastCalendarEntry = ({
  entry,
  className,
}: {
  entry: TCalendarEntry;
  className?: string;
}) => {
  const [, setQueryParams] = useMultiQueryState<{ messageId: string }>([
    'messageId',
  ]);

  const { t } = useTranslation('broadcasts');
  const { dot, chip } = calendarEntryDisplay(entry.state);
  const { Icon, labelKey } = broadcastMethodDisplay(entry.method ?? undefined);

  return (
    <Tooltip.Provider>
      <Tooltip>
        <Tooltip.Trigger asChild>
          <Button
            variant="ghost"
            onClick={() => setQueryParams({ messageId: entry.engageMessageId })}
            onPointerDown={(event) => event.stopPropagation()}
            className={cn(
              'h-auto w-full justify-start gap-1.5 rounded px-1 py-0.5 text-left text-xs font-normal',
              chip,
              className,
            )}
          >
            <span className={cn('size-1.5 flex-none rounded-full', dot)} />
            <span className="flex-none tabular-nums text-muted-foreground">
              {entryTime(entry)}
            </span>
            <span className="min-w-0 flex-1 truncate">
              {entry.title || t('untitled')}
            </span>
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content className="flex items-center gap-1.5">
          <Icon className="size-3.5" />
          {t(labelKey)} · {entrySummary(entry, t)}
        </Tooltip.Content>
      </Tooltip>
    </Tooltip.Provider>
  );
};
