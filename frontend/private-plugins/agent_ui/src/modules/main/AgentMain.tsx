import { AgentDeployScreen } from '../deploy/components/AgentDeployScreen';
import { AgentTransferCredentialsDialog } from '../deploy/components/AgentTransferCredentialsDialog';
import { useAgent } from './hooks/useAgent';
import { useFixAndRestart } from '../detail/hooks/useFixAndRestart';
import { useKimiKeyStatus } from '../detail/hooks/useKimiKey';
import { Button, Card, Spinner } from 'erxes-ui';
import {
  IconKey,
  IconLibrary,
  IconRefresh,
  IconTransfer,
  IconTrash,
} from '@tabler/icons-react';
import { useToast } from 'erxes-ui';
import { AddAgentTrigger } from '../detail/components/AddAgent';
import { RestartServerDialog } from '../detail/components/RestartServerDialog';
import { RestartingOverlay } from '../detail/components/RestartingOverlay';
import { LlmConnectionDialog } from '../detail/components/LlmConnectionDialog';
import { DestroyServerDialog } from '../deploy/components/DestroyServerDialog';
import { useAgentDestroy } from '../deploy/hooks/useAgentDestroy';
import { isManagedAssistantAgent } from '../deploy/utils/isManagedAssistantAgent';
import { useState, useCallback } from 'react';
import { SERVER_STATUSES } from '../deploy/constants';
import { useCurrentIdentifierId } from '../assistant-orgs/hooks/useAssistantOrg';
import { useDeleteIdentifier } from '../assistant-orgs/hooks/useDeleteAssistantOrg';
import { useNavigate } from 'react-router-dom';

export const AgentMain = () => {
  const navigate = useNavigate();
  const identifierId = useCurrentIdentifierId();
  const { agent, loading } = useAgent();
  const { restart, loading: restarting } = useFixAndRestart();
  const { destroyAgent, loading: destroying } = useAgentDestroy();
  const { deleteIdentifier, loading: deletingIdentifier } =
    useDeleteIdentifier();
  const { toast } = useToast();
  const [iframeKey, setIframeKey] = useState(0);
  const [restartOpen, setRestartOpen] = useState(false);
  const [destroyOpen, setDestroyOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const refreshIframe = useCallback(() => setIframeKey((k) => k + 1), []);

  const runtimeUrl = agent?.url?.trim().replace(/\/+$/, '');
  const isApproved =
    !!agent && agent.status === SERVER_STATUSES.APPROVED && !!runtimeUrl;
  const shouldCheckKimiKey =
    isApproved && (!agent?.provider || agent.provider === 'kimi');
  const { hasKey, refetch: refetchKimiKey } = useKimiKeyStatus(
    !shouldCheckKimiKey,
  );
  const [llmConnectionManualOpen, setLlmConnectionManualOpen] = useState(false);
  const llmConnectionForced = shouldCheckKimiKey && hasKey === false;
  const llmConnectionOpen = llmConnectionForced || llmConnectionManualOpen;

  if (loading) {
    return <Spinner />;
  }

  if (!isApproved) {
    return (
      <div className="flex flex-1 overflow-auto p-4">
        <div className="flex flex-col flex-auto justify-center items-center min-h-0 w-full">
          <Card className="w-full max-w-md p-6">
            <AgentDeployScreen />
          </Card>
        </div>
      </div>
    );
  }

  const handleRestartConfirm = () => {
    restart({
      onCompleted: () => {
        toast({ variant: 'success', title: 'Restarted' });
        refreshIframe();
      },
      onError: (error) =>
        toast({
          title: 'Restart failed',
          description: error.message,
          variant: 'destructive',
        }),
    });
  };

  return (
    <div className="relative h-full flex flex-col">
      <RestartingOverlay visible={restarting} />
      <div className="flex items-center justify-start px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setRestartOpen(true)}
            disabled={restarting}
            aria-label="Restart"
            title="Restart"
          >
            <IconRefresh
              className={`size-4 ${restarting ? 'animate-spin' : ''}`}
            />
          </Button>
          <AddAgentTrigger onSuccess={refreshIframe} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() =>
              navigate(`/agent/templates?assistantId=${identifierId}`)
            }
            aria-label="AI Assistant Templates"
            title="AI Assistant Templates"
          >
            <IconLibrary className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setLlmConnectionManualOpen(true)}
            aria-label="Change AI provider, model, or API key"
            title="Change AI provider, model, or API key"
          >
            <IconKey className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setTransferOpen(true)}
            aria-label="Transfer credentials"
            title="Transfer credentials"
          >
            <IconTransfer className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setDestroyOpen(true)}
            disabled={destroying || deletingIdentifier}
            className="text-destructive hover:bg-destructive/10"
            aria-label="Destroy server"
            title="Destroy server"
          >
            <IconTrash className="size-4" />
          </Button>
        </div>
      </div>
      <iframe
        key={iframeKey}
        src={`${runtimeUrl}/#token=${agent.token}`}
        title="Agent"
        className="w-full flex-1 border-0 transition-opacity duration-200 opacity-100"
        allow="clipboard-read; clipboard-write; microphone"
      />
      <RestartServerDialog
        open={restartOpen}
        onOpenChange={setRestartOpen}
        onConfirm={handleRestartConfirm}
        loading={restarting}
      />
      <DestroyServerDialog
        open={destroyOpen}
        onOpenChange={setDestroyOpen}
        onConfirm={async () => {
          try {
            await destroyAgent();
            await deleteIdentifier(identifierId);
            toast({ variant: 'success', title: 'AI Assistant deleted' });
            navigate('/agent/assistant');
          } catch (error: unknown) {
            toast({
              title: 'Destroy failed',
              description:
                error instanceof Error ? error.message : String(error),
              variant: 'destructive',
            });
          }
        }}
        loading={destroying || deletingIdentifier}
      />
      <AgentTransferCredentialsDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
      />
      <LlmConnectionDialog
        open={llmConnectionOpen}
        currentProvider={agent.provider}
        currentModel={agent.model}
        managed={isManagedAssistantAgent(agent)}
        onSuccess={(provider) => {
          setLlmConnectionManualOpen(false);
          if (provider === 'kimi') {
            refetchKimiKey();
          }
          refreshIframe();
        }}
        onCancel={
          llmConnectionForced
            ? undefined
            : () => setLlmConnectionManualOpen(false)
        }
      />
    </div>
  );
};
