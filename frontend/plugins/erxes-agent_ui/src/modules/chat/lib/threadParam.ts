// Pure ?thread= URL param editor backing conversation addressability. Setting a
// threadId makes the active conversation deep-linkable (and survive reload / walk
// under browser Back); clearing it falls back to the agent's default — the
// most-recent thread or a fresh draft — exactly as an agent-only URL did before.
// Kept side-effect-free (returns a fresh URLSearchParams) so it slots straight
// into react-router's setSearchParams(prev => …) updater.
export const withThreadParam = (
  prev: URLSearchParams,
  threadId: string | undefined,
): URLSearchParams => {
  const next = new URLSearchParams(prev.toString());
  if (threadId) next.set('thread', threadId);
  else next.delete('thread');
  return next;
};
