import { zodResolver } from '@hookform/resolvers/zod';
import { IconKey } from '@tabler/icons-react';
import { AlertDialog, Button, Form, Input, Select, useToast } from 'erxes-ui';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { getOpencodeProviderOptions } from '../../constants';
import { useSetOpencodeApiKey } from '../hooks/useOpencodeApiKey';

const formSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  apiKey: z.string().min(1, 'API key is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface OpencodeApiKeyDialogProps {
  open: boolean;
  provider?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const OpencodeApiKeyDialog = ({
  open,
  provider,
  onSuccess,
  onCancel,
}: OpencodeApiKeyDialogProps) => {
  const { setKey, loading } = useSetOpencodeApiKey();
  const { toast } = useToast();
  const providerOptions = useMemo(
    () => getOpencodeProviderOptions(provider),
    [provider],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { provider: provider || '', apiKey: '' },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      provider: provider || '',
      apiKey: '',
    });
  }, [form, open, provider]);

  const onSubmit = async (values: FormValues) => {
    await setKey(values.provider, values.apiKey, {
      onCompleted: () => {
        toast({ variant: 'success', title: 'API key saved' });
        onSuccess();
      },
      onError: (err) => {
        toast({
          variant: 'destructive',
          title: 'Failed to save key',
          description: err.message,
        });
      },
    });
  };

  return (
    <AlertDialog open={open}>
      <AlertDialog.Content className="sm:max-w-md">
        <AlertDialog.Header className="flex flex-row gap-3 sm:flex-row">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <IconKey className="text-primary h-5 w-5" />
          </div>
          <div className="flex flex-col gap-2 text-left">
            <AlertDialog.Title className="text-base font-semibold">
              Update provider credentials
            </AlertDialog.Title>
            <AlertDialog.Description className="text-muted-foreground text-sm">
              Save a fresh provider key on your opencode server. The key is sent
              to the deployer and stored on the server side only.
            </AlertDialog.Description>
          </div>
        </AlertDialog.Header>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <Form.Field
              name="provider"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Provider ID</Form.Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <Form.Control>
                      <Select.Trigger className="w-full">
                        <Select.Value placeholder="Choose provider" />
                      </Select.Trigger>
                    </Form.Control>
                    <Select.Content>
                      {providerOptions.map((option) => (
                        <Select.Item key={option.value} value={option.value}>
                          {option.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    Pick from the supported provider IDs instead of typing a
                    raw value.
                  </p>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              name="apiKey"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>API key</Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      placeholder="Paste your provider key"
                      autoComplete="off"
                    />
                  </Form.Control>
                  <p className="text-muted-foreground text-xs">
                    For Kimi For Coding, use your Kimi Code API key from
                    www.kimi.com/code/console.
                  </p>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <AlertDialog.Footer className="flex gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="min-w-28"
              >
                {loading ? 'Saving...' : 'Save key'}
              </Button>
            </AlertDialog.Footer>
          </form>
        </Form>
      </AlertDialog.Content>
    </AlertDialog>
  );
};
