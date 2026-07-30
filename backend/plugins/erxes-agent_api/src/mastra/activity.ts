// ---------------------------------------------------------------------------
// Live activity summarizer — "what is the agent doing right now".
//
// Turns the in-flight turn's raw signals (reasoning deltas, tool invocations)
// into one short human status line. Generic and transport-agnostic:
//
//   summarizeActivity()      — one-shot: snapshot in, status line out.
//   createActivityTracker()  — stream wrapper: feed it thinking/tool events
//                              and it decides WHEN to re-summarize (throttled,
//                              single-flight) and emits the result.
//
// The in-app chat SSE route is the first consumer; future surfaces (workflow
// run monitors, the frontline bot, dashboards) should reuse these instead of
// inventing their own status text.
//
// Same shape as the titler: a dedicated tool-less agent cached per
// provider+model, heavy deps imported lazily, best-effort — a summarization
// failure never affects the turn itself.
// ---------------------------------------------------------------------------

import type { Agent } from '@mastra/core/agent';
import { trimEdgeChars } from '~/mastra/text';
import {
  providerRuntimeFingerprint,
  type ProviderDocLike,
} from '~/mastra/providers';
import { createAgentCache } from '~/mastra/cachedAgent';

/** Auth context accepted by runWithAuth (the module itself loads lazily). */
type AuthCtx = Parameters<
  typeof import('~/mastra/requestContext')['runWithAuth']
>[0];

export const ACTIVITY_INSTRUCTIONS = `You narrate what an AI agent is doing right now.
Given the agent's in-progress reasoning and/or the tool it is invoking, output ONE short status line (3-8 words) describing the CURRENT step.
Rules:
- Write in the same language as the reasoning text (fall back to the user request's language).
- Present continuous voice ("Searching customers", "Comparing pricing plans").
- Name the concrete subject when one is clear ("Looking up order #1042"), never generic filler ("Processing data", "Working on it").
- No quotes, no trailing punctuation, no emoji, no markdown.
- Output ONLY the status line, nothing else.`;

// How much context the summarizer sees, and how long its output may be.
const USER_MESSAGE_CHARS = 200;
const THINKING_TAIL_CHARS = 700;
const TOOL_ARGS_CHARS = 240;
const ACTIVITY_MAX_CHARS = 80;
// Stream policy defaults: at most one summary per interval, and only once
// enough new reasoning accumulated (a tool call always counts as news).
const MIN_INTERVAL_MS = 3000;
const MIN_NEW_THINKING_CHARS = 240;
// Cap the retained reasoning burst — only the tail describes "now".
const THINKING_BUFFER_CHARS = 4000;

// What the summarizer is shown. All fields optional; with neither reasoning
// nor a tool there is nothing live to narrate.
export interface ActivitySnapshot {
  userMessage?: string;
  thinking?: string;
  toolName?: string;
  toolArgs?: unknown;
}

// ── Pure helpers (unit-testable) ─────────────────────────────────────────────

const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max)}…` : text;

/** Render a snapshot into the summarizer prompt, or null when there is
 *  nothing in-flight worth narrating. */
export function buildActivityContext(snap: ActivitySnapshot): string | null {
  const thinking = (snap.thinking || '').replace(/\s+/g, ' ').trim();
  if (!thinking && !snap.toolName) return null;

  const sections: string[] = [];

  const user = (snap.userMessage || '').replace(/\s+/g, ' ').trim();
  if (user) sections.push(`User request: ${clip(user, USER_MESSAGE_CHARS)}`);

  if (thinking) {
    const tail =
      thinking.length > THINKING_TAIL_CHARS
        ? `…${thinking.slice(-THINKING_TAIL_CHARS)}`
        : thinking;
    sections.push(`Agent reasoning (live tail): ${tail}`);
  }

  if (snap.toolName) {
    let args = '';
    if (snap.toolArgs !== undefined) {
      try {
        args = JSON.stringify(snap.toolArgs);
      } catch {
        args = String(snap.toolArgs);
      }
    }
    sections.push(
      `Invoking tool: ${snap.toolName}${
        args ? ` with ${clip(args, TOOL_ARGS_CHARS)}` : ''
      }`,
    );
  }

  return sections.join('\n');
}

/** Normalize raw model output into a usable status line, or null. */
export function sanitizeActivity(
  raw: string | null | undefined,
  maxChars = ACTIVITY_MAX_CHARS,
): string | null {
  let line = (raw || '').split('\n')[0].replace(/\s+/g, ' ').trim();
  line = line.replace(/^(status|activity)\s*:\s*/i, '');
  line = trimEdgeChars(line, '"\'`“”‘’', '"\'`“”‘’.…').trim();
  if (!line) return null;
  if (line.length > maxChars) line = `${line.slice(0, maxChars).trimEnd()}…`;
  return line;
}

// ── One-shot summarizer ──────────────────────────────────────────────────────

// Tool-less summarizer agents, cached per provider+model.
const summarizerCache = createAgentCache<Agent>();

/** Get (or lazily create and cache) the summarizer agent for a model. */
async function summarizerFor(
  provider: string,
  model: string,
  providers: ProviderDocLike[],
): Promise<Agent> {
  const key = `${provider}:${model}:${providerRuntimeFingerprint(providers)}`;
  return summarizerCache.getOrBuild(key, ({ buildModel }) => ({
    id: 'mastra-activity-summarizer',
    name: 'Activity Summarizer',
    instructions: ACTIVITY_INSTRUCTIONS,
    model: buildModel(provider, model, providers),
  }));
}

/**
 * Summarize an in-flight snapshot into one short status line. Returns null
 * when there is nothing to narrate or the model output is unusable. Never
 * throws.
 */
export async function summarizeActivity(params: {
  provider: string;
  model: string;
  providers: ProviderDocLike[];
  authCtx: AuthCtx;
  snapshot: ActivitySnapshot;
}): Promise<string | null> {
  const { provider, model, providers, authCtx, snapshot } = params;
  try {
    const context = buildActivityContext(snapshot);
    if (!context) return null;

    const { runWithAuth } = await import('~/mastra/requestContext');
    const summarizer = await summarizerFor(provider, model, providers);
    const prompt = `${context}\n\nOutput the status line.`;
    const result = await runWithAuth(
      authCtx,
      (): Promise<{ text?: string }> =>
        summarizer.generate(prompt, { maxSteps: 1 }),
    );

    return sanitizeActivity(result?.text);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // eslint-disable-next-line no-console
    console.warn(
      `[mastra:activity] activity summarization skipped: ${message}`,
    );
    return null;
  }
}

// ── Turn + step summaries (single batched call) ──────────────────────────────
//
// Where ACTIVITY narrates "what is the agent doing right now" (one rolling line
// for the sidebar), this produces the chat run-timeline summaries: ONE past-tense
// turn headline plus a ≤50-word gist for each substantial reasoning step. Both
// come from a SINGLE model call at turn end — off the felt path (the reply has
// already streamed), so a long turn costs one summarization call, not N.

// Bursts shorter than this aren't worth summarizing — the UI shows their raw
// lead instead. Exported so the stream loop gates which bursts to include.
export const REASONING_STEP_MIN_CHARS = 80;
// Output budget for a step summary — ~50 words, kept as one or two sentences.
const REASONING_STEP_MAX_CHARS = 320;

/** Sanitize a fuller (sentence-level) summary: collapse whitespace, strip a
 *  leading label + wrapping quotes, cap to the budget. Keeps sentence
 *  punctuation (unlike sanitizeActivity, which is for terse status lines). */
function sanitizeSummary(
  raw: string | null | undefined,
  maxChars: number,
): string | null {
  let text = (raw || '').replace(/\s+/g, ' ').trim();
  text = text.replace(/^(summary|note|step)\s*:\s*/i, '');
  text = trimEdgeChars(text, '"\'`“”‘’', '"\'`“”‘’').trim();
  if (!text) return null;
  if (text.length > maxChars) text = `${text.slice(0, maxChars).trimEnd()}…`;
  return text;
}

const COMBINED_SUMMARY_INSTRUCTIONS = `You summarize an AI assistant's turn for a human-readable activity log.
You are given the user's request, the assistant's reply, and a numbered list of the assistant's reasoning steps (each prefixed with an index like [2]).
Produce two things:
1. A TURN headline: ONE short past-tense line (4-10 words) naming what the assistant ultimately accomplished — the outcome, not the process ("Synthesized marketplace data into a PDF report", "Compared the three pricing plans").
2. For EACH reasoning step you are given, a 1-2 sentence summary (UNDER 50 words) of what it is figuring out, deciding, or about to do, in the agent's own natural voice (first person like "I'll…" is fine), concrete and specific to that step.
Rules:
- Use the same language as the content.
- Output the headline on its own line prefixed "TURN:". Output each step summary on its own line prefixed with its exact index in square brackets, e.g. "[2] …".
- Only summarize the steps you are given; never invent indices. No markdown, lists, quotes, or emoji.
- Output ONLY the "TURN:" line and the "[index]" lines, nothing else.`;

// Output budgets.
const TURN_SUMMARY_MAX_CHARS = 120;
const TURN_SUMMARY_REPLY_CHARS = 1200;
// How much of each burst the batched summarizer sees — substance is up front.
const STEP_INPUT_CHARS = 800;

/** Optional cheaper/faster model for the (off-path) summarization, via env. Both
 *  vars are optional; with neither set, summaries run on the agent's own model so
 *  nothing breaks out of the box (set AGENT_SUMMARIZER_MODEL, and optionally
 *  AGENT_SUMMARIZER_PROVIDER, to point them at a small fast model). */
function summarizerTarget(
  agentProvider: string,
  agentModel: string,
): { provider: string; model: string } {
  const model = process.env.AGENT_SUMMARIZER_MODEL?.trim();
  if (!model) return { provider: agentProvider, model: agentModel };
  return {
    provider: process.env.AGENT_SUMMARIZER_PROVIDER?.trim() || agentProvider,
    model,
  };
}

// One combined summarizer agent, cached per provider+model.
const summaryAgentCache = createAgentCache<Agent>();

async function summaryAgentFor(
  provider: string,
  model: string,
  providers: ProviderDocLike[],
): Promise<Agent> {
  const key = `${provider}:${model}:${providerRuntimeFingerprint(providers)}`;
  return summaryAgentCache.getOrBuild(key, ({ buildModel }) => ({
    id: 'mastra-turn-summarizer',
    name: 'Turn Summarizer',
    instructions: COMBINED_SUMMARY_INSTRUCTIONS,
    model: buildModel(provider, model, providers),
  }));
}

export interface ReasoningStepInput {
  index: number;
  text: string;
}

export interface TurnAndStepsResult {
  turn: string | null;
  steps: { index: number; summary: string }[];
}

/** Build the single prompt asking for the turn headline + each step summary. */
function buildCombinedPrompt(params: {
  userMessage: string;
  reply: string;
  steps: ReasoningStepInput[];
  wantTurn: boolean;
}): string {
  const { userMessage, reply, steps, wantTurn } = params;
  const sections: string[] = [];
  const user = clip(
    (userMessage || '').replace(/\s+/g, ' ').trim(),
    USER_MESSAGE_CHARS,
  );
  if (user) sections.push(`User request: ${user}`);
  if (wantTurn)
    sections.push(`Assistant reply: ${clip(reply, TURN_SUMMARY_REPLY_CHARS)}`);
  if (steps.length) {
    const lines = steps.map(
      (s) =>
        `[${s.index}] ${clip(
          s.text.replace(/\s+/g, ' ').trim(),
          STEP_INPUT_CHARS,
        )}`,
    );
    sections.push(`Reasoning steps:\n${lines.join('\n')}`);
  }
  const spec: string[] = ['Now output:'];
  if (wantTurn) spec.push('TURN: <past-tense headline, 4-10 words>');
  for (const s of steps)
    spec.push(`[${s.index}] <1-2 sentence summary, under 50 words>`);
  sections.push(spec.join('\n'));
  return sections.join('\n\n');
}

/** Parse the "TURN:" + "[index]" lines back out, tolerating wrapped lines and
 *  stray prose. Each item degrades independently. Exported for unit tests. */
export function parseCombined(
  raw: string,
  wantTurn: boolean,
): TurnAndStepsResult {
  const turnLines: string[] = [];
  const stepLines = new Map<number, string[]>();
  let cur: { kind: 'turn' } | { kind: 'step'; index: number } | null = null;
  for (const line of (raw || '').split('\n')) {
    const trimmed = line.trim();
    const turnM = trimmed.match(/^TURN\s*:\s*(.*)$/i);
    const stepM = trimmed.match(/^\[(\d+)\]\s*(.*)$/);
    if (turnM) {
      cur = { kind: 'turn' };
      if (turnM[1]) turnLines.push(turnM[1]);
    } else if (stepM) {
      const index = Number(stepM[1]);
      cur = { kind: 'step', index };
      const acc = stepLines.get(index) ?? [];
      if (stepM[2]) acc.push(stepM[2]);
      stepLines.set(index, acc);
    } else if (cur && trimmed) {
      if (cur.kind === 'turn') turnLines.push(trimmed);
      else stepLines.get(cur.index)?.push(trimmed);
    }
  }
  const turn = wantTurn
    ? sanitizeActivity(turnLines.join(' '), TURN_SUMMARY_MAX_CHARS)
    : null;
  const steps: { index: number; summary: string }[] = [];
  for (const [index, lines] of stepLines) {
    const summary = sanitizeSummary(lines.join(' '), REASONING_STEP_MAX_CHARS);
    if (summary) steps.push({ index, summary });
  }
  return { turn, steps };
}

/**
 * Produce the turn headline + each substantial reasoning step's summary in ONE
 * model call (off the felt path — the reply already streamed). Returns whatever
 * parsed cleanly; a failure yields empty results and the UI falls back to the
 * raw-reasoning lead / no header. Never throws.
 */
export async function summarizeTurnAndSteps(params: {
  provider: string;
  model: string;
  providers: ProviderDocLike[];
  authCtx: AuthCtx;
  userMessage: string;
  reply: string | null;
  steps: ReasoningStepInput[];
}): Promise<TurnAndStepsResult> {
  const { provider, model, providers, authCtx, userMessage, steps } = params;
  const reply = (params.reply || '').replace(/\s+/g, ' ').trim();
  const wantTurn = !!reply;
  if (!wantTurn && steps.length === 0) return { turn: null, steps: [] };
  try {
    const { runWithAuth } = await import('~/mastra/requestContext');
    const target = summarizerTarget(provider, model);
    const agent = await summaryAgentFor(
      target.provider,
      target.model,
      providers,
    );
    const prompt = buildCombinedPrompt({ userMessage, reply, steps, wantTurn });
    const result = await runWithAuth(
      authCtx,
      (): Promise<{ text?: string }> => agent.generate(prompt, { maxSteps: 1 }),
    );
    return parseCombined(result?.text ?? '', wantTurn);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // eslint-disable-next-line no-console
    console.warn(`[mastra:activity] turn+steps summary skipped: ${message}`);
    return { turn: null, steps: [] };
  }
}

// ── Stream tracker ───────────────────────────────────────────────────────────

export interface ActivityTracker {
  /** Feed a reasoning delta. */
  onThinking(text: string): void;
  /** Feed a tool invocation (the tool becomes the current step). */
  onToolCall(toolName: string, args?: unknown): void;
  /** Stop summarizing and emitting (idempotent). */
  stop(): void;
}

/**
 * Wrap a summarize function with the throttling policy a live stream needs:
 * re-summarize when a tool call starts or once enough new reasoning arrived,
 * never more than one LLM call in flight, never more often than the interval,
 * and only emit when the line actually changed.
 */
export function createActivityTracker(opts: {
  summarize: (snapshot: ActivitySnapshot) => Promise<string | null>;
  emit: (text: string) => void;
  // Optional instant, LLM-free status line for a tool call (see
  // activity-signals.toolStatusLine). When it returns a line, that line is
  // emitted immediately and the LLM summarizer is skipped for that step.
  toolSignal?: (toolName: string, args?: unknown) => string | null;
  userMessage?: string;
  minIntervalMs?: number;
  minNewThinkingChars?: number;
}): ActivityTracker {
  const minInterval = opts.minIntervalMs ?? MIN_INTERVAL_MS;
  const minNewChars = opts.minNewThinkingChars ?? MIN_NEW_THINKING_CHARS;

  let stopped = false;
  let inFlight = false;
  let dirty = false;
  let lastRunAt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  let thinking = '';
  let newThinkingChars = 0;
  let tool: { toolName: string; args?: unknown } | undefined;
  let lastEmitted = '';

  /** Summarize the current snapshot once; re-arms itself when stale. */
  async function run(): Promise<void> {
    if (stopped || inFlight) return;
    inFlight = true;
    dirty = false;
    newThinkingChars = 0;
    lastRunAt = Date.now();
    const snapshot: ActivitySnapshot = {
      userMessage: opts.userMessage,
      thinking: thinking || undefined,
      toolName: tool?.toolName,
      toolArgs: tool?.args,
    };
    try {
      const text = await opts.summarize(snapshot);
      if (text && !stopped && text !== lastEmitted) {
        lastEmitted = text;
        opts.emit(text);
      }
    } finally {
      inFlight = false;
      if (dirty && !stopped) schedule();
    }
  }

  /** Arm the next run after the throttle interval (no-op when armed). */
  function schedule(): void {
    if (stopped || timer) return;
    const wait = Math.max(0, lastRunAt + minInterval - Date.now());
    timer = setTimeout(() => {
      timer = null;
      run().catch(() => null);
    }, wait);
  }

  return {
    onThinking(text: string) {
      if (stopped || !text) return;
      thinking += text;
      newThinkingChars += text.length;
      if (thinking.length > THINKING_BUFFER_CHARS) {
        thinking = thinking.slice(-THINKING_BUFFER_CHARS);
      }
      if (newThinkingChars >= minNewChars) {
        dirty = true;
        schedule();
      }
    },
    onToolCall(toolName: string, args?: unknown) {
      if (stopped || !toolName) return;
      tool = { toolName, args };
      // The tool is now the current step; earlier reasoning led up to it.
      thinking = '';
      newThinkingChars = 0;
      // A tool's name + args already describe the step — emit a precise line
      // instantly with no LLM round-trip. Only fall back to the summarizer when
      // the tool is unrecognized.
      const signal = opts.toolSignal?.(toolName, args);
      if (signal) {
        if (signal !== lastEmitted) {
          lastEmitted = signal;
          opts.emit(signal);
        }
        return;
      }
      dirty = true;
      schedule();
    },
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      timer = null;
    },
  };
}
