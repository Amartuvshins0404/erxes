import { IconLock } from '@tabler/icons-react';
import { Empty } from 'erxes-ui';
import { useTranslation } from 'react-i18next';

export const NoAccessPage = () => {
  const { t } = useTranslation('common', { keyPrefix: 'no-access' });
  return (
    <Empty className="h-full">
      <Empty.Header>
        <Empty.Media
          variant="icon"
          className="size-12 rounded-full text-muted-foreground shadow-none"
        >
          <IconLock />
        </Empty.Media>
        <Empty.Title>{t('title')}</Empty.Title>
        <Empty.Description>{t('description')}</Empty.Description>
      </Empty.Header>
    </Empty>
  );
};
