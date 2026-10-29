import { IconFilterOff, IconInbox } from '@tabler/icons-react';
import { Button, Empty } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { useNotificationFilterControls } from '@/notification/hooks/useNotificationFilterControls';

export const NotificationEmptyState = () => {
  const { t } = useTranslation('common', { keyPrefix: 'notification' });
  const { status, hasActiveFilters, clearFilters, setStatus } =
    useNotificationFilterControls();
  const Icon = hasActiveFilters ? IconFilterOff : IconInbox;
  let message = t('no-notifications');
  if (hasActiveFilters) {
    message = t('no-filter-matches');
  } else if (status === 'unread') {
    message = t('all-caught-up');
  }

  return (
    <Empty className="h-full">
      <Empty.Header>
        <Empty.Media variant="icon">
          <Icon />
        </Empty.Media>
        <Empty.Title className="text-sm">{message}</Empty.Title>
        {hasActiveFilters && (
          <Empty.Description className="text-xs">
            {t('empty-filter-hint')}
          </Empty.Description>
        )}
      </Empty.Header>
      {hasActiveFilters ? (
        <Empty.Content>
          <Button variant="secondary" onClick={clearFilters}>
            <IconFilterOff />
            {t('clear-filters')}
          </Button>
        </Empty.Content>
      ) : (
        status !== 'all' && (
          <Empty.Content>
            <Button variant="secondary" onClick={() => setStatus('all')}>
              <IconInbox />
              {t('view-all')}
            </Button>
          </Empty.Content>
        )
      )}
    </Empty>
  );
};
