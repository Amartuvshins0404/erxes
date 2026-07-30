import { useState } from 'react';
import { IconChevronRight } from '@tabler/icons-react';

// A reasoning burst as a timeline-step body — always a single line so the trace
// only ever grows downward (no auto-expand/auto-collapse, which made the whole
// section jump up and down as each thought streamed in and finished). Live: a
// shimmering "Thinking…". Settled: "Reasoning". Click to read the full thought.
export const ThinkingSection = ({
  text,
  live,
}: {
  text: string;
  live?: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="ea-pop">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`ea-trace-row flex w-full items-center gap-2 px-1.5 py-1 text-left text-xs ${
          live ? '' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {live ? (
          <span className="ea-shimmer-text font-medium">Thinking…</span>
        ) : (
          <span>Reasoning</span>
        )}
        <span className="flex-1" />
        <IconChevronRight
          className={`size-3 shrink-0 text-muted-foreground opacity-40 transition-transform duration-200 ${
            expanded ? 'rotate-90' : ''
          }`}
        />
      </button>
      {expanded && (
        <div className="ea-expand px-1.5 pb-1.5 pt-0.5">
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
            {text}
          </p>
        </div>
      )}
    </div>
  );
};
