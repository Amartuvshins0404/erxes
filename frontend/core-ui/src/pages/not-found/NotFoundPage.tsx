import { useNavigate } from 'react-router-dom';

import { IconArrowLeft } from '@tabler/icons-react';
import { Button, Empty } from 'erxes-ui';
import { useAtomValue } from 'jotai';
import { loadingPluginsConfigState } from 'ui-modules';
import { LoadingScreen } from '@/auth/components/LoadingScreen';
import { useTranslation } from 'react-i18next';

export const NotFoundPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('common', { keyPrefix: 'not-found' });
  const loadingPluginsConfig = useAtomValue(loadingPluginsConfigState);

  if (loadingPluginsConfig) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Empty className="w-full max-w-md flex-none rounded-3xl bg-card shadow-lg">
        <Empty.Header>
          <Empty.Media className="text-6xl font-semibold tracking-tight text-primary">
            404
          </Empty.Media>
          <Empty.Title>{t('message')}</Empty.Title>
        </Empty.Header>
        <Empty.Content>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full"
            onClick={() => navigate('/')}
          >
            <IconArrowLeft />
            {t('go-back')}
          </Button>
        </Empty.Content>
      </Empty>
    </div>
  );
};
