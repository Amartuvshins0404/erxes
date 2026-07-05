import {
  IconAlertTriangle,
  IconClock,
  IconMessageReply,
  IconPrompt,
} from '@tabler/icons-react';
import { Badge, RelativeDateDisplay, Separator, Sheet } from 'erxes-ui';
import {
  ISchedule,
  SCHEDULE_STATUS_VARIANTS,
  formatScheduleDuration,
} from '../types';

// Why not show run output via the chat view?
// A schedule's run thread is OWNERSHIP-SCOPED to the background principal (the
// agent's owner / service user that executes the cron) — never the viewing
// human. The human-scoped `mastraThreadMessages` query filters by the viewer's
// resourceId (getOwnedThreadMessages) and throws "Thread not found" for these
// threads, so /erxes-agent/chat renders an empty composer. We show the last-run
// bookkeeping already loaded on the row instead. Do NOT re-wire this to chat.

/** Read-only panel showing a schedule's most recent run outcome. */
export const ScheduleOutputSheet = ({
  schedule,
  onClose,
}: {
  schedule: ISchedule | null;
  onClose: () => void;
}) => {
  const status = schedule?.lastStatus;
  const failed = status === 'failed';
  const duration = formatScheduleDuration(schedule?.lastDurationMs);
  const runCount = schedule?.runCount ?? 0;

  return (
    <Sheet open={!!schedule} onOpenChange={(open) => !open && onClose()}>
      <Sheet.View className="w-[40rem] max-w-[92vw] flex flex-col p-0 sm:max-w-[92vw]">
        <Sheet.Header className="gap-2">
          <IconClock className="size-5 text-primary" />
          <Sheet.Title>
            {schedule ? `Last run — ${schedule.name}` : 'Last run'}
          </Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <Sheet.Content className="flex-1 min-h-0 overflow-auto p-6 space-y-6">
          {!schedule?.lastRunAt ? (
            <p className="text-sm text-muted-foreground">
              This schedule hasn't run yet.
            </p>
          ) : (
            <>
              <section className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <Badge variant={SCHEDULE_STATUS_VARIANTS[status ?? 'success']}>
                  {status}
                </Badge>
                <RelativeDateDisplay value={schedule.lastRunAt} asChild>
                  <span>
                    <RelativeDateDisplay.Value value={schedule.lastRunAt} />
                  </span>
                </RelativeDateDisplay>
                {duration && <span>· {duration}</span>}
                <span>
                  · {runCount} {runCount === 1 ? 'run' : 'runs'} total
                </span>
              </section>

              {failed && schedule.lastError ? (
                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-destructive">
                    <IconAlertTriangle className="size-4" />
                    Error
                  </div>
                  <p className="whitespace-pre-wrap rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm leading-relaxed text-destructive">
                    {schedule.lastError}
                  </p>
                </section>
              ) : null}

              {schedule.lastReply ? (
                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <IconMessageReply className="size-4" />
                    Reply
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {schedule.lastReply}
                  </p>
                </section>
              ) : !failed ? (
                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <IconMessageReply className="size-4" />
                    Reply
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No text output.
                  </p>
                </section>
              ) : null}

              <Separator />

              <details className="group">
                <summary className="flex cursor-pointer items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <IconPrompt className="size-4" />
                  Prompt
                </summary>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {schedule.prompt}
                </p>
              </details>
            </>
          )}
        </Sheet.Content>
      </Sheet.View>
    </Sheet>
  );
};
