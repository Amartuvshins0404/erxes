import { zodResolver } from '@hookform/resolvers/zod';
import {
  IconArrowRight,
  IconCode,
  IconPlus,
  IconSparkles,
} from '@tabler/icons-react';
import {
  Breadcrumb,
  Button,
  Form,
  Input,
  Select,
  Separator,
  Sheet,
  Spinner,
  Textarea,
  useToast,
} from 'erxes-ui';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { z } from 'zod';
import { AssistantOrgManageSheet } from '~/modules/assistant-orgs/components/AssistantOrgManageSheet';
import { useCreateIdentifier } from '~/modules/assistant-orgs/hooks/useCreateAssistantOrg';
import { useDeleteIdentifier } from '~/modules/assistant-orgs/hooks/useDeleteAssistantOrg';
import {
  Identifier,
  useIdentifiers,
} from '~/modules/assistant-orgs/hooks/useAssistantOrgs';
import { SERVER_STATUSES } from '~/modules/deploy/constants';
import { useAgentDeploy } from '~/modules/deploy/hooks/useAgentDeploy';
import { useAgent } from '~/modules/main/hooks/useAgent';
import { OPENCODE_PROVIDER_OPTIONS } from '~/modules/opencode/constants';
import { useOpencodeDeploy } from '~/modules/opencode/deploy/hooks/useOpencodeDeploy';
import { useOpencode } from '~/modules/opencode/main/hooks/useOpencode';

const ASSISTANT_PROVIDER_OPTIONS = [{ value: 'kimi', label: 'Kimi' }] as const;

const workspaceFormSchema = z.object({
  serverName: z.string().min(1, 'Server name is required'),
  provider: z.string().min(1, 'Provider is required'),
  apiToken: z.string().min(1, 'API token is required'),
  discordBotToken: z.string().optional(),
  description: z.string().optional(),
});

type WorkspaceFormValues = z.infer<typeof workspaceFormSchema>;

const getStatusLabel = (status?: string | null) => {
  if (!status) {
    return 'Not deployed';
  }

  if (status === SERVER_STATUSES.APPROVED) {
    return 'Ready';
  }

  if (status === SERVER_STATUSES.DEPLOYING) {
    return 'Deploying';
  }

  return status;
};

const getProviderLabel = (provider?: string | null) => {
  if (!provider) {
    return 'Not set';
  }

  const normalized = provider.trim().toLowerCase();
  const option = OPENCODE_PROVIDER_OPTIONS.find(
    ({ value }) => value === normalized,
  );

  return option?.label || provider;
};

const AssistantWorkspaceCard = ({
  identifier,
}: {
  identifier: Identifier;
}) => {
  const { agent, loading } = useAgent(identifier._id);

  return (
    <div className="group flex min-h-56 flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            {loading ? 'Loading' : getStatusLabel(agent?.status)}
          </span>
          <AssistantOrgManageSheet org={identifier} />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-semibold text-card-foreground">
          {identifier.name}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {identifier.description?.trim() ||
            'OpenClaw AI assistant identifier for your company brain setup.'}
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-border px-2.5 py-1 font-medium">
          Kimi
        </span>
      </div>

      <Button
        asChild
        variant="ghost"
        className="mt-auto w-fit gap-1 px-0 text-xs font-medium text-primary hover:bg-transparent hover:text-primary"
      >
        <Link to={`/agent/assistant/${identifier._id}`}>
          Open AI Assistant <IconArrowRight className="h-3 w-3" />
        </Link>
      </Button>
    </div>
  );
};

const AiAgentWorkspaceCard = ({
  identifier,
}: {
  identifier: Identifier;
}) => {
  const { opencode, loading } = useOpencode(identifier._id);

  return (
    <div className="group flex min-h-56 flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            {loading ? 'Loading' : getStatusLabel(opencode?.status)}
          </span>
          <AssistantOrgManageSheet org={identifier} />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-semibold text-card-foreground">
          {identifier.name}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {identifier.description?.trim() ||
            'Opencode AI agent identifier for your company brain setup.'}
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-border px-2.5 py-1 font-medium">
          {getProviderLabel(opencode?.provider)}
        </span>
      </div>

      <Button
        asChild
        variant="ghost"
        className="mt-auto w-fit gap-1 px-0 text-xs font-medium text-primary hover:bg-transparent hover:text-primary"
      >
        <Link to={`/agent/agents/${identifier._id}`}>
          Open AI Agent <IconArrowRight className="h-3 w-3" />
        </Link>
      </Button>
    </div>
  );
};

export const CompanyBrainWorkspacePage = ({
  mode,
}: {
  mode: 'assistant' | 'agent';
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { identifiers, loading } = useIdentifiers(mode);
  const { createIdentifier, loading: creatingIdentifier } =
    useCreateIdentifier();
  const { deleteIdentifier, loading: deletingIdentifier } =
    useDeleteIdentifier();
  const { deployAgent, loading: deployingAssistant } = useAgentDeploy();
  const { deployOpencode, loading: deployingAgent } = useOpencodeDeploy();
  const [open, setOpen] = useState(false);

  const config = useMemo(
    () =>
      mode === 'assistant'
        ? {
            title: 'AI Assistant',
            subtitle:
              'Manage assistants for your company brain.',
            buttonLabel: 'Add AI Assistant',
            emptyTitle: 'No AI assistants yet',
            emptyDescription:
              'Create your first AI assistant with a server name, provider, API token, Discord bot token, and description.',
            detailPath: 'openclaw',
            providerOptions: ASSISTANT_PROVIDER_OPTIONS,
            sheetDescription:
              'Fill in the server name, provider, API token, required Discord bot token, and description for this AI assistant identifier.',
          }
        : {
            title: 'AI Agents',
            subtitle:
              'Manage agents for your company brain.',
            buttonLabel: 'Add AI Agent',
            emptyTitle: 'No AI agents yet',
            emptyDescription:
              'Create your first AI agent with a server name, provider, API token, and description.',
            detailPath: 'opencode',
            providerOptions: OPENCODE_PROVIDER_OPTIONS,
            sheetDescription:
              'Fill in the server name, provider, API token, and description for this AI agent identifier.',
          },
    [mode],
  );

  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      serverName: '',
      provider: config.providerOptions[0]?.value || '',
      apiToken: '',
      discordBotToken: '',
      description: '',
    },
  });

  const isSubmitting =
    creatingIdentifier ||
    deletingIdentifier ||
    deployingAssistant ||
    deployingAgent;

  const onSubmit = async (values: WorkspaceFormValues) => {
    let createdIdentifier: Identifier | null = null;

    try {
      if (mode === 'assistant' && !values.discordBotToken?.trim()) {
        form.setError('discordBotToken', {
          type: 'required',
          message: 'Discord bot token is required',
        });
        return;
      }

      createdIdentifier = await createIdentifier({
        name: values.serverName.trim(),
        kind: mode,
        description: values.description?.trim() || '',
      });

      if (!createdIdentifier?._id) {
        throw new Error('Failed to create identifier');
      }

      if (mode === 'assistant') {
        await deployAgent({
          identifierId: createdIdentifier._id,
          token: values.discordBotToken!.trim(),
          apiToken: values.apiToken,
        });
      } else {
        await deployOpencode({
          identifierId: createdIdentifier._id,
          provider: values.provider,
          apiToken: values.apiToken,
        });
      }

      form.reset({
        serverName: '',
        provider: config.providerOptions[0]?.value || '',
        apiToken: '',
        discordBotToken: '',
        description: '',
      });
      setOpen(false);
      navigate(
        mode === 'assistant'
          ? `/agent/assistant/${createdIdentifier._id}`
          : `/agent/agents/${createdIdentifier._id}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      let cleanupMessage = '';
      let description = message;

      if (mode === 'agent' && createdIdentifier?._id) {
        try {
          await deleteIdentifier(createdIdentifier._id);
          cleanupMessage = ' The failed agent was removed.';
        } catch (cleanupError) {
          const cleanupErrorMessage =
            cleanupError instanceof Error
              ? cleanupError.message
              : String(cleanupError);

          cleanupMessage = ` Failed to remove the identifier: ${cleanupErrorMessage}`;
        }

        setOpen(false);
        navigate('/agent/agents');
        description = `${message}.${cleanupMessage}`;
      } else if (createdIdentifier?._id) {
        description = `${message}. The identifier was created, so you can retry from its detail page.`;
      }

      toast({
        variant: 'destructive',
        title: mode === 'assistant' ? 'Add AI Assistant failed' : 'Add AI Agent failed',
        description,
      });

      if (mode === 'assistant' && createdIdentifier?._id) {
        navigate(`/agent/assistant/${createdIdentifier._id}`);
      }
    }
  };

  const renderCard = (identifier: Identifier) => {
    if (mode === 'assistant') {
      return (
        <AssistantWorkspaceCard
          key={identifier._id}
          identifier={identifier}
        />
      );
    }

    return (
      <AiAgentWorkspaceCard
        key={identifier._id}
        identifier={identifier}
      />
    );
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to={mode === 'assistant' ? '/agent/assistant' : '/agent/agents'}>
                    Company Brain
                  </Link>
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.Page>{config.title}</Breadcrumb.Page>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {config.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {config.subtitle}
              </p>
            </div>
            <Button onClick={() => setOpen(true)} className="gap-2">
              <IconPlus className="h-4 w-4" />
              {config.buttonLabel}
            </Button>
          </div>

          {loading ? (
            <Spinner />
          ) : identifiers.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                {mode === 'assistant' ? (
                  <IconSparkles className="h-7 w-7" />
                ) : (
                  <IconCode className="h-7 w-7" />
                )}
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">{config.emptyTitle}</h2>
                <p className="max-w-md text-sm text-muted-foreground">
                  {config.emptyDescription}
                </p>
              </div>
              <Button onClick={() => setOpen(true)} className="gap-2">
                <IconPlus className="h-4 w-4" />
                {config.buttonLabel}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {identifiers.map(renderCard)}
            </div>
          )}
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <Sheet.View className="p-0 md:w-[calc(100vw-theme(spacing.4))] sm:max-w-xl">
          <Form {...form}>
            <form
              className="flex h-full flex-col gap-0"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <Sheet.Header>
                <Sheet.Title>{config.buttonLabel}</Sheet.Title>
                <Sheet.Close />
              </Sheet.Header>

              <Sheet.Content className="flex min-h-0 flex-1 flex-col gap-5 px-5 py-5">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">{config.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {config.sheetDescription}
                  </p>
                </div>

                <Form.Field
                  name="serverName"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Server name</Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          placeholder={
                            mode === 'assistant'
                              ? 'Support Assistant'
                              : 'Frontend Agent'
                          }
                          autoComplete="off"
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  name="provider"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Provider</Form.Label>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <Form.Control>
                          <Select.Trigger className="w-full">
                            <Select.Value placeholder="Choose provider" />
                          </Select.Trigger>
                        </Form.Control>
                        <Select.Content>
                          {config.providerOptions.map((option) => (
                            <Select.Item key={option.value} value={option.value}>
                              {option.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  name="apiToken"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>API token</Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          placeholder="Paste your API token"
                          autoComplete="off"
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                {mode === 'assistant' && (
                  <Form.Field
                    name="discordBotToken"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>Discord bot token</Form.Label>
                        <Form.Control>
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="Paste your Discord bot token"
                            autoComplete="off"
                          />
                        </Form.Control>
                        <p className="text-xs text-muted-foreground">
                          Required. uses this token during bootstrap so the bot
                          can come online and send the pairing code.
                        </p>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                )}

                <Form.Field
                  name="description"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Description</Form.Label>
                      <Form.Control>
                        <Textarea
                          {...field}
                          value={field.value || ''}
                          rows={5}
                          className="resize-none"
                          placeholder="What this identifier is used for"
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
              </Sheet.Content>

              <Sheet.Footer>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => {
                    form.reset({
                      serverName: '',
                      provider: config.providerOptions[0]?.value || '',
                      apiToken: '',
                      discordBotToken: '',
                      description: '',
                    });
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : config.buttonLabel}
                </Button>
              </Sheet.Footer>
            </form>
          </Form>
        </Sheet.View>
      </Sheet>
    </div>
  );
};
