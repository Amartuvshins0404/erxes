import {
  IconActivity,
  IconCircleCheck,
  IconCircleX,
  IconInfoCircle,
} from '@tabler/icons-react';
import { cn, Empty, RelativeDateDisplay, Skeleton } from 'erxes-ui';
import { useBroadcastTraces } from '../../../hooks/useBroadcastTraces';
import { TBroadcastMessage, TBroadcastTrace } from '../../../types';
import { useTranslation } from 'react-i18next';

type TraceType = 'success' | 'failure' | 'regular';

const TRACE_CONFIG: Record<
  TraceType,
  { icon: React.ElementType; iconClass: string; bgClass: string }
> = {
  success: {
    icon: IconCircleCheck,
    iconClass: 'text-success',
    bgClass: 'bg-success/10',
  },
  failure: {
    icon: IconCircleX,
    iconClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
  },
  regular: {
    icon: IconInfoCircle,
    iconClass: 'text-info',
    bgClass: 'bg-info/10',
  },
};

const TraceRow = ({
  trace,
  isLast,
}: {
  trace: TBroadcastTrace;
  isLast: boolean;
}) => {
  const config = TRACE_CONFIG[trace.type as TraceType] ?? TRACE_CONFIG.regular;
  const Icon = config.icon;

  return (
    <div className="relative flex flex-row gap-3 pb-5">
      {!isLast && (
        <div className="absolute left-3 -translate-x-1/2 top-7 bottom-0 w-px bg-border" />
      )}

      <div className="relative z-10 shrink-0">
        <div
          className={cn(
            'size-6 rounded-full flex items-center justify-center border border-background',
            config.bgClass,
          )}
        >
          <Icon className={cn('size-4', config.iconClass)} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-start gap-3 pt-0.5">
        <p className="min-w-0 flex-1 text-sm">{trace.message}</p>
        <RelativeDateDisplay value={trace.createdAt} asChild>
          <p className="shrink-0 text-xs leading-6 text-muted-foreground">
            <RelativeDateDisplay.Value value={trace.createdAt} />
          </p>
        </RelativeDateDisplay>
      </div>
    </div>
  );
};

export const BroadcastTabLogContent = ({
  message,
}: {
  message: TBroadcastMessage;
}) => {
  const { t } = useTranslation('broadcasts');
  const { traces, loading, error } = useBroadcastTraces(message._id);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-5">
        {loading && !traces.length && (
          <div className="flex flex-col gap-4">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-3">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <Empty>
            <Empty.Header>
              <Empty.Media variant="icon">
                <IconCircleX className="text-destructive" />
              </Empty.Media>
              <Empty.Description className="break-words">
                {error.message}
              </Empty.Description>
            </Empty.Header>
          </Empty>
        )}

        {!loading && !error && traces.length === 0 && (
          <Empty>
            <Empty.Header>
              <Empty.Media variant="icon">
                <IconActivity />
              </Empty.Media>
              <Empty.Title>{t('traces.empty')}</Empty.Title>
              <Empty.Description>{t('traces.empty-body')}</Empty.Description>
            </Empty.Header>
          </Empty>
        )}

        <div className="w-full flex flex-col">
          {traces.map((trace, index) => (
            <TraceRow
              key={trace?._id}
              trace={trace}
              isLast={index === traces.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
