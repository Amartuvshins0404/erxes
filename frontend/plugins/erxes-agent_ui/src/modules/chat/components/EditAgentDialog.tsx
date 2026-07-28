import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, Form, Skeleton, Tooltip } from 'erxes-ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AgentFormFields } from '~/pages/agents/components/AgentFormFields';
import {
  AGENT_FORM_DEFAULTS,
  AgentFormValues,
  agentFormSchema,
} from '~/pages/agents/validations';
import { useAgent } from '~/pages/agents/hooks/useAgent';
import { IChatAgent } from '~/modules/chat/hooks/useChatAgents';
import { useUpdateAgent } from '~/modules/chat/hooks/useUpdateAgent';

/**
 * In-chat agent editor. Renders the canonical agent form (AgentFormFields) in a
 * modal so the agent powering the current conversation can be retuned — model,
 * provider, instructions, tools, behaviour — without leaving for the Agents
 * settings page. Unlike that page it stays put on save (useUpdateAgent) and
 * keeps agentId read-only, since changing it would orphan this conversation.
 */
export const EditAgentDialog = ({
  agent,
  open,
  onOpenChange,
}: {
  agent: IChatAgent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { t } = useTranslation('mastra');
  const canOpenEditor =
    agent.capabilities?.canReadConfig === true &&
    agent.capabilities?.canEdit === true;
  const {
    agent: detailedAgent,
    loading,
    error,
  } = useAgent(agent._id, !open || !canOpenEditor);
  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: AGENT_FORM_DEFAULTS,
  });
  const [hydratedAgentId, setHydratedAgentId] = useState<string | null>(null);

  const model = form.watch('model');
  const { saveAgent, saving } = useUpdateAgent(() => onOpenChange(false));
  const hasDetailedAuthorization =
    detailedAgent?.capabilities?.canReadConfig === true &&
    detailedAgent?.capabilities?.canEdit === true;

  useEffect(() => {
    if (!detailedAgent) {
      setHydratedAgentId(null);
      return;
    }
    if (!hasDetailedAuthorization) {
      onOpenChange(false);
      return;
    }

    form.reset({
      name: detailedAgent.name || '',
      agentId: detailedAgent.agentId || '',
      description: detailedAgent.description || '',
      instructions: detailedAgent.instructions || '',
      provider: detailedAgent.provider || '',
      model: detailedAgent.model || '',
      destructiveOps:
        detailedAgent.destructiveOps === 'allow' ? 'allow' : 'ask',
      memoryEnabled: detailedAgent.memoryEnabled ?? true,
      debug: detailedAgent.debug ?? false,
      maxSteps: detailedAgent.maxSteps ?? 10,
      temperature: detailedAgent.temperature ?? null,
      isEnabled: detailedAgent.isEnabled ?? true,
      visibility: detailedAgent.visibility ?? 'private',
      teamId: detailedAgent.teamId ?? undefined,
      departmentId: detailedAgent.departmentId ?? undefined,
      unitId: detailedAgent.unitId ?? undefined,
    });
    setHydratedAgentId(detailedAgent._id);
  }, [detailedAgent, form, hasDetailedAuthorization, onOpenChange]);

  const formReady =
    detailedAgent !== null &&
    hasDetailedAuthorization &&
    hydratedAgentId === detailedAgent._id;
  const loadFailed = Boolean(error) || (!loading && !detailedAgent);

  const onSubmit = async (doc: AgentFormValues) => {
    if (!formReady || !detailedAgent) return;
    await saveAgent(detailedAgent, doc);
  };

  if (!canOpenEditor) return null;
  if (detailedAgent && !hasDetailedAuthorization) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-2xl gap-0 p-0">
        <Dialog.Header className="border-b px-5 py-3.5">
          <Dialog.Title>Edit {agent.name}</Dialog.Title>
          <Dialog.Description>
            Change this agent's model, provider and behaviour. Changes apply to
            new messages right away.
          </Dialog.Description>
        </Dialog.Header>

        {loadFailed ? (
          <>
            <p role="alert" className="px-5 py-8 text-sm text-destructive">
              {error?.message ?? t('error')}
            </p>
            <Dialog.Footer className="border-t px-5 py-3.5">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" size="sm">
                  {t('cancel')}
                </Button>
              </Dialog.Close>
            </Dialog.Footer>
          </>
        ) : !formReady || !detailedAgent ? (
          <div className="space-y-4 px-5 py-6">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="max-h-[65vh] space-y-4 overflow-y-auto px-5 py-4">
                <AgentFormFields
                  form={form}
                  canShare={detailedAgent.capabilities?.canShare === true}
                />
              </div>

              <Dialog.Footer className="flex items-center gap-2 border-t px-5 py-3.5">
                <Tooltip.Provider>
                  <Tooltip>
                    <Tooltip.Trigger asChild>
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          to={`/settings/erxes-agent/agents/edit/${detailedAgent._id}`}
                        >
                          Open full editor
                        </Link>
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                      Edit every setting on the Agents page
                    </Tooltip.Content>
                  </Tooltip>
                </Tooltip.Provider>
                <div className="flex-1" />
                <Dialog.Close asChild>
                  <Button type="button" variant="outline" size="sm">
                    {t('cancel')}
                  </Button>
                </Dialog.Close>
                <Button type="submit" size="sm" disabled={saving || !model}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </Dialog.Footer>
            </form>
          </Form>
        )}
      </Dialog.Content>
    </Dialog>
  );
};
