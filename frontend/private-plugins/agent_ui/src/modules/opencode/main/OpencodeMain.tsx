import {
  IconKey,
  IconLock,
  IconRefresh,
  IconTrash,
} from '@tabler/icons-react';
import { Spinner, useToast } from 'erxes-ui';
import { useCallback, useEffect, useState } from 'react';
import { SERVER_STATUSES } from '~/modules/deploy/constants';
import { DestroyServerDialog } from '~/modules/deploy/components/DestroyServerDialog';
import { RestartServerDialog } from '~/modules/detail/components/RestartServerDialog';
import { RestartingOverlay } from '~/modules/detail/components/RestartingOverlay';
import { OpencodeDeployScreen } from '../deploy/components/OpencodeDeployScreen';
import { useOpencodeDestroy } from '../deploy/hooks/useOpencodeDestroy';
import { OpencodeApiKeyDialog } from '../detail/components/OpencodeApiKeyDialog';
import { OpencodeCredentialsDialog } from '../detail/components/OpencodeCredentialsDialog';
import { useOpencodeRestart } from '../detail/hooks/useOpencodeRestart';
import { useOpencode } from './hooks/useOpencode';
import { useCurrentIdentifierId } from '../../assistant-orgs/hooks/useAssistantOrg';
import { useDeleteIdentifier } from '../../assistant-orgs/hooks/useDeleteAssistantOrg';
import { useNavigate } from 'react-router-dom';

export const OpencodeMain = () => {
  const navigate = useNavigate();
  const identifierId = useCurrentIdentifierId();
  const { opencode, loading, refetch } = useOpencode();
  const { restart, loading: restarting } = useOpencodeRestart();
  const { destroyOpencode, loading: destroying } = useOpencodeDestroy();
  const { deleteIdentifier, loading: deletingIdentifier } =
    useDeleteIdentifier();
  const { toast } = useToast();
  const [iframeKey, setIframeKey] = useState(0);
  const [restartOpen, setRestartOpen] = useState(false);
  const [destroyOpen, setDestroyOpen] = useState(false);
  const [apiKeyOpen, setApiKeyOpen] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const refreshIframe = useCallback(() => setIframeKey((key) => key + 1), []);

  useEffect(() => {
    if (opencode?.status !== SERVER_STATUSES.DEPLOYING) {
      return;
    }

    const timer = window.setInterval(() => {
      void refetch();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [opencode?.status, refetch]);

  if (loading) {
    return <Spinner />;
  }

  const isApproved =
    !!opencode && opencode.status === SERVER_STATUSES.APPROVED;
  const iframeSrc =
    opencode?.token && opencode.url
      ? `${opencode.url.replace(/\/$/, '')}/#token=${encodeURIComponent(opencode.token)}`
      : opencode?.url || '';

  if (!isApproved) {
    return (
      <div className="flex flex-1 overflow-auto p-4">
        <div className="flex w-full items-center justify-center">
          <div className="w-full max-w-md">
            <OpencodeDeployScreen />
          </div>
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
      <RestartingOverlay
        visible={restarting}
        stoppingDescription="Please wait while your opencode server is being restarted"
        loadingDescription="Opencode is restarting"
        footerText="This may take 1–2 minutes before the iframe responds again."
      />
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
          <button
            onClick={() => setApiKeyOpen(true)}
            className="p-1.5 rounded hover:bg-muted transition-colors"
            title="Update provider key"
          >
            <IconKey className="size-4" />
          </button>
          <button
            onClick={() => setCredentialsOpen(true)}
            className="p-1.5 rounded hover:bg-muted transition-colors"
            title="Show login credentials"
          >
            <IconLock className="size-4" />
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
        src={iframeSrc}
        title="Opencode"
        className="w-full flex-1 border-0 transition-opacity duration-200 opacity-100"
        allow="clipboard-read; clipboard-write; microphone"
      />
      <RestartServerDialog
        open={restartOpen}
        onOpenChange={setRestartOpen}
        onConfirm={handleRestartConfirm}
        loading={restarting}
        title="Restart opencode?"
        description="This will restart your opencode server. The workspace may be unavailable for a few minutes."
      />
      <DestroyServerDialog
        open={destroyOpen}
        onOpenChange={setDestroyOpen}
        onConfirm={async () => {
          try {
            await destroyOpencode();
            await deleteIdentifier(identifierId);
            toast({ variant: 'success', title: 'AI Agent deleted' });
            navigate('/agent/agents');
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            toast({
              title: 'Destroy failed',
              description: message,
              variant: 'destructive',
            });
          }
        }}
        loading={destroying || deletingIdentifier}
        title="Destroy Agent server?"
        description="This will permanently remove your Agent workspace server. This action cannot be undone."
        onAfterConfirm={() => {
          void refetch();
        }}
      />
      <OpencodeApiKeyDialog
        open={apiKeyOpen}
        provider={opencode.provider}
        onSuccess={() => {
          setApiKeyOpen(false);
          refreshIframe();
          void refetch();
        }}
        onCancel={() => setApiKeyOpen(false)}
      />
      <OpencodeCredentialsDialog
        open={credentialsOpen}
        onOpenChange={setCredentialsOpen}
      />
    </div>
  );
};
