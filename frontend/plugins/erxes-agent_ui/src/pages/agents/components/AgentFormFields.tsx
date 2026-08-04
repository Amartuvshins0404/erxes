import { useQuery } from '@apollo/client';
import { useAtomValue } from 'jotai';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';
import {
  Alert,
  Badge,
  Button,
  Collapsible,
  Combobox,
  Form,
  Input,
  Popover,
  RadioGroup,
  Separator,
  Slider,
  Switch,
  Textarea,
} from 'erxes-ui';
import { Trans, useTranslation } from 'react-i18next';
import { UseFormReturn, useWatch } from 'react-hook-form';
import {
  currentUserState,
  pluginsConfigState,
  SelectDepartments,
  SelectMember,
  usePermissionCheck,
} from 'ui-modules';
import { Field } from '~/components/FormLayout';
import {
  SelectModel,
  SelectProvider,
  useProviderOptions,
} from '~/components/SelectProviderModel';
import { MASTRA_AGENT_ADDITIONAL_TOOLS } from '~/graphql/queries';
import { AgentFormValues } from '../validations';
import {
  AUDIENCE_TEAMS,
  type AudienceTeamsData,
  PERMISSION_GROUPS,
  permissionGroupOptions,
  type PermissionGroupsData,
} from '../graphql/access';
import { PermissionGroupSelector } from './PermissionGroupSelector';
import { AudienceTeamSelector } from './AudienceTeamSelector';
import { ERXES_AGENT_ACTIONS } from '~/permissions';
import { resolveAgentActionScope } from '../hooks/agentActionScope';

type AgentForm = UseFormReturn<AgentFormValues>;

interface AdditionalToolsData {
  mastraAgentAdditionalTools: string[];
}

const AgentFormSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <section className="grid gap-4 border-b py-4 last:border-b-0 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] md:gap-6">
    <header className="space-y-1">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </header>
    <div className="min-w-0 space-y-4">{children}</div>
  </section>
);

const BasicInfoSection = ({ form }: { form: AgentForm }) => {
  const { t } = useTranslation('mastra');

  return (
    <AgentFormSection
      title={t('agent-settings-identity-title')}
      description={t('agent-settings-identity-description')}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Form.Field
          control={form.control}
          name="name"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>{t('agent-settings-name')}</Form.Label>
              <Form.Control>
                <Input
                  {...field}
                  placeholder={t('agent-settings-name-placeholder')}
                />
              </Form.Control>
              <Form.Description>
                {t('agent-settings-name-description')}
              </Form.Description>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field
          control={form.control}
          name="description"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>{t('agent-settings-description')}</Form.Label>
              <Form.Control>
                <Input
                  {...field}
                  placeholder={t('agent-settings-description-placeholder')}
                />
              </Form.Control>
              <Form.Description>
                {t('agent-settings-description-description')}
              </Form.Description>
              <Form.Message />
            </Form.Item>
          )}
        />
      </div>

      <Form.Field
        control={form.control}
        name="instructions"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>{t('agent-settings-instructions')}</Form.Label>
            <Form.Control>
              <Textarea
                {...field}
                placeholder={t('agent-settings-instructions-placeholder')}
                rows={6}
              />
            </Form.Control>
            <Form.Description>
              {t('agent-settings-instructions-description')}
            </Form.Description>
            <Form.Message />
          </Form.Item>
        )}
      />
    </AgentFormSection>
  );
};

const AgentSharingSection = ({ form }: { form: AgentForm }) => {
  const { t } = useTranslation('mastra');
  const { t: tAgent } = useTranslation('erxes-agent');
  const visibility = useWatch({ control: form.control, name: 'visibility' });
  const pluginsConfig = useAtomValue(pluginsConfigState);
  const isOperationPluginEnabled = Object.values(pluginsConfig ?? {}).some(
    ({ name }) => name === 'operation',
  );
  const { data: audienceTeamsData, loading: teamsLoading } =
    useQuery<AudienceTeamsData>(AUDIENCE_TEAMS, {
      skip: visibility !== 'shared' || !isOperationPluginEnabled,
    });
  const teamOptions = audienceTeamsData?.getTeams ?? [];
  const visibilityOptions = [
    {
      value: 'private',
      label: 'agent-settings-private',
      description: 'agent-settings-private-description',
    },
    {
      value: 'shared',
      label: 'agent-settings-many',
      description: 'agent-settings-many-description',
    },
    {
      value: 'organization',
      label: 'agent-settings-everyone',
      description: 'agent-settings-everyone-description',
    },
  ] as const;

  const clearAudience = () => {
    form.setValue('audienceUserIds', []);
    form.setValue('audienceTeamIds', []);
    form.setValue('audienceDepartmentIds', []);
  };

  return (
    <AgentFormSection
      title={t('agent-settings-visibility-title')}
      description={t('agent-settings-visibility-description')}
    >
      <Form.Field
        control={form.control}
        name="visibility"
        render={({ field }) => (
          <Form.Item>
            <Form.Control>
              <RadioGroup
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value !== 'shared') clearAudience();
                }}
                className="grid gap-3 md:grid-cols-3"
              >
                {visibilityOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                      field.value === option.value
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <RadioGroup.Item value={option.value} />
                    <span className="min-w-0 space-y-1">
                      <span className="block text-sm font-medium">
                        {option.value === 'shared'
                          ? tAgent(option.label)
                          : t(option.label)}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {option.value === 'shared'
                          ? tAgent(option.description)
                          : t(option.description)}
                      </span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </Form.Control>
            <Form.Message />
          </Form.Item>
        )}
      />

      {visibility === 'shared' && (
        <div className="space-y-5 rounded-lg border bg-muted/10 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {tAgent('agent-settings-audience-title')}
            </p>
            <p className="text-xs text-muted-foreground">
              {tAgent('agent-settings-audience-description')}
            </p>
          </div>

          <Form.Field
            control={form.control}
            name="audienceUserIds"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>
                  {tAgent('agent-settings-audience-people')}
                </Form.Label>
                <SelectMember.FormItem
                  mode="multiple"
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange(Array.isArray(value) ? value : [])
                  }
                  placeholder={tAgent(
                    'agent-settings-audience-people-placeholder',
                  )}
                />
                <Form.Description>
                  {tAgent('agent-settings-audience-people-description')}
                </Form.Description>
              </Form.Item>
            )}
          />

          <Form.Field
            control={form.control}
            name="audienceTeamIds"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>
                  {tAgent('agent-settings-audience-teams')}
                </Form.Label>
                <Form.Control>
                  <AudienceTeamSelector
                    teams={teamOptions}
                    value={field.value}
                    onChange={field.onChange}
                    loading={teamsLoading}
                  />
                </Form.Control>
                <Form.Description>
                  {tAgent('agent-settings-audience-teams-description')}
                </Form.Description>
                {!teamsLoading && teamOptions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {tAgent('agent-settings-audience-no-teams')}
                  </p>
                )}
              </Form.Item>
            )}
          />

          <Form.Field
            control={form.control}
            name="audienceDepartmentIds"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>
                  {tAgent('agent-settings-audience-departments')}
                </Form.Label>
                <SelectDepartments
                  mode="multiple"
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange(Array.isArray(value) ? value : [])
                  }
                >
                  <Popover>
                    <Form.Control>
                      <Combobox.Trigger className="w-full shadow-xs">
                        <SelectDepartments.List
                          placeholder={tAgent(
                            'agent-settings-audience-departments-placeholder',
                          )}
                        />
                      </Combobox.Trigger>
                    </Form.Control>
                    <Combobox.Content>
                      <SelectDepartments.Command disableCreateOption />
                    </Combobox.Content>
                  </Popover>
                </SelectDepartments>
                <Form.Description>
                  {tAgent('agent-settings-audience-departments-description')}
                </Form.Description>
              </Form.Item>
            )}
          />
        </div>
      )}
    </AgentFormSection>
  );
};

const AiModelSection = ({ form }: { form: AgentForm }) => {
  const { t } = useTranslation('mastra');
  const provider = form.watch('provider');
  const { providers: enabledProviders } = useProviderOptions();

  return (
    <AgentFormSection
      title={t('agent-settings-model-title')}
      description={t('agent-settings-model-description')}
    >
      {enabledProviders.length === 0 ? (
        <Alert>
          <IconInfoCircle className="size-4" />
          <Alert.Title>{t('agent-settings-no-providers-title')}</Alert.Title>
          <Alert.Description>
            <Trans
              ns="mastra"
              i18nKey="agent-settings-no-providers-description"
              components={{
                providerLink: (
                  <Link
                    to="/settings/erxes-agent/providers"
                    className="underline underline-offset-4"
                  />
                ),
              }}
            />
          </Alert.Description>
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Form.Field
            control={form.control}
            name="provider"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t('agent-settings-provider')}</Form.Label>
                <SelectProvider
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue('model', '');
                  }}
                />
                <Form.Description>
                  {t('agent-settings-provider-description')}
                </Form.Description>
                <Form.Message />
              </Form.Item>
            )}
          />

          <Form.Field
            control={form.control}
            name="model"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t('agent-settings-model')}</Form.Label>
                <SelectModel
                  provider={provider}
                  value={field.value}
                  onValueChange={field.onChange}
                />
                <Form.Description>
                  {t('agent-settings-model-live-description')}
                </Form.Description>
                <Form.Message />
              </Form.Item>
            )}
          />
        </div>
      )}
    </AgentFormSection>
  );
};

const AdditionalToolsSection = ({ form }: { form: AgentForm }) => {
  const { t } = useTranslation('mastra');
  const { data, loading, error } = useQuery<AdditionalToolsData>(
    MASTRA_AGENT_ADDITIONAL_TOOLS,
  );
  const tools = data?.mastraAgentAdditionalTools ?? [];

  return (
    <AgentFormSection
      title={t('agent-settings-tools-title')}
      description={t('agent-settings-tools-description')}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">
          {t('agent-settings-tools-loading')}
        </p>
      ) : error ? (
        <Alert variant="warning">
          <IconAlertTriangle className="size-4" />
          <Alert.Description>
            {t('agent-settings-tools-error')}
          </Alert.Description>
        </Alert>
      ) : (
        <Form.Field
          control={form.control}
          name="additionalTools"
          render={({ field }) => (
            <Form.Item>
              <Form.Control>
                <div className="grid gap-3 md:grid-cols-2">
                  {tools.map((key) => {
                    const enabled = field.value.includes(key);
                    const label = t(`agent-settings-tool-${key}-label`);
                    return (
                      <div
                        key={key}
                        className={`flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors ${
                          enabled
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/40'
                        }`}
                      >
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {t(`agent-settings-tool-${key}-description`)}
                          </p>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) =>
                            field.onChange(
                              checked
                                ? [...field.value, key]
                                : field.value.filter(
                                    (selected) => selected !== key,
                                  ),
                            )
                          }
                          aria-label={label}
                        />
                      </div>
                    );
                  })}
                </div>
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
      )}
    </AgentFormSection>
  );
};

const AgentAccessSection = ({ form }: { form: AgentForm }) => {
  const { t } = useTranslation('mastra');
  const destructiveOps = form.watch('destructiveOps');
  const { data, loading, error } =
    useQuery<PermissionGroupsData>(PERMISSION_GROUPS);
  const currentUser = useAtomValue(currentUserState);
  const permissionCheck = usePermissionCheck();
  const canAssignAnyGroup =
    resolveAgentActionScope(
      permissionCheck,
      ERXES_AGENT_ACTIONS.agent.create,
    ) === 'all' ||
    resolveAgentActionScope(
      permissionCheck,
      ERXES_AGENT_ACTIONS.agent.update,
    ) === 'all';
  const availableGroups = permissionGroupOptions(data);
  const groups = canAssignAnyGroup
    ? availableGroups
    : availableGroups.filter((group) =>
        currentUser?.permissionGroupIds?.includes(group.id),
      );

  return (
    <AgentFormSection
      title={t('agent-settings-access-title')}
      description={t('agent-settings-access-description')}
    >
      <Form.Field
        control={form.control}
        name="permissionGroupIds"
        render={({ field }) => (
          <Form.Item>
            <Form.Control>
              <PermissionGroupSelector
                groups={groups}
                value={field.value}
                onChange={field.onChange}
                loading={loading}
              />
            </Form.Control>
            <Form.Message />
          </Form.Item>
        )}
      />

      {error && (
        <Alert variant="warning">
          <IconAlertTriangle className="size-4" />
          <Alert.Description>{t('error')}</Alert.Description>
        </Alert>
      )}

      <Separator />

      <Form.Field
        control={form.control}
        name="destructiveOps"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>{t('agent-settings-destructive-label')}</Form.Label>
            <Form.Description>
              {t('agent-settings-destructive-description')}
            </Form.Description>
            <Form.Control>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid gap-3 pt-1 md:grid-cols-2"
              >
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                    field.value === 'ask'
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/40'
                  }`}
                >
                  <RadioGroup.Item value="ask" />
                  <span className="min-w-0 space-y-1">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {t('agent-settings-ask-first')}
                      <Badge variant="secondary">
                        {t('agent-settings-recommended')}
                      </Badge>
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {t('agent-settings-ask-first-description')}
                    </span>
                  </span>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                    field.value === 'allow'
                      ? 'border-destructive bg-destructive/5'
                      : 'hover:bg-muted/40'
                  }`}
                >
                  <RadioGroup.Item value="allow" />
                  <span className="min-w-0 space-y-1">
                    <span className="block text-sm font-medium">
                      {t('agent-settings-run-immediately')}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {t('agent-settings-run-immediately-description')}
                    </span>
                  </span>
                </label>
              </RadioGroup>
            </Form.Control>
            <Form.Message />
          </Form.Item>
        )}
      />

      {destructiveOps === 'allow' && (
        <Alert variant="warning">
          <IconAlertTriangle className="size-4" />
          <Alert.Title>{t('agent-settings-no-approval-title')}</Alert.Title>
          <Alert.Description>
            {t('agent-settings-no-approval-description')}
          </Alert.Description>
        </Alert>
      )}
    </AgentFormSection>
  );
};

const BehaviorSection = ({ form }: { form: AgentForm }) => {
  const { t } = useTranslation('mastra');
  const temperature = form.watch('temperature');

  return (
    <AgentFormSection
      title={t('agent-settings-behavior-title')}
      description={t('agent-settings-behavior-description')}
    >
      <div className="grid gap-2 md:grid-cols-2">
        <Form.Field
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <Form.Item className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="space-y-1">
                <Form.Label>
                  {t('agent-settings-availability-label')}
                </Form.Label>
                <Form.Description>
                  {field.value
                    ? t('agent-settings-availability-on-description')
                    : t('agent-settings-availability-off-description')}
                </Form.Description>
              </div>
              <Form.Control>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </Form.Control>
            </Form.Item>
          )}
        />

        <Form.Field
          control={form.control}
          name="memoryEnabled"
          render={({ field }) => (
            <Form.Item className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="space-y-1">
                <Form.Label>{t('agent-settings-memory-label')}</Form.Label>
                <Form.Description>
                  {field.value
                    ? t('agent-settings-memory-on-description')
                    : t('agent-settings-memory-off-description')}
                </Form.Description>
              </div>
              <Form.Control>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </Form.Control>
            </Form.Item>
          )}
        />
      </div>

      <Collapsible className="overflow-hidden rounded-lg border">
        <Collapsible.TriggerButton
          type="button"
          className="h-auto rounded-none px-4 py-3"
        >
          <Collapsible.TriggerIcon className="mr-2 size-3.5 shrink-0" />
          <span className="min-w-0 text-left">
            <span className="block text-sm font-medium">
              {t('agent-settings-advanced-title')}
            </span>
            <span className="mt-0.5 block whitespace-normal text-xs font-normal text-muted-foreground">
              {t('agent-settings-advanced-description')}
            </span>
          </span>
        </Collapsible.TriggerButton>
        <Collapsible.Content className="space-y-5 border-t bg-muted/10 p-4">
          <Form.Field
            control={form.control}
            name="debug"
            render={({ field }) => (
              <Form.Item className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Form.Label>{t('agent-settings-debug-label')}</Form.Label>
                  <Form.Description>
                    {t('agent-settings-debug-description')}
                  </Form.Description>
                </div>
                <Form.Control>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Form.Control>
              </Form.Item>
            )}
          />

          <Separator />

          <Form.Field
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <Field
                label={t('agent-settings-temperature-label')}
                hint={t('agent-settings-temperature-description')}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Slider
                    min={0}
                    max={2}
                    step={0.1}
                    value={[field.value ?? 1]}
                    onValueChange={([value]: number[]) => field.onChange(value)}
                    className="max-w-xs flex-1"
                  />
                  <span className="w-16 text-sm tabular-nums text-muted-foreground">
                    {temperature != null
                      ? temperature.toFixed(1)
                      : t('agent-settings-default')}
                  </span>
                  {temperature != null && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 self-start text-xs sm:self-auto"
                      onClick={() => field.onChange(null)}
                    >
                      {t('agent-settings-use-default')}
                    </Button>
                  )}
                </div>
              </Field>
            )}
          />
        </Collapsible.Content>
      </Collapsible>
    </AgentFormSection>
  );
};

// Canonical AI team-member form body, shared by settings and chat.
export const AgentFormFields = ({ form }: { form: AgentForm }) => {
  const { t } = useTranslation('mastra');

  return (
    <>
      <Alert className="border-primary/20 bg-primary/5">
        <IconInfoCircle className="size-4 text-primary" />
        <Alert.Title>{t('agent-settings-intro-title')}</Alert.Title>
        <Alert.Description>
          {t('agent-settings-intro-description')}
        </Alert.Description>
      </Alert>
      <BasicInfoSection form={form} />
      <AgentSharingSection form={form} />
      <AiModelSection form={form} />
      <AdditionalToolsSection form={form} />
      <AgentAccessSection form={form} />
      <BehaviorSection form={form} />
    </>
  );
};
