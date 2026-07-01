// Tracks in-flight /chat/stream runs so an explicit cancel can abort them
// server-side. The gateway proxy does not forward the client disconnect —
// req.on('close') never fires upstream — so the client's Stop cannot rely on the
// socket closing. It calls the mastraChatCancel mutation instead, which aborts
// the tracked run's AbortController here. Keyed per (tenant, user, thread); the
// UI guards against a second concurrent turn on a thread, so one slot suffices.

const activeRuns = new Map<string, AbortController>();

const runKey = (subdomain: string, userId: string, threadId: string): string =>
  `${subdomain}:${userId}:${threadId}`;

/** Register an in-flight run's AbortController. Returns an unregister fn that
 *  removes only THIS controller, so a newer run reclaiming the slot is never
 *  clobbered by the previous run's teardown. */
export function registerActiveRun(
  subdomain: string,
  userId: string,
  threadId: string,
  controller: AbortController,
): () => void {
  const key = runKey(subdomain, userId, threadId);
  activeRuns.set(key, controller);
  return () => {
    if (activeRuns.get(key) === controller) activeRuns.delete(key);
  };
}

/** Abort the tracked run for a thread, if one is in flight. Returns true when a
 *  run was found and signalled. */
export function cancelActiveRun(
  subdomain: string,
  userId: string,
  threadId: string,
): boolean {
  const key = runKey(subdomain, userId, threadId);
  const controller = activeRuns.get(key);
  if (!controller) return false;
  controller.abort();
  activeRuns.delete(key);
  return true;
}
