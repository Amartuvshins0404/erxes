import type { Processor } from '@mastra/core/processors';
import type {
  MastraDBMessage,
  MastraMessagePart,
  MastraToolInvocationPart,
} from '@mastra/core/agent/message-list';

// Reasoning models (Kimi) reject replayed/recalled tool-call frames, so those
// frames must be removed from history before a turn. The stock ToolCallFilter
// deletes them outright — which also erases the only evidence that the agent
// had ALREADY invoked a render/document tool. With that signal gone, on the
// next turn the model stops calling the render tools and merely narrates the
// artifact (a silent no-op for the second artifact in a conversation).
//
// This filter removes the raw tool frames (so Kimi still accepts the request)
// but leaves a short plain-text breadcrumb in their place. Text can never be an
// orphaned tool frame, so it stays Kimi-safe while preserving the signal that
// the agent may — and did — call those tools.
export class ToolCallSignalFilter implements Processor {
  readonly id = 'tool-call-signal-filter';
  readonly name = 'ToolCallSignalFilter';

  async processInput({
    messageList,
  }: {
    messageList: { get: { all: { db: () => MastraDBMessage[] } } };
  }): Promise<MastraDBMessage[]> {
    return messageList.get.all.db().map((message) => this.rewrite(message));
  }

  private rewrite(message: MastraDBMessage): MastraDBMessage {
    const content = message.content;
    if (typeof content !== 'object' || !Array.isArray(content.parts)) {
      return message;
    }
    if (!content.parts.some(isToolInvocationPart)) {
      return message;
    }

    const seen = new Set<string>();
    const parts: MastraMessagePart[] = [];
    for (const part of content.parts) {
      if (!isToolInvocationPart(part)) {
        parts.push(part);
        continue;
      }
      const toolName = part.toolInvocation.toolName;
      if (seen.has(toolName)) continue;
      seen.add(toolName);
      parts.push({ type: 'text', text: `Used the \`${toolName}\` tool.` });
    }

    // Drop the legacy top-level toolInvocations too, or the raw frames would be
    // re-injected downstream.
    const { toolInvocations: _dropped, ...rest } = content;
    return { ...message, content: { ...rest, parts } };
  }
}

function isToolInvocationPart(
  part: MastraMessagePart,
): part is MastraToolInvocationPart {
  return part.type === 'tool-invocation';
}
