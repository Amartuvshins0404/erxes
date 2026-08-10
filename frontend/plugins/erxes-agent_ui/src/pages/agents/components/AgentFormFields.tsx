import { useQuery } from '@apollo/client';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';
import { Alert, Form, Input, RadioGroup, Switch, Textarea } from 'erxes-ui';
import { Trans, useTranslation } from 'react-i18next';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { SelectMember } from 'ui-modules';
import {
  SelectModel,
  SelectProvider,
  useProviderOptions,
} from '~/components/SelectProviderModel';
import { MASTRA_AGENT_ADDITIONAL_TOOLS } from '~/graphql/queries';
import { AgentFormValues } from '../validations';
import { PermissionGroupSelector } from './PermissionGroupSelector';
import { useAgentPermissionGroups } from '../hooks/useAgentPermissionGroups';

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
                  if (value !== 'shared') {
                    form.setValue('audienceUserIds', []);
                  }
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
                <Form.Message />
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
  const { groups, loading, error } = useAgentPermissionGroups();

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
    </AgentFormSection>
  );
};

const BehaviorSection = ({ form }: { form: AgentForm }) => {
  const { t } = useTranslation('mastra');

  return (
    <AgentFormSection
      title={t('agent-settings-behavior-title')}
      description={t('agent-settings-behavior-description')}
    >
      <Form.Field
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <Form.Item className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="space-y-1">
              <Form.Label>{t('agent-settings-availability-label')}</Form.Label>
              <Form.Description>
                {field.value
                  ? t('agent-settings-availability-on-description')
                  : t('agent-settings-availability-off-description')}
              </Form.Description>
            </div>
            <Form.Control>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </Form.Control>
          </Form.Item>
        )}
      />
    </AgentFormSection>
  );
};

// Canonical AI team-member form body for the main agent admin.
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
