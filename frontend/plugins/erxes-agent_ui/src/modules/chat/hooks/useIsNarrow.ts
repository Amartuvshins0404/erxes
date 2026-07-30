import { useEffect, useState } from 'react';

// True below the Tailwind `md` breakpoint (768px), where the fixed sessions
// side panel would otherwise squeeze the message column off-screen. Drives the
// off-canvas drawer treatment in ChatPage; desktop (≥md) keeps the static rail.
const NARROW_BREAKPOINT = 768;

export const useIsNarrow = (): boolean => {
  const [narrow, setNarrow] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia(`(max-width: ${NARROW_BREAKPOINT - 1}px)`).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${NARROW_BREAKPOINT - 1}px)`);
    const onChange = () => setNarrow(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return narrow;
};
