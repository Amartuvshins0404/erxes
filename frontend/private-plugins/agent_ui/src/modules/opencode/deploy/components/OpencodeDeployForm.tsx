import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, Input, Select, useToast } from 'erxes-ui';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { OPENCODE_PROVIDER_OPTIONS } from '../../constants';
import { useOpencode } from '../../main/hooks/useOpencode';
import { useOpencodeDeploy } from '../hooks/useOpencodeDeploy';

const providerRegex = /^[a-z0-9_-]+$/;

const deployFormSchema = z.object({
  provider: z
    .string()
    .min(1, 'Provider is required')
    .regex(
      providerRegex,
      'Use lowercase letters, numbers, underscores, or hyphens only',
    ),
  apiKey: z.string().min(1, 'API key is required'),
});

type DeployFormValues = z.infer<typeof deployFormSchema>;

export const OpencodeDeployForm = () => {
  const { refetch } = useOpencode();
  const { deployOpencode, loading } = useOpencodeDeploy();
  const { toast } = useToast();

  const form = useForm<DeployFormValues>({
    resolver: zodResolver(deployFormSchema),
    defaultValues: { provider: 'kimi', apiKey: '' },
  });

  const onSubmit = async (data: DeployFormValues) => {
    try {
      await deployOpencode({
        provider: data.provider,
        apiToken: data.apiKey,
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
          <h3 className="text-sm font-medium">Add AI Agent</h3>
          <p className="text-muted-foreground text-xs">
            Enter the provider and API token for this AI Agent.
          </p>
        </div>
        <Form.Field
          name="provider"
          render={({ field }) => (
            <Form.Item className="w-full">
              <Form.Label>Provider ID</Form.Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <Form.Control>
                  <Select.Trigger className="w-full">
                    <Select.Value placeholder="Choose provider" />
                  </Select.Trigger>
                </Form.Control>
                <Select.Content>
                  {OPENCODE_PROVIDER_OPTIONS.map((option) => (
                    <Select.Item key={option.value} value={option.value}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
              <p className="text-muted-foreground text-xs">
                Only supported provider IDs are shown here, so the deploy
                request cannot send a mistyped value.
              </p>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          name="apiKey"
          render={({ field }) => (
            <Form.Item className="w-full">
              <Form.Label>Provider API key</Form.Label>
              <Form.Control>
                <Input
                  {...field}
                  placeholder="Paste your provider key"
                  autoComplete="off"
                  className="w-full"
                />
              </Form.Control>
              <p className="text-muted-foreground text-xs">
                For Kimi For Coding, paste your Kimi Code API key from
                www.kimi.com/code/console.
              </p>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Button type="submit" disabled={loading} className="w-full mt-1">
          {loading ? 'Saving...' : 'Add AI Agent'}
        </Button>
      </form>
    </Form>
  );
};
