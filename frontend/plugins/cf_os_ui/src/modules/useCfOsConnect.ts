import { useEffect, useState } from 'react';
import { REACT_APP_API_URL } from 'erxes-ui';
import { getCommandUrl } from './utils';

// Asks the dashboard backend (as the signed-in user) for a single-use code
// that signs the embedded Cloudflare OS app in without a password. The code
// rides on the frame URL once; nothing sensitive is stored or reused.
export function useCfOsConnect() {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const base = getCommandUrl();
    if (!base) {
      setError('CF_OS_URL is not configured.');
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `${REACT_APP_API_URL}/pl:erxes-agent/cf-os/connect-code`,
          { method: 'POST', credentials: 'include' },
        );
        if (!res.ok) throw new Error(`Connect failed (${res.status})`);
        const { code } = (await res.json()) as { code: string };
        if (!cancelled) {
          const sep = base.includes('?') ? '&' : '?';
          setSrc(`${base}${sep}cfOsCode=${encodeURIComponent(code)}`);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Connect failed');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { src, error };
}
