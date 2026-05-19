import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, Input, Select, useToast } from 'erxes-ui';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAgent } from '../../main/hooks/useAgent';
import { useAgentDeploy } from '../hooks/useAgentDeploy';

const tokenRegex = /^[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+$/;

const deployFormSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  apiToken: z
    .string()
    .min(1, 'Kimi API key is required')
    .refine(
      (val) => val === 'erxesVIPcustomers' || val.startsWith('sk-'),
      'Kimi API keys start with "sk-"',
    ),
  discordBotToken: z
    .string()
    .min(1, 'Discord bot token is required')
    .regex(
      tokenRegex,
      'Token must be in Discord bot format (e.g. XXX.XXX.XXX)',
    ),
});

type DeployFormValues = z.infer<typeof deployFormSchema>;

export const AgentDeployForm = () => {
  const { refetch } = useAgent();
  const { deployAgent, loading } = useAgentDeploy();
  const { toast } = useToast();

  const form = useForm<DeployFormValues>({
    resolver: zodResolver(deployFormSchema),
    defaultValues: { provider: 'kimi', apiToken: '', discordBotToken: '' },
  });

  const onSubmit = async (data: DeployFormValues) => {
    try {
      await deployAgent({
        provider: data.provider,
        token: data.discordBotToken,
        apiToken: data.apiToken,
      });
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        variant: 'destructive',
        title: 'Deploy failed',
        description: message,
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Add AI Assistant</h3>
          <p className="text-muted-foreground text-xs">
            Enter the provider and API token for this AI Assistant.
          </p>
        </div>
        <Form.Field
          name="provider"
          render={({ field }) => (
            <Form.Item className="w-full">
              <Form.Label>Provider</Form.Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <Form.Control>
                  <Select.Trigger className="w-full">
                    <Select.Value placeholder="Choose provider" />
                  </Select.Trigger>
                </Form.Control>
                <Select.Content>
                  <Select.Item value="kimi">Kimi</Select.Item>
                </Select.Content>
              </Select>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          name="apiToken"
          render={({ field }) => (
            <Form.Item className="w-full">
              <Form.Label>API token</Form.Label>
              <Form.Control>
                <Input
                  {...field}
                  placeholder="Paste your API token"
                  autoComplete="off"
                  className="w-full"
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          name="discordBotToken"
          render={({ field }) => (
            <Form.Item className="w-full">
              <Form.Label>Discord bot token</Form.Label>
              <Form.Control>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="Paste your Discord bot token"
                  autoComplete="off"
                  className="w-full"
                />
              </Form.Control>
              <p className="text-muted-foreground text-xs">
                Required. Erxes uses this token during bootstrap so the bot
                can come online and send the pairing code.
              </p>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Button type="submit" disabled={loading} className="w-full mt-1">
          {loading ? 'Saving...' : 'Add AI Assistant'}
        </Button>
      </form>
    </Form>
  );
};
