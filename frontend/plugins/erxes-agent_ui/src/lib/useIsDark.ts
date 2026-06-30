import { useEffect, useState } from 'react';

/**
 * Local copy of erxes-ui's `useIsDark`, kept here to avoid module-federation
 * version-skew: `erxes-ui` is a host-provided singleton, so importing a NEWER
 * export than the deployed host shell provides throws at runtime
 * ("useIsDark is not a function") and takes the whole agent plugin down. The
 * same guard already exists for CHART_FONT in MermaidViewer.tsx.
 *
 * It reads the shared `erxes-theme` value (a jotai `atomWithStorage`, JSON-encoded
 * in localStorage) directly, mirroring erxes-ui/state/themeState.ts, so dark mode
 * stays in sync with the host without depending on the host's erxes-ui version.
 */
type ThemeOption = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'erxes-theme';

function readStoredTheme(): ThemeOption {
  if (typeof window === 'undefined') return 'light';
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return 'light';
  }
  if (!raw) return 'light';
  // atomWithStorage JSON-encodes values ("dark"); tolerate a legacy unquoted value too.
  let value: unknown = raw;
  try {
    value = JSON.parse(raw);
  } catch {
    /* legacy/unquoted value — fall through with the raw string */
  }
  return value === 'dark' || value === 'system' ? value : 'light';
}

/** Returns true when the active theme is dark (or system-dark). */
export function useIsDark(): boolean {
  const [theme, setTheme] = useState<ThemeOption>(readStoredTheme);
  const [sysDark, setSysDark] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  // Pick up theme changes made in other tabs/windows.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) setTheme(readStoredTheme());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Track OS-level preference only while following the system theme.
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSysDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSysDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return theme === 'dark' || (theme === 'system' && sysDark);
}
