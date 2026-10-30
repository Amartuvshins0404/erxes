import { SettingsBreadcrumbs } from '@/settings/components/SettingsBreadcrumbs';
import { MailConfigForm } from '@/settings/mail-config/components/MailConfigForm';
import { PageContainer, ScrollArea } from 'erxes-ui';
import { useTranslation } from 'react-i18next';

export function MailConfigPage() {
  const { t } = useTranslation('settings', {
    keyPrefix: 'mail-config',
  });
  return (
    <PageContainer>
      <SettingsBreadcrumbs />
      <ScrollArea.Root>
        <section className="mx-auto max-w-2xl w-full relative">
          <h2 className="px-4 pt-8 pb-6 text-xl font-semibold tracking-tight">
            {t('mail-service')}
          </h2>
          <div className="flex flex-col gap-8 px-4 w-full h-auto">
            <MailConfigForm />
          </div>
        </section>
        <ScrollArea.Bar />
      </ScrollArea.Root>
    </PageContainer>
  );
}
