import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconActivity,
  IconBrain,
  IconCheck,
  IconDatabase,
  IconKey,
  IconPaperclip,
  IconPhoto,
  IconSparkles,
  IconTerminal2,
} from '@tabler/icons-react';
import { Badge, Button, Card, Form, Input, Switch, toast } from 'erxes-ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SelectModel, SelectProvider } from '~/components/SelectProviderModel';
import { useGeneralSettings } from './hooks/useGeneralSettings';
import {
  GENERAL_SETTINGS_DEFAULTS,
  GeneralSettingsValues,
  generalSettingsSchema,
} from './validations';

const LEARNING_TUNING_FIELDS = [
  {
    name: 'learningAutoPromoteMinSources',
    label: 'general-settings-learning-min-sources-label',
    description: 'general-settings-learning-min-sources-description',
    min: 1,
    max: 20,
    step: 1,
  },
  {
    name: 'learningAutoPromoteMinConfidence',
    label: 'general-settings-learning-min-confidence-label',
    description: 'general-settings-learning-min-confidence-description',
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    name: 'learningIdleMinutes',
    label: 'general-settings-learning-idle-label',
    description: 'general-settings-learning-idle-description',
    min: 1,
    max: 10080,
    step: 1,
  },
  {
    name: 'learningDecayDays',
    label: 'general-settings-learning-decay-days-label',
    description: 'general-settings-learning-decay-days-description',
    min: 1,
    max: 3650,
    step: 1,
  },
  {
    name: 'learningDecayFactor',
    label: 'general-settings-learning-decay-factor-label',
    description: 'general-settings-learning-decay-factor-description',
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    name: 'learningArchiveBelowConfidence',
    label: 'general-settings-learning-archive-label',
    description: 'general-settings-learning-archive-description',
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    name: 'learningDigestMaxEntries',
    label: 'general-settings-learning-digest-entries-label',
    description: 'general-settings-learning-digest-entries-description',
    min: 1,
    max: 100,
    step: 1,
  },
  {
    name: 'learningDigestMaxChars',
    label: 'general-settings-learning-digest-chars-label',
    description: 'general-settings-learning-digest-chars-description',
    min: 500,
    max: 10000,
    step: 100,
  },
] as const;

export const GeneralSettingsPage = () => {
  const { t } = useTranslation('erxes-agent');
  const { settings, save, saving } = useGeneralSettings();

  const form = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: GENERAL_SETTINGS_DEFAULTS,
  });

  const [saved, setSaved] = useState(false);
  const learningEnabled = form.watch('learningEnabled');
  const summarizerProvider = form.watch('summarizerProvider');
  const clearEvaluationDsn = form.watch('clearEvaluationDsn');

  useEffect(() => {
    if (!settings) return;

    form.reset({
      erxesApiUrl: settings.erxesApiUrl || 'http://localhost:4000',
      memoryEnabled: settings.memoryEnabled !== false,
      attachmentsEnabled: settings.attachmentsEnabled !== false,
      learningEnabled: settings.learningEnabled === true,
      learningAutoPromoteMinSources:
        settings.learningAutoPromoteMinSources ?? 3,
      learningAutoPromoteMinConfidence:
        settings.learningAutoPromoteMinConfidence ?? 0.75,
      learningDigestMaxChars: settings.learningDigestMaxChars ?? 2400,
      learningDigestMaxEntries: settings.learningDigestMaxEntries ?? 12,
      learningIdleMinutes: settings.learningIdleMinutes ?? 30,
      learningDecayDays: settings.learningDecayDays ?? 30,
      learningDecayFactor: settings.learningDecayFactor ?? 0.9,
      learningArchiveBelowConfidence:
        settings.learningArchiveBelowConfidence ?? 0.2,
      evaluationEnabled: settings.evaluationEnabled === true,
      evaluationDsn: '',
      clearEvaluationDsn: false,
      backgroundRemovalEnabled:
        settings.backgroundRemovalEnabled !== false,
      summarizerProvider: settings.summarizerProvider || '',
      summarizerModel: settings.summarizerModel || '',
      openSandboxApiUrl: settings.openSandboxApiUrl || '',
      openSandboxApiKey: '',
    });
  }, [settings, form]);

  const attachmentStorage = settings?.attachmentStorage;
  const storageConfigured = attachmentStorage?.configured === true;
  const storageService =
    attachmentStorage?.serviceType ||
    t('general-settings-storage-service-unknown');
  const evaluationDsnConfigured =
    settings?.evaluationDsnConfigured === true && !clearEvaluationDsn;
  const sandboxConfigured =
    Boolean(settings?.openSandboxApiUrl) &&
    settings?.hasOpenSandboxApiKey === true;
  const sandboxKeyHint = settings?.openSandboxApiKeyHint || '';

  const onSubmit = async (doc: GeneralSettingsValues) => {
    const { evaluationDsn, clearEvaluationDsn, ...runtimeSettings } = doc;
    const replacementDsn = evaluationDsn.trim();

    try {
      await save({
        variables: {
          doc: {
            ...runtimeSettings,
            ...(clearEvaluationDsn
              ? { evaluationDsn: '' }
              : replacementDsn
                ? { evaluationDsn: replacementDsn }
                : {}),
          },
        },
      });
      form.setValue('evaluationDsn', '');
      form.setValue('clearEvaluationDsn', false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ title: t('general-settings-save-success') });
    } catch {
      // Error surfaced to the user via the mutation's onError toast.
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full max-w-3xl p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t('general-settings-title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('general-settings-description')}
          </p>
        </div>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Card className="border shadow-none">
              <Card.Content className="space-y-5 p-4 sm:p-5">
                <div>
                  <h2 className="font-semibold">
                    {t('general-settings-chat-title')}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('general-settings-chat-description')}
                  </p>
                </div>

                <Form.Field
                  control={form.control}
                  name="erxesApiUrl"
                  render={({ field }) => (
                    <Form.Item className="border-t pt-5">
                      <Form.Label>
                        {t('general-settings-api-url-label')}
                      </Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          inputMode="url"
                          placeholder={t(
                            'general-settings-api-url-placeholder',
                          )}
                        />
                      </Form.Control>
                      <Form.Description>
                        {t('general-settings-api-url-description')}
                      </Form.Description>
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                <div className="space-y-4 border-t pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <IconTerminal2
                        aria-hidden
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      />
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold">
                          {t('general-settings-sandbox-title')}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t('general-settings-sandbox-description')}
                        </p>
                      </div>
                    </div>
                    <Badge
                      aria-live="polite"
                      variant={sandboxConfigured ? 'success' : 'secondary'}
                    >
                      {sandboxConfigured
                        ? t('general-settings-sandbox-configured')
                        : t('general-settings-sandbox-not-configured')}
                    </Badge>
                  </div>

                  <Form.Field
                    control={form.control}
                    name="openSandboxApiUrl"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>
                          {t('general-settings-sandbox-url-label')}
                        </Form.Label>
                        <Form.Control>
                          <Input
                            {...field}
                            inputMode="url"
                            placeholder={t(
                              'general-settings-sandbox-url-placeholder',
                            )}
                          />
                        </Form.Control>
                        <Form.Description>
                          {t('general-settings-sandbox-url-description')}
                        </Form.Description>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />

                  <Form.Field
                    control={form.control}
                    name="openSandboxApiKey"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>
                          {t('general-settings-sandbox-key-label')}
                        </Form.Label>
                        <Form.Control>
                          <div className="relative">
                            <IconKey
                              aria-hidden
                              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                            />
                            <Input
                              {...field}
                              type="password"
                              autoComplete="new-password"
                              className="pl-9"
                              placeholder={
                                sandboxKeyHint ||
                                t('general-settings-sandbox-key-placeholder')
                              }
                            />
                          </div>
                        </Form.Control>
                        <Form.Description>
                          {settings?.hasOpenSandboxApiKey
                            ? t(
                                'general-settings-sandbox-key-preserve-description',
                              )
                            : t('general-settings-sandbox-key-description')}
                        </Form.Description>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                </div>

                <Form.Field
                  control={form.control}
                  name="memoryEnabled"
                  render={({ field }) => (
                    <Form.Item className="border-t pt-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <IconBrain
                            aria-hidden
                            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                          />
                          <div className="min-w-0">
                            <Form.Label className="text-base font-semibold">
                              {t('general-settings-memory-label')}
                            </Form.Label>
                            <Form.Description className="mt-1">
                              {t('general-settings-memory-description')}
                            </Form.Description>
                          </div>
                        </div>
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            aria-label={t('general-settings-memory-label')}
                          />
                        </Form.Control>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  control={form.control}
                  name="attachmentsEnabled"
                  render={({ field }) => (
                    <Form.Item className="border-t pt-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <IconPaperclip
                            aria-hidden
                            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                          />
                          <div className="min-w-0">
                            <h3 className="text-base font-semibold">
                              {t('general-settings-attachments-label')}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {t('general-settings-attachments-description')}
                            </p>
                          </div>
                        </div>
                        <Badge
                          aria-live="polite"
                          variant={
                            storageConfigured ? 'success' : 'destructive'
                          }
                        >
                          {storageConfigured
                            ? t('general-settings-storage-configured')
                            : t('general-settings-storage-not-configured')}
                        </Badge>
                      </div>

                      <div className="mt-4 flex items-center gap-3 rounded-md bg-muted/50 px-3 py-3">
                        <IconDatabase
                          aria-hidden
                          className="size-4 shrink-0 text-muted-foreground"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t('general-settings-storage-label')}
                          </p>
                          <p className="truncate font-mono text-sm">
                            {storageService}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <Form.Label>
                            {t('general-settings-enable-attachments-label')}
                          </Form.Label>
                          <Form.Description>
                            {storageConfigured
                              ? t('general-settings-storage-description')
                              : t(
                                  'general-settings-storage-missing-description',
                                )}
                          </Form.Description>
                        </div>
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            disabled={!storageConfigured}
                            onCheckedChange={field.onChange}
                            aria-label={t(
                              'general-settings-enable-attachments-label',
                            )}
                          />
                        </Form.Control>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  control={form.control}
                  name="backgroundRemovalEnabled"
                  render={({ field }) => (
                    <Form.Item className="border-t pt-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <IconPhoto
                            aria-hidden
                            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                          />
                          <div className="min-w-0">
                            <Form.Label className="text-base font-semibold">
                              {t('general-settings-background-removal-label')}
                            </Form.Label>
                            <Form.Description className="mt-1">
                              {t(
                                'general-settings-background-removal-description',
                              )}
                            </Form.Description>
                          </div>
                        </div>
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            aria-label={t(
                              'general-settings-background-removal-label',
                            )}
                          />
                        </Form.Control>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
              </Card.Content>
            </Card>

            <Card className="border shadow-none">
              <Card.Content className="space-y-5 p-4 sm:p-5">
                <Form.Field
                  control={form.control}
                  name="learningEnabled"
                  render={({ field }) => (
                    <Form.Item>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <IconBrain
                            aria-hidden
                            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                          />
                          <div className="min-w-0">
                            <Form.Label className="text-base font-semibold">
                              {t('general-settings-learning-label')}
                            </Form.Label>
                            <Form.Description className="mt-1">
                              {t('general-settings-learning-description')}
                            </Form.Description>
                          </div>
                        </div>
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            aria-label={t('general-settings-learning-label')}
                          />
                        </Form.Control>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                  {LEARNING_TUNING_FIELDS.map((item) => (
                    <Form.Field
                      key={item.name}
                      control={form.control}
                      name={item.name}
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>{t(item.label)}</Form.Label>
                          <Form.Control>
                            <Input
                              {...field}
                              type="number"
                              min={item.min}
                              max={item.max}
                              step={item.step}
                              disabled={!learningEnabled}
                              onChange={(event) =>
                                field.onChange(
                                  event.currentTarget.valueAsNumber,
                                )
                              }
                            />
                          </Form.Control>
                          <Form.Description>
                            {t(item.description)}
                          </Form.Description>
                          <Form.Message />
                        </Form.Item>
                      )}
                    />
                  ))}
                </div>
              </Card.Content>
            </Card>

            <Card className="border shadow-none">
              <Card.Content className="space-y-5 p-4 sm:p-5">
                <Form.Field
                  control={form.control}
                  name="evaluationEnabled"
                  render={({ field }) => (
                    <Form.Item>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <IconActivity
                            aria-hidden
                            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                          />
                          <div className="min-w-0">
                            <Form.Label className="text-base font-semibold">
                              {t('general-settings-evaluation-label')}
                            </Form.Label>
                            <Form.Description className="mt-1">
                              {t('general-settings-evaluation-description')}
                            </Form.Description>
                          </div>
                        </div>
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            aria-label={t('general-settings-evaluation-label')}
                          />
                        </Form.Control>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  control={form.control}
                  name="evaluationDsn"
                  render={({ field }) => (
                    <Form.Item className="border-t pt-5">
                      <div className="flex items-center justify-between gap-3">
                        <Form.Label>
                          {t('general-settings-evaluation-dsn-label')}
                        </Form.Label>
                        <Badge
                          variant={
                            evaluationDsnConfigured ? 'success' : 'secondary'
                          }
                        >
                          {evaluationDsnConfigured
                            ? t('general-settings-secret-configured')
                            : t('general-settings-secret-not-configured')}
                        </Badge>
                      </div>
                      <Form.Control>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="new-password"
                          disabled={clearEvaluationDsn}
                          placeholder={
                            evaluationDsnConfigured
                              ? t(
                                  'general-settings-evaluation-dsn-replace-placeholder',
                                )
                              : t(
                                  'general-settings-evaluation-dsn-placeholder',
                                )
                          }
                        />
                      </Form.Control>
                      <Form.Description>
                        {t('general-settings-evaluation-dsn-description')}
                      </Form.Description>
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                {settings?.evaluationDsnConfigured && (
                  <Form.Field
                    control={form.control}
                    name="clearEvaluationDsn"
                    render={({ field }) => (
                      <Form.Item>
                        <div className="flex items-start justify-between gap-4 rounded-md bg-muted/50 p-3">
                          <div className="min-w-0">
                            <Form.Label>
                              {t('general-settings-evaluation-dsn-clear-label')}
                            </Form.Label>
                            <Form.Description>
                              {t(
                                'general-settings-evaluation-dsn-clear-description',
                              )}
                            </Form.Description>
                          </div>
                          <Form.Control>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              aria-label={t(
                                'general-settings-evaluation-dsn-clear-label',
                              )}
                            />
                          </Form.Control>
                        </div>
                      </Form.Item>
                    )}
                  />
                )}

                <div className="border-t pt-5">
                  <div className="mb-4 flex items-start gap-3">
                    <IconSparkles
                      aria-hidden
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    />
                    <div>
                      <h3 className="font-semibold">
                        {t('general-settings-summarizer-label')}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t('general-settings-summarizer-description')}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Form.Field
                      control={form.control}
                      name="summarizerProvider"
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>
                            {t('general-settings-summarizer-provider-label')}
                          </Form.Label>
                          <Form.Control>
                            <SelectProvider
                              value={field.value}
                              onValueChange={(provider) => {
                                field.onChange(provider);
                                form.setValue('summarizerModel', '');
                              }}
                            />
                          </Form.Control>
                          <Form.Message />
                        </Form.Item>
                      )}
                    />

                    <Form.Field
                      control={form.control}
                      name="summarizerModel"
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label>
                            {t('general-settings-summarizer-model-label')}
                          </Form.Label>
                          <Form.Control>
                            <SelectModel
                              provider={summarizerProvider}
                              value={field.value}
                              onValueChange={field.onChange}
                            />
                          </Form.Control>
                          <Form.Message />
                        </Form.Item>
                      )}
                    />
                  </div>
                </div>
              </Card.Content>
            </Card>

            <div className="sticky bottom-0 flex justify-end border-t bg-background/95 py-3 backdrop-blur-sm">
              <Button type="submit" disabled={saving}>
                {saved ? (
                  <>
                    <IconCheck aria-hidden className="size-4" />
                    {t('general-settings-saved')}
                  </>
                ) : saving ? (
                  t('general-settings-saving')
                ) : (
                  t('general-settings-save')
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};
