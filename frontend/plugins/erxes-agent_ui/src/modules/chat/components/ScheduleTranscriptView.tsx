import { useRef } from 'react';
import { useMutation } from '@apollo/client';
import {
  IconCalendarClock,
  IconLock,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { Button, Empty, toast } from 'erxes-ui';
import { MASTRA_SCHEDULE_RUN_NOW } from '~/graphql/mutations';
import { IChatAgent } from '~/modules/chat/hooks/useChatAgents';
import { useScheduleTranscript } from '~/modules/chat/hooks/useScheduleTranscript';
import { MessageList } from '~/modules/chat/components/MessageList';
import { IScheduleRunNowResponse } from '~/pages/schedules/types';

const noop = () => {};

// The chat-area content when the sidebar is in Scheduled mode: a schedule's run
// transcript rendered through the SAME MessageList (bubbles, markdown, inline
// tool/chart parts) as live chat, but READ-ONLY — the composer is replaced by a
// footer + "Run now". Humans can never inject a message into a schedule thread;
// only Run now (which re-runs the whole prompt as the background principal)
// writes to it.
export const ScheduleTranscriptView = ({
  agent,
  scheduleId,
  scheduleName,
}: {
  agent: IChatAgent;
  scheduleId?: string;
  scheduleName?: string;
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { messages, loading, error, refetch } =
    useScheduleTranscript(scheduleId);

  const [runNow, { loading: running }] = useMutation<IScheduleRunNowResponse>(
    MASTRA_SCHEDULE_RUN_NOW,
    {
      onCompleted: (data) => {
        const outcome = data?.mastraScheduleRunNow;
        if (outcome?.lastStatus === 'failed') {
          toast({
            title: 'Run failed',
            description: outcome.lastError || scheduleName,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Run finished', description: scheduleName });
        }
        // Pull the new run into the transcript.
        void refetch();
      },
      onError: (e) =>
        toast({
          title: 'Run failed',
          description: e.message,
          variant: 'destructive',
        }),
    },
  );

  if (!scheduleId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Empty>
          <Empty.Header>
            <Empty.Media variant="icon">
              <IconCalendarClock />
            </Empty.Media>
            <Empty.Title>Select a schedule</Empty.Title>
            <Empty.Description>
              Choose a schedule from the sidebar to read its run history.
            </Empty.Description>
          </Empty.Header>
        </Empty>
      </div>
    );
  }

  const handleRunNow = () => {
    toast({ title: 'Running…', description: scheduleName });
    runNow({ variables: { _id: scheduleId } });
  };

  return (
    <>
      {error ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <Empty>
            <Empty.Header>
              <Empty.Media variant="icon">
                <IconLock />
              </Empty.Media>
              <Empty.Title>Transcript unavailable</Empty.Title>
              <Empty.Description>
                You don’t have access to this schedule’s runs, or it could not be
                loaded.
              </Empty.Description>
            </Empty.Header>
          </Empty>
        </div>
      ) : !loading && messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <Empty>
            <Empty.Header>
              <Empty.Media variant="icon">
                <IconCalendarClock />
              </Empty.Media>
              <Empty.Title>No runs yet</Empty.Title>
              <Empty.Description>
                This schedule hasn’t produced any output. Run it now to see the
                result here.
              </Empty.Description>
            </Empty.Header>
          </Empty>
        </div>
      ) : (
        <MessageList
          agent={agent}
          messages={messages}
          messagesLoading={loading}
          chatLoading={false}
          attachmentsEnabled={false}
          ratingEnabled={false}
          boxRef={boxRef}
          endRef={endRef}
          onScroll={noop}
          onSuggestion={noop}
          onRegenerate={noop}
          onRate={noop}
          onEditMessage={noop}
          onResendMessage={noop}
          debug={agent.debug}
        />
      )}

      {/* Read-only footer — no composer; only Run now writes to the thread. */}
      <div className="border-t bg-background/80 px-3 py-2">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconLock className="size-3.5" />
            Scheduled run — read only
          </span>
          <Button size="sm" onClick={handleRunNow} disabled={running}>
            <IconPlayerPlay className="size-3.5" />
            {running ? 'Running…' : 'Run now'}
          </Button>
        </div>
      </div>
    </>
  );
};
