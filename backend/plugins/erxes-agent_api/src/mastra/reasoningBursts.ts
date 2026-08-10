import { REASONING_STEP_MIN_CHARS } from './activity';

// Cap per-turn step summaries: a generous backstop so a pathological,
// many-burst turn keeps the single summary call's prompt bounded. Beyond it, the
// extra steps fall back to the raw-reasoning lead in the UI.
const MAX_STEP_SUMMARIES = 12;

export interface ReasoningBurst {
  index: number;
  text: string;
}

// Per-reasoning-step short summaries ("short thoughts"): substantial reasoning
// bursts are COLLECTED here (by reasoning ordinal, matching the client's
// per-reasoning-part index) and summarized together in ONE model call at turn
// end — no per-burst LLM round-trips during the stream. A natural sibling of
// UITurnAccumulator: it owns the burst-buffering state the stream loop folds
// into, with the MAX_STEP_SUMMARIES / REASONING_STEP_MIN_CHARS caps encapsulated.
export class ReasoningBurstCollector {
  private current = '';
  private nextIndex = 0;
  private collected: ReasoningBurst[] = [];

  /** Feed a reasoning delta into the currently open burst. */
  append(delta: string): void {
    this.current += delta;
  }

  // A reasoning burst just ended (a non-reasoning chunk arrived). Give it the
  // next ordinal — kept in lockstep with the client even for bursts too short to
  // summarize — and queue substantial ones for the batched call.
  close(): void {
    const text = this.current;
    this.current = '';
    if (!text) return;
    const index = this.nextIndex++;
    if (text.trim().length < REASONING_STEP_MIN_CHARS) return;
    if (this.collected.length >= MAX_STEP_SUMMARIES) return;
    this.collected.push({ index, text });
  }

  /** The substantial bursts collected this turn, for the batched summary call. */
  get bursts(): ReasoningBurst[] {
    return this.collected;
  }
}
