import { zodResolver } from '@hookform/resolvers/zod';
import {
  IconCopy,
  IconExternalLink,
  IconKey,
  IconLoader2,
  IconRefresh,
} from '@tabler/icons-react';
import {
  Alert,
  AlertDialog,
  Button,
  Form,
  Input,
  Select,
  useToast,
} from 'erxes-ui';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LlmProviderApiKeyFields } from '~/modules/company-brain/components/LlmProviderApiKeyFields';
import { SubscriptionProviderGuide } from '~/modules/company-brain/components/SubscriptionProviderGuide';
import {
  ASSISTANT_PROVIDER_OPTIONS,
  ASSISTANT_SUBSCRIPTION_PROVIDER_OPTIONS,
  getManagedAssistantModel,
  getSubscriptionAssistantModel,
  getSubscriptionProviderOption,
  subscriptionProviderNeedsCredential,
  subscriptionProviderUsesDeviceCode,
} from '~/modules/company-brain/llmProviders';
import {
  SubscriptionAuthState,
  useLlmSubscriptionAuth,
  useSetLlmConnection,
} from '../hooks/useLlmConnection';

const formSchema = z
  .object({
    credentialMode: z.enum(['api_key', 'subscription']),
    provider: z.string().min(1, 'Provider is required'),
    model: z.string().min(1, 'Model is required'),
    apiKey: z.string().optional(),
    subscriptionToken: z.string().optional(),
  })
  .superRefine((values, context) => {
    if (values.credentialMode === 'api_key' && !values.apiKey?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['apiKey'],
        message: 'API key is required',
      });
    }

    if (
      values.credentialMode === 'subscription' &&
      subscriptionProviderNeedsCredential(values.provider) &&
      !values.subscriptionToken?.trim()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['subscriptionToken'],
        message: `${
          getSubscriptionProviderOption(values.provider).credentialLabel
        } is required`,
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface LlmConnectionDialogProps {
  open: boolean;
  currentProvider?: string | null;
  currentModel?: string | null;
  currentCredentialMode?: string | null;
  managed: boolean;
  onSuccess: (provider: string) => void;
  onCancel?: () => void;
}

export const LlmConnectionDialog = ({
  open,
  currentProvider,
  currentModel,
  currentCredentialMode,
  managed,
  onSuccess,
  onCancel,
}: LlmConnectionDialogProps) => {
  const { setConnection, loading: applying } = useSetLlmConnection();
  const { start, getStatus, starting } = useLlmSubscriptionAuth();
  const { toast } = useToast();
  const initialProvider =
    currentProvider?.trim().toLowerCase() ||
    (currentCredentialMode === 'subscription' ? 'openai' : 'kimi');
  const initialMode =
    managed && currentCredentialMode === 'subscription'
      ? 'subscription'
      : 'api_key';
  const providerOptions = managed
    ? ASSISTANT_PROVIDER_OPTIONS
    : ASSISTANT_PROVIDER_OPTIONS.filter(({ value }) => value === 'kimi');
  const [authState, setAuthState] = useState<SubscriptionAuthState | null>(
    null,
  );
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      credentialMode: initialMode,
      provider: initialProvider,
      model:
        currentModel ||
        (initialMode === 'subscription'
          ? getSubscriptionAssistantModel(initialProvider)
          : getManagedAssistantModel(initialProvider)),
      apiKey: '',
      subscriptionToken: '',
    },
  });
  const credentialMode = form.watch('credentialMode');
  const subscriptionProvider = form.watch('provider');
  const subscriptionOption =
    getSubscriptionProviderOption(subscriptionProvider);
  const waitingForDeviceAuth =
    credentialMode === 'subscription' &&
    subscriptionProviderUsesDeviceCode(subscriptionProvider) &&
    ['starting', 'pending'].includes(authState?.status || '');
  const busy = applying || starting || waitingForDeviceAuth;

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      credentialMode: initialMode,
      provider: initialProvider,
      model:
        currentModel ||
        (initialMode === 'subscription'
          ? getSubscriptionAssistantModel(initialProvider)
          : getManagedAssistantModel(initialProvider)),
      apiKey: '',
      subscriptionToken: '',
    });
    setAuthState(null);
  }, [currentModel, form, initialMode, initialProvider, open]);

  useEffect(() => {
    if (!waitingForDeviceAuth) {
      return;
    }

    const timer = window.setInterval(async () => {
      try {
        const next = await getStatus();
        if (!next) {
          return;
        }

        setAuthState(next);

        if (next.status === 'connected') {
          window.clearInterval(timer);
          toast({
            variant: 'success',
            title: `${subscriptionOption.label} connected`,
            description: `This assistant now uses your ${subscriptionOption.label} subscription.`,
          });
          onSuccess(subscriptionProvider);
        }
      } catch (error) {
        setAuthState({
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, 2_000);

    return () => window.clearInterval(timer);
  }, [
    getStatus,
    onSuccess,
    subscriptionOption.label,
    subscriptionProvider,
    toast,
    waitingForDeviceAuth,
  ]);

  const setMode = (mode: FormValues['credentialMode']) => {
    form.setValue('credentialMode', mode, { shouldDirty: true });
    form.setValue('apiKey', '', { shouldDirty: true });
    form.setValue('subscriptionToken', '', { shouldDirty: true });
    setAuthState(null);

    if (mode === 'subscription') {
      form.setValue('provider', 'openai', { shouldDirty: true });
      form.setValue('model', getSubscriptionAssistantModel('openai'), {
        shouldDirty: true,
      });
      return;
    }

    form.setValue('provider', initialProvider, { shouldDirty: true });
    form.setValue('model', getManagedAssistantModel(initialProvider), {
      shouldDirty: true,
    });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const samePendingSubscription =
        values.credentialMode === 'subscription' &&
        currentCredentialMode === 'subscription' &&
        currentProvider?.trim().toLowerCase() === values.provider &&
        currentModel === values.model;

      if (!samePendingSubscription) {
        await setConnection({
          provider: values.provider,
          model: values.model,
          credentialMode: values.credentialMode,
          apiKey: values.apiKey?.trim() || undefined,
          subscriptionToken: values.subscriptionToken?.trim() || undefined,
        });
      }

      if (
        values.credentialMode === 'subscription' &&
        subscriptionProviderUsesDeviceCode(values.provider)
      ) {
        const next = await start();
        setAuthState(next);
        return;
      }

      toast({
        variant: 'success',
        title: 'AI connection updated',
        description:
          values.credentialMode === 'subscription'
            ? `This assistant now uses your ${
                getSubscriptionProviderOption(values.provider).label
              } subscription.`
            : 'The provider, model, and API key are active.',
      });
      onSuccess(values.provider);
    } catch (error) {
      // A timeout / 503 usually means the assistant is still restarting with
      // the new connection in the background. Preserve the existing guidance
      // instead of treating a dropped proxy connection as a definite failure.
      const message = error instanceof Error ? error.message : String(error);
      const stillApplying =
        /timeout|timed out|503|network|failed to fetch|gateway/i.test(message);

      toast(
        stillApplying
          ? {
              variant: 'default',
              title: 'Still applying your connection',
              description:
                'Your assistant is restarting with the new connection. Give it a moment, then refresh to confirm.',
            }
          : {
              variant: 'destructive',
              title: 'Failed to update AI connection',
              description: message,
            },
      );
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // Without this, Escape had nothing to call and the dialog was a trap.
        // Never dismiss mid-apply: the key is already being written.
        if (!next && !busy) onCancel?.();
      }}
    >
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
              Use a provider API key or connect an existing supported provider
              subscription.
            </AlertDialog.Description>
          </div>
        </AlertDialog.Header>
        {applying ? (
          <div className="flex flex-col items-center justify-center gap-4 px-4 py-12 text-center">
            <IconLoader2 className="size-8 animate-spin text-primary" />
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium">
                Applying your new AI connection…
              </p>
              <p className="text-xs text-muted-foreground">
                Your assistant is restarting with the new connection. This
                usually takes about a minute — please keep this window open.
              </p>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto pr-1"
            >
              {managed && (
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
                  <Button
                    type="button"
                    variant={
                      credentialMode === 'api_key' ? 'secondary' : 'ghost'
                    }
                    onClick={() => setMode('api_key')}
                    disabled={busy}
                  >
                    API key
                  </Button>
                  <Button
                    type="button"
                    variant={
                      credentialMode === 'subscription' ? 'secondary' : 'ghost'
                    }
                    onClick={() => setMode('subscription')}
                    disabled={busy}
                  >
                    Provider subscription
                  </Button>
                </div>
              )}

              {credentialMode === 'api_key' ? (
                <LlmProviderApiKeyFields
                  control={form.control}
                  providerName="provider"
                  modelName="model"
                  apiKeyName="apiKey"
                  providerOptions={providerOptions}
                  disabled={busy}
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
              ) : (
                <div className="space-y-5">
                  <Form.Field
                    name="provider"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>Subscription provider</Form.Label>
                        <Select
                          value={field.value}
                          onValueChange={(provider) => {
                            field.onChange(provider);
                            form.setValue(
                              'model',
                              getSubscriptionAssistantModel(provider),
                              { shouldDirty: true },
                            );
                            form.setValue('subscriptionToken', '', {
                              shouldDirty: true,
                            });
                            setAuthState(null);
                          }}
                          disabled={busy}
                        >
                          <Form.Control>
                            <Select.Trigger>
                              <Select.Value />
                            </Select.Trigger>
                          </Form.Control>
                          <Select.Content>
                            {ASSISTANT_SUBSCRIPTION_PROVIDER_OPTIONS.map(
                              (option) => (
                                <Select.Item
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </Select.Item>
                              ),
                            )}
                          </Select.Content>
                        </Select>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />

                  <SubscriptionProviderGuide provider={subscriptionProvider} />

                  {subscriptionProviderUsesDeviceCode(subscriptionProvider) ? (
                    <div className="space-y-3">
                      {waitingForDeviceAuth && !authState?.userCode && (
                        <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                          <IconRefresh className="size-4 animate-spin" />
                          {authState?.message ||
                            `Requesting a ${subscriptionOption.label} sign-in code`}
                        </div>
                      )}

                      {authState?.userCode && authState.verificationUrl && (
                        <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                          <div className="text-xs font-medium text-muted-foreground">
                            One-time sign-in code
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 rounded-md border bg-background px-3 py-2 text-center text-lg font-semibold tracking-widest">
                              {authState.userCode}
                            </code>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              aria-label="Copy sign-in code"
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  authState.userCode || '',
                                )
                              }
                            >
                              <IconCopy className="size-4" />
                            </Button>
                          </div>
                          <Button
                            type="button"
                            className="w-full"
                            onClick={() =>
                              window.open(
                                authState.verificationUrl || '',
                                '_blank',
                                'noopener,noreferrer',
                              )
                            }
                          >
                            <IconExternalLink className="size-4" />
                            Open {subscriptionOption.label} sign-in
                          </Button>
                        </div>
                      )}

                      {authState?.status === 'failed' && (
                        <Alert variant="destructive">
                          <Alert.Title>Sign-in failed</Alert.Title>
                          <Alert.Description>
                            {authState.error ||
                              'Start again to request a new sign-in code.'}
                          </Alert.Description>
                        </Alert>
                      )}

                      {authState?.status === 'expired' && (
                        <Alert variant="warning">
                          <Alert.Title>Sign-in code expired</Alert.Title>
                          <Alert.Description>
                            Select Connect subscription to request a new code.
                          </Alert.Description>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Form.Field
                        name="subscriptionToken"
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>
                              {subscriptionOption.credentialLabel}
                            </Form.Label>
                            <Form.Control>
                              <Input
                                {...field}
                                type="password"
                                autoComplete="off"
                                placeholder={
                                  subscriptionOption.credentialPlaceholder
                                }
                                disabled={busy}
                              />
                            </Form.Control>
                            <Form.Message />
                          </Form.Item>
                        )}
                      />
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Gemini subscriptions cannot be connected through OpenClaw;
                    Gemini remains available with a Google AI API key.
                  </p>
                </div>
              )}

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
                    disabled={busy}
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={busy} className="min-w-40">
                  {waitingForDeviceAuth ? (
                    <>
                      <IconRefresh className="size-4 animate-spin" />
                      Waiting for {subscriptionOption.label}
                    </>
                  ) : applying || starting ? (
                    'Applying...'
                  ) : credentialMode === 'subscription' ? (
                    'Connect subscription'
                  ) : (
                    'Save connection'
                  )}
                </Button>
              </AlertDialog.Footer>
            </form>
          </Form>
        )}
      </AlertDialog.Content>
    </AlertDialog>
  );
};
