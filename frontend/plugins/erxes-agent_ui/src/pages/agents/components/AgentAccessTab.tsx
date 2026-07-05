import { useEffect, useState } from 'react';
import { IconLock, IconShieldCheck } from '@tabler/icons-react';
import { Button, Label, Separator, Spinner, Switch } from 'erxes-ui';
import { useAgentGrant } from '../hooks/useAgentGrant';

/**
 * The agent's Access tab — the ONE surface that picks which permission ACTIONS
 * the agent may use. The selection is written verbatim to the agent's dedicated,
 * server-enforced permission group (`agent-grant:<agentId>`); the backend then
 * DERIVES the tool-registry filter from it, so the group and the tool filter
 * stay in sync. Scope is forced to 'all' for v1. Gated on permissionsManage:
 * the underlying group mutations require it, so a user who can't manage
 * permissions sees a read-only, disabled surface.
 */
export const AgentAccessTab = ({
  agent,
}: {
  agent: { _id: string; agentId: string; grantGroupId?: string | null };
}) => {
  const {
    loading,
    canManage,
    plugins,
    isModuleOn,
    isActionOn,
    toggleModule,
    toggleAction,
    dirty,
    saving,
    save,
  } = useAgentGrant(agent);

  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPlugin && plugins.length) setSelectedPlugin(plugins[0].plugin);
  }, [plugins, selectedPlugin]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const current = plugins.find((p) => p.plugin === selectedPlugin);
  const disabled = !canManage || saving;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <IconShieldCheck className="size-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground truncate">
            Pick the actions this agent may perform. They are enforced server-side
            and mirrored into the agent&apos;s tool access.
          </p>
        </div>
        <Button onClick={save} disabled={disabled || !dirty}>
          {saving ? <Spinner /> : null}
          Save access
        </Button>
      </div>

      {!canManage && (
        <div className="flex items-center gap-2 px-4 py-2 text-sm bg-muted/40 text-muted-foreground border-b">
          <IconLock className="size-4 shrink-0" />
          You need permission-management access to change an agent&apos;s grant.
          Showing the current selection read-only.
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <div className="w-48 shrink-0 border-r overflow-auto styled-scroll p-2 space-y-1">
          {plugins.map(({ plugin }) => (
            <button
              key={plugin}
              type="button"
              onClick={() => setSelectedPlugin(plugin)}
              className={`w-full text-left rounded-md px-3 py-2 text-sm capitalize transition-colors ${
                selectedPlugin === plugin
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted/60'
              }`}
            >
              {plugin}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto styled-scroll p-4 space-y-4">
          {current?.modules.map((module) => {
            const moduleOn = isModuleOn(current.plugin, module.name);
            return (
              <section
                key={module.name}
                className="rounded-lg border bg-card shadow-sm"
              >
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <div className="font-medium capitalize">{module.name}</div>
                    {module.description && (
                      <p className="text-sm text-muted-foreground">
                        {module.description}
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={moduleOn}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      toggleModule(current.plugin, module.name, checked ?? false)
                    }
                  />
                </div>

                {moduleOn && (
                  <>
                    <Separator />
                    <div className="px-4 py-3 space-y-1">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Allowed actions
                      </Label>
                      {module.actions.map((action) => (
                        <div
                          key={action.name}
                          className="flex items-center justify-between gap-4 rounded-md py-2 px-2 hover:bg-muted/40"
                        >
                          <div className="min-w-0">
                            <div className="text-sm">
                              {action.title || action.name}
                            </div>
                            {action.description && (
                              <div className="text-xs text-muted-foreground">
                                {action.description}
                              </div>
                            )}
                          </div>
                          <Switch
                            checked={isActionOn(current.plugin, module.name, action)}
                            disabled={disabled || action.always || action.disabled}
                            onCheckedChange={(checked) =>
                              toggleAction(
                                current.plugin,
                                module.name,
                                action,
                                checked ?? false,
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>
            );
          })}
          {current && current.modules.length === 0 && (
            <p className="text-sm text-muted-foreground">
              This plugin exposes no configurable actions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
