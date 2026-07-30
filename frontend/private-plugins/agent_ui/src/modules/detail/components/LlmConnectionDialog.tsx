import { zodResolver } from '@hookform/resolvers/zod';
import { IconKey, IconLoader2 } from '@tabler/icons-react';
import { AlertDialog, Button, Form, useToast } from 'erxes-ui';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LlmProviderApiKeyFields } from '~/modules/company-brain/components/LlmProviderApiKeyFields';
import {
  ASSISTANT_PROVIDER_OPTIONS,
  getManagedAssistantModel,
} from '~/modules/company-brain/llmProviders';
import { useSetLlmConnection } from '../hooks/useLlmConnection';

const formSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  model: z.string().min(1, 'Model is required'),
  apiKey: z.string().min(1, 'API key is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface LlmConnectionDialogProps {
  open: boolean;
  currentProvider?: string | null;
  currentModel?: string | null;
  managed: boolean;
  onSuccess: (provider: string) => void;
  onCancel?: () => void;
}

export const LlmConnectionDialog = ({
  open,
  currentProvider,
  currentModel,
  managed,
  onSuccess,
  onCancel,
}: LlmConnectionDialogProps) => {
  const { setConnection, loading } = useSetLlmConnection();
  const { toast } = useToast();
  const provider = currentProvider?.trim().toLowerCase() || 'kimi';
  const providerOptions = managed
    ? ASSISTANT_PROVIDER_OPTIONS
    : ASSISTANT_PROVIDER_OPTIONS.filter(({ value }) => value === 'kimi');
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider,
      model: currentModel || getManagedAssistantModel(provider),
      apiKey: '',
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      provider,
      model: currentModel || getManagedAssistantModel(provider),
      apiKey: '',
    });
  }, [currentModel, form, open, provider]);

  const onSubmit = async (values: FormValues) => {
    await setConnection(
      {
        provider: values.provider,
        model: values.model,
        apiKey: values.apiKey.trim(),
      },
      {
        onCompleted: () => {
          toast({
            variant: 'success',
            title: 'AI connection updated',
            description: 'The provider, model, and API key are active.',
          });
          onSuccess(values.provider);
        },
        onError: (error) => {
          // A timeout / 503 usually means the assistant is still restarting with
          // the new key in the background — not a real failure. Guide the user to
          // refresh rather than showing an alarming error.
          const message = error.message || '';
          const stillApplying =
            /timeout|timed out|503|network|failed to fetch|gateway/i.test(
              message,
            );
          toast(
            stillApplying
              ? {
                  variant: 'default',
                  title: 'Still applying your connection',
                  description:
                    'Your assistant is restarting with the new key. Give it a moment, then refresh to confirm.',
                }
              : {
                  variant: 'destructive',
                  title: 'Failed to update AI connection',
                  description: message,
                },
          );
        },
      },
    );
  };

  return (
    <AlertDialog open={open}>
      <AlertDialog.Content className="sm:max-w-2xl">
        <AlertDialog.Header className="flex flex-row gap-3 sm:flex-row">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <IconKey className="size-5 text-primary" />
          </div>
          <div className="flex flex-col gap-2 text-left">
            <AlertDialog.Title className="text-base font-semibold">
              Change AI connection
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-muted-foreground">
              Choose the provider, load its available models live, and enter a
              fresh API key. The key is sent securely to your assistant runtime.
            </AlertDialog.Description>
          </div>
        </AlertDialog.Header>
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 px-4 py-12 text-center">
            <IconLoader2 className="size-8 animate-spin text-primary" />
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium">
                Applying your new AI connection…
              </p>
              <p className="text-xs text-muted-foreground">
                Your assistant is restarting with the new provider &amp; key.
                This usually takes about a minute — please keep this window
                open.
              </p>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto pr-1"
            >
              <LlmProviderApiKeyFields
                control={form.control}
                providerName="provider"
                modelName="model"
                apiKeyName="apiKey"
                providerOptions={providerOptions}
                disabled={loading}
                apiKeyPlaceholder="Paste your provider API key"
                onProviderChange={(nextProvider) => {
                  form.setValue('apiKey', '', { shouldDirty: true });
                  form.setValue(
                    'model',
                    getManagedAssistantModel(nextProvider),
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    },
                  );
                }}
              />
              {!managed && (
                <p className="text-xs text-muted-foreground">
                  This legacy assistant supports Kimi For Coding only.
                </p>
              )}
              <AlertDialog.Footer className="flex gap-2 sm:justify-end">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={loading} className="min-w-36">
                  Save connection
                </Button>
              </AlertDialog.Footer>
            </form>
          </Form>
        )}
      </AlertDialog.Content>
    </AlertDialog>
  );
};
