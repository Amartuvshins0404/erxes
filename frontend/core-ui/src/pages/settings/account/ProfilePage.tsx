import { PageContainer, ScrollArea } from 'erxes-ui';

import { SettingsBreadcrumbs } from '@/settings/components/SettingsBreadcrumbs';
import { ProfileForm } from '@/settings/profile/components/ProfileForm';
import { useTranslation } from 'react-i18next';

export const SettingsProfilePage = () => {
  const { t } = useTranslation('settings', {
    keyPrefix: 'profile',
  });
  return (
    <PageContainer>
      <SettingsBreadcrumbs />
      <ScrollArea>
        <section className="mx-auto max-w-2xl w-full relative">
          <h2 className="px-4 pt-8 pb-6 text-xl font-semibold tracking-tight">{t('_')}</h2>
          <div className="flex flex-col gap-10 px-4 w-full h-auto mb-5">
            <ProfileForm />
          </div>
        </section>
        <ScrollArea.Bar />
      </ScrollArea>
    </PageContainer>
  );
};
