import { IconShieldCheck } from '@tabler/icons-react';

import { Empty } from 'erxes-ui';
import { useTranslation } from 'react-i18next';

type Props = {
  clientName?: string;
};

export const DeviceAuthorizeApproved = ({ clientName }: Props) => {
  const { t } = useTranslation('common', { keyPrefix: 'auth' });
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Empty className="w-full max-w-md flex-none rounded-3xl bg-card shadow-lg">
        <Empty.Header>
          <Empty.Media
            variant="icon"
            className="size-12 rounded-full bg-success/10 text-success shadow-none"
          >
            <IconShieldCheck />
          </Empty.Media>
          <Empty.Title className="text-xl font-semibold">
            {t('access-granted')}
          </Empty.Title>
          <Empty.Description>
            {t('access-granted-description', {
              name: clientName || t('this-application'),
            })}
          </Empty.Description>
        </Empty.Header>
      </Empty>
    </div>
  );
};
