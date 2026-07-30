import { AgentDeployScreen } from '../deploy/components/AgentDeployScreen';
import { AgentTransferCredentialsDialog } from '../deploy/components/AgentTransferCredentialsDialog';
import { useAgent } from './hooks/useAgent';
import { useFixAndRestart } from '../detail/hooks/useFixAndRestart';
import { useKimiKeyStatus } from '../detail/hooks/useKimiKey';
import { Card, Spinner } from 'erxes-ui';
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
import { KimiKeyDialog } from '../detail/components/KimiKeyDialog';
import { DestroyServerDialog } from '../deploy/components/DestroyServerDialog';
import { useAgentDestroy } from '../deploy/hooks/useAgentDestroy';
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
  const { hasKey, refetch: refetchKimiKey } = useKimiKeyStatus(!isApproved);
  const [kimiKeyManualOpen, setKimiKeyManualOpen] = useState(false);
  const kimiKeyForced = isApproved && hasKey === false;
  const kimiKeyOpen = kimiKeyForced || kimiKeyManualOpen;

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
          <button
            onClick={() => setRestartOpen(true)}
            disabled={restarting}
            className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-50"
            title="Restart"
          >
            <IconRefresh
              className={`size-4 ${restarting ? 'animate-spin' : ''}`}
            />
          </button>
          <AddAgentTrigger onSuccess={refreshIframe} />
          <button
            onClick={() =>
              navigate(`/agent/templates?assistantId=${identifierId}`)
            }
            className="p-1.5 rounded hover:bg-muted transition-colors"
            title="AI Assistant Templates"
          >
            <IconLibrary className="size-4" />
          </button>
          <button
            onClick={() => setKimiKeyManualOpen(true)}
            className="p-1.5 rounded hover:bg-muted transition-colors"
            title="Change Kimi API key"
          >
            <IconKey className="size-4" />
          </button>
          <button
            onClick={() => setTransferOpen(true)}
            className="p-1.5 rounded hover:bg-muted transition-colors"
            title="Transfer credentials"
          >
            <IconTransfer className="size-4" />
          </button>
          <button
            onClick={() => setDestroyOpen(true)}
            disabled={destroying || deletingIdentifier}
            className="p-1.5 rounded text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            title="Destroy server"
          >
            <IconTrash className="size-4" />
          </button>
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
          } catch (error: any) {
            toast({
              title: 'Destroy failed',
              description: error?.message,
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
      <KimiKeyDialog
        open={kimiKeyOpen}
        onSuccess={() => {
          setKimiKeyManualOpen(false);
          refetchKimiKey();
          refreshIframe();
        }}
        onCancel={kimiKeyForced ? undefined : () => setKimiKeyManualOpen(false)}
      />
    </div>
  );
};
