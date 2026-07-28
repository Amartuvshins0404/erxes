import { useState } from 'react';
import { IconShieldCheck } from '@tabler/icons-react';
import { Button, Label, Select, Separator, Spinner, Switch } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { useAgentGrant } from '../hooks/useAgentGrant';

/**
 * The agent Access tab is the single surface for choosing which actions the
 * agent may use. The selection is written to its dedicated, server-enforced
 * permission profile (`agent-grant:<agentId>`). Each module carries an explicit
 * own/group/all scope, and runtime tool discovery derives from the same profile.
 */
export const AgentAccessTab = ({
  agent,
}: {
  agent: { _id: string; agentId: string; grantGroupId?: string | null };
}) => {
  const { t } = useTranslation('mastra');
  const {
    loading,
    canManage,
    plugins,
    isModuleOn,
    isActionOn,
    toggleModule,
    toggleAction,
    getModuleScope,
    setModuleScope,
    dirty,
    saving,
    save,
  } = useAgentGrant(agent);

  // Null = no explicit pick yet; fall back to the first plugin at render time
  // rather than syncing a default into state through an effect.
  const [picked, setPicked] = useState<string | null>(null);
  const selectedPlugin = picked ?? plugins[0]?.plugin ?? null;

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
            {t('agent-access-description')}
          </p>
        </div>
        <Button onClick={save} disabled={disabled || !dirty}>
          {saving ? <Spinner /> : null}
          {t('agent-access-save')}
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="w-48 shrink-0 border-r overflow-auto styled-scroll p-2 space-y-1">
          {plugins.map(({ plugin }) => (
            <button
              key={plugin}
              type="button"
              onClick={() => setPicked(plugin)}
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
                  <div className="flex items-center gap-2">
                    {moduleOn && (module.scopes?.length ?? 0) > 0 && (
                      <Select
                        value={getModuleScope(current.plugin, module.name)}
                        disabled={disabled}
                        onValueChange={(scope) =>
                          setModuleScope(current.plugin, module.name, scope)
                        }
                      >
                        <Select.Trigger
                          className="w-32"
                          aria-label={t('agent-access-scope-label', {
                            module: module.name,
                          })}
                        >
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          {module.scopes?.map((scope) => (
                            <Select.Item key={scope.name} value={scope.name}>
                              {t(`agent-access-scope-${scope.name}`)}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                    )}
                    <Switch
                      checked={moduleOn}
                      disabled={disabled}
                      onCheckedChange={(checked) =>
                        toggleModule(
                          current.plugin,
                          module.name,
                          checked ?? false,
                        )
                      }
                    />
                  </div>
                </div>

                {moduleOn && (
                  <>
                    <Separator />
                    <div className="px-4 py-3 space-y-1">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('agent-access-actions')}
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
                            checked={isActionOn(
                              current.plugin,
                              module.name,
                              action,
                            )}
                            disabled={
                              disabled || action.always || action.disabled
                            }
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
              {t('agent-access-empty')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
