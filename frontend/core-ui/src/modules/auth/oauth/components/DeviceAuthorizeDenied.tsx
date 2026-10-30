import { IconX } from '@tabler/icons-react';

import { Empty } from 'erxes-ui';
import { useTranslation } from 'react-i18next';

export const DeviceAuthorizeDenied = () => {
  const { t } = useTranslation('common', { keyPrefix: 'auth' });
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Empty className="w-full max-w-md flex-none rounded-3xl bg-card shadow-lg">
        <Empty.Header>
          <Empty.Media
            variant="icon"
            className="size-12 rounded-full text-muted-foreground shadow-none"
          >
            <IconX />
          </Empty.Media>
          <Empty.Title className="text-xl font-semibold">
            {t('request-canceled')}
          </Empty.Title>
          <Empty.Description>{t('access-not-granted')}</Empty.Description>
        </Empty.Header>
      </Empty>
    </div>
  );
};
