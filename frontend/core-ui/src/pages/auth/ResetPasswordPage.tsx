import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { currentUserState } from 'ui-modules';

import { ResetPassword } from '@/auth/login/components/ResetPassword';
import { AuthenticationLayout } from '@/auth/components/AuthenticationLayout';
import { AppPath } from '@/types/paths/AppPath';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('common', { keyPrefix: 'auth' });

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') as string;

  const currentUser = useAtomValue(currentUserState);

  useEffect(() => {
    if (currentUser) {
      navigate(AppPath.Index);
    }
  }, [currentUser, navigate]);

  return (
    <div className="flex min-h-screen w-full">
      <AuthenticationLayout>
        <h1 className="text-center text-xl font-semibold tracking-tight">
          {t('reset-password')}
        </h1>
        <ResetPassword token={token} />
      </AuthenticationLayout>
    </div>
  );
};

export default ResetPasswordPage;
