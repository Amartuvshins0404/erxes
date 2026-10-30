import { Button } from 'erxes-ui';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { Link } from 'react-router-dom';
import { AppPath } from '@/types/paths/AppPath';
import { useTranslation } from 'react-i18next';

export const ForgotPassword = () => {
  const { t } = useTranslation('common', { keyPrefix: 'auth' });
  return (
    <>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          {t('forgot-password')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('forgot-password-description')}
        </p>
      </div>
      <ForgotPasswordForm />
      <Button
        variant="ghost"
        asChild
        className="mx-auto rounded-full text-muted-foreground hover:text-foreground"
      >
        <Link to={AppPath.Login}>{t('login')}</Link>
      </Button>
    </>
  );
};
