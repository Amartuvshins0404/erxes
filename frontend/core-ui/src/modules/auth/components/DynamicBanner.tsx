import { Polygons } from '@/auth/components/Polygons';
import { useAtomValue } from 'jotai';
import { currentOrganizationState } from 'ui-modules';
import { Logo } from '@/auth/components/Logo';
import { useTranslation } from 'react-i18next';

export const DynamicBanner = () => {
  const { t } = useTranslation('common', { keyPrefix: 'auth' });
  const organization = useAtomValue(currentOrganizationState);

  return (
    <div className="relative hidden h-dvh p-3 lg:block lg:w-1/2">
      <div className="relative isolate flex h-full flex-col overflow-hidden rounded-3xl bg-sidebar shadow-card">
        <Polygons className="top-0 -z-10 opacity-60" />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 -z-10 size-[32rem] rounded-full bg-primary/15 blur-3xl"
        />
        <div className="p-8">
          <Logo className="h-8 text-foreground" />
        </div>
        <div className="mt-auto flex max-w-lg flex-col gap-3 p-10">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {organization?.orgLoginText || t('banner-title')}
          </h1>
          <p className="text-base text-muted-foreground">
            {organization?.orgLoginDescription || t('banner-description')}
          </p>
        </div>
      </div>
    </div>
  );
};
