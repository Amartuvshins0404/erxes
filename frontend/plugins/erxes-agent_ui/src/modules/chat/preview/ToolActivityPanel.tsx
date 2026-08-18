import { Fragment, useState } from 'react';
import {
  IconCheck,
  IconChevronDown,
  IconCircle,
  IconFile,
  IconLoader2,
  IconMaximize,
  IconMinimize,
  IconX,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ThinkingOrb, type OrbState } from 'thinking-orbs';
import { Button, Collapsible, Empty, ScrollArea, Separator } from 'erxes-ui';
import {
  humanizeToolName,
  isFailureResult,
  isRecord,
  ToolArgsView,
  ToolResultView,
} from '~/modules/chat/assistant/toolValue';
import {
  isWebSearchResult,
  SourcesList,
} from '~/modules/chat/assistant/WebSearchTool';
import {
  previewStore,
  type PanelStep,
  type PanelToolCall,
} from '~/modules/chat/preview/previewStore';

const hostname = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

// The dimmed hint after the tool name — the search query or the fetched host.
const callHint = (call: PanelToolCall): string => {
  if (!isRecord(call.args)) return '';
  if (call.toolName === 'webSearch' && call.args.query) {
    return `“${String(call.args.query)}”`;
  }
  if (call.toolName === 'fetchUrl' && call.args.url) {
    return hostname(String(call.args.url));
  }
  return '';
};

// One snapshotted call: status row, parameters, and the full result (sources
// list for webSearch, the structured result view for everything else), with a
// mini separator between the sections that render. A call still in flight (no
// result yet) renders nothing below the status row.
const ToolCallBlock = ({ call }: { call: PanelToolCall }) => {
  const running = call.result === undefined;
  const failed = !!call.isError || isFailureResult(call.result);
  const hint = callHint(call);
  const sources =
    call.toolName === 'webSearch' && isWebSearchResult(call.result)
      ? (call.result.results ?? [])
      : null;
  const hasArgs =
    (isRecord(call.args) && Object.keys(call.args).length > 0) ||
    (!!call.argsText && call.argsText !== '{}');
  const hasResult = call.result !== undefined || call.isError === true;

  return (
    <div>
      <div className="flex items-center gap-2">
        {running ? (
          <IconLoader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
        ) : failed ? (
          <IconX className="size-4 shrink-0 text-destructive" />
        ) : (
          <IconCheck className="size-4 shrink-0" />
        )}
        <span className="min-w-0 break-words text-sm font-medium">
          {humanizeToolName(call.toolName)}
        </span>
        {hint && (
          <span className="ea-muted-80 min-w-0 truncate text-sm">{hint}</span>
        )}
      </div>
      {!running && hasArgs && <Separator className="my-3" />}
      {!running && (hasArgs || hasResult) && (
        <div className={`flex flex-col gap-2 ps-6${hasArgs ? '' : ' mt-2'}`}>
          {hasArgs && <ToolArgsView value={call.args} rawText={call.argsText} />}
          {hasArgs && hasResult && <Separator className="my-3" />}
          {hasResult &&
            (sources ? (
              <SourcesList results={sources} />
            ) : (
              <ToolResultView result={call.result} isError={call.isError} />
            ))}
        </div>
      )}
    </div>
  );
};

// The step's title row: status icon + bold label (+ optional dimmed hint).
// Shared by the plain note sections and the collapsible tool sections.
const StepTitle = ({ step }: { step: PanelStep }) => (
  <>
    {step.status === 'done' ? (
      <IconCheck className="size-4 shrink-0" />
    ) : step.status === 'active' ? (
      <ThinkingOrb
        state={(step.runningState as OrbState | undefined) ?? 'working'}
        size={20}
      />
    ) : (
      <IconCircle className="size-4 shrink-0 opacity-50" />
    )}
    <span className="min-w-0 break-words text-sm font-semibold">
      {step.label}
    </span>
    {step.hint && (
      <span className="ea-muted-80 min-w-0 truncate text-sm">{step.hint}</span>
    )}
  </>
);

// A step's body: the full note for reasoning/phase steps, the per-call blocks
// for tool steps.
const StepContent = ({ step }: { step: PanelStep }) => (
  <div className="mt-2 flex flex-col gap-4 ps-6">
    {step.note && (
      <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
        {step.note}
      </p>
    )}
    {step.toolCalls.map((call, i) => (
      <Fragment key={call.toolCallId || `call-${i}`}>
        {i > 0 && <Separator />}
        <ToolCallBlock call={call} />
      </Fragment>
    ))}
  </div>
);

// A tool step: the title row is the collapsible trigger (chevron rotated while
// collapsed) and the per-call blocks stay hidden until expanded. Starts
// collapsed even while the call is still running — the panel is a click-time
// snapshot, so nothing re-opens on its own.
const ToolStepSection = ({ step }: { step: PanelStep }) => {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger className="flex w-full items-center gap-2 text-left">
          <StepTitle step={step} />
          <IconChevronDown
            className={`size-4 shrink-0 transition-transform duration-200${
              open ? '' : ' -rotate-90'
            }`}
          />
        </Collapsible.Trigger>
        <Collapsible.Content>
          <StepContent step={step} />
        </Collapsible.Content>
      </Collapsible>
    </section>
  );
};

// One titled process step, Claude-style. Tool steps (any toolCalls) collapse
// behind their title row; reasoning/phase steps (a note and no toolCalls)
// render their full note, always visible. A step with neither renders just
// the header.
const StepSection = ({ step }: { step: PanelStep }) => {
  if (step.toolCalls.length > 0) {
    return <ToolStepSection step={step} />;
  }
  return (
    <section>
      <div className="flex items-center gap-2">
        <StepTitle step={step} />
      </div>
      {step.note && <StepContent step={step} />}
    </section>
  );
};

// The preview panel's tool-activity view: the turn's whole process as titled
// steps (reasoning notes, tool calls with full args/result detail), opened by
// clicking the chat's single process line — or scoped to one step from the
// debug-mode stepper. The data is a snapshot from click time — the panel does
// not live-update as the turn continues.
export const ToolActivityPanel = ({
  activity,
}: {
  activity: { steps: PanelStep[]; title?: string };
}) => {
  const { t } = useTranslation('erxes-agent');
  const fullscreen = previewStore((s) => s.fullscreen);
  const toggleFullscreen = previewStore((s) => s.toggleFullscreen);
  const close = previewStore((s) => s.close);
  const { steps } = activity;
  const toolCalls = steps.flatMap((step) => step.toolCalls);

  const running = toolCalls.some((call) => call.result === undefined);
  // An all-webSearch turn with parseable results reads as a Sources panel
  // instead of a tool dump.
  const allSources =
    toolCalls.length > 0 &&
    toolCalls.every(
      (call) => call.toolName === 'webSearch' && isWebSearchResult(call.result),
    );
  const sourceCount = allSources
    ? toolCalls.reduce(
        (total, call) =>
          total +
          (isWebSearchResult(call.result)
            ? (call.result.results?.length ?? 0)
            : 0),
        0,
      )
    : 0;

  const title =
    activity.title ??
    (allSources
      ? `${t('tool-activity-sources', { defaultValue: 'Sources' })} · ${sourceCount}`
      : `${
          running
            ? t('tool-activity-running', { defaultValue: 'Running…' })
            : t('tool-activity-done', { defaultValue: 'Done' })
        } · ${
          toolCalls.length === 1
            ? t('tool-activity-used-tool', { defaultValue: 'Used 1 tool' })
            : t('tool-activity-used-tools', {
                defaultValue: 'Used {{count}} tools',
                count: toolCalls.length,
              })
        }`);

  return (
    <>
      <div className="flex items-center gap-2 border-b px-4 py-2.5 shrink-0">
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{title}</p>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {fullscreen ? (
            <IconMinimize className="size-4" />
          ) : (
            <IconMaximize className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={close}
          aria-label="Close"
        >
          <IconX className="size-4" />
        </Button>
      </div>
      {steps.length === 0 ? (
        <Empty className="min-h-0">
          <Empty.Header>
            <Empty.Media variant="icon">
              <IconFile />
            </Empty.Media>
            <Empty.Title>
              {t('tool-activity-empty-title', { defaultValue: 'No tool calls' })}
            </Empty.Title>
            <Empty.Description>
              {t('tool-activity-empty-description', {
                defaultValue: 'This turn did not call any tools.',
              })}
            </Empty.Description>
          </Empty.Header>
        </Empty>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-5 p-4">
            {steps.map((step, i) => (
              <Fragment key={step.id || `step-${i}`}>
                {i > 0 && <Separator />}
                <StepSection step={step} />
              </Fragment>
            ))}
          </div>
        </ScrollArea>
      )}
    </>
  );
};
