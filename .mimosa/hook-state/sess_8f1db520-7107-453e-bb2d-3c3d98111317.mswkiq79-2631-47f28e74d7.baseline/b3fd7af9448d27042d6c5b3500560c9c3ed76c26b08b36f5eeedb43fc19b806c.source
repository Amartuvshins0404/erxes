import { useState } from 'react';
import { Button, useToast } from 'erxes-ui';
import { useAgentDestroy } from '../hooks/useAgentDestroy';
import { DestroyServerDialog } from './DestroyServerDialog';

export const AgentDeploySuccess = () => {
  const [destroyOpen, setDestroyOpen] = useState(false);
  const { destroyAgent, loading: destroyLoading } = useAgentDestroy();
  const { toast } = useToast();

  const onDestroy = async () => {
    try {
      await destroyAgent();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        variant: 'destructive',
        title: 'Destroy failed',
        description: message,
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <DestroyServerDialog
        open={destroyOpen}
        onOpenChange={setDestroyOpen}
        onConfirm={onDestroy}
        loading={destroyLoading}
      />
      <h3 className="font-medium text-sm">OpenClaw deployed successfully</h3>
      <p className="text-muted-foreground text-xs">
        This org&apos;s OpenClaw workspace is ready. You can continue with the
        Discord bot connection and use it now.
      </p>

      <Button
        variant="destructive"
        type="button"
        onClick={() => setDestroyOpen(true)}
        disabled={destroyLoading}
        className=""
      >
        Destroy server
      </Button>
    </div>
  );
};
