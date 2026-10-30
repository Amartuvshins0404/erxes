import { ChooseTheme } from '@/settings/components/ChooseTheme';
import { SettingsBreadcrumbs } from '@/settings/components/SettingsBreadcrumbs';
import { useTranslation } from 'react-i18next';

export const SettingsExperiencePage = () => {
  const { t } = useTranslation('common', { keyPrefix: 'sidebar' });
  return (
    <section className="mx-auto max-w-2xl w-full">
      <div className="px-4 h-10 flex items-center">
        <SettingsBreadcrumbs />
      </div>
      <h2 className="px-4 pt-8 pb-6 text-xl font-semibold tracking-tight">
        {t('experience')}
      </h2>
      <div className="flex flex-col gap-4 px-4">
        <ChooseTheme />
      </div>
    </section>
  );
};
