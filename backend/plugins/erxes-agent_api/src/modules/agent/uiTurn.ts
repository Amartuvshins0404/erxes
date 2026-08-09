import type { UIMessageChunk } from 'ai';

interface TurnToolCall {
  toolCallId?: string;
  toolName: string;
  result?: unknown;
}

// Folds the AI SDK stream into the reply text and tool results needed to finish
// the turn. Tool calls stay here for synthesis and artifact delivery checks; the
// end-user trace state is not kept.
export class UITurnAccumulator {
  text = '';
  toolCalls: TurnToolCall[] = [];
  private textParts: string[] = [];
  private textOpen = false;
  // Mastra's native assistant message id, used to link artifacts and delete
  // message pairs without a reload.
  messageId?: string;

  /** Final text block from the last model step, excluding earlier narration. */
  get latestText(): string {
    for (let index = this.textParts.length - 1; index >= 0; index -= 1) {
      if (this.textParts[index].trim()) return this.textParts[index];
    }
    return '';
  }

  fold(chunk: UIMessageChunk): void {
    switch (chunk.type) {
      case 'start':
        if (typeof (chunk as { messageId?: unknown }).messageId === 'string') {
          this.messageId = (chunk as { messageId: string }).messageId;
        }
        break;
      case 'text-start':
        this.textParts.push('');
        this.textOpen = true;
        break;
      case 'text-delta':
        this.appendText(chunk.delta ?? '');
        break;
      case 'text-end':
        this.textOpen = false;
        break;
      case 'tool-input-available':
        this.recordToolCall({
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
        });
        break;
      case 'tool-input-error':
        this.recordToolCall({
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          result: chunk.errorText,
        });
        break;
      case 'tool-output-available':
        this.recordToolOutput(chunk.toolCallId, chunk.output);
        break;
      case 'tool-output-error':
        this.recordToolOutput(chunk.toolCallId, chunk.errorText);
        break;
      default:
        break;
    }
  }

  private appendText(text: string): void {
    if (!text) return;
    this.text += text;
    if (!this.textOpen) {
      this.textParts.push(text);
      this.textOpen = true;
      return;
    }
    const lastIndex = this.textParts.length - 1;
    this.textParts[lastIndex] = `${this.textParts[lastIndex] ?? ''}${text}`;
  }

  private recordToolCall(call: TurnToolCall): void {
    const existing = call.toolCallId
      ? this.toolCalls.find((tool) => tool.toolCallId === call.toolCallId)
      : undefined;
    if (existing) {
      Object.assign(existing, call);
      return;
    }
    this.toolCalls.push(call);
  }

  private recordToolOutput(toolCallId: string, result: unknown): void {
    const existing = this.toolCalls.find(
      (tool) => tool.toolCallId === toolCallId,
    );
    if (existing) existing.result = result;
  }

  /** Tool results gathered this turn for the no-prose synthesis fallback. */
  toolResults(): { toolCallId?: string; toolName: string; result: unknown }[] {
    return this.toolCalls
      .filter((tool) => tool.result !== undefined)
      .map((tool) => ({
        toolCallId: tool.toolCallId,
        toolName: tool.toolName,
        result: tool.result,
      }));
  }
}
