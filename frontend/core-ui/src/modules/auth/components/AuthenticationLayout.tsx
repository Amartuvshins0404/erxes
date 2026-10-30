import { Logo } from '@/auth/components/Logo';
import { useTranslation } from 'react-i18next';

interface AuthenticationLayoutProps {
  children: React.ReactNode;
}

export const AuthenticationLayout = ({
  children,
}: AuthenticationLayoutProps) => {
  const { t } = useTranslation('common', { keyPrefix: 'auth' });
  return (
    <div className="relative isolate flex h-dvh flex-1 flex-col overflow-y-auto bg-background px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-32 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 size-[28rem] rounded-full bg-info/10 blur-3xl" />
      </div>
      <div className="m-auto flex w-full max-w-sm flex-col gap-8">
        <Logo className="mx-auto h-9 text-primary" />
        <div className="flex flex-col gap-6 rounded-3xl bg-card p-8 text-card-foreground shadow-lg">
          {children}
        </div>
        <div className="flex flex-col items-center gap-1 text-center text-xs text-muted-foreground">
          <span>{t('accept-terms-prefix')}</span>
          <span className="inline-flex gap-1">
            <a
              className="font-medium text-foreground transition-colors hover:text-primary"
              href="https://erxes.io/legal/terms"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('terms-of-use')}
            </a>
            {t('and')}
            <a
              className="font-medium text-foreground transition-colors hover:text-primary"
              href="https://erxes.io/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('privacy-policy')}
            </a>
          </span>
        </div>
      </div>
    </div>
  );
};
