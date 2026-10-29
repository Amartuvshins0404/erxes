import { IconInbox } from '@tabler/icons-react';
import { Empty } from 'erxes-ui';
import { useTranslation } from 'react-i18next';

export const NoNotificationSelected = () => {
  const { t } = useTranslation('common', { keyPrefix: 'notification' });
  return (
    <Empty className="h-full w-full">
      <Empty.Header>
        <Empty.Media variant="icon">
          <IconInbox />
        </Empty.Media>
        <Empty.Title>{t('no-notification-selected')}</Empty.Title>
        <Empty.Description>{t('select-notification')}</Empty.Description>
      </Empty.Header>
    </Empty>
  );
};
