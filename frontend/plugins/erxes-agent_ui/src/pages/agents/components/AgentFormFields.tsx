import { Link } from 'react-router-dom';
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';
import {
  Alert,
  Badge,
  Button,
  Collapsible,
  Form,
  Input,
  RadioGroup,
  Separator,
  Slider,
  Switch,
  Textarea,
} from 'erxes-ui';
import { Trans, useTranslation } from 'react-i18next';
import { UseFormReturn } from 'react-hook-form';
import { ClampedNumberInput } from '~/components/ClampedNumberInput';
import { Field, FormSection } from '~/components/FormLayout';
import {
  SelectModel,
  SelectProvider,
  useProviderOptions,
} from '~/components/SelectProviderModel';
import { AgentToolPicker } from './AgentToolPicker';
import { AgentVisibilitySectionFields } from './AgentVisibilitySectionFields';
import { useAvailableErxesTools } from '../hooks/useAvailableErxesTools';
import { AgentFormValues } from '../validations';

type AgentForm = UseFormReturn<AgentFormValues>;

const BasicInfoSection = ({
  form,
  agentIdEditable,
  onNameChange,
  onAgentIdChange,
}: {
  form: AgentForm;
  agentIdEditable: boolean;
  onNameChange?: (value: string) => void;
  onAgentIdChange?: (value: string) => void;
}) => {
  const { t } = useTranslation('mastra');

  return (
    <FormSection
      step={1}
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
                  onChange={(event) =>
                    onNameChange
                      ? onNameChange(event.target.value)
                      : field.onChange(event.target.value)
                  }
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
        name="agentId"
        render={({ field }) => (
          <Form.Item className="rounded-lg border bg-muted/20 p-3">
            <Form.Label>{t('agent-settings-agent-id')}</Form.Label>
            <Form.Control>
              <Input
                {...field}
                disabled={!agentIdEditable}
                onChange={(event) => {
                  onAgentIdChange?.(event.target.value);
                  field.onChange(event.target.value);
                }}
                placeholder="customer-support"
                className="font-mono text-sm"
              />
            </Form.Control>
            <Form.Description>
              {agentIdEditable
                ? t('agent-settings-agent-id-create-description')
                : t('agent-settings-agent-id-edit-description')}
            </Form.Description>
            <Form.Message />
          </Form.Item>
        )}
      />

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
    </FormSection>
  );
};

const AiModelSection = ({ form }: { form: AgentForm }) => {
  const { t } = useTranslation('mastra');
  const provider = form.watch('provider');
  const { providers: enabledProviders } = useProviderOptions();

  return (
    <FormSection
      step={2}
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
    </FormSection>
  );
};

const ToolAccessSection = ({ form }: { form: AgentForm }) => {
  const { t } = useTranslation('mastra');
  const toolPolicy = form.watch('toolPolicy');
  const destructiveOps = form.watch('destructiveOps');
  const { operations, loading: availableLoading } = useAvailableErxesTools(
    toolPolicy === 'custom',
  );

  return (
    <FormSection
      step={3}
      title={t('agent-settings-access-title')}
      description={t('agent-settings-access-description')}
    >
      <Form.Field
        control={form.control}
        name="toolPolicy"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>{t('agent-settings-tool-policy-label')}</Form.Label>
            <Form.Description>
              {t('agent-settings-tool-policy-description')}
            </Form.Description>
            <Form.Control>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid gap-3 pt-1 md:grid-cols-2"
              >
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                    field.value === 'custom'
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/40'
                  }`}
                >
                  <RadioGroup.Item value="custom" />
                  <span className="min-w-0 space-y-1">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {t('agent-settings-selected-tools')}
                      <Badge variant="secondary">
                        {t('agent-settings-recommended')}
                      </Badge>
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {t('agent-settings-selected-tools-description')}
                    </span>
                  </span>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                    field.value === 'all'
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/40'
                  }`}
                >
                  <RadioGroup.Item value="all" />
                  <span className="min-w-0 space-y-1">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {t('agent-settings-all-tools')}
                      <Badge variant="outline">
                        {t('agent-settings-broad-access')}
                      </Badge>
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {t('agent-settings-all-tools-description')}
                    </span>
                  </span>
                </label>
              </RadioGroup>
            </Form.Control>
            <Form.Message />
          </Form.Item>
        )}
      />

      {toolPolicy === 'custom' ? (
        <Form.Field
          control={form.control}
          name="allowedTools"
          render={({ field }) => (
            <div className="rounded-lg border bg-muted/20 p-4">
              <AgentToolPicker
                value={field.value}
                onChange={field.onChange}
                operations={operations}
                loading={availableLoading}
              />
            </div>
          )}
        />
      ) : (
        <Alert variant="warning">
          <IconAlertTriangle className="size-4" />
          <Alert.Title>{t('agent-settings-full-access-title')}</Alert.Title>
          <Alert.Description>
            {t('agent-settings-full-access-description')}
          </Alert.Description>
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
    </FormSection>
  );
};

const BehaviorSection = ({
  form,
  step,
}: {
  form: AgentForm;
  step: number;
}) => {
  const { t } = useTranslation('mastra');
  const temperature = form.watch('temperature');

  return (
    <FormSection
      step={step}
      title={t('agent-settings-behavior-title')}
      description={t('agent-settings-behavior-description')}
    >
      <Form.Field
        control={form.control}
        name="isEnabled"
        render={({ field }) => (
          <Form.Item className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-1">
              <Form.Label>{t('agent-settings-availability-label')}</Form.Label>
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
          <Form.Item className="flex items-center justify-between gap-4 rounded-lg border p-4">
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
            name="maxSteps"
            render={({ field }) => (
              <Field
                label={t('agent-settings-max-steps-label')}
                hint={t('agent-settings-max-steps-description')}
              >
                <ClampedNumberInput
                  field={field}
                  min={1}
                  max={50}
                  fallback={10}
                  className="w-24"
                />
              </Field>
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
                    onValueChange={([value]: number[]) =>
                      field.onChange(value)
                    }
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
    </FormSection>
  );
};

// Canonical agent form body — every field group, shared by the Agents settings
// page (AgentFormPage) and the in-chat quick editor (EditAgentDialog). The two
// only differ in chrome (page header vs modal footer) and save behaviour
// (navigate-away vs stay-put), plus whether agentId is editable: on the create
// page it's a writable slug, in edit contexts it keys the bot endpoint and
// every persisted thread, so it stays read-only.
export const AgentFormFields = ({
  form,
  agentIdEditable = false,
  isAdmin = false,
  onNameChange,
  onAgentIdChange,
}: {
  form: AgentForm;
  /** Create flow only — agentId is the bot-endpoint key, frozen once it exists. */
  agentIdEditable?: boolean;
  /** When true the Visibility section is shown (admin-only feature). */
  isAdmin?: boolean;
  /** Lets the create page drive its auto-slug behaviour off the name field. */
  onNameChange?: (value: string) => void;
  /** Lets the create page stop auto-slugging once agentId is hand-edited. */
  onAgentIdChange?: (value: string) => void;
}) => {
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
      <BasicInfoSection
        form={form}
        agentIdEditable={agentIdEditable}
        onNameChange={onNameChange}
        onAgentIdChange={onAgentIdChange}
      />
      <AiModelSection form={form} />
      <ToolAccessSection form={form} />
      {isAdmin && <AgentVisibilitySectionFields form={form} step={4} />}
      <BehaviorSection form={form} step={isAdmin ? 5 : 4} />
    </>
  );
};
