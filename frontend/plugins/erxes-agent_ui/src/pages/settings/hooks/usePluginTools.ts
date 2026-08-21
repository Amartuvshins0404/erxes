import { useCallback, useEffect, useState } from 'react';
import { REACT_APP_API_URL } from 'erxes-ui';

export interface IMastraPluginToolItem {
  id: string;
  kind: string;
  module: string | null;
  method: string | null;
  destructive: boolean | null;
  description: string | null;
  agentUsable: boolean;
  permissionAction: string | null;
}

export interface IMastraPluginTools {
  plugin: string;
  supported: boolean;
  enabled: boolean;
  disabledTools: string[];
  tools: IMastraPluginToolItem[];
}

const LIST_URL = `${REACT_APP_API_URL}/pl:erxes-agent/plugin-tools`;
const UPDATE_URL = `${REACT_APP_API_URL}/pl:erxes-agent/plugin-tools/curation`;

const readError = async (res: Response): Promise<Error> => {
  try {
    const data = (await res.json()) as { error?: string } | null;
    if (data?.error) return new Error(data.error);
  } catch {
    // Non-JSON error body — fall through to the status text.
  }
  return new Error(`HTTP ${res.status}`);
};

/** Admin REST surface for per-plugin agent-tool curation. */
export const usePluginTools = () => {
  const [plugins, setPlugins] = useState<IMastraPluginTools[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [savingPlugin, setSavingPlugin] = useState<string | null>(null);

  const list = useCallback(async () => {
    const res = await fetch(LIST_URL, { credentials: 'include' });
    if (!res.ok) throw await readError(res);
    return (await res.json()) as IMastraPluginTools[];
  }, []);

  const refresh = useCallback(async () => {
    try {
      setPlugins(await list());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [list]);

  useEffect(() => {
    setLoading(true);
    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  const updateCuration = useCallback(
    async (plugin: string, enabled: boolean, disabledTools: string[]) => {
      setSavingPlugin(plugin);
      try {
        const res = await fetch(UPDATE_URL, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plugin, enabled, disabledTools }),
        });
        if (!res.ok) throw await readError(res);
        await refresh();
      } finally {
        setSavingPlugin(null);
      }
    },
    [refresh],
  );

  return { plugins, loading, error, savingPlugin, updateCuration };
};