import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconChevronDown, IconPuzzle } from '@tabler/icons-react';
import {
  Badge,
  Card,
  Collapsible,
  Empty,
  Skeleton,
  Switch,
  toast,
} from 'erxes-ui';
import {
  IMastraPluginToolItem,
  IMastraPluginTools,
  usePluginTools,
} from './hooks/usePluginTools';

// "posProducts.query posOrdersSummary" → tail after the last "." → "Pos orders summary".
const humanizeToolId = (id: string): string => {
  const tail = id.split('.').pop() || id;
  const words = tail
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const groupTools = (tools: IMastraPluginToolItem[]) => {
  const groups = new Map<string, IMastraPluginToolItem[]>();
  for (const tool of tools) {
    const key = tool.module || tool.kind;
    const list = groups.get(key);
    if (list) {
      list.push(tool);
    } else {
      groups.set(key, [tool]);
    }
  }
  return Array.from(groups.entries());
};

const PluginToolRow = ({
  tool,
  checked,
  saving,
  onToggle,
}: {
  tool: IMastraPluginToolItem;
  checked: boolean;
  saving: boolean;
  onToggle: (tool: IMastraPluginToolItem, enabled: boolean) => void;
}) => {
  const { t } = useTranslation('erxes-agent');
  const label = humanizeToolId(tool.id);

  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <Badge variant="secondary" className="text-xs">
            {tool.kind}
          </Badge>
          {tool.method === 'mutation' && (
            <Badge variant="warning" className="text-xs">
              {t('plugin-tools-method-mutation', { defaultValue: 'mutation' })}
            </Badge>
          )}
          {tool.destructive && (
            <Badge variant="destructive" className="text-xs">
              {t('plugin-tools-destructive', { defaultValue: 'destructive' })}
            </Badge>
          )}
        </div>
        {tool.permissionAction && (
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {tool.permissionAction}
          </p>
        )}
        {tool.description && (
          <p className="mt-1 text-xs text-muted-foreground">
            {tool.description}
          </p>
        )}
      </div>
      {tool.agentUsable ? (
        <Switch
          checked={checked}
          disabled={saving}
          onCheckedChange={(enabled) => onToggle(tool, enabled)}
          aria-label={label}
        />
      ) : (
        <Badge variant="secondary" className="shrink-0 text-xs">
          {t('plugin-tools-not-agent-callable', {
            defaultValue: 'Not agent-callable',
          })}
        </Badge>
      )}
    </div>
  );
};

const PluginToolsCard = ({
  plugin,
  saving,
  onSave,
}: {
  plugin: IMastraPluginTools;
  saving: boolean;
  onSave: (
    plugin: IMastraPluginTools,
    enabled: boolean,
    disabledTools: string[],
  ) => void;
}) => {
  const { t } = useTranslation('erxes-agent');
  const [open, setOpen] = useState(plugin.enabled);

  const disabledTools = plugin.disabledTools;
  const unavailableCount = plugin.tools.filter((tool) => !tool.agentUsable)
    .length;

  const handleToggleTool = (tool: IMastraPluginToolItem, enabled: boolean) => {
    const nextDisabledTools = enabled
      ? disabledTools.filter((id) => id !== tool.id)
      : [...disabledTools, tool.id];
    onSave(plugin, plugin.enabled, nextDisabledTools);
  };

  return (
    <Card className="border shadow-none">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between gap-3 p-4">
          <Collapsible.Trigger className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <IconChevronDown
              aria-hidden
              className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200${
                open ? '' : ' -rotate-90'
              }`}
            />
            <span className="truncate font-semibold">{plugin.plugin}</span>
          </Collapsible.Trigger>
          <div className="flex shrink-0 items-center gap-2">
            {!plugin.supported && (
              <Badge variant="destructive">
                {t('plugin-tools-no-endpoint', { defaultValue: 'No endpoint' })}
              </Badge>
            )}
            {unavailableCount > 0 && (
              <Badge variant="secondary">
                {t('plugin-tools-unavailable-count', {
                  defaultValue: '{{count}} unavailable',
                  count: unavailableCount,
                })}
              </Badge>
            )}
            <Switch
              checked={plugin.enabled}
              disabled={!plugin.supported || saving}
              onCheckedChange={(enabled) =>
                onSave(plugin, enabled, disabledTools)
              }
              aria-label={t('plugin-tools-enable-plugin', {
                defaultValue: 'Enable plugin for agents',
              })}
            />
          </div>
        </div>
        <Collapsible.Content>
          <div className="border-t px-4 py-3">
            {!plugin.enabled ? (
              <p className="text-sm text-muted-foreground">
                {t('plugin-tools-disabled-hint', {
                  defaultValue: 'Enable this plugin to configure its tools.',
                })}
              </p>
            ) : plugin.tools.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('plugin-tools-no-tools', {
                  defaultValue: 'This plugin exposes no tools.',
                })}
              </p>
            ) : (
              groupTools(plugin.tools).map(([group, tools], index) => (
                <div key={group} className={index > 0 ? 'mt-4' : undefined}>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {group}
                  </p>
                  <div className="mt-1 divide-y">
                    {tools.map((tool) => (
                      <PluginToolRow
                        key={tool.id}
                        tool={tool}
                        checked={!disabledTools.includes(tool.id)}
                        saving={saving}
                        onToggle={handleToggleTool}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Collapsible.Content>
      </Collapsible>
    </Card>
  );
};

const PluginToolsSkeleton = () => (
  <div className="space-y-4">
    {[0, 1, 2].map((index) => (
      <Card key={index} className="border p-4 shadow-none">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </Card>
    ))}
  </div>
);

export const PluginToolsPage = () => {
  const { t } = useTranslation('erxes-agent');
  const { plugins, loading, error, savingPlugin, updateCuration } =
    usePluginTools();

  const handleSave = async (
    plugin: IMastraPluginTools,
    enabled: boolean,
    disabledTools: string[],
  ) => {
    try {
      await updateCuration(plugin.plugin, enabled, disabledTools);
      toast({
        title: t('plugin-tools-update-success', {
          defaultValue: 'Plugin tools updated',
        }),
      });
    } catch (err) {
      toast({
        title: t('plugin-tools-update-failed', {
          defaultValue: 'Failed to update plugin tools',
        }),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full max-w-3xl p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {t('plugin-tools-title', { defaultValue: 'Plugin tools' })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('plugin-tools-description', {
              defaultValue:
                'Control which plugin capabilities agents may use, and disable individual tools.',
            })}
          </p>
        </div>

        {loading ? (
          <PluginToolsSkeleton />
        ) : error || plugins.length === 0 ? (
          <Empty className="border">
            <Empty.Header>
              <Empty.Media variant="icon">
                <IconPuzzle />
              </Empty.Media>
              <Empty.Title>
                {error
                  ? t('plugin-tools-load-failed', {
                      defaultValue: 'Failed to load plugin tools',
                    })
                  : t('plugin-tools-empty-title', {
                      defaultValue: 'No plugin tools',
                    })}
              </Empty.Title>
              <Empty.Description>
                {error
                  ? error.message
                  : t('plugin-tools-empty-description', {
                      defaultValue: 'No plugins expose agent-callable tools.',
                    })}
              </Empty.Description>
            </Empty.Header>
          </Empty>
        ) : (
          <div className="space-y-4">
            {plugins.map((plugin) => (
              <PluginToolsCard
                key={plugin.plugin}
                plugin={plugin}
                saving={savingPlugin === plugin.plugin}
                onSave={handleSave}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
