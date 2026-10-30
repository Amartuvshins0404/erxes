import { OrgLogoIcon } from '@/auth/components/Logo';
import { Polygons } from '@/auth/components/Polygons';
import { cn, Spinner, TextEffect } from 'erxes-ui';
import { AnimatePresence, motion, Variants } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const LoadingScreen = () => {
  return (
    <div className="h-dvh w-dvw p-2 bg-sidebar">
      <div className="relative flex size-full flex-col items-center justify-center overflow-hidden rounded-3xl bg-background shadow-card">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 size-full overflow-hidden bg-[radial-gradient(50%_100%_at_50%_0%,color-mix(in_oklch,var(--primary)_8%,var(--background))_0%,var(--background)_100%)]"
        >
          <Polygons
            variant="welcome"
            className="absolute top-0 left-1/2 -translate-x-1/2"
          />
        </motion.div>
        <div className="flex flex-col gap-3 items-center justify-center relative z-10">
          <div className="flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-card shadow-card">
            <IconAnimation />
          </div>
          <TextAnimation />
        </div>
      </div>
    </div>
  );
};
export const TextAnimation = () => {
  const { t } = useTranslation('common', { keyPrefix: 'auth' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMoreText, setShowMoreText] = useState(false);

  useEffect(() => {
    const welcomeTextTimer = setTimeout(() => {
      setCurrentIndex(1);
    }, 2000);
    const loadingMessageTimer = setTimeout(() => {
      setShowMoreText(true);
    }, 4000);
    return () => {
      clearTimeout(welcomeTextTimer);
      clearTimeout(loadingMessageTimer);
    };
  }, []);

  const motionVariants: Variants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -10, opacity: 0 },
  };

  return (
    <div className="relative inline-block whitespace-nowrap text-center">
      <AnimatePresence mode="wait">
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3, delay: 0.2 }}
          variants={motionVariants}
          key={currentIndex}
        >
          {currentIndex === 0 && (
            <p className="text-primary text-sm">{t('welcome')}</p>
          )}

          {currentIndex === 1 && (
            <div className="relative w-0 mx-auto">
              <div
                className={cn(
                  'text-sm text-muted-foreground inline-flex gap-1 items-center text-nowrap transition-transform duration-1000 left-0 -translate-x-12',
                  showMoreText && '-translate-x-1/2',
                )}
              >
                {t('just-a-moment')}
                {showMoreText && (
                  <TextEffect per="char">{t('good-things-come')}</TextEffect>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
export const IconAnimation = () => {
  const iconVariants: Variants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  };

  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    const spinnerTimer = setTimeout(() => {
      setShowSpinner(true);
    }, 2000);
    return () => clearTimeout(spinnerTimer);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={showSpinner ? 'spinner' : 'logo'}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
        variants={iconVariants}
      >
        {showSpinner ? (
          <Spinner />
        ) : (
          <OrgLogoIcon className="size-7 text-primary" />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
