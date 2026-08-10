import { loadRemote } from '@module-federation/enhanced/runtime';
import { ComponentType, useEffect, useState } from 'react';

export const useRemoteComponent = <P extends object>(
  pluginName: string,
  remoteModuleName: string,
) => {
  const [Component, setComponent] = useState<ComponentType<P> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadRemote<{ default: ComponentType<P> }>(
      `${pluginName}/${remoteModuleName}`,
      { from: 'runtime' },
    )
      .then((remoteModule) => {
        if (isMounted) {
          setComponent(() => remoteModule?.default ?? null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err
              : new Error('Failed to load remote component'),
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [pluginName, remoteModuleName]);

  return { Component, loading, error };
};
