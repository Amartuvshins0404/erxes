import { FederationHost, getInstance } from '@module-federation/enhanced/runtime';
import { ComponentType, useEffect, useState } from 'react';

const hasRemote = (host: FederationHost, pluginName: string) =>
  !!host.options.remotes?.some(
    (remote) => remote.name === pluginName || remote.alias === pluginName,
  );

/**
 * Plugin remotes are only registered on the host (core-ui) federation
 * instance. This plugin's own instance declares no remotes, so `loadRemote`
 * from `@module-federation/enhanced/runtime` resolves against `blockagency_ui`
 * and never finds another plugin. Resolve the instance that actually knows the
 * remote instead.
 */
const resolveFederationHost = (pluginName: string): FederationHost | null => {
  const instance = getInstance();

  if (instance && hasRemote(instance, pluginName)) {
    return instance;
  }

  return (
    globalThis.__FEDERATION__?.__INSTANCES__?.find((host) =>
      hasRemote(host, pluginName),
    ) ?? null
  );
};

export const useRemoteComponent = <P extends object>(
  pluginName: string,
  remoteModuleName: string,
) => {
  const [Component, setComponent] = useState<ComponentType<P> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    setComponent(null);
    setError(null);
    setLoading(true);

    const host = resolveFederationHost(pluginName);

    if (!host) {
      setError(new Error(`The "${pluginName}" plugin is not available.`));
      setLoading(false);

      return;
    }

    host
      .loadRemote<{ default: ComponentType<P> } | null>(
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
