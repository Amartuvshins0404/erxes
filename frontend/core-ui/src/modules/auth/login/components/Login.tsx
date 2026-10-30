import { Tabs } from 'erxes-ui';
import { CredentialLoginForm } from '@/auth/login/components/CredentialLoginForm';
import { MagicLinkLoginForm } from '@/auth/login/components/MagicLinkLoginForm';
import { useState } from 'react';
import { useVersion } from 'ui-modules';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

const LOGIN_TABS = [
  { value: 'magic-link', label: 'magic-link' },
  { value: 'credential', label: 'email-and-password' },
] as const;

export const Login = () => {
  const { t } = useTranslation('common', { keyPrefix: 'auth' });
  const isOS = useVersion();
  const [value, setValue] = useState<string>(
    isOS ? 'credential' : 'magic-link',
  );

  return (
    <>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-xl font-semibold tracking-tight">{t('welcome')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('sign-in-to-continue')}
        </p>
      </div>

      <Tabs value={value} onValueChange={setValue} className="flex flex-col">
        <Tabs.List
          variant="segment"
          className="mb-5 grid w-full grid-cols-2 rounded-full"
        >
          {LOGIN_TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="relative rounded-full data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:hover:bg-transparent"
            >
              {value === tab.value && (
                <motion.span
                  layoutId="activeLoginTab"
                  className="absolute inset-0 rounded-full bg-card shadow-sm"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative">{t(tab.label)}</span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="magic-link">
          <MagicLinkLoginForm />
        </Tabs.Content>
        <Tabs.Content value="credential">
          <CredentialLoginForm />
        </Tabs.Content>
      </Tabs>
    </>
  );
};
