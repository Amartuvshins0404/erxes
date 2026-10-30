import { SubmitHandler } from 'react-hook-form';

import { Button, Form, Input } from 'erxes-ui';

import { useLogin } from '@/auth/login/hooks/useLogin';
import {
  ResetPasswordFormType,
  useResetPasswordForm,
} from '@/auth/login/hooks/useLoginForm';
import { useTranslation } from 'react-i18next';

export const ResetPassword = ({ token }: { token: string }) => {
  const { t } = useTranslation('common', { keyPrefix: 'auth' });
  const { form } = useResetPasswordForm();

  const { handleResetPassword } = useLogin();

  const submitHandler: SubmitHandler<ResetPasswordFormType> = (data) => {
    handleResetPassword(token, data.password);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitHandler)} className="grid gap-5">
        <Form.Field
          name="password"
          render={({ field }) => (
            <Form.Item>
              <Form.Label className="text-sm font-medium normal-case text-foreground">
                {t('password')}
              </Form.Label>
              <Form.Control>
                <Input
                  type="password"
                  placeholder={t('enter-password')}
                  className="h-8"
                  {...field}
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field
          name="confirmPassword"
          render={({ field }) => (
            <Form.Item>
              <Form.Label className="text-sm font-medium normal-case text-foreground">
                {t('confirm-password')}
              </Form.Label>
              <Form.Control>
                <Input
                  type="password"
                  placeholder={t('confirm-password')}
                  className="h-8"
                  {...field}
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Button type="submit" size="lg" className="w-full rounded-full">
          {t('change-password')}
        </Button>
      </form>
    </Form>
  );
};
