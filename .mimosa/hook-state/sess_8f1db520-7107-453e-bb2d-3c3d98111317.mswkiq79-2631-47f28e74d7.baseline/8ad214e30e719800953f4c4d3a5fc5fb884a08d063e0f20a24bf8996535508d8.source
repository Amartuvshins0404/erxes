import { IconCode } from '@tabler/icons-react';
import { Sheet, Skeleton } from 'erxes-ui';
import { useState } from 'react';
import { SERVER_STATUSES } from '~/modules/deploy/constants';
import { useOpencode } from '../../main/hooks/useOpencode';
import { OpencodeDeployForm } from './OpencodeDeployForm';
import { OpencodePendingState } from './OpencodePendingState';

export const OpencodeDeployScreen = () => {
  const { opencode, loading, refetch } = useOpencode();
  const [open, setOpen] = useState(false);

  if (loading) {
    return <Skeleton className="h-52 w-full rounded-md" />;
  }

  if (!opencode) {
    return (
      <>
        <Sheet open={open} onOpenChange={setOpen}>
          <Sheet.View className="p-0 md:w-[calc(100vw-theme(spacing.4))] sm:max-w-xl">
            <Sheet.Header>
              <Sheet.Title>Add AI Agent</Sheet.Title>
              <Sheet.Close />
            </Sheet.Header>
            <Sheet.Content className="px-5 py-5">
              <OpencodeDeployForm />
            </Sheet.Content>
          </Sheet.View>
        </Sheet>
      </>
    );
  }

  if (opencode.status === SERVER_STATUSES.DEPLOYING) {
    return <OpencodePendingState onRefresh={refetch} />;
  }

  return <OpencodePendingState onRefresh={refetch} />;
};
