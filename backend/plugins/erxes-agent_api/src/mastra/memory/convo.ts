// ---------------------------------------------------------------------------
// Advanced Memory — conversation assembly (pure).
//
// Keeps the LLM message array clean and Kimi-safe: working memory is injected
// only as a `system` context message, never as a tool-call frame.
// ---------------------------------------------------------------------------

export interface ConvoMessage {
  role: string;
  content: string;
}

/**
 * Assemble the turn's message array:
 *   [ workingMemoryBlock?, ...recentHistory, userMessage ]
 * The user message is always last; working memory uses the `system` role.
 */
export function augmentConvo(args: {
  recentHistory: ConvoMessage[];
  userMessage: string;
  workingMemoryBlock?: string | null;
}): ConvoMessage[] {
  const convo: ConvoMessage[] = [];
  if (args.workingMemoryBlock) {
    convo.push({ role: 'system', content: args.workingMemoryBlock });
  }
  convo.push(...args.recentHistory);
  convo.push({ role: 'user', content: args.userMessage });
  return convo;
}

/**
 * The stable "who" for resource-scoped memory. A logged-in user's id, or a
 * per-agent fallback when there is no user (so memory never silently merges
 * across agents).
 */
export function deriveResourceId(args: {
  user?: { _id?: string } | null;
  agentId: string;
}): string {
  return args.user?._id || `agent:${args.agentId}`;
}
