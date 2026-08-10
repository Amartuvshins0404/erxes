import { useEffect, useState } from 'react';
import {
  IconCheck,
  IconCopy,
  IconMicrophone,
  IconPaperclip,
} from '@tabler/icons-react';
import {
  Badge,
  Button,
  CopyText,
  Form,
  Input,
  Skeleton,
  cn,
  toast,
} from 'erxes-ui';
import { ClampedNumberInput } from '~/components/ClampedNumberInput';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGeneralSettings } from './hooks/useGeneralSettings';
import { useSettingsStatus } from './hooks/useSettingsStatus';
import {
  GENERAL_SETTINGS_DEFAULTS,
  GeneralSettingsValues,
  generalSettingsSchema,
} from './validations';
import { usePermissionCheck } from 'ui-modules';
import { ERXES_AGENT_ACTIONS } from '~/permissions';

const ManagedGeneralSettingsPage = ({
  canManageQuotas,
}: {
  canManageQuotas: boolean;
}) => {
  const { settings, agents, save, saving } = useGeneralSettings();

  // The bot webhook is served by the gateway at /pl:erxes-agent/* on this
  // console's own origin — NOT the core GraphQL API URL, which can be a
  // separate host/port on a split deployment. Derive it from the current
  // origin so it's correct wherever the console is served from. `origin` is
  // scheme+host+port with no trailing slash, so no trimming is needed.
  // TODO: prefer a server-computed `settings.botEndpointUrl` once the backend
  // exposes one, so a reverse-proxied / custom gateway host is reflected
  // exactly rather than assumed to match the console origin.
  const botBase = typeof window !== 'undefined' ? window.location.origin : '';
  const botEndpointUrl = `${botBase}/pl:erxes-agent/bot`;

  const form = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: GENERAL_SETTINGS_DEFAULTS,
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      form.reset({
        erxesApiUrl: settings.erxesApiUrl || 'http://localhost:4000',
        erxesApiToken: settings.erxesApiToken || '',
        defaultAgentId: settings.defaultAgentId || '',
        attachmentsEnabled: settings.attachmentsEnabled !== false,
        defaultAgentQuota: settings.defaultAgentQuota ?? 0,
      });
    }
  }, [settings, form]);

  // Detected upload storage (configured in core Settings → File upload).
  const attachmentStorage = settings?.attachmentStorage;

  const onSubmit = async ({
    defaultAgentQuota,
    ...settingsDoc
  }: GeneralSettingsValues) => {
    const doc = canManageQuotas
      ? { ...settingsDoc, defaultAgentQuota }
      : settingsDoc;
    try {
      await save({ variables: { doc } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ title: 'Settings saved' });
    } catch {
      // Error surfaced to the user via the mutation's onError toast.
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold">General Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure the Mastra plugin connection to erxes.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <Form.Field
              control={form.control}
              name="defaultAgentId"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Default Agent (for bot webhook)</Form.Label>
                  <Form.Control>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      <option value="">None</option>
                      {agents.flatMap((a) =>
                        a.isEnabled
                          ? [
                              <option key={a._id} value={a.agentId}>
                                {a.name} ({a.agentId})
                              </option>,
                            ]
                          : [],
                      )}
                    </select>
                  </Form.Control>
                  <Form.Description>
                    This agent handles incoming messages from the erxes
                    messenger bot endpoint (
                    <code>POST /pl:erxes-agent/bot/:conversationId</code>). Set
                    this URL as
                    <code> botEndpointUrl</code> in your frontline integration.
                  </Form.Description>
                  <Form.Message />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="erxesApiUrl"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>erxes API URL</Form.Label>
                  <Form.Control>
                    <Input {...field} placeholder="http://localhost:4000" />
                  </Form.Control>
                  <Form.Description>
                    Used by erxes tools to call the GraphQL gateway
                  </Form.Description>
                  <Form.Message />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="erxesApiToken"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>erxes API Token</Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Bearer token for erxes gateway calls"
                    />
                  </Form.Control>
                  <Form.Description>
                    Also used for GraphQL schema introspection when loading
                    erxes tools
                  </Form.Description>
                  <Form.Message />
                </Form.Item>
              )}
            />

            {canManageQuotas && (
              <Form.Field
                control={form.control}
                name="defaultAgentQuota"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Default agent creation quota</Form.Label>
                    <Form.Control>
                      <ClampedNumberInput
                        field={field}
                        min={0}
                        max={10000}
                        fallback={0}
                        className="w-32"
                      />
                    </Form.Control>
                    <Form.Description>
                      Maximum agents a user may create (0 = unlimited). Shared /
                      team-visible agents don't count toward this limit. Admins
                      are always exempt.
                    </Form.Description>
                    <Form.Message />
                  </Form.Item>
                )}
              />
            )}

            <Form.Field
              control={form.control}
              name="attachmentsEnabled"
              render={({ field }) => (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconPaperclip className="size-4 text-muted-foreground" />
                      <span className="font-medium">Chat file attachments</span>
                    </div>
                    <Badge
                      variant={
                        attachmentStorage?.configured
                          ? field.value
                            ? 'success'
                            : 'secondary'
                          : 'destructive'
                      }
                    >
                      {!attachmentStorage?.configured
                        ? 'No storage'
                        : field.value
                        ? 'On'
                        : 'Off'}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1 pl-6">
                    <div>
                      Detected storage:{' '}
                      <span className="font-mono">
                        {attachmentStorage?.serviceType || 'unknown'}
                      </span>{' '}
                      {attachmentStorage?.configured
                        ? '(configured)'
                        : '(not configured)'}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pl-6 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      disabled={!attachmentStorage?.configured}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    Allow file attachments in agent chat (images, PDF, Excel,
                    Word, …)
                  </label>

                  <p className="text-xs text-muted-foreground">
                    Files are stored in this instance's existing upload storage
                    (configured in <strong>Settings → File upload</strong>: AWS
                    S3, Cloudflare R2, Azure, GCS or local disk). When no
                    storage is configured, conversations stay text-only.
                  </p>
                </div>
              )}
            />

            <Button type="submit" disabled={saving}>
              {saved ? (
                <>
                  <IconCheck size={16} /> Saved
                </>
              ) : saving ? (
                'Saving...'
              ) : (
                'Save Settings'
              )}
            </Button>
          </form>
        </Form>

        <div className="rounded-lg border bg-muted/50 p-4 text-sm space-y-2">
          <p className="font-semibold">Bot Endpoint Setup</p>
          <p className="text-muted-foreground">
            To connect this agent to the erxes messenger widget:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
            <li>
              Go to <strong>Settings → Integrations → Messenger</strong>
            </li>
            <li>
              Edit an integration and set <strong>Bot Endpoint URL</strong> to:
            </li>
          </ol>
          <CopyText
            value={botEndpointUrl}
            className={cn(
              'block w-full bg-muted px-3 py-2 rounded text-xs font-mono justify-between',
            )}
          >
            <span>{botEndpointUrl}</span>
            <IconCopy className="size-3.5 shrink-0 text-muted-foreground" />
          </CopyText>
          <p className="text-xs text-muted-foreground">
            Uses this console's origin, where the gateway proxies{' '}
            <code>/pl:erxes-agent/*</code> to the agent service. If your gateway
            is reached on a different host, substitute it here.
          </p>
        </div>
      </div>
    </div>
  );
};

const GeneralSettingsStatusPage = () => {
  const { attachmentStorage, voiceStatus, loading, error } =
    useSettingsStatus();

  const attachmentsConfigured = attachmentStorage?.configured === true;
  const attachmentsEnabled = attachmentStorage?.enabled === true;
  const voiceEnabled = voiceStatus?.enabled === true;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-xl space-y-8">
        <h1 className="text-2xl font-bold">General Settings</h1>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error.message}
          </p>
        ) : loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <IconPaperclip className="size-4 text-muted-foreground" />
                  <span className="font-medium">Chat file attachments</span>
                </div>
                <Badge
                  variant={
                    !attachmentsConfigured
                      ? 'destructive'
                      : attachmentsEnabled
                      ? 'success'
                      : 'secondary'
                  }
                >
                  {!attachmentsConfigured
                    ? 'No storage'
                    : attachmentsEnabled
                    ? 'On'
                    : 'Off'}
                </Badge>
              </div>
              <p className="mt-2 pl-6 text-xs text-muted-foreground">
                Detected storage:{' '}
                <span className="font-mono">
                  {attachmentStorage?.serviceType || 'unknown'}
                </span>
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <IconMicrophone className="size-4 text-muted-foreground" />
                  <span className="font-medium">Voice mode</span>
                </div>
                <Badge variant={voiceEnabled ? 'success' : 'secondary'}>
                  {voiceEnabled ? 'Ready' : 'Unavailable'}
                </Badge>
              </div>
              <p className="mt-2 pl-6 text-xs text-muted-foreground">
                {voiceEnabled
                  ? 'Both directions are configured — voice mode is available in chat.'
                  : 'Needs a usable STT and TTS token (per-workspace or environment) to appear in chat.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const GeneralSettingsPage = () => {
  const { hasActionPermission } = usePermissionCheck();
  const canManageSettings = hasActionPermission(
    ERXES_AGENT_ACTIONS.settings.manage,
  );
  const canReadSettingsStatus = hasActionPermission(
    ERXES_AGENT_ACTIONS.settings.statusRead,
  );
  const canManageQuotas = hasActionPermission(
    ERXES_AGENT_ACTIONS.settings.quotasManage,
  );

  if (canManageSettings) {
    return <ManagedGeneralSettingsPage canManageQuotas={canManageQuotas} />;
  }

  return canReadSettingsStatus ? <GeneralSettingsStatusPage /> : null;
};
