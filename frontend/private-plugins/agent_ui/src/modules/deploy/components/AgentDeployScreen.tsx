import { IconSparkles } from '@tabler/icons-react';
import { Button, Sheet, Skeleton } from 'erxes-ui';
import { useState } from 'react';
import { SERVER_STATUSES } from '../constants';
import { useAgent } from '../../main/hooks/useAgent';
import { AgentDeployForm } from './AgentDeployForm';

import { AgentPendingForm } from './AgentPendingForm';

import { AgentDeploySuccess } from './AgentDeploySuccess';

export const AgentDeployScreen = () => {
  const { agent, loading } = useAgent();
  const [open, setOpen] = useState(false);

  if (loading) {
    return <Skeleton className="h-52 w-full rounded-md" />;
  }

  if (!agent) {
    return (
      <>
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Assistant not deployed</h3>
            <p className="text-muted-foreground text-xs">
              Configure this AI Assistant from the right-side panel instead of
              the inline form.
            </p>
          </div>

          <Button onClick={() => setOpen(true)} className="w-full gap-2">
            <IconSparkles className="h-4 w-4" />
            Configure AI Assistant
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <Sheet.View className="p-0 md:w-[calc(100vw-theme(spacing.4))] sm:max-w-xl">
            <Sheet.Header>
              <Sheet.Title>Add AI Assistant</Sheet.Title>
              <Sheet.Close />
            </Sheet.Header>
            <Sheet.Content className="px-5 py-5">
              <AgentDeployForm />
            </Sheet.Content>
          </Sheet.View>
        </Sheet>
      </>
    );
  }

  if (agent?.status === SERVER_STATUSES.DEPLOYING) {
    return <AgentPendingForm createdAt={agent.createdAt} />;
  }

  if (agent?.status === SERVER_STATUSES.APPROVED) {
    return <AgentDeploySuccess />;
  }

  return <AgentDeploySuccess />;
};
