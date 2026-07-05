// The Chat page's sessions sidebar has two (soon three) modes, addressable via
// ?mode= so a reload / deep-link restores it — the same convention ?thread= uses
// for the active conversation. `chat` is the default (omitted from the URL);
// `scheduled` browses the selected agent's schedule run transcripts. A future
// `triggered` mode (automations/workflows) slots in here without touching callers.
export type ChatMode = 'chat' | 'scheduled';

const MODE_PARAM = 'mode';
const SCHEDULE_PARAM = 'schedule';

/** Read the active sidebar mode from the URL (defaults to `chat`). */
export const readChatMode = (params: URLSearchParams): ChatMode =>
  params.get(MODE_PARAM) === 'scheduled' ? 'scheduled' : 'chat';

/** The selected schedule id in scheduled mode, if any. */
export const readScheduleParam = (params: URLSearchParams): string | undefined =>
  params.get(SCHEDULE_PARAM) || undefined;

// Pure URLSearchParams editors (side-effect-free, return a fresh copy) so they
// drop straight into react-router's setSearchParams(prev => …) updater — mirrors
// withThreadParam.

/** Set/clear the sidebar mode. Leaving scheduled mode also drops the selected
 *  schedule so the URL never carries a stale ?schedule= into chat mode. */
export const withChatMode = (
  prev: URLSearchParams,
  mode: ChatMode,
): URLSearchParams => {
  const next = new URLSearchParams(prev.toString());
  if (mode === 'scheduled') {
    next.set(MODE_PARAM, 'scheduled');
  } else {
    next.delete(MODE_PARAM);
    next.delete(SCHEDULE_PARAM);
  }
  return next;
};

/** Set/clear the selected schedule (scheduled mode). */
export const withScheduleParam = (
  prev: URLSearchParams,
  scheduleId: string | undefined,
): URLSearchParams => {
  const next = new URLSearchParams(prev.toString());
  if (scheduleId) next.set(SCHEDULE_PARAM, scheduleId);
  else next.delete(SCHEDULE_PARAM);
  return next;
};
