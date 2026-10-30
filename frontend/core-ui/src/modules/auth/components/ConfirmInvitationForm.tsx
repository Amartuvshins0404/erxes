import { OrgLogoIcon } from '@/auth/components/Logo';
import { useUserConfirmInvitation } from '@/auth/hooks/useUserConfirmInvitation';
import { AppPath } from '@/types/paths/AppPath';
import { IconAlertCircle } from '@tabler/icons-react';
import { Button, useQueryState, useToast } from 'erxes-ui';
import { motion } from 'framer-motion';
import { useAtomValue, useSetAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { currentOrganizationState, isCurrentUserLoadedState } from 'ui-modules';
import { useTranslation } from 'react-i18next';

export const ConfirmInvitationForm = () => {
  const { t } = useTranslation('common', { keyPrefix: 'auth' });
  const navigate = useNavigate();
  const [token] = useQueryState<string>('token');
  const currentOrganization = useAtomValue(currentOrganizationState);
  const setCurrentUserLoaded = useSetAtom(isCurrentUserLoadedState);
  const { confirmInvitation, loading } = useUserConfirmInvitation();
  const { toast } = useToast();

  const handleConfirmInvitation = () => {
    if (!token) return;

    confirmInvitation({
      variables: {
        token: token,
      },
      onError: (error) => {
        toast({
          title: t('error'),
          description: error.message,
          variant: 'destructive',
        });
      },
      onCompleted: () => {
        setCurrentUserLoaded(false);
        navigate(AppPath.Index);
      },
    });
  };

  if (!token) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mx-auto w-full max-w-md rounded-3xl bg-card px-8 pt-10 pb-10 text-card-foreground shadow-lg"
        >
          <div className="flex flex-col items-center gap-6 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
              className="relative"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 bg-destructive/10 rounded-full blur-xl"
              />
              <div className="relative flex size-20 items-center justify-center rounded-full bg-destructive/10">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ delay: 0.5, duration: 0.5, ease: 'easeInOut' }}
                >
                  <IconAlertCircle className="size-10 text-destructive" />
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="space-y-3"
            >
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {t('invalid-invitation-link')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('invalid-invitation-description')}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mx-auto w-full max-w-md rounded-3xl bg-card px-8 pt-10 pb-10 text-card-foreground shadow-lg"
      >
        <div className="flex flex-col items-center gap-6 mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
            className="relative"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 bg-primary/10 rounded-full blur-xl"
            />
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <OrgLogoIcon className="relative size-20 text-primary" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-center space-y-2"
          >
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {t('youve-been-invited')}
            </h1>
            <p className="text-sm text-muted-foreground">
              Join{' '}
              <span className="font-semibold text-foreground">
                {currentOrganization?.orgShortName || 'erxes'}
              </span>{' '}
              and start collaborating
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Button
            onClick={handleConfirmInvitation}
            className="w-full rounded-full"
            size="lg"
            disabled={loading}
          >
            {t('accept-invitation')}
          </Button>
        </motion.div>
      </motion.div>
    </>
  );
};
