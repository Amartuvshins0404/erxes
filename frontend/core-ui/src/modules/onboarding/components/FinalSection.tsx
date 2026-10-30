import { IconCircleCheck } from '@tabler/icons-react';
import { Button, useScopedHotkeys } from 'erxes-ui';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export const FinalSection = ({ onContinue }: { onContinue: () => void }) => {
  const { t } = useTranslation('common', { keyPrefix: 'onboarding' });
  useScopedHotkeys(`enter`, () => onContinue(), 'welcome');
  useScopedHotkeys(`space`, () => onContinue(), 'welcome');
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="flex flex-col gap-10 sm:-translate-y-10 md:-translate-y-10 px-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.8,
          delay: 0.2,
          ease: [0.34, 1.56, 0.64, 1],
          type: 'spring',
          stiffness: 100,
          damping: 15,
        }}
        className="flex items-center justify-center"
      >
        <div className="flex size-20 items-center justify-center rounded-3xl bg-success/10">
          <IconCircleCheck className="size-10 text-success" stroke={1.75} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-col gap-2 items-center"
      >
        <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground">
          {t('all-set')}
        </h2>
        <p className="max-w-md px-4 text-center text-sm text-muted-foreground">
          {t('all-set-description')}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full px-6 sm:px-12 lg:px-20"
        tabIndex={-1}
      >
        <Button
          className="w-full rounded-full"
          size="lg"
          onClick={onContinue}
        >
          {t('start-exploring')}
        </Button>
      </motion.div>
    </motion.div>
  );
};
