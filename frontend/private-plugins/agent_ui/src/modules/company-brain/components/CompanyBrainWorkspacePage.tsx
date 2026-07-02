import { zodResolver } from '@hookform/resolvers/zod';
import {
  IconArrowRight,
  IconBrandDiscord,
  IconCheck,
  IconCode,
  IconLink,
  IconPlus,
  IconRefresh,
  IconSparkles,
  IconUsers,
} from '@tabler/icons-react';
import {
  Alert,
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MembersInline, PageHeader } from 'ui-modules';
import { z } from 'zod';
import { AssistantOrgManageSheet } from '~/modules/assistant-orgs/components/AssistantOrgManageSheet';
import { useCreateIdentifier } from '~/modules/assistant-orgs/hooks/useCreateAssistantOrg';
import { useDeleteIdentifier } from '~/modules/assistant-orgs/hooks/useDeleteAssistantOrg';
import {
  Identifier,
  useIdentifiers,
} from '~/modules/assistant-orgs/hooks/useAssistantOrgs';
import { SERVER_STATUSES } from '~/modules/deploy/constants';
import { ManagedProvisioningProgress } from '~/modules/deploy/components/ManagedProvisioningProgress';
import { useAgentDeploy } from '~/modules/deploy/hooks/useAgentDeploy';
import { useManagedAgentDeploy } from '~/modules/deploy/hooks/useManagedAgentDeploy';
import { useAgentTransfer } from '~/modules/deploy/hooks/useAgentTransfer';
import { isManagedAssistantAgent } from '~/modules/deploy/utils/isManagedAssistantAgent';
import { useAgent } from '~/modules/main/hooks/useAgent';
import { OPENCODE_PROVIDER_OPTIONS } from '~/modules/opencode/constants';
import { useOpencodeDeploy } from '~/modules/opencode/deploy/hooks/useOpencodeDeploy';
import { useOpencodeTransfer } from '~/modules/opencode/deploy/hooks/useOpencodeTransfer';
import { useOpencode } from '~/modules/opencode/main/hooks/useOpencode';
import { useManagedDiscordSetup } from '../hooks/useManagedDiscordSetup';

const ASSISTANT_PROVIDER_OPTIONS = [{ value: 'kimi', label: 'Kimi' }] as const;
const MANUAL_REFRESH_THROTTLE_MS = 1_500;

const workspaceFormSchema = z.object({
  setupMode: z.enum(['new', 'transfer']),
  discordConnectionMode: z.enum(['managed', 'byob']),
  serverName: z.string().min(1, 'Identifier name is required'),
  provider: z.string().optional(),
  apiToken: z.string().optional(),
  discordBotToken: z.string().optional(),
  transferServerName: z.string().optional(),
  transferGatewayToken: z.string().optional(),
  transferServerUrl: z.string().optional(),
  transferServerId: z.string().optional(),
  transferServerPassword: z.string().optional(),
  transferSourceSubdomain: z.string().optional(),
  description: z.string().optional(),
});

type WorkspaceFormValues = z.infer<typeof workspaceFormSchema>;
type DiscordConnectionMode = WorkspaceFormValues['discordConnectionMode'];
type ManagedCreationStep =
  | 'details'
  | 'provisioning'
  | 'connect'
  | 'channel'
  | 'complete';

const DEFAULT_DISCORD_CONNECTION_MODE: DiscordConnectionMode = 'byob';

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

const InvitedMembersRow = ({ memberIds }: { memberIds?: string[] | null }) => {
  const invitedMemberIds = memberIds || [];

  return (
    <div className="flex min-h-9 items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <IconUsers className="h-4 w-4 flex-none" />
      <MembersInline
        memberIds={invitedMemberIds}
        placeholder="No invited members"
        size="sm"
        className="text-xs"
      />
    </div>
  );
};

const buildRuntimeLabel = (status?: string | null, url?: string | null) => {
  if (status === SERVER_STATUSES.APPROVED && url?.trim()) {
    return 'Ready';
  }

  if (status === SERVER_STATUSES.FAILED) {
    return 'Failed';
  }

  if (status === SERVER_STATUSES.PENDING) {
    return 'Provisioning';
  }

  if (status === SERVER_STATUSES.DEPLOYING) {
    return 'Deploying';
  }

  return 'Not ready';
};

const AssistantDiscordManageSheet = ({
  identifier,
}: {
  identifier: Identifier;
}) => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [retryApiToken, setRetryApiToken] = useState('');
  const [refreshingRuntime, setRefreshingRuntime] = useState(false);
  const lastRuntimeRefreshAt = useRef(0);
  const {
    agent,
    loading: loadingAgent,
    refetch: refetchAgent,
  } = useAgent(identifier._id, { pollWhilePending: true });
  const { deployManagedAgent, loading: retryingProvisioning } =
    useManagedAgentDeploy(identifier._id);

  const runtimeUrl = agent?.url?.trim() || '';
  const runtimeReady =
    agent?.status === SERVER_STATUSES.APPROVED && !!runtimeUrl;
  const runtimeFailed = agent?.status === SERVER_STATUSES.FAILED;

  const managedDiscord = useManagedDiscordSetup({
    assistantId: identifier._id,
    runtimeStatus: agent?.status,
    runtimeUrl,
    mode: 'manage',
    enabled: open,
  });

  const selectedInstallation = managedDiscord.installations.find(
    (installation) =>
      installation._id === managedDiscord.selectedInstallationId,
  );
  const activeInstallation = managedDiscord.activeBinding
    ? managedDiscord.installations.find(
        (installation) =>
          installation.discordGuildId ===
          managedDiscord.activeBinding?.discordGuildId,
      )
    : undefined;
  const activeChannel = managedDiscord.activeBinding
    ? managedDiscord.channels.find(
        (channel) =>
          channel.id === managedDiscord.activeBinding?.discordChannelId,
      )
    : undefined;
  const selectedBindingAlreadyActive =
    !!managedDiscord.activeBinding &&
    managedDiscord.activeBinding.discordGuildId ===
      selectedInstallation?.discordGuildId &&
    managedDiscord.activeBinding.discordChannelId ===
      managedDiscord.selectedChannelId;
  const isBusy =
    managedDiscord.loading ||
    managedDiscord.saving ||
    loadingAgent ||
    refreshingRuntime ||
    retryingProvisioning;
  const responseMode =
    managedDiscord.activeBinding?.responseMode || 'all_messages';

  const buildManageReturnUrl = () => {
    const returnUrl = new URL(window.location.href);

    returnUrl.searchParams.set('discordSetup', 'managed');
    returnUrl.searchParams.set('discordMode', 'manage');
    returnUrl.searchParams.set('discordStep', 'channel');
    returnUrl.searchParams.set('assistantId', identifier._id);
    returnUrl.searchParams.delete('discordConnection');
    returnUrl.searchParams.delete('installationId');
    returnUrl.searchParams.delete('message');

    return returnUrl.toString();
  };

  const handleInstallDiscord = async () => {
    try {
      setError('');
      await managedDiscord.connectDiscord(buildManageReturnUrl());
    } catch (connectError) {
      const message =
        connectError instanceof Error
          ? connectError.message
          : String(connectError);

      setError(message);
      toast({
        variant: 'destructive',
        title: 'Could not connect Discord',
        description: message,
      });
    }
  };

  const handleConnectChannel = async () => {
    if (!runtimeReady) {
      const message =
        'Discord is connected, but this assistant runtime is not ready yet.';
      setError(message);
      toast({
        variant: 'destructive',
        title: 'Runtime not ready',
        description: message,
      });
      return;
    }

    try {
      setError('');
      await managedDiscord.connectChannel();
      await managedDiscord.refresh();
      toast({
        variant: 'success',
        title: 'Discord channel connected',
      });
    } catch (connectError) {
      const message =
        connectError instanceof Error
          ? connectError.message
          : String(connectError);

      setError(message);
      toast({
        variant: 'destructive',
        title: 'Could not connect channel',
        description: message,
      });
    }
  };

  const handleDisconnectChannel = async () => {
    const bindingId = managedDiscord.activeBinding?._id;

    if (!bindingId) {
      return;
    }

    try {
      setError('');
      await managedDiscord.disconnectChannel(bindingId);
      toast({
        variant: 'success',
        title: 'Discord channel disconnected',
      });
    } catch (disconnectError) {
      const message =
        disconnectError instanceof Error
          ? disconnectError.message
          : String(disconnectError);

      setError(message);
      toast({
        variant: 'destructive',
        title: 'Could not disconnect channel',
        description: message,
      });
    }
  };

  const handleResponseModeChange = async (value: string) => {
    const bindingId = managedDiscord.activeBinding?._id;

    if (
      !bindingId ||
      (value !== 'slash_only' && value !== 'all_messages') ||
      value === responseMode
    ) {
      return;
    }

    try {
      setError('');
      await managedDiscord.updateBindingResponseMode(bindingId, value);
      toast({
        variant: 'success',
        title: 'Response mode updated',
      });
    } catch (updateError) {
      const message =
        updateError instanceof Error ? updateError.message : String(updateError);

      setError(message);
      toast({
        variant: 'destructive',
        title: 'Could not update response mode',
        description: message,
      });
    }
  };

  const handleRetryProvisioning = async () => {
    if (!retryApiToken.trim()) {
      const message = 'Kimi API key is required to retry provisioning.';
      setError(message);
      toast({
        variant: 'destructive',
        title: 'Kimi API key required',
        description: message,
      });
      return;
    }

    try {
      setError('');
      await deployManagedAgent({
        apiToken: retryApiToken,
        provider: 'kimi',
      });
      setRetryApiToken('');
      await refetchAgent();
      toast({
        variant: 'success',
        title: 'Runtime provisioned',
      });
    } catch (retryError) {
      const message =
        retryError instanceof Error ? retryError.message : String(retryError);

      setError(message);
      toast({
        variant: 'destructive',
        title: 'Retry provisioning failed',
        description: message,
      });
    }
  };

  const handleRefreshRuntime = async () => {
    const now = Date.now();

    if (
      refreshingRuntime ||
      now - lastRuntimeRefreshAt.current < MANUAL_REFRESH_THROTTLE_MS
    ) {
      return;
    }

    lastRuntimeRefreshAt.current = now;
    setRefreshingRuntime(true);

    try {
      setError('');
      await Promise.all([refetchAgent(), managedDiscord.refresh()]);
    } finally {
      setRefreshingRuntime(false);
    }
  };

  const clearManageSearchParams = () => {
    const next = new URLSearchParams(searchParams);

    next.delete('discordSetup');
    next.delete('discordMode');
    next.delete('discordStep');
    next.delete('assistantId');
    next.delete('discordConnection');
    next.delete('installationId');
    next.delete('message');

    setSearchParams(next, { replace: true });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      clearManageSearchParams();
    }
  };

  useEffect(() => {
    const discordSetup = searchParams.get('discordSetup');
    const discordMode = searchParams.get('discordMode');
    const assistantId = searchParams.get('assistantId');

    if (
      discordSetup !== 'managed' ||
      discordMode !== 'manage' ||
      assistantId !== identifier._id
    ) {
      return;
    }

    setOpen(true);

    const connection = searchParams.get('discordConnection');

    if (connection === 'success') {
      setError('');
      managedDiscord.refresh();
      toast({
        variant: 'success',
        title: 'Discord connected',
        description: 'Select a server and channel to finish setup.',
      });
    } else if (connection === 'error') {
      setError(
        searchParams.get('message') ||
          'Discord connection was cancelled or failed. Try connecting again.',
      );
    }

    if (
      connection ||
      searchParams.has('installationId') ||
      searchParams.has('message')
    ) {
      const next = new URLSearchParams(searchParams);
      next.delete('discordConnection');
      next.delete('installationId');
      next.delete('message');
      setSearchParams(next, { replace: true });
    }
  }, [
    identifier._id,
    managedDiscord.refresh,
    searchParams,
    setSearchParams,
    toast,
  ]);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <Sheet.Trigger asChild>
        <Button variant="outline" className="gap-2">
          <IconBrandDiscord className="h-4 w-4" />
          Connect Discord
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="p-0 md:w-[calc(100vw-theme(spacing.4))] sm:max-w-xl">
        <Sheet.Header>
          <IconBrandDiscord className="shrink-0" />
          <Sheet.Title className="sr-only min-w-0 truncate sm:not-sr-only">
            Discord connection
          </Sheet.Title>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={handleRefreshRuntime}
            className="ml-auto shrink-0 whitespace-nowrap"
          >
            <IconRefresh
              className={`size-4 ${refreshingRuntime ? 'animate-spin' : ''}`}
            />
            Refresh runtime
          </Button>
          <Sheet.Close className="ml-2 shrink-0" />
        </Sheet.Header>
        <Sheet.Content className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">{identifier.name}</h3>
            <p className="text-xs text-muted-foreground">
              Manage where this AI Assistant responds in Discord.
            </p>
          </div>

          <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-3 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Runtime status</span>
              <span className="font-medium">
                {loadingAgent
                  ? 'Checking'
                  : buildRuntimeLabel(agent?.status, runtimeUrl)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Server</span>
              <span className="max-w-64 truncate font-medium">
                {agent?.name || 'Not provisioned'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Server ID</span>
              <span className="font-medium">{agent?.serverId || 'Not set'}</span>
            </div>
          </div>

          {(error || managedDiscord.error) && (
            <Alert variant="destructive">
              <Alert.Title>Discord setup failed</Alert.Title>
              <Alert.Description>
                {error || managedDiscord.error?.message}
              </Alert.Description>
            </Alert>
          )}

          {(agent?.status === SERVER_STATUSES.PENDING ||
            agent?.status === SERVER_STATUSES.DEPLOYING ||
            agent?.status === SERVER_STATUSES.FAILED) && (
            <ManagedProvisioningProgress
              status={agent.status}
              stage={agent.provisioning?.stage}
              message={agent.provisioning?.message}
              startedAt={agent.provisioning?.startedAt || agent.createdAt}
              updatedAt={agent.provisioning?.updatedAt}
              error={agent.provisioning?.error}
              runtimeUrl={runtimeUrl}
              retrying={retryingProvisioning}
            />
          )}

          {!runtimeReady &&
            agent?.status !== SERVER_STATUSES.PENDING &&
            agent?.status !== SERVER_STATUSES.DEPLOYING &&
            agent?.status !== SERVER_STATUSES.FAILED && (
            <Alert variant="warning">
              <Alert.Title>Runtime provisioning</Alert.Title>
              <Alert.Description>
                Discord is connected, but this assistant runtime is not ready
                yet.
              </Alert.Description>
            </Alert>
          )}

          {runtimeFailed && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-sm font-medium">Retry provisioning</div>
              <Input
                value={retryApiToken}
                onChange={(event) => setRetryApiToken(event.target.value)}
                placeholder="Paste your Kimi API key"
                autoComplete="off"
                disabled={retryingProvisioning}
              />
              <Button
                type="button"
                variant="outline"
                disabled={retryingProvisioning || !retryApiToken.trim()}
                onClick={handleRetryProvisioning}
                className="gap-2"
              >
                {retryingProvisioning && (
                  <IconRefresh className="size-4 animate-spin" />
                )}
                Retry provisioning
              </Button>
            </div>
          )}

          {managedDiscord.loadingInstallations ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <IconRefresh className="size-4 animate-spin" />
              Loading Discord installations
            </div>
          ) : !managedDiscord.installations.length ? (
            <Alert>
              <Alert.Title>Connect Erxes AI Assistant</Alert.Title>
              <Alert.Description>
                Add the official Erxes AI Assistant bot to a Discord server to
                choose a response channel.
              </Alert.Description>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <div className="text-sm font-medium">Discord server</div>
                <Select
                  value={managedDiscord.selectedInstallationId}
                  onValueChange={(value) => {
                    managedDiscord.setSelectedInstallationId(value);
                    managedDiscord.setSelectedChannelId('');
                  }}
                  disabled={isBusy}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select server" />
                  </Select.Trigger>
                  <Select.Content>
                    {managedDiscord.installations.map((installation) => (
                      <Select.Item
                        key={installation._id}
                        value={installation._id}
                      >
                        {installation.discordGuildName ||
                          installation.discordGuildId}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Discord channel</div>
                <Select
                  value={managedDiscord.selectedChannelId}
                  onValueChange={managedDiscord.setSelectedChannelId}
                  disabled={
                    isBusy ||
                    !selectedInstallation ||
                    managedDiscord.loadingChannels
                  }
                >
                  <Select.Trigger>
                    <Select.Value
                      placeholder={
                        managedDiscord.loadingChannels
                          ? 'Loading channels'
                          : 'Select channel'
                      }
                    />
                  </Select.Trigger>
                  <Select.Content>
                    {managedDiscord.channels.map((channel) => (
                      <Select.Item key={channel.id} value={channel.id}>
                        #{channel.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
            </>
          )}

          {managedDiscord.activeBinding && (
            <Alert>
              <Alert.Title>Connected</Alert.Title>
              <Alert.Description>
                {activeInstallation?.discordGuildName ||
                  managedDiscord.activeBinding.discordGuildId}{' '}
                ·{' '}
                {activeChannel
                  ? `#${activeChannel.name}`
                  : managedDiscord.activeBinding.discordChannelId}
              </Alert.Description>
            </Alert>
          )}

          {managedDiscord.activeBinding && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Response mode</div>
                <p className="text-xs text-muted-foreground">
                  Choose how this assistant listens in the connected channel.
                </p>
              </div>
              <Select
                value={responseMode}
                onValueChange={handleResponseModeChange}
                disabled={isBusy || managedDiscord.updatingBinding}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="slash_only">
                    Slash commands only
                  </Select.Item>
                  <Select.Item value="all_messages">
                    Every message in this channel
                  </Select.Item>
                </Select.Content>
              </Select>
              {responseMode === 'all_messages' && (
                <Alert variant="warning">
                  <Alert.Title>Every message enabled</Alert.Title>
                  <Alert.Description>
                    The assistant will respond to every user message posted in
                    this connected channel.
                  </Alert.Description>
                </Alert>
              )}
            </div>
          )}
        </Sheet.Content>
        <Sheet.Footer className="!h-auto min-h-14 py-3 sm:space-x-0">
          <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={handleInstallDiscord}
            >
              <IconBrandDiscord className="size-4" />
              {managedDiscord.installations.length
                ? 'Install into another server'
                : 'Add to server'}
            </Button>
            {managedDiscord.activeBinding && (
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={handleDisconnectChannel}
              >
                Disconnect channel
              </Button>
            )}
            <Button
              type="button"
              disabled={
                isBusy ||
                !runtimeReady ||
                !managedDiscord.selectedInstallationId ||
                !managedDiscord.selectedChannelId ||
                selectedBindingAlreadyActive
              }
              onClick={handleConnectChannel}
            >
              {managedDiscord.creatingBinding && (
                <IconRefresh className="size-4 animate-spin" />
              )}
              {selectedBindingAlreadyActive ? 'Connected' : 'Connect channel'}
            </Button>
          </div>
        </Sheet.Footer>
      </Sheet.View>
    </Sheet>
  );
};

const AssistantWorkspaceCard = ({ identifier }: { identifier: Identifier }) => {
  const { agent, loading } = useAgent(identifier._id);
  const isManagedAssistant = isManagedAssistantAgent(agent);

  return (
    <div className="group flex min-h-56 flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md">
      <div className="flex min-w-0 flex-wrap items-start gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            {loading ? 'Loading' : getStatusLabel(agent?.status)}
          </span>
          <span className="min-w-0 [&_button]:h-8 [&_button]:px-2.5 [&_button]:text-xs">
            <AssistantOrgManageSheet
              org={identifier}
              triggerLabel="Edit assistant"
            />
          </span>
          {isManagedAssistant && (
            <span className="min-w-0 [&_button]:h-8 [&_button]:px-2.5 [&_button]:text-xs">
              <AssistantDiscordManageSheet identifier={identifier} />
            </span>
          )}
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

      <InvitedMembersRow memberIds={identifier.memberIds} />

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

const AiAgentWorkspaceCard = ({ identifier }: { identifier: Identifier }) => {
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

      <InvitedMembersRow memberIds={identifier.memberIds} />

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { identifiers, loading } = useIdentifiers(mode);
  const { createIdentifier, loading: creatingIdentifier } =
    useCreateIdentifier();
  const { deleteIdentifier, loading: deletingIdentifier } =
    useDeleteIdentifier();
  const { deployAgent, loading: deployingAssistant } = useAgentDeploy();
  const { deployManagedAgent, loading: deployingManagedAssistant } =
    useManagedAgentDeploy();
  const { transferAgent, loading: transferringAssistant } = useAgentTransfer();
  const { deployOpencode, loading: deployingAgent } = useOpencodeDeploy();
  const { transferOpencode, loading: transferringAgent } =
    useOpencodeTransfer();
  const [open, setOpen] = useState(false);
  const [discordConnectionMode, setDiscordConnectionModeState] =
    useState<DiscordConnectionMode>(DEFAULT_DISCORD_CONNECTION_MODE);
  const [managedAssistantId, setManagedAssistantId] = useState('');
  const [managedStep, setManagedStep] =
    useState<ManagedCreationStep>('details');
  const [managedError, setManagedError] = useState('');
  const [managedRetryApiToken, setManagedRetryApiToken] = useState('');
  const [managedProvisioningStartedAt, setManagedProvisioningStartedAt] =
    useState('');
  const [refreshingManagedRuntime, setRefreshingManagedRuntime] =
    useState(false);
  const lastManagedRuntimeRefreshAt = useRef(0);

  const managedDiscord = useManagedDiscordSetup(
    mode === 'assistant' ? managedAssistantId : undefined,
  );
  const {
    agent: managedAgent,
    loading: loadingManagedAgent,
    refetch: refetchManagedAgent,
  } = useAgent(managedAssistantId, { pollWhilePending: true });

  const config = useMemo(
    () =>
      mode === 'assistant'
        ? {
            title: 'AI Assistant',
            subtitle: 'Manage assistants for your company brain.',
            buttonLabel: 'Add AI Assistant',
            emptyTitle: 'No AI assistants yet',
            emptyDescription:
              'Create your first AI assistant or link one transferred from another SaaS.',
            detailPath: 'openclaw',
            providerOptions: ASSISTANT_PROVIDER_OPTIONS,
            sheetDescription:
              'Create a new server or link an existing assistant server from another SaaS.',
          }
        : {
            title: 'AI Agents',
            subtitle: 'Manage agents for your company brain.',
            buttonLabel: 'Add AI Agent',
            emptyTitle: 'No AI agents yet',
            emptyDescription:
              'Create your first AI agent or link one transferred from another SaaS.',
            detailPath: 'opencode',
            providerOptions: OPENCODE_PROVIDER_OPTIONS,
            sheetDescription:
              'Create a new server or link an existing opencode server from another SaaS.',
          },
    [mode],
  );

  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      setupMode: 'new',
      discordConnectionMode: DEFAULT_DISCORD_CONNECTION_MODE,
      serverName: '',
      provider: config.providerOptions[0]?.value || '',
      apiToken: '',
      discordBotToken: '',
      transferServerName: '',
      transferGatewayToken: '',
      transferServerUrl: '',
      transferServerId: '',
      transferServerPassword: '',
      transferSourceSubdomain: '',
      description: '',
    },
  });

  const setupMode = form.watch('setupMode');
  const isTransfer = setupMode === 'transfer';
  const isManagedAssistantCreation =
    mode === 'assistant' && !isTransfer && discordConnectionMode === 'managed';
  const showManagedDiscordStep =
    mode === 'assistant' && !!managedAssistantId && managedStep !== 'details';
  const isManagedRuntimeReady =
    managedAgent?.status === SERVER_STATUSES.APPROVED && !!managedAgent?.url;
  const isManagedRuntimeFailed =
    managedAgent?.status === SERVER_STATUSES.FAILED;

  const setDiscordConnectionMode = (value: DiscordConnectionMode) => {
    setDiscordConnectionModeState(value);
    form.setValue('discordConnectionMode', value, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (value === 'managed') {
      form.setValue('discordBotToken', '');
    }
  };

  const isSubmitting =
    creatingIdentifier ||
    deletingIdentifier ||
    deployingAssistant ||
    deployingManagedAssistant ||
    transferringAssistant ||
    deployingAgent ||
    transferringAgent ||
    refreshingManagedRuntime ||
    managedDiscord.loading ||
    managedDiscord.saving;

  const resetCreateForm = () => {
    form.reset({
      setupMode: 'new',
      discordConnectionMode: DEFAULT_DISCORD_CONNECTION_MODE,
      serverName: '',
      provider: config.providerOptions[0]?.value || '',
      apiToken: '',
      discordBotToken: '',
      transferServerName: '',
      transferGatewayToken: '',
      transferServerUrl: '',
      transferServerId: '',
      transferServerPassword: '',
      transferSourceSubdomain: '',
      description: '',
    });
    setDiscordConnectionModeState(DEFAULT_DISCORD_CONNECTION_MODE);
    setManagedAssistantId('');
    setManagedStep('details');
    setManagedError('');
    setManagedRetryApiToken('');
    setManagedProvisioningStartedAt('');
  };

  const clearManagedSearchParams = () => {
    const next = new URLSearchParams(searchParams);

    next.delete('discordSetup');
    next.delete('discordMode');
    next.delete('discordStep');
    next.delete('assistantId');
    next.delete('discordConnection');
    next.delete('installationId');
    next.delete('message');

    setSearchParams(next, { replace: true });
  };

  const setManagedSetupSearchParams = useCallback(
    (assistantId: string, step: ManagedCreationStep) => {
      const next = new URLSearchParams(searchParams);

      next.set('discordSetup', 'managed');
      next.set('discordStep', step);
      next.set('assistantId', assistantId);
      next.delete('discordConnection');
      next.delete('installationId');
      next.delete('message');

      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const finishManagedCreation = (assistantId: string) => {
    resetCreateForm();
    setOpen(false);
    clearManagedSearchParams();
    navigate(`/agent/assistant/${assistantId}`);
  };

  const openManagedDiscordManageSheet = (assistantId: string) => {
    resetCreateForm();
    setOpen(false);

    const next = new URLSearchParams(searchParams);

    next.set('discordSetup', 'managed');
    next.set('discordMode', 'manage');
    next.set('discordStep', 'channel');
    next.set('assistantId', assistantId);
    next.delete('discordConnection');
    next.delete('installationId');
    next.delete('message');

    setSearchParams(next, { replace: true });
  };

  const buildManagedReturnUrl = (assistantId: string) => {
    const returnUrl = new URL(window.location.href);

    returnUrl.searchParams.set('discordSetup', 'managed');
    returnUrl.searchParams.set('discordStep', 'connect');
    returnUrl.searchParams.set('assistantId', assistantId);
    returnUrl.searchParams.delete('discordConnection');
    returnUrl.searchParams.delete('installationId');
    returnUrl.searchParams.delete('message');

    return returnUrl.toString();
  };

  const handleConnectManagedDiscord = async () => {
    if (!managedAssistantId) {
      return;
    }

    try {
      setManagedError('');
      await managedDiscord.connectDiscord(
        buildManagedReturnUrl(managedAssistantId),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      setManagedError(message);
      toast({
        variant: 'destructive',
        title: 'Could not connect Discord',
        description: message,
      });
    }
  };

  const handleCreateManagedBinding = async () => {
    if (!managedAssistantId) {
      return;
    }

    if (!isManagedRuntimeReady) {
      const message =
        'Assistant runtime is still provisioning. Wait until it is ready before connecting a Discord channel.';

      setManagedError(message);
      toast({
        variant: 'destructive',
        title: 'Runtime not ready',
        description: message,
      });
      return;
    }

    try {
      setManagedError('');
      await managedDiscord.connectChannel();
      toast({
        variant: 'success',
        title: 'Discord channel connected',
        description: 'Opening Discord management.',
      });
      openManagedDiscordManageSheet(managedAssistantId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      setManagedError(message);
      toast({
        variant: 'destructive',
        title: 'Could not connect channel',
        description: message,
      });
    }
  };

  const handleRetryManagedProvisioning = async () => {
    if (!managedAssistantId) {
      return;
    }

    if (!managedRetryApiToken.trim()) {
      const message = 'Kimi API key is required to retry provisioning.';
      setManagedError(message);
      toast({
        variant: 'destructive',
        title: 'Kimi API key required',
        description: message,
      });
      return;
    }

    try {
      setManagedError('');
      await deployManagedAgent({
        identifierId: managedAssistantId,
        provider: 'kimi',
        apiToken: managedRetryApiToken,
      });
      setManagedRetryApiToken('');
      await refetchManagedAgent();
      toast({
        variant: 'success',
        title: 'Runtime provisioned',
        description: 'You can connect a Discord channel now.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      setManagedError(message);
      toast({
        variant: 'destructive',
        title: 'Retry provisioning failed',
        description: message,
      });
    }
  };

  const handleRefreshManagedRuntime = async () => {
    const now = Date.now();

    if (
      refreshingManagedRuntime ||
      now - lastManagedRuntimeRefreshAt.current < MANUAL_REFRESH_THROTTLE_MS
    ) {
      return;
    }

    lastManagedRuntimeRefreshAt.current = now;
    setRefreshingManagedRuntime(true);

    try {
      setManagedError('');
      await Promise.all([refetchManagedAgent(), managedDiscord.refresh()]);
    } finally {
      setRefreshingManagedRuntime(false);
    }
  };

  useEffect(() => {
    if (mode !== 'assistant') {
      return;
    }

    const discordSetup = searchParams.get('discordSetup');
    const discordMode = searchParams.get('discordMode');
    const assistantId = searchParams.get('assistantId');

    if (discordSetup !== 'managed' || discordMode === 'manage' || !assistantId) {
      return;
    }

    setManagedAssistantId(assistantId);
    setOpen(true);

    const connection = searchParams.get('discordConnection');
    const requestedStep = searchParams.get('discordStep');

    if (connection === 'success') {
      setManagedStep('channel');
      setManagedError('');
      toast({
        variant: 'success',
        title: 'Discord connected',
        description: 'Select a server channel to finish setup.',
      });
    } else if (connection === 'error') {
      setManagedStep('connect');
      setManagedError(
        searchParams.get('message') ||
          'Discord connection was cancelled or failed. Try connecting again.',
      );
    } else if (requestedStep === 'provisioning') {
      setManagedStep('provisioning');
    } else if (requestedStep === 'channel') {
      setManagedStep('channel');
    } else {
      setManagedStep('connect');
    }

    if (
      connection ||
      searchParams.has('installationId') ||
      searchParams.has('message')
    ) {
      const next = new URLSearchParams(searchParams);
      if (connection === 'success') {
        next.set('discordStep', 'channel');
      }
      if (connection === 'error') {
        next.set('discordStep', 'connect');
      }
      next.delete('discordConnection');
      next.delete('installationId');
      next.delete('message');
      setSearchParams(next, { replace: true });
    }
  }, [mode, searchParams, setSearchParams, toast]);

  useEffect(() => {
    if (
      mode !== 'assistant' ||
      !managedAssistantId ||
      managedStep !== 'provisioning' ||
      isManagedRuntimeReady ||
      isManagedRuntimeFailed
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      void refetchManagedAgent().catch(() => undefined);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [
    isManagedRuntimeReady,
    isManagedRuntimeFailed,
    managedAssistantId,
    managedStep,
    mode,
    refetchManagedAgent,
  ]);

  useEffect(() => {
    if (
      mode !== 'assistant' ||
      !managedAssistantId ||
      managedStep !== 'provisioning' ||
      !isManagedRuntimeReady
    ) {
      return;
    }

    setManagedError('');
    // Runtime finished provisioning — hand off to the shared Discord manage
    // sheet (same UI as managing an existing assistant) for connect/channel.
    openManagedDiscordManageSheet(managedAssistantId);
  }, [
    isManagedRuntimeReady,
    managedAssistantId,
    managedStep,
    mode,
    openManagedDiscordManageSheet,
  ]);

  const renderManagedDiscordStep = () => {
    const selectedInstallation = managedDiscord.installations.find(
      (installation) =>
        installation._id === managedDiscord.selectedInstallationId,
    );

    const activeChannel = managedDiscord.activeBinding
      ? managedDiscord.channels.find(
          (channel) =>
            channel.id === managedDiscord.activeBinding?.discordChannelId,
        )
      : undefined;

    if (managedStep === 'complete') {
      return (
        <div className="flex min-h-80 flex-col items-center justify-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconCheck className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Discord channel connected</h3>
            <p className="text-xs text-muted-foreground">
              Opening the AI Assistant workspace.
            </p>
          </div>
        </div>
      );
    }

    if (managedStep === 'provisioning') {
      return (
        <div className="flex min-h-0 flex-1 flex-col gap-5">
          <ManagedProvisioningProgress
            status={managedAgent?.status || SERVER_STATUSES.PENDING}
            stage={managedAgent?.provisioning?.stage}
            message={managedAgent?.provisioning?.message}
            startedAt={
              managedAgent?.provisioning?.startedAt ||
              managedAgent?.createdAt ||
              managedProvisioningStartedAt
            }
            updatedAt={managedAgent?.provisioning?.updatedAt}
            error={managedAgent?.provisioning?.error}
            runtimeUrl={managedAgent?.url}
            retrying={deployingManagedAssistant}
          />

          {isManagedRuntimeFailed && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-sm font-medium">Retry provisioning</div>
              <p className="text-xs text-muted-foreground">
                Reuses this assistant and the existing managed server name.
              </p>
              <Input
                value={managedRetryApiToken}
                onChange={(event) =>
                  setManagedRetryApiToken(event.target.value)
                }
                placeholder="Paste your Kimi API key"
                autoComplete="off"
                disabled={deployingManagedAssistant}
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex min-h-0 flex-1 flex-col gap-5">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">
            {managedStep === 'connect'
              ? 'Connect Discord'
              : 'Choose server and channel'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {managedStep === 'connect'
              ? 'Install the official erxes AI Assistant bot to continue setup.'
              : 'Select where this assistant should respond in Discord.'}
          </p>
        </div>

        {(managedError || managedDiscord.error) && (
          <Alert variant="destructive">
            <Alert.Title>Discord setup failed</Alert.Title>
            <Alert.Description>
              {managedError || managedDiscord.error?.message}
            </Alert.Description>
          </Alert>
        )}

        {managedStep === 'connect' && (
          <>
            <Alert>
              <Alert.Title>Assistant created</Alert.Title>
              <Alert.Description>
                The assistant was created. Finish Discord setup here by
                approving the official erxes AI Assistant bot.
              </Alert.Description>
            </Alert>

            {!!managedDiscord.installations.length && (
              <Alert>
                <Alert.Title>Discord connected</Alert.Title>
                <Alert.Description>
                  Select a server and channel to finish setup.
                </Alert.Description>
              </Alert>
            )}
          </>
        )}

        {managedStep === 'channel' &&
          (managedDiscord.loading && !managedDiscord.installations.length ? (
            <div className="flex min-h-40 items-center justify-center">
              <Spinner />
            </div>
          ) : !managedDiscord.installations.length ? (
            <Alert variant="warning">
              <Alert.Title>No Discord server found</Alert.Title>
              <Alert.Description>
                Connect Discord again, then approve a server for the official
                erxes AI Assistant bot.
              </Alert.Description>
            </Alert>
          ) : (
            <>
              {!isManagedRuntimeReady && (
                <Alert variant="warning">
                  <Alert.Title>Runtime provisioning</Alert.Title>
                  <Alert.Description>
                    Discord is connected, but this assistant runtime is not
                    ready yet.
                  </Alert.Description>
                </Alert>
              )}

              {isManagedRuntimeFailed && (
                <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                  <div className="text-sm font-medium">Retry provisioning</div>
                  <p className="text-xs text-muted-foreground">
                    Reuses this assistant and the existing managed server name.
                  </p>
                  <Input
                    value={managedRetryApiToken}
                    onChange={(event) =>
                      setManagedRetryApiToken(event.target.value)
                    }
                    placeholder="Paste your Kimi API key"
                    autoComplete="off"
                    disabled={deployingManagedAssistant}
                  />
                </div>
              )}

              {managedDiscord.activeBinding && (
                <Alert>
                  <Alert.Title>Discord channel already connected</Alert.Title>
                  <Alert.Description>
                    Connected channel:{' '}
                    {activeChannel
                      ? `#${activeChannel.name}`
                      : managedDiscord.activeBinding.discordChannelId}
                  </Alert.Description>
                </Alert>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Discord server</div>
                  <Select
                    value={managedDiscord.selectedInstallationId}
                    onValueChange={(value) => {
                      managedDiscord.setSelectedInstallationId(value);
                      managedDiscord.setSelectedChannelId('');
                    }}
                    disabled={isSubmitting}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Select server" />
                    </Select.Trigger>
                    <Select.Content>
                      {managedDiscord.installations.map((installation) => (
                        <Select.Item
                          key={installation._id}
                          value={installation._id}
                        >
                          {installation.discordGuildName ||
                            installation.discordGuildId}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Discord channel</div>
                  <Select
                    value={managedDiscord.selectedChannelId}
                    onValueChange={managedDiscord.setSelectedChannelId}
                    disabled={
                      isSubmitting ||
                      !selectedInstallation ||
                      managedDiscord.loadingChannels
                    }
                  >
                    <Select.Trigger>
                      <Select.Value
                        placeholder={
                          managedDiscord.loadingChannels
                            ? 'Loading channels'
                            : 'Select channel'
                        }
                      />
                    </Select.Trigger>
                    <Select.Content>
                      {managedDiscord.channels.map((channel) => (
                        <Select.Item key={channel.id} value={channel.id}>
                          #{channel.name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>
              </div>
            </>
          ))}

        {managedDiscord.loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <IconRefresh className="size-4 animate-spin" />
            Syncing Discord setup
          </div>
        )}

        {loadingManagedAgent && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <IconRefresh className="size-4 animate-spin" />
            Checking runtime status
          </div>
        )}
      </div>
    );
  };

  const onSubmit = async (values: WorkspaceFormValues) => {
    let createdIdentifier: Identifier | null = null;

    try {
      if (!isTransfer && !values.apiToken?.trim()) {
        form.setError('apiToken', {
          type: 'required',
          message: 'API token is required',
        });
        return;
      }

      if (
        !isTransfer &&
        mode === 'assistant' &&
        values.discordConnectionMode === 'byob' &&
        !values.discordBotToken?.trim()
      ) {
        form.setError('discordBotToken', {
          type: 'required',
          message: 'Discord bot token is required',
        });
        return;
      }

      if (isTransfer && !values.transferServerName?.trim()) {
        form.setError('transferServerName', {
          type: 'required',
          message: 'Transferred server name is required',
        });
        return;
      }

      if (isTransfer && !values.transferGatewayToken?.trim()) {
        form.setError('transferGatewayToken', {
          type: 'required',
          message: 'Gateway token is required',
        });
        return;
      }

      if (isTransfer && mode === 'agent' && !values.transferServerUrl?.trim()) {
        form.setError('transferServerUrl', {
          type: 'required',
          message: 'Server URL is required for transferred AI agents',
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

      if (isTransfer) {
        const transferServerName = values.transferServerName?.trim() || '';
        const transferGatewayToken = values.transferGatewayToken?.trim() || '';
        const transferServerUrl = values.transferServerUrl?.trim() || '';

        if (mode === 'assistant') {
          await transferAgent({
            identifierId: createdIdentifier._id,
            serverName: transferServerName,
            gatewayToken: transferGatewayToken,
            serverUrl: transferServerUrl || undefined,
            serverId: values.transferServerId?.trim() || undefined,
            sourceSubdomain:
              values.transferSourceSubdomain?.trim() || undefined,
          });
        } else {
          await transferOpencode({
            identifierId: createdIdentifier._id,
            serverName: transferServerName,
            gatewayToken: transferGatewayToken,
            provider: values.provider || config.providerOptions[0]?.value || '',
            serverUrl: transferServerUrl,
            serverId: values.transferServerId?.trim() || undefined,
            serverPassword: values.transferServerPassword?.trim() || undefined,
            sourceSubdomain:
              values.transferSourceSubdomain?.trim() || undefined,
          });
        }
      } else {
        const apiToken = values.apiToken?.trim() || '';

        if (mode === 'assistant') {
          if (values.discordConnectionMode === 'managed') {
            setManagedAssistantId(createdIdentifier._id);
            setManagedStep('provisioning');
            setManagedError('');
            setManagedProvisioningStartedAt(new Date().toISOString());
            setManagedSetupSearchParams(createdIdentifier._id, 'provisioning');

            const deployedAgent = await deployManagedAgent({
              identifierId: createdIdentifier._id,
              provider: values.provider || config.providerOptions[0]?.value,
              apiToken,
              description: values.description?.trim() || undefined,
              systemPrompt: values.description?.trim() || undefined,
            });

            if (
              deployedAgent?.status === SERVER_STATUSES.APPROVED &&
              deployedAgent.url?.trim()
            ) {
              // Runtime is ready immediately — hand off to the shared Discord
              // manage sheet for the connect/channel/manage experience.
              openManagedDiscordManageSheet(createdIdentifier._id);
            }

            return;
          }

          await deployAgent({
            identifierId: createdIdentifier._id,
            token: values.discordBotToken?.trim() || '',
            apiToken,
          });
        } else {
          await deployOpencode({
            identifierId: createdIdentifier._id,
            provider: values.provider || config.providerOptions[0]?.value || '',
            apiToken,
          });
        }
      }

      resetCreateForm();
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
      const isManagedCreationAttempt =
        mode === 'assistant' &&
        !isTransfer &&
        values.discordConnectionMode === 'managed' &&
        !!createdIdentifier?._id;

      if (isManagedCreationAttempt && createdIdentifier?._id) {
        const assistantId = createdIdentifier._id;

        setOpen(true);
        setManagedAssistantId(assistantId);
        setManagedStep('provisioning');
        setManagedError(message);
        setManagedSetupSearchParams(assistantId, 'provisioning');

        toast({
          variant: 'destructive',
          title: 'Assistant provisioning interrupted',
          description:
            'Setup is still open for this assistant. Keep this sheet open while runtime status is checked.',
        });

        return;
      }

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
        title:
          mode === 'assistant'
            ? 'Add AI Assistant failed'
            : 'Add AI Agent failed',
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
        <AssistantWorkspaceCard key={identifier._id} identifier={identifier} />
      );
    }

    return (
      <AiAgentWorkspaceCard key={identifier._id} identifier={identifier} />
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
                  <Link
                    to={
                      mode === 'assistant'
                        ? '/agent/assistant'
                        : '/agent/agents'
                    }
                  >
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
              <p className="text-sm text-muted-foreground">{config.subtitle}</p>
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

              <Sheet.Content className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
                {showManagedDiscordStep ? (
                  renderManagedDiscordStep()
                ) : (
                  <>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">{config.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {config.sheetDescription}
                      </p>
                    </div>

                    <Form.Field
                      name="setupMode"
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Setup type</Form.Label>
                          <Select
                            value={field.value || 'new'}
                            onValueChange={field.onChange}
                          >
                            <Form.Control>
                              <Select.Trigger className="w-full">
                                <Select.Value placeholder="Choose setup type" />
                              </Select.Trigger>
                            </Form.Control>
                            <Select.Content>
                              <Select.Item value="new">
                                Create new server
                              </Select.Item>
                              <Select.Item value="transfer">
                                Transfer existing server
                              </Select.Item>
                            </Select.Content>
                          </Select>
                          <Form.Message />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      name="serverName"
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>Identifier name</Form.Label>
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

                    {(!isTransfer || mode === 'agent') && (
                      <Form.Field
                        name="provider"
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>Provider</Form.Label>
                            <Select
                              value={
                                field.value ||
                                config.providerOptions[0]?.value ||
                                ''
                              }
                              onValueChange={field.onChange}
                            >
                              <Form.Control>
                                <Select.Trigger className="w-full">
                                  <Select.Value placeholder="Choose provider" />
                                </Select.Trigger>
                              </Form.Control>
                              <Select.Content>
                                {config.providerOptions.map((option) => (
                                  <Select.Item
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select>
                            <Form.Message />
                          </Form.Item>
                        )}
                      />
                    )}

                    {!isTransfer && (
                      <Form.Field
                        name="apiToken"
                        render={({ field }) => (
                          <Form.Item>
                            <Form.Label>API token</Form.Label>
                            <Form.Control>
                              <Input
                                {...field}
                                value={field.value || ''}
                                placeholder="Paste your API token"
                                autoComplete="off"
                              />
                            </Form.Control>
                            <Form.Message />
                          </Form.Item>
                        )}
                      />
                    )}

                    {!isTransfer && mode === 'assistant' && (
                      <Form.Field
                        name="discordConnectionMode"
                        render={() => (
                          <Form.Item>
                            <Form.Label>Discord connection</Form.Label>
                            <Form.Control>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <button
                                  type="button"
                                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                                    discordConnectionMode === 'managed'
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border bg-background'
                                  }`}
                                  onClick={() =>
                                    setDiscordConnectionMode('managed')
                                  }
                                >
                                  <span
                                    className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                                      discordConnectionMode === 'managed'
                                        ? 'border-primary'
                                        : 'border-input'
                                    }`}
                                  >
                                    {discordConnectionMode === 'managed' && (
                                      <span className="size-2 rounded-full bg-primary" />
                                    )}
                                  </span>
                                  <span className="space-y-1">
                                    <span className="block font-medium">
                                      Use erxes Ai Assistant
                                    </span>
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                                    discordConnectionMode === 'byob'
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border bg-background'
                                  }`}
                                  onClick={() =>
                                    setDiscordConnectionMode('byob')
                                  }
                                >
                                  <span
                                    className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                                      discordConnectionMode === 'byob'
                                        ? 'border-primary'
                                        : 'border-input'
                                    }`}
                                  >
                                    {discordConnectionMode === 'byob' && (
                                      <span className="size-2 rounded-full bg-primary" />
                                    )}
                                  </span>
                                  <span className="space-y-1">
                                    <span className="block font-medium">
                                      Bring your own bot
                                    </span>
                                  </span>
                                </button>
                              </div>
                            </Form.Control>
                            <Form.Message />
                          </Form.Item>
                        )}
                      />
                    )}

                    {!isTransfer &&
                      mode === 'assistant' &&
                      discordConnectionMode === 'byob' && (
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
                                Required. Uses this token during bootstrap so
                                the bot can come online and send the pairing
                                code.
                              </p>
                              <Form.Message />
                            </Form.Item>
                          )}
                        />
                      )}

                    {isTransfer && (
                      <>
                        <Form.Field
                          name="transferServerName"
                          render={({ field }) => (
                            <Form.Item>
                              <Form.Label>Transferred server name</Form.Label>
                              <Form.Control>
                                <Input
                                  {...field}
                                  value={field.value || ''}
                                  placeholder="existing-server-name"
                                  autoComplete="off"
                                />
                              </Form.Control>
                              <Form.Message />
                            </Form.Item>
                          )}
                        />
                        <Form.Field
                          name="transferGatewayToken"
                          render={({ field }) => (
                            <Form.Item>
                              <Form.Label>Gateway token</Form.Label>
                              <Form.Control>
                                <Input
                                  {...field}
                                  value={field.value || ''}
                                  placeholder="Paste the exported gateway token"
                                  autoComplete="off"
                                />
                              </Form.Control>
                              <Form.Message />
                            </Form.Item>
                          )}
                        />
                        <Form.Field
                          name="transferServerUrl"
                          render={({ field }) => (
                            <Form.Item>
                              <Form.Label>
                                Server URL
                                {mode === 'agent' ? '' : ' (optional)'}
                              </Form.Label>
                              <Form.Control>
                                <Input
                                  {...field}
                                  value={field.value || ''}
                                  placeholder={
                                    mode === 'agent'
                                      ? 'https://server.example.com'
                                      : 'https://server.assistant.erxes.io'
                                  }
                                  autoComplete="off"
                                />
                              </Form.Control>
                              <Form.Message />
                            </Form.Item>
                          )}
                        />
                        <Form.Field
                          name="transferServerId"
                          render={({ field }) => (
                            <Form.Item>
                              <Form.Label>Server ID (optional)</Form.Label>
                              <Form.Control>
                                <Input
                                  {...field}
                                  value={field.value || ''}
                                  placeholder="Remote deployer server ID"
                                  autoComplete="off"
                                />
                              </Form.Control>
                              <Form.Message />
                            </Form.Item>
                          )}
                        />
                        {mode === 'agent' && (
                          <Form.Field
                            name="transferServerPassword"
                            render={({ field }) => (
                              <Form.Item>
                                <Form.Label>
                                  Server password (optional)
                                </Form.Label>
                                <Form.Control>
                                  <Input
                                    {...field}
                                    value={field.value || ''}
                                    placeholder="Opencode login password"
                                    autoComplete="off"
                                  />
                                </Form.Control>
                                <Form.Message />
                              </Form.Item>
                            )}
                          />
                        )}
                        <Form.Field
                          name="transferSourceSubdomain"
                          render={({ field }) => (
                            <Form.Item>
                              <Form.Label>
                                Source SaaS subdomain (optional)
                              </Form.Label>
                              <Form.Control>
                                <Input
                                  {...field}
                                  value={field.value || ''}
                                  placeholder="source-workspace"
                                  autoComplete="off"
                                />
                              </Form.Control>
                              <Form.Message />
                            </Form.Item>
                          )}
                        />
                      </>
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
                  </>
                )}
              </Sheet.Content>

              <Sheet.Footer className="!h-auto min-h-14 py-3 sm:space-x-0">
                <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
                  {showManagedDiscordStep ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                        onClick={() => {
                          if (managedAssistantId) {
                            finishManagedCreation(managedAssistantId);
                          } else {
                            setOpen(false);
                          }
                        }}
                      >
                        Open assistant
                      </Button>

                      {managedStep === 'provisioning' && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={handleRefreshManagedRuntime}
                          >
                            <IconRefresh
                              className={`size-4 ${
                                refreshingManagedRuntime ? 'animate-spin' : ''
                              }`}
                            />
                            Refresh runtime
                          </Button>
                          {isManagedRuntimeFailed && (
                            <Button
                              type="button"
                              variant="outline"
                              disabled={
                                isSubmitting || !managedRetryApiToken.trim()
                              }
                              onClick={handleRetryManagedProvisioning}
                            >
                              {deployingManagedAssistant ? (
                                <IconRefresh className="size-4 animate-spin" />
                              ) : (
                                <IconRefresh className="size-4" />
                              )}
                              Retry provisioning
                            </Button>
                          )}
                        </>
                      )}

                      {managedStep === 'connect' && (
                        <>
                          {!!managedDiscord.installations.length && (
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isSubmitting}
                              onClick={() => setManagedStep('channel')}
                            >
                              <IconArrowRight className="size-4" />
                              Continue
                            </Button>
                          )}
                          <Button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleConnectManagedDiscord}
                          >
                            <IconBrandDiscord className="size-4" />
                            Connect erxes Ai Assistant
                          </Button>
                        </>
                      )}

                      {managedStep === 'channel' && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={handleRefreshManagedRuntime}
                          >
                            <IconRefresh
                              className={`size-4 ${
                                refreshingManagedRuntime ? 'animate-spin' : ''
                              }`}
                            />
                            Refresh runtime
                          </Button>
                          {isManagedRuntimeFailed && (
                            <Button
                              type="button"
                              variant="outline"
                              disabled={
                                isSubmitting || !managedRetryApiToken.trim()
                              }
                              onClick={handleRetryManagedProvisioning}
                            >
                              {deployingManagedAssistant ? (
                                <IconRefresh className="size-4 animate-spin" />
                              ) : (
                                <IconRefresh className="size-4" />
                              )}
                              Retry provisioning
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={handleConnectManagedDiscord}
                          >
                            <IconBrandDiscord className="size-4" />
                            Install into another server
                          </Button>
                          <Button
                            type="button"
                            disabled={
                              isSubmitting ||
                              !isManagedRuntimeReady ||
                              !managedDiscord.selectedInstallationId ||
                              !managedDiscord.selectedChannelId
                            }
                            onClick={handleCreateManagedBinding}
                          >
                            <IconLink className="size-4" />
                            Connect channel
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                        onClick={() => {
                          resetCreateForm();
                          setOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting
                          ? 'Saving...'
                          : isManagedAssistantCreation
                          ? 'Connect erxes Ai Assistant'
                          : config.buttonLabel}
                      </Button>
                    </>
                  )}
                </div>
              </Sheet.Footer>
            </form>
          </Form>
        </Sheet.View>
      </Sheet>
    </div>
  );
};
