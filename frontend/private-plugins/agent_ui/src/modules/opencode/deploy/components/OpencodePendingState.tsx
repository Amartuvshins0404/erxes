import { Button, useToast } from 'erxes-ui';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentIdentifierId } from '~/modules/assistant-orgs/hooks/useAssistantOrg';
import { useDeleteIdentifier } from '~/modules/assistant-orgs/hooks/useDeleteAssistantOrg';
import { DestroyServerDialog } from '~/modules/deploy/components/DestroyServerDialog';
import { RestartServerDialog } from '~/modules/detail/components/RestartServerDialog';
import { useOpencodeDestroy } from '../hooks/useOpencodeDestroy';
import { useOpencodeRestart } from '../../detail/hooks/useOpencodeRestart';

interface OpencodePendingStateProps {
  onRefresh: () => Promise<unknown>;
}

export const OpencodePendingState = ({
  onRefresh,
}: OpencodePendingStateProps) => {
  const navigate = useNavigate();
  const identifierId = useCurrentIdentifierId();
  const [destroyOpen, setDestroyOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const { destroyOpencode, loading: destroying } = useOpencodeDestroy();
  const { deleteIdentifier, loading: deletingIdentifier } =
    useDeleteIdentifier();
  const { restart, loading: restarting } = useOpencodeRestart();
  const { toast } = useToast();
  const deleting = destroying || deletingIdentifier;

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Provisioning Agent</h3>
        <p className="text-muted-foreground text-xs">
          Your server is being prepared. This can take a few minutes before the
          iframe is ready.
        </p>
      </div>

      <Button
        type="button"
        onClick={() => void onRefresh()}
        variant="outline"
        className="w-full"
      >
        Refresh status
      </Button>

      <Button
        type="button"
        onClick={() => setRestartOpen(true)}
        variant="outline"
        disabled={restarting}
        className="w-full"
      >
        {restarting ? 'Restarting...' : 'Restart provisioning'}
      </Button>

      <Button
        variant="destructive"
        type="button"
        onClick={() => setDestroyOpen(true)}
        disabled={deleting}
        className="w-full"
      >
        {deleting ? 'Deleting...' : 'Destroy server'}
      </Button>

      <RestartServerDialog
        open={restartOpen}
        onOpenChange={setRestartOpen}
        onConfirm={() => {
          restart({
            onCompleted: () =>
              toast({
                variant: 'success',
                title: 'Restarted',
                description: 'Provisioning restart requested.',
              }),
            onError: (error) =>
              toast({
                title: 'Restart failed',
                description: error.message,
                variant: 'destructive',
              }),
          });
        }}
        loading={restarting}
        title="Restart Agent provisioning?"
        description="This will restart your Agent server setup. Use this if the workspace has been provisioning for too long."
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
              variant: 'destructive',
              title: 'Destroy failed',
              description: message,
            });
          }
        }}
        loading={deleting}
        title="Destroy Agent server?"
        description="This will permanently remove your workspace server and delete this AI Agent identifier."
      />
    </div>
  );
};
