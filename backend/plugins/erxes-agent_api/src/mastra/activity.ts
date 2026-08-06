// Deterministic live activity labels for the in-app chat stream.
//
// Tool names and arguments already identify the current action. Turning those
// signals into a local status line avoids adding provider requests to the user's
// turn. Reasoning deltas remain visible through their native stream chunks and
// never trigger a separate summarization model.

export interface ActivityTracker {
  /** Reasoning already streams to the client; no auxiliary processing needed. */
  onThinking(text: string): void;
  /** Emit a local status label for the tool that became the current step. */
  onToolCall(toolName: string, args?: unknown): void;
  /** Stop emitting labels (idempotent). */
  stop(): void;
}

export function createActivityTracker(opts: {
  emit: (text: string) => void;
  toolSignal: (toolName: string, args?: unknown) => string | null;
}): ActivityTracker {
  let stopped = false;
  let lastEmitted = '';

  return {
    onThinking() {
      // The model's reasoning chunk is already forwarded by foldModelStream.
    },
    onToolCall(toolName: string, args?: unknown) {
      if (stopped || !toolName) return;
      const signal = opts.toolSignal(toolName, args);
      if (!signal || signal === lastEmitted) return;
      lastEmitted = signal;
      opts.emit(signal);
    },
    stop() {
      stopped = true;
    },
  };
}
