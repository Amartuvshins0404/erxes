import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconBrain,
  IconCheck,
  IconDatabase,
  IconPaperclip,
} from '@tabler/icons-react';
import { Badge, Button, Card, Form, Input, Switch, toast } from 'erxes-ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGeneralSettings } from './hooks/useGeneralSettings';
import {
  GENERAL_SETTINGS_DEFAULTS,
  GeneralSettingsValues,
  generalSettingsSchema,
} from './validations';

export const GeneralSettingsPage = () => {
  const { t } = useTranslation('erxes-agent');
  const { settings, save, saving } = useGeneralSettings();

  const form = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: GENERAL_SETTINGS_DEFAULTS,
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      form.reset({
        erxesApiUrl: settings.erxesApiUrl || 'http://localhost:4000',
        memoryEnabled: settings.memoryEnabled !== false,
        attachmentsEnabled: settings.attachmentsEnabled !== false,
      });
    }
  }, [settings, form]);

  const attachmentStorage = settings?.attachmentStorage;
  const storageConfigured = attachmentStorage?.configured === true;
  const storageService =
    attachmentStorage?.serviceType ||
    t('general-settings-storage-service-unknown');

  const onSubmit = async (doc: GeneralSettingsValues) => {
    try {
      await save({ variables: { doc } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ title: t('general-settings-save-success') });
    } catch {
      // Error surfaced to the user via the mutation's onError toast.
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full max-w-xl p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t('general-settings-title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('general-settings-description')}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="border shadow-none">
              <Card.Content className="space-y-5 p-4 sm:p-5">
                <Form.Field
                  control={form.control}
                  name="erxesApiUrl"
                  render={({ field }) => (
                    <Form.Item>
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

                <div className="border-t pt-5">
                  <Form.Field
                    control={form.control}
                    name="memoryEnabled"
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
                </div>

                <div className="border-t pt-5">
                  <Form.Field
                    control={form.control}
                    name="attachmentsEnabled"
                    render={({ field }) => (
                      <Form.Item>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <IconPaperclip
                              aria-hidden
                              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                            />
                            <div className="min-w-0">
                              <h2 className="text-base font-semibold">
                                {t('general-settings-attachments-label')}
                              </h2>
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
                </div>
              </Card.Content>

              <Card.Footer className="justify-end border-t p-3 sm:px-5">
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
              </Card.Footer>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
};
