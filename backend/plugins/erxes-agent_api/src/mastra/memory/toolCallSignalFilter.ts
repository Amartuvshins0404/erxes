import type {
  ProcessLLMRequestArgs,
  ProcessLLMRequestResult,
  Processor,
} from '@mastra/core/processors';

const historyNote = (toolNames: Set<string>): string =>
  `Conversation history note: earlier turns invoked these tools: ${[
    ...toolNames,
  ].join(
    ', ',
  )}. These tools remain available; call them again when needed instead of only describing the action.`;

/**
 * Reasoning models such as Kimi reject recalled tool-call frames from earlier
 * turns. Rewriting MessageList input persisted the compatibility text into chat
 * history and sometimes primed the model to answer only "Used the X tool."
 *
 * The provider-boundary hook is deliberately transient: it removes only
 * historical tool frames from the outbound prompt, preserves tool calls made in
 * the current agentic loop, and carries the prior-use signal in a system note.
 * Stored memory, the UI transcript, and other providers keep the real frames.
 *
 * "Current loop" is located structurally — every frame after the last user
 * message belongs to the in-flight run — because `steps` is not reliably
 * populated mid-stream in all Mastra versions; trusting it alone once stripped
 * the current run's own tool results, and the model re-issued the same call
 * forever, never having seen its answer.
 */
export class ToolCallSignalFilter implements Processor {
  readonly id = 'tool-call-signal-filter';
  readonly name = 'ToolCallSignalFilter';

  processLLMRequest({
    prompt,
    steps,
  }: ProcessLLMRequestArgs): ProcessLLMRequestResult {
    const activeToolCallIds = new Set(
      steps.flatMap((step) => step.toolCalls.map((call) => call.toolCallId)),
    );

    // Frames at or after the final user message belong to the current run;
    // everything earlier is replayed history that may be stripped.
    let lastUserIndex = -1;
    prompt.forEach((message, index) => {
      if (message.role === 'user') lastUserIndex = index;
    });

    const historicalToolNames = new Set<string>();
    let changed = false;

    const rewritten: typeof prompt = [];
    for (const [index, message] of prompt.entries()) {
      if (message.role === 'system' || message.role === 'user') {
        rewritten.push(message);
        continue;
      }

      // Never touch the in-flight run's frames.
      if (lastUserIndex !== -1 && index > lastUserIndex) {
        rewritten.push(message);
        continue;
      }

      if (message.role === 'assistant') {
        const hasActiveToolCall = message.content.some(
          (part) =>
            part.type === 'tool-call' && activeToolCallIds.has(part.toolCallId),
        );
        const content = message.content.filter((part) => {
          if (part.type === 'reasoning' && !hasActiveToolCall) {
            changed = true;
            return false;
          }
          if (part.type !== 'tool-call' && part.type !== 'tool-result') {
            return true;
          }
          if (activeToolCallIds.has(part.toolCallId)) return true;
          historicalToolNames.add(part.toolName);
          changed = true;
          return false;
        });
        if (content.length) rewritten.push({ ...message, content });
        continue;
      }

      const content = message.content.filter((part) => {
        if (activeToolCallIds.has(part.toolCallId)) return true;
        historicalToolNames.add(part.toolName);
        changed = true;
        return false;
      });
      if (content.length) rewritten.push({ ...message, content });
    }

    if (!changed) return;

    if (historicalToolNames.size) {
      const note = historyNote(historicalToolNames);
      const systemIndex = rewritten.findIndex(
        (message) => message.role === 'system',
      );
      if (systemIndex === -1) {
        rewritten.unshift({ role: 'system', content: note });
      } else {
        const system = rewritten[systemIndex];
        if (system.role === 'system') {
          rewritten[systemIndex] = {
            ...system,
            content: `${system.content}\n\n${note}`,
          };
        }
      }
    }

    return { prompt: rewritten };
  }
}
