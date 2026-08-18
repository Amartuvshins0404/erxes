import { Button, cn, Input, Label, ToggleGroup, useToast } from 'erxes-ui';
import { IconSettings } from '@tabler/icons-react';
import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useFixAndRestart } from '../hooks/useFixAndRestart';
import { useDiscordSettings } from '../hooks/useDiscordSettings';
import { GET_DISCORD_GUILDS } from '../graphql/queries';
import { DestroyServerDialog } from '../../deploy/components/DestroyServerDialog';
import { useAgentDestroy } from '../../deploy/hooks/useAgentDestroy';
import { RestartServerDialog } from './RestartServerDialog';
import { RestartingOverlay } from './RestartingOverlay';

const TABS = [
  { value: 'discord', label: 'Discord' },
  { value: 'restart-openclaw', label: 'Restart & Destroy' },
];

export const SettingsContent = ({
  selectedId,
}: {
  selectedId: string | null;
}) => {
  const [activeTab, setActiveTab] = useState<string>(TABS[0].value);
  const [destroyOpen, setDestroyOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const { restart, loading: restarting } = useFixAndRestart();
  const { destroyAgent, loading: destroyLoading } = useAgentDestroy();
  const {
    updateDiscordSettings,
    updatingDiscord,
    addDiscordGuild,
    addingGuild,
  } = useDiscordSettings();
  const { toast } = useToast();
  const { data: guildsData, refetch: refetchGuilds } = useQuery<{
    getDiscordGuilds: { guildId: string; requireMention: boolean }[];
  }>(GET_DISCORD_GUILDS);

  const [botToken, setBotToken] = useState('');
  const [guildId, setGuildId] = useState('');

  const onDestroy = async () => {
    await destroyAgent();
  };

  const handleRestart = () => {
    restart({
      onCompleted: () =>
        toast({ variant: 'success', title: 'AI Assistant restarted successfully' }),
      onError: (error) =>
        toast({
          title: 'Restart failed',
          description: error.message,
          variant: 'destructive',
        }),
    });
  };

  const handleRestartConfirm = () => {
    handleRestart();
  };

  const handleSaveDiscord = () => {
    updateDiscordSettings(botToken, undefined, {
      onCompleted: () =>
        toast({ variant: 'success', title: 'Discord settings saved' }),
      onError: (error) =>
        toast({
          title: 'Failed to save Discord settings',
          description: error.message,
          variant: 'destructive',
        }),
    });
  };

  const handleAddGuild = () => {
    addDiscordGuild(guildId, {
      onCompleted: () => {
        toast({ variant: 'success', title: 'Discord guild added' });
        setGuildId('');
        refetchGuilds();
      },
      onError: (error) =>
        toast({
          title: 'Failed to add guild',
          description: error.message,
          variant: 'destructive',
        }),
    });
  };

  return (
    <div className="relative flex flex-col h-full p-4 gap-4">
      <RestartingOverlay visible={restarting} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            size="lg"
            value={activeTab}
            onValueChange={(value) => {
              if (!value) return;
              setActiveTab(value);
            }}
          >
            {TABS.map((tab) => (
              <ToggleGroup.Item key={tab.value} value={tab.value}>
                {tab.label}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup>
        </div>
      </div>

      {activeTab === 'discord' && (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col gap-6 w-full max-w-lg">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="botToken"
                  className="text-xs text-muted-foreground"
                >
                  Change Discord Bot Token
                </Label>
                <Input
                  id="botToken"
                  type="password"
                  placeholder="Enter bot token"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  disabled={updatingDiscord || !botToken}
                  onClick={handleSaveDiscord}
                >
                  {updatingDiscord ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="guildId"
                  className="text-xs text-muted-foreground"
                >
                  Discord server ID
                </Label>
                <p className="text-xs text-muted-foreground">
                  Add your Discord server ID here. This allows your bot to
                  communicate on that Discord server.
                </p>
                <Input
                  id="guildId"
                  placeholder="Enter discord server ID"
                  value={guildId}
                  onChange={(e) => setGuildId(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  disabled={addingGuild || !guildId}
                  onClick={handleAddGuild}
                >
                  {addingGuild ? 'Adding...' : 'Save'}
                </Button>
              </div>
            </div>

            {guildsData?.getDiscordGuilds &&
              guildsData.getDiscordGuilds.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium">Added Servers</h3>
                  <div className="flex flex-col gap-1">
                    {guildsData.getDiscordGuilds.map((guild) => (
                      <div
                        key={guild.guildId}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <span className="font-mono text-xs">
                          {guild.guildId}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {activeTab === 'restart-openclaw' && (
        <div className="flex flex-1 items-center justify-center gap-4">
          <Button disabled={restarting} onClick={() => setRestartOpen(true)}>
            {restarting ? 'Restarting...' : 'Restart AI Assistant'}
          </Button>
          <Button
            variant="destructive"
            disabled={destroyLoading}
            onClick={() => setDestroyOpen(true)}
          >
            {destroyLoading ? 'Destroying...' : 'Destroy'}
          </Button>
        </div>
      )}

      <RestartServerDialog
        open={restartOpen}
        onOpenChange={setRestartOpen}
        onConfirm={handleRestartConfirm}
        loading={restarting}
      />
      <DestroyServerDialog
        open={destroyOpen}
        onOpenChange={setDestroyOpen}
        onConfirm={onDestroy}
        loading={destroyLoading}
      />
    </div>
  );
};

export const SettingsItem = ({
  id,
  label,
  icon,
  selectedId,
  setSelectedId,
}: {
  id: string;
  label: string;
  icon?: React.ReactNode;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}) => {
  const fullId = `settings:${id}`;
  const isActive = selectedId === fullId;

  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        'justify-start h-auto rounded-lg p-2 items-start overflow-hidden',
        isActive && 'bg-primary/10 hover:bg-primary/10',
      )}
      onClick={() => setSelectedId(fullId)}
    >
      <div className="flex items-center gap-2 w-full text-left">
        <div
          className={cn(
            'size-8 bg-foreground/5 rounded-full flex-none flex items-center justify-center shrink-0',
            isActive && 'text-primary',
          )}
        >
          {icon ?? <IconSettings className="size-4 text-muted-foreground" />}
        </div>
        <h4
          className={cn(
            'line-clamp-1 truncate text-sm',
            isActive ? 'font-medium text-foreground' : 'text-muted-foreground',
          )}
        >
          {label}
        </h4>
      </div>
    </Button>
  );
};
