import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useEffect, useState } from 'react';
import { ThemeOption } from '../types';

export const themeState = atomWithStorage<ThemeOption>('erxes-theme', 'light');

/** Returns true when the active theme is dark (or system-dark). Subscribes to
 *  OS-level preference changes when theme === 'system'. */
export function useIsDark(): boolean {
  const [theme] = useAtom(themeState);
  const [sysDark, setSysDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSysDark(mq.matches); // sync to current OS value in case it changed while we weren't subscribed
    const handler = (e: MediaQueryListEvent) => setSysDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);
  return theme === 'dark' || (theme === 'system' && sysDark);
}
