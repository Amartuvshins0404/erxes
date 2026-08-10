import { useState } from 'react';
import {
  IconCalculator,
  IconDatabase,
  IconSearch,
  IconTool,
  IconWorld,
  type Icon,
} from '@tabler/icons-react';
import { Collapsible } from 'erxes-ui';
import { AgentUIMessage } from '~/modules/chat/types';
import {
  asToolPart,
  toolKind,
  type ToolKind,
  type ToolPartView,
} from '~/modules/chat/lib/uiParts';
import { ThinkingSection } from '~/modules/chat/components/ThinkingSection';
import { ToolBody } from '~/modules/chat/components/trace/ToolBody';
import { FetchGroupCard } from '~/modules/chat/components/trace/FetchGroupCard';
import { SearchGroupCard } from '~/modules/chat/components/trace/SearchGroupCard';

type MessagePart = AgentUIMessage['parts'][number];

// The marker glyph + tint for each tool kind, shown on the rail node.
const TOOL_MARKER: Record<
  Exclude<ToolKind, 'artifact'>,
  { cls: string; Icon: Icon }
> = {
  'web-search': { cls: 'is-search', Icon: IconSearch },
  'fetch-url': { cls: 'is-read', Icon: IconWorld },
  operation: { cls: 'is-op', Icon: IconDatabase },
  calculator: { cls: 'is-op', Icon: IconCalculator },
  generic: { cls: 'is-tool', Icon: IconTool },
};

// The assistant's reasoning + tool calls rendered as one vertical run timeline.
//
// `debug` is the agent's setting and controls how much shows:
//  • debug OFF (default): the collapsed header is the turn summary ("what it
//    did"); expanding reveals only the reasoning "short thoughts" — tool calls
//    are hidden. Rests collapsed.
//  • debug ON: the full trace — reasoning + tool-call cards/rows — opens while
//    streaming so the developer watches each step.
//
// Artifact-producing tool calls (chart / diagram / document) are always hidden
// here; they surface as a prominent ArtifactCard below the answer instead.
export const AgentTrace = ({
  parts,
  streaming,
  summaries,
  turnSummary,
  debug,
}: {
  parts: MessagePart[];
  streaming: boolean;
  // Per reasoning-burst short summary (by reasoning ordinal): the "short thought"
  // shown in place of the raw reasoning. Absent/null entries fall back to the lead.
  summaries?: (string | null)[];
  // The whole-turn headline shown collapsed (replacing "Thought process").
  turnSummary?: string;
  debug?: boolean;
}) => {
  // Debug opens live so each step is watched; the clean view rests collapsed.
  const [open, setOpen] = useState(!!debug && streaming);

  // What shows: reasoning thoughts always; web research (search-result cards +
  // fetched-page chips) always, since it's content — what the agent looked at;
  // the noisier rows (erxes operations, calculations, raw I/O) only in debug;
  // artifact tools never (they surface as ArtifactCards below the answer).
  const steps = parts.filter((p) => {
    const tool = asToolPart(p);
    if (tool) {
      const kind = toolKind(tool.toolName);
      if (kind === 'artifact') return false;
      if (kind === 'web-search' || kind === 'fetch-url') return true;
      return !!debug;
    }
    return p.type === 'reasoning';
  });

  const headerLabel = turnSummary || 'Thought process';

  // Nothing to show (settled, no steps, no headline).
  if (!steps.length && !turnSummary && !streaming) return null;

  // No expandable detail (e.g. a clean turn with no reasoning) → a plain line.
  if (!steps.length) {
    return (
      <div className="mb-3 px-1.5 py-1 text-xs text-muted-foreground">
        {streaming ? (
          <span className="ea-shimmer-text font-medium">Working…</span>
        ) : (
          <span>{headerLabel}</span>
        )}
      </div>
    );
  }

  // Coalesce CONSECUTIVE fetch-url calls into one collapsible card (a lone fetch
  // stays a simple chip), and track the reasoning ordinal so each summary lines
  // up with its burst. Everything else renders one-to-one, in order.
  type Unit =
    | { kind: 'reasoning'; part: MessagePart; ord: number; key: string }
    | { kind: 'tool'; tool: ToolPartView; key: string }
    | { kind: 'fetch'; calls: ToolPartView[]; key: string }
    | { kind: 'search'; calls: ToolPartView[]; key: string };

  const units: Unit[] = [];
  let run: { kind: 'web-search' | 'fetch-url'; calls: ToolPartView[] } | null =
    null;
  let reasoningOrd = -1;
  const flushRun = () => {
    if (!run) return;
    const { kind, calls } = run;
    run = null;
    if (calls.length === 1) {
      units.push({
        kind: 'tool',
        tool: calls[0],
        key: calls[0].toolCallId ?? `tool-${units.length}`,
      });
    } else if (kind === 'web-search') {
      units.push({ kind: 'search', calls, key: `searchgroup-${units.length}` });
    } else {
      units.push({ kind: 'fetch', calls, key: `fetchgroup-${units.length}` });
    }
  };
  steps.forEach((part, i) => {
    const tool = asToolPart(part);
    const k = tool ? toolKind(tool.toolName) : null;
    if (tool && (k === 'web-search' || k === 'fetch-url')) {
      if (run && run.kind === k) run.calls.push(tool);
      else {
        flushRun();
        run = { kind: k, calls: [tool] };
      }
      return;
    }
    flushRun();
    if (tool) {
      units.push({ kind: 'tool', tool, key: tool.toolCallId ?? `tool-${i}` });
    } else {
      reasoningOrd += 1;
      units.push({ kind: 'reasoning', part, ord: reasoningOrd, key: `reasoning-${i}` });
    }
  });
  flushRun();

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-3">
      <Collapsible.TriggerButton className="h-auto w-auto gap-1.5 px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground">
        <Collapsible.TriggerIcon className="size-3 shrink-0" />
        {streaming ? (
          <span className="ea-shimmer-text font-medium">Working…</span>
        ) : (
          <span className="text-left">{headerLabel}</span>
        )}
        {debug && (
          <span className="font-mono opacity-50">
            · {steps.length} step{steps.length !== 1 ? 's' : ''}
          </span>
        )}
      </Collapsible.TriggerButton>
      <Collapsible.Content>
        <ol className="ea-trace mt-1.5">
          {units.map((unit) => {
            if (unit.kind === 'reasoning') {
              const p = unit.part;
              const text = p.type === 'reasoning' ? p.text : '';
              const live =
                streaming && p.type === 'reasoning' && p.state === 'streaming';
              return (
                <li className="ea-step" key={unit.key}>
                  <span className="ea-step-rail" aria-hidden>
                    <span className="ea-step-marker is-think">
                      <span className="ea-think-dot" />
                    </span>
                  </span>
                  <div className="ea-step-body">
                    <ThinkingSection
                      text={text}
                      summary={summaries?.[unit.ord] ?? undefined}
                      live={live}
                    />
                  </div>
                </li>
              );
            }
            if (unit.kind === 'search' || unit.kind === 'fetch') {
              const running =
                streaming && unit.calls.some((c) => c.pending);
              const isSearch = unit.kind === 'search';
              return (
                <li className="ea-step is-card" key={unit.key}>
                  <span className="ea-step-rail" aria-hidden>
                    <span
                      className={`ea-step-marker ${
                        isSearch ? 'is-search' : 'is-read'
                      } ${running ? 'is-running' : ''}`}
                    >
                      {isSearch ? (
                        <IconSearch className="size-3" />
                      ) : (
                        <IconWorld className="size-3" />
                      )}
                    </span>
                  </span>
                  <div className="ea-step-body">
                    {isSearch ? (
                      <SearchGroupCard
                        calls={unit.calls}
                        streaming={streaming}
                      />
                    ) : (
                      <FetchGroupCard calls={unit.calls} streaming={streaming} />
                    )}
                  </div>
                </li>
              );
            }
            const tool = unit.tool;
            const running = tool.pending && streaming;
            const kind = toolKind(tool.toolName) as Exclude<
              ToolKind,
              'artifact'
            >;
            const marker = TOOL_MARKER[kind] ?? TOOL_MARKER.generic;
            const { Icon } = marker;
            const isCard = kind === 'web-search' || kind === 'fetch-url';
            return (
              <li
                className={`ea-step ${isCard ? 'is-card' : ''}`}
                key={unit.key}
              >
                <span className="ea-step-rail" aria-hidden>
                  <span
                    className={`ea-step-marker ${marker.cls} ${
                      running ? 'is-running' : ''
                    } ${tool.isError ? 'is-error' : ''}`}
                  >
                    <Icon className="size-3" />
                  </span>
                </span>
                <div className="ea-step-body">
                  <ToolBody call={tool} streaming={streaming} />
                </div>
              </li>
            );
          })}
        </ol>
      </Collapsible.Content>
    </Collapsible>
  );
};
