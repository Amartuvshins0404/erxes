import { memo } from 'react';

// A reasoning burst rendered as a timeline-step body: the SHORT THOUGHT shown
// DIRECTLY — the backend's ≤50-word gist of what the agent is figuring out — as
// a calm paragraph. No expand, no first-sentence truncation, no raw chain-of-
// thought dump. While a step is still streaming (its summary not produced yet)
// it shows a "Thinking…" shimmer; old turns with no stored summary fall back to a
// clipped lead of the raw reasoning.
//
// memo()'d so prior reasoning steps don't re-render on every throttled token of
// the live turn (only the streaming step's text changes).
const clipText = (raw: string, max: number): string => {
  const t = raw.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
};

export const ThinkingSection = memo(function ThinkingSection({
  text,
  summary,
  live,
}: {
  text: string;
  summary?: string;
  live?: boolean;
}) {
  const gist = summary?.trim();
  // While the step is still streaming there's no gist yet — don't flash the raw
  // reasoning; show a thinking shimmer instead.
  if (live && !gist) {
    return (
      <div className="ea-pop px-1.5 py-1">
        <span className="ea-shimmer-text text-xs font-medium">Thinking…</span>
      </div>
    );
  }

  const display = gist || clipText(text, 320);
  if (!display) return null;

  return (
    <div className="ea-pop px-1.5 py-1">
      <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
        {display}
      </p>
    </div>
  );
});
