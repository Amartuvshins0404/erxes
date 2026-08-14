import type { ToolCallMessagePartProps } from '@assistant-ui/react';
import {
  IconCalculator,
  IconChartBar,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconFileTypePpt,
  IconFileTypeXls,
  IconHierarchy,
  IconPhoto,
  IconSearch,
  IconShieldCheck,
  IconX,
} from '@tabler/icons-react';
import { ThinkingOrb, type OrbState } from 'thinking-orbs';
import { humanizeToolName } from '~/modules/chat/assistant/ToolFallback';

// Quiet one-liners for tools whose real output lives elsewhere (artifact card,
// approval bar, question card) or whose payload is a single scalar
// (calculator). They render as a status line only — expanding them would just
// expose plumbing JSON.

export const QuietLine = ({
  icon: Icon,
  runningState = 'working',
  label,
  running,
  isError,
}: {
  icon: React.ComponentType<{ className?: string }>;
  runningState?: OrbState;
  label: React.ReactNode;
  running: boolean;
  isError?: boolean;
}) => (
  <div className="flex w-fit max-w-full items-center gap-2 py-1.5 text-sm text-muted-foreground">
    {isError ? (
      <IconX className="size-4 shrink-0 text-destructive" />
    ) : running ? (
      <ThinkingOrb state={runningState} size={20} />
    ) : (
      <Icon className="size-4 shrink-0" />
    )}
    <span
      className={`min-w-0 break-words leading-5 ${
        running ? 'ea-shimmer-text' : ''
      }`}
    >
      {label}
    </span>
  </div>
);

const isRunning = (status: ToolCallMessagePartProps['status'], result: unknown) =>
  status?.type === 'running' || result === undefined;

// calculator → "2 + 2 * 10 = 42" — the whole story fits on one line.
export const CalculatorTool = ({
  args,
  result,
  isError,
  status,
}: ToolCallMessagePartProps) => {
  const running = isRunning(status, result);
  const expression =
    args && typeof args === 'object' && 'expression' in args
      ? String((args as { expression?: unknown }).expression ?? '')
      : '';
  const value =
    result && typeof result === 'object' && 'result' in result
      ? (result as { result?: unknown }).result
      : undefined;

  return (
    <QuietLine
      icon={IconCalculator}
      runningState="solving"
      running={running}
      isError={isError}
      label={
        running ? (
          <>Calculating {expression && <span className="ea-muted-80">{expression}</span>}</>
        ) : isError ? (
          'Calculation failed'
        ) : (
          <>
            <span className="ea-muted-80">{expression}</span>
            {value !== undefined && (
              <>
                {' = '}
                <b className="font-medium text-foreground">
                  {typeof value === 'number'
                    ? value.toLocaleString('en-US')
                    : String(value)}
                </b>
              </>
            )}
          </>
        )
      }
    />
  );
};

// request_approval — the ApprovalBar above the composer carries the actual
// decision; the inline row is only a record that the agent asked.
export const RequestApprovalNote = ({
  args,
  result,
  status,
}: ToolCallMessagePartProps) => {
  const running = isRunning(status, result);
  const summary =
    args && typeof args === 'object' && 'summary' in args
      ? String((args as { summary?: unknown }).summary ?? '')
      : '';
  return (
    <QuietLine
      icon={IconShieldCheck}
      runningState="listening"
      running={running}
      label={
        running ? (
          'Preparing an approval request…'
        ) : (
          <>
            Asked for approval
            {summary && (
              <span className="ea-muted-80"> — {summary}</span>
            )}
          </>
        )
      }
    />
  );
};

// search_tools — the tool-discovery step; matched tools show up as their own
// rows when called, so this stays a bare status line.
export const ToolSearchNote = ({
  result,
  status,
}: ToolCallMessagePartProps) => {
  const running = isRunning(status, result);
  return (
    <QuietLine
      icon={IconSearch}
      runningState="searching"
      running={running}
      label={running ? 'Searching available tools…' : 'Searched available tools'}
    />
  );
};

const ARTIFACT_VERBS: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    runningState: OrbState;
    running: string;
    done: string;
    failed: string;
  }
> = {
  renderChart: {
    icon: IconChartBar,
    runningState: 'shaping',
    running: 'Creating chart…',
    done: 'Created chart',
    failed: 'Chart creation failed',
  },
  renderDiagram: {
    icon: IconHierarchy,
    runningState: 'shaping',
    running: 'Creating diagram…',
    done: 'Created diagram',
    failed: 'Diagram creation failed',
  },
  generatePdf: {
    icon: IconFileTypePdf,
    runningState: 'composing',
    running: 'Generating PDF…',
    done: 'Generated PDF',
    failed: 'PDF generation failed',
  },
  generateDocx: {
    icon: IconFileTypeDocx,
    runningState: 'composing',
    running: 'Generating document…',
    done: 'Generated document',
    failed: 'Document generation failed',
  },
  generateXlsx: {
    icon: IconFileTypeXls,
    runningState: 'composing',
    running: 'Generating spreadsheet…',
    done: 'Generated spreadsheet',
    failed: 'Spreadsheet generation failed',
  },
  generatePptx: {
    icon: IconFileTypePpt,
    runningState: 'composing',
    running: 'Generating slides…',
    done: 'Generated slides',
    failed: 'Slide generation failed',
  },
  removeImageBackground: {
    icon: IconPhoto,
    runningState: 'shaping',
    running: 'Removing image background…',
    done: 'Removed image background',
    failed: 'Background removal failed',
  },
};

// Artifact tools — the ArtifactCard below the message carries the content and
// the ArtifactFailureCard carries errors, so the tool row is a status line
// (its huge spec/artifact payload is never shown).
export const ArtifactToolNote = ({
  toolName,
  result,
  isError,
  status,
}: ToolCallMessagePartProps) => {
  const running = isRunning(status, result);
  const verbs = ARTIFACT_VERBS[toolName];
  const name = humanizeToolName(toolName);
  return (
    <QuietLine
      icon={verbs?.icon ?? IconChartBar}
      runningState={verbs?.runningState}
      running={running}
      isError={isError}
      label={
        isError
          ? verbs?.failed ?? `${name} failed`
          : running
          ? verbs?.running ?? `Using ${name}…`
          : verbs?.done ?? `Used ${name}`
      }
    />
  );
};
