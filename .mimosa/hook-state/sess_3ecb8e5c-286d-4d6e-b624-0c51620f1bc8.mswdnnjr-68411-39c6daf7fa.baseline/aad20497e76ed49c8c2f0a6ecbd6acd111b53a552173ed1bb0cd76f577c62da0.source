import { IconRefresh, IconSparkles } from '@tabler/icons-react';
import { Button, Input, Sheet, Skeleton, useToast } from 'erxes-ui';
import { useEffect, useState } from 'react';
import { SERVER_STATUSES } from '../constants';
import { useAgent } from '../../main/hooks/useAgent';
import { AgentDeployForm } from './AgentDeployForm';

import { AgentPendingForm } from './AgentPendingForm';

import { AgentDeploySuccess } from './AgentDeploySuccess';
import { useManagedAgentDeploy } from '../hooks/useManagedAgentDeploy';
import { ManagedProvisioningProgress } from './ManagedProvisioningProgress';
import { isManagedAssistantAgent } from '../utils/isManagedAssistantAgent';

const AgentManagedRetry = () => {
  const { agent, refetch } = useAgent();
  const { deployManagedAgent, loading } = useManagedAgentDeploy();
  const { toast } = useToast();
  const [apiToken, setApiToken] = useState('');

  const retryProvisioning = async () => {
    if (!apiToken.trim()) {
      toast({
        variant: 'destructive',
        title: 'Kimi API key required',
      });
      return;
    }

    try {
      await deployManagedAgent({
        apiToken,
        provider: 'kimi',
      });
      await refetch();
      toast({
        variant: 'success',
        title: 'Runtime provisioned',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        variant: 'destructive',
        title: 'Retry provisioning failed',
        description: message,
      });
    }
  };

  useEffect(() => {
    if (!loading) {
      return;
    }

    const timer = window.setInterval(() => {
      refetch();
    }, 4000);

    return () => window.clearInterval(timer);
  }, [loading, refetch]);

  return (
    <div className="flex flex-col gap-4 py-2">
      <ManagedProvisioningProgress
        status={loading ? SERVER_STATUSES.PENDING : SERVER_STATUSES.FAILED}
        stage={agent?.provisioning?.stage}
        message={agent?.provisioning?.message}
        startedAt={agent?.provisioning?.startedAt || agent?.updatedAt}
        updatedAt={agent?.provisioning?.updatedAt}
        error={agent?.provisioning?.error}
        runtimeUrl={agent?.url}
        retrying={loading}
      />

      <div className="space-y-2">
        <label className="text-xs font-medium" htmlFor="managed-kimi-api-key">
          Kimi API key
        </label>
        <Input
          id="managed-kimi-api-key"
          value={apiToken}
          onChange={(event) => setApiToken(event.target.value)}
          placeholder="Paste your Kimi API key"
          autoComplete="off"
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:flex">
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => refetch()}
          className="flex-1 gap-2"
        >
          <IconRefresh className="h-4 w-4" />
          Refresh runtime
        </Button>
        <Button
          type="button"
          disabled={loading || !apiToken.trim()}
          onClick={retryProvisioning}
          className="flex-1 gap-2"
        >
          {loading && <IconRefresh className="h-4 w-4 animate-spin" />}
          {loading ? 'Provisioning...' : 'Retry provisioning'}
        </Button>
      </div>
    </div>
  );
};

export const AgentDeployScreen = () => {
  const { agent, loading } = useAgent(undefined, { pollWhilePending: true });
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
            <Sheet.Content className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <AgentDeployForm />
            </Sheet.Content>
          </Sheet.View>
        </Sheet>
      </>
    );
  }

  if (
    agent?.status === SERVER_STATUSES.DEPLOYING ||
    agent?.status === SERVER_STATUSES.PENDING
  ) {
    if (isManagedAssistantAgent(agent)) {
      return (
        <ManagedProvisioningProgress
          status={agent.status}
          stage={agent.provisioning?.stage}
          message={agent.provisioning?.message}
          startedAt={agent.provisioning?.startedAt || agent.createdAt}
          updatedAt={agent.provisioning?.updatedAt}
          error={agent.provisioning?.error}
          runtimeUrl={agent.url}
        />
      );
    }

    return <AgentPendingForm createdAt={agent.createdAt} />;
  }

  if (agent?.status === SERVER_STATUSES.APPROVED) {
    return <AgentDeploySuccess />;
  }

  if (agent?.status === SERVER_STATUSES.FAILED) {
    return <AgentManagedRetry />;
  }

  return <AgentDeployForm />;
};
