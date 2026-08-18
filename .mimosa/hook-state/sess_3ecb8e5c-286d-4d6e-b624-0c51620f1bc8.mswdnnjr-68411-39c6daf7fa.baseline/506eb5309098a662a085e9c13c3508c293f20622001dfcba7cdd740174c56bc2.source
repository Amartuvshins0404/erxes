import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, Input, useToast } from 'erxes-ui';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAgentApprove } from '../hooks/useAgentApprove';
import { useAgentDestroy } from '../hooks/useAgentDestroy';
import { useFixAndRestart } from '../../detail/hooks/useFixAndRestart';
import { DestroyServerDialog } from './DestroyServerDialog';

const approveFormSchema = z.object({
  code: z.string().min(1, 'Code is required'),
});

type ApproveFormValues = z.infer<typeof approveFormSchema>;

const AGENT_CREATING_THRESHOLD_MS = 8 * 60 * 1000;

interface AgentPendingFormProps {
  createdAt?: string;
}

export const AgentPendingForm = ({ createdAt }: AgentPendingFormProps) => {
  const [destroyOpen, setDestroyOpen] = useState(false);
  const { approveAgent, loading } = useAgentApprove();
  const { destroyAgent, loading: destroyLoading } = useAgentDestroy();
  const { restart: fixRestartAgent, loading: fixRestartLoading } =
    useFixAndRestart();
  const { toast } = useToast();

  const form = useForm<ApproveFormValues>({
    resolver: zodResolver(approveFormSchema),
    defaultValues: { code: '' },
  });

  const onSubmit = async (data: ApproveFormValues) => {
    try {
      await approveAgent(data.code);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        variant: 'destructive',
        title: 'Approve failed',
        description: message,
      });
    }
  };

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

  const onCheck = async () => {
    if (createdAt) {
      const elapsed = Date.now() - new Date(createdAt).getTime();
      if (elapsed < AGENT_CREATING_THRESHOLD_MS) {
        toast({
          title: 'Your agent is creating...',
          description: 'Please wait a few more minutes before checking.',
        });
        return;
      }
    }

    await fixRestartAgent({
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Send message to your agent again!.',
        });
      },
      onError: (err) => {
        toast({
          variant: 'destructive',
          title: 'Fix restart failed',
          description: err.message,
        });
      },
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        OpenClaw will send an approval token through the Discord bot. This may
        take 5-10 minutes. Paste it below to continue.
      </p>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          <Form.Field
            name="code"
            render={({ field }) => (
              <Form.Item className="w-full">
                <Form.Label>Enter Discord bot code</Form.Label>
                <Form.Control>
                  <Input {...field} className="w-full" />
                </Form.Control>
                <Form.Message />
              </Form.Item>
            )}
          />
          <Button type="submit" disabled={loading} className="w-full mt-1">
            {loading ? 'Approving...' : 'Approve'}
          </Button>
        </form>
      </Form>
      <Button
        variant="outline"
        type="button"
        onClick={onCheck}
        disabled={fixRestartLoading}
        className="w-full"
      >
        {fixRestartLoading ? 'Checking...' : 'Check'}
      </Button>
      <Button
        variant="destructive"
        type="button"
        onClick={() => setDestroyOpen(true)}
        disabled={destroyLoading}
        className="w-full"
      >
        Destroy server and start over
      </Button>
      <DestroyServerDialog
        open={destroyOpen}
        onOpenChange={setDestroyOpen}
        onConfirm={onDestroy}
        loading={destroyLoading}
      />
    </div>
  );
};
