// Deterministic live activity labels for the in-app chat stream.
//
// Tool names and arguments already identify the current action. Turning those
// signals into a local status line avoids adding provider requests to the turn.

export interface ActivityTracker {
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
