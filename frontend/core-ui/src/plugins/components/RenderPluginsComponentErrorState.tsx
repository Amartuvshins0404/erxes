import type { Dispatch, SetStateAction } from 'react';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import { Button, Empty } from 'erxes-ui';
import {
  RemoteComponent,
  RemoteModule,
  resolveRemoteComponent,
} from '../utils/resolveRemoteComponent';

import { loadRemote } from '@module-federation/enhanced/runtime';
import { useTranslation } from 'react-i18next';

export const RenderPluginsComponentErrorState = ({
  pluginName,
  remoteModuleName,
  setPlugin,
  setHasError,
  setIsLoading,
}: {
  pluginName: string;
  remoteModuleName: string;
  setPlugin: Dispatch<SetStateAction<RemoteComponent | null>>;
  setHasError: Dispatch<
    SetStateAction<{
      message: string;
    } | null>
  >;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}) => {
  const { t } = useTranslation('common', { keyPrefix: 'plugins' });
  const retry = () => {
    setHasError(null);
    setIsLoading(true);
    loadRemote<RemoteModule>(`${pluginName}/${remoteModuleName}`, {
      from: 'runtime',
    })
      .then((remoteModule) => {
        const remoteComponent = resolveRemoteComponent(
          remoteModule,
          remoteModuleName,
        );

        if (!remoteComponent)
          throw new Error('Plugin module is empty or invalid');

        setPlugin(() => remoteComponent);
      })
      .catch((error) => {
        setHasError({
          message:
            error instanceof Error ? error.message : 'Failed to load plugin',
        });
        setPlugin(null);
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <Empty className="min-h-svh">
      <Empty.Header>
        <Empty.Media variant="icon" className="bg-warning/10 text-warning">
          <IconAlertTriangle />
        </Empty.Media>
        <Empty.Title className="text-sm font-semibold">
          {t('module-unavailable')}
        </Empty.Title>
        <code className="block text-xs text-muted-foreground">
          {pluginName}/{remoteModuleName}
        </code>
        <Empty.Description className="text-xs">
          {t('failed-to-load')}
        </Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <Button variant="outline" className="rounded-full" onClick={retry}>
          <IconRefresh />
          {t('try-again')}
        </Button>
      </Empty.Content>
    </Empty>
  );
};
