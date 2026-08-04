import { Badge, Button, Spinner, toast } from 'erxes-ui';
import { IconCloudCheck, IconCloudUpload } from '@tabler/icons-react';
import { useCustomerSync, useSyncCustomer } from '@/admin/hooks/useCustomerSync';

const ALLOWED_CONTENT_TYPES = ['core:customer', 'block:contract'];

export const CustomerSync = ({
  contentId,
  contentType,
  customerId,
  access = 'write',
}: {
  contentId: string;
  contentType: string;
  access?: 'read' | 'write';
  customerId?: string;
}) => {
  const isAllowedContext = ALLOWED_CONTENT_TYPES.includes(contentType);
  const targetCustomerId = isAllowedContext
    ? contentType === 'core:customer'
      ? contentId
      : customerId
    : undefined;

  const { customerSync, loading, refetch } = useCustomerSync(
    targetCustomerId,
  );
  const { syncCustomer, loading: syncing } = useSyncCustomer();

  if (!isAllowedContext) {
    return null;
  }

  if (!targetCustomerId) {
    return (
      <div className="flex flex-col flex-auto justify-center items-center gap-4 text-muted-foreground p-8 text-center">
        <div className="bg-background p-6 border border-dashed rounded-xl">
          <IconCloudUpload />
        </div>
        <span className="text-sm">
          No customer linked to this record yet.
        </span>
      </div>
    );
  }

  if (loading) {
    return <Spinner containerClassName="py-20" />;
  }

  const handleSync = () => {
    syncCustomer({
      variables: { customerId: targetCustomerId },
      onCompleted: () => {
        toast({ title: 'Customer synced to Block Platform', variant: 'success' });
        refetch();
      },
      onError: (error) => {
        toast({
          title: 'Sync failed',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium text-primary">Block Platform Sync</span>
        {customerSync ? (
          <Badge variant="secondary" className="gap-1">
            <IconCloudCheck className="size-3.5" />
            Synced
          </Badge>
        ) : (
          <Badge variant="secondary">Not synced</Badge>
        )}
      </div>
      {customerSync && (
        <div className="text-sm text-muted-foreground space-y-1">
          <div>
            Block Platform ID:{' '}
            <span className="font-mono text-foreground">
              {customerSync.blockAdminId}
            </span>
          </div>
          {customerSync.updatedAt && (
            <div>
              Last synced:{' '}
              {new Date(customerSync.updatedAt).toLocaleString()}
            </div>
          )}
        </div>
      )}
      {access === 'write' && (
        <Button
          variant="secondary"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing && <Spinner containerClassName="flex-none" />}
          {customerSync ? 'Re-sync now' : 'Sync now'}
        </Button>
      )}
    </div>
  );
};

export default CustomerSync;
