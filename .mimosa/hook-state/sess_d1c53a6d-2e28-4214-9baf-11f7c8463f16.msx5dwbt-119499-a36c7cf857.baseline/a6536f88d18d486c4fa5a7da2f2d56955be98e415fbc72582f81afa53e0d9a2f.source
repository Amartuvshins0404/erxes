import { IconRefresh } from '@tabler/icons-react';
import { Button, Spinner, toast, Tooltip } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { usePermissionCheck } from 'ui-modules';
import { useResyncOrder } from '../hooks/useResyncOrder';

const RESYNCABLE_STATUSES = ['pending', 'failed'];

export const OrderResyncButton = ({
  orderId,
  status,
}: {
  orderId: string;
  status?: string;
}) => {
  const { t } = useTranslation('mushop');
  const { hasActionPermission } = usePermissionCheck();
  const { resyncOrder, loading } = useResyncOrder(orderId);

  if (!hasActionPermission('mushopResyncOrder')) return null;
  if (!RESYNCABLE_STATUSES.includes(status || 'pending')) return null;

  const handleResync = async (e?: React.MouseEvent) => {
    e?.stopPropagation();

    try {
      await resyncOrder({ variables: { _id: orderId } });
      toast({ variant: 'success', title: t('Order resynced') });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('Failed to resync order'),
        description: error?.message,
      });
    }
  };

  return (
    <Tooltip.Provider>
      <Tooltip>
        <Tooltip.Trigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            disabled={loading}
            onClick={handleResync}
          >
            {loading ? (
              <Spinner size="sm" />
            ) : (
              <IconRefresh className="size-4" />
            )}
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>{t('Resync to supplier')}</Tooltip.Content>
      </Tooltip>
    </Tooltip.Provider>
  );
};
