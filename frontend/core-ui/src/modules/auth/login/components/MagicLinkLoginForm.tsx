import { useLoginMagicLink } from '@/auth/login/hooks/useLoginMagicLink';
import { IconBrandGoogleFilled } from '@tabler/icons-react';
import { Button, Form, Input } from 'erxes-ui';
import { useTranslation } from 'react-i18next';

export const MagicLinkLoginForm = () => {
  const { t } = useTranslation('common', { keyPrefix: 'auth' });
  const { form, onMagicLinkSubmit, onGoogleLogin } = useLoginMagicLink();

  return (
    <Form {...form}>
      <form onSubmit={onMagicLinkSubmit} className="grid gap-5">
        <p className="text-center text-sm text-muted-foreground">
          {t('magic-link-description')}
        </p>
        <Form.Field
          name="email"
          control={form.control}
          render={({ field }) => (
            <Form.Item>
              <Form.Label className="text-sm font-medium normal-case text-foreground">
                {t('email')}
              </Form.Label>
              <Form.Control>
                <Input
                  type="email"
                  placeholder={t('enter-your-email')}
                  className="h-8"
                  {...field}
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Button type="submit" size="lg" className="w-full rounded-full">
          {t('continue')}
        </Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {t('or')}
          <span className="h-px flex-1 bg-border" />
        </div>
        <Button
          variant="outline"
          size="lg"
          type="button"
          onClick={onGoogleLogin}
          className="w-full rounded-full"
        >
          <IconBrandGoogleFilled />
          {t('continue-with-google')}
        </Button>
      </form>
    </Form>
  );
};
