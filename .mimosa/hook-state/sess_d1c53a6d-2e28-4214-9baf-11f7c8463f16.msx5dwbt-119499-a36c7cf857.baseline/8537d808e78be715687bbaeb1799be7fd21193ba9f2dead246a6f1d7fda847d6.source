import { IconSparkles, IconUserPlus } from '@tabler/icons-react';
import { Button, Form, Spinner, Sheet, useToast } from 'erxes-ui';

import { useCallback, useState } from 'react';
import { useAgentAdd } from '../hooks/useAgentAdd';
import { SubmitHandler } from 'react-hook-form';
import { useAgentForm } from '../hooks/useAgentFormt';
import { AgentForm } from './AgentForm';

export const AddAgentTrigger = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { form } = useAgentForm();

  const [open, setOpen] = useState(false);
  const { addAgent, loading } = useAgentAdd();
  const { toast } = useToast();

  const submitHandler: SubmitHandler<any> = useCallback(
    async (data) => {
      addAgent({
        variables: { input: { agentId: data.name, botName: data.name } },
        onCompleted: () => {
          toast({
            variant: 'success',
            title: 'Agent created successfully',
          });
          form.reset({ name: '' });
          setOpen(false);
          onSuccess?.();
        },
        onError: (error) =>
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          }),
      });
    },
    [addAgent, toast, form, setOpen, onSuccess],
  );
  return (
    <Sheet
      open={open}
      onOpenChange={(open) => (open ? setOpen(true) : setOpen(false))}
    >
      <Sheet.Trigger asChild>
        <button
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="Agents"
        >
          <IconUserPlus className="size-4" />
        </button>
      </Sheet.Trigger>
      <Sheet.View className="p-0">
        <Form {...form}>
          <form
            className="flex flex-col gap-0 size-full"
            onSubmit={form.handleSubmit(submitHandler)}
          >
            <Sheet.Header>
              <IconSparkles />
              <Sheet.Title>Add Agent</Sheet.Title>
              <Sheet.Close />
            </Sheet.Header>
            <Sheet.Content className="grow size-full flex flex-col px-5 py-4">
              <AgentForm form={form} />
            </Sheet.Content>
            <Sheet.Footer>
              <Button variant={'secondary'} onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Spinner /> : 'Add Agent'}
              </Button>
            </Sheet.Footer>
          </form>
        </Form>
      </Sheet.View>
    </Sheet>
  );
};
