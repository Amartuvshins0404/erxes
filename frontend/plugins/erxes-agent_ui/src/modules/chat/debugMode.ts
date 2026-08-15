import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

/**
 * Viewer-side "Debug mode" (Settings → General): when on, every tool call
 * renders its full args/result detail and tool rows/groups stay expanded
 * instead of the compact one-line/collapsed chat rendering. Per-browser only
 * (localStorage) — never sent to the backend and never affects other viewers.
 */
export const chatDebugModeAtom = atomWithStorage<boolean>(
  'erxes-agent:chatDebugMode',
  false,
);

export const useChatDebugMode = () => useAtom(chatDebugModeAtom);
