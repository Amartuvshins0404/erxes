import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import { Button, Empty } from 'erxes-ui';
import { motion } from 'motion/react';
import { ReactNode } from 'react';
import { FallbackProps } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

type GenericErrorFallbackProps = FallbackProps & {
  title?: string;
  children?: ReactNode;
};

export const GenericErrorFallback = ({
  resetErrorBoundary,
  error,
  title = 'Sorry, something went wrong',
  children,
}: GenericErrorFallbackProps) => {
  const { t } = useTranslation('common', { keyPrefix: 'error-handler' });
  return (
    <div className="relative isolate flex min-h-dvh w-full flex-col items-center justify-center gap-8 overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[40rem] -translate-x-1/2 rounded-full bg-destructive/10 blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <Empty className="rounded-3xl bg-card shadow-lg">
          <Empty.Header>
            <Empty.Media
              variant="icon"
              className="size-12 rounded-full bg-destructive/10 text-destructive shadow-none"
            >
              <IconAlertTriangle />
            </Empty.Media>
            <Empty.Title className="text-xl font-semibold">{title}</Empty.Title>
            {error?.message && (
              <Empty.Description className="break-words">
                {error.message}
              </Empty.Description>
            )}
          </Empty.Header>
          <Empty.Content>
            <Button
              size="lg"
              className="rounded-full"
              onClick={resetErrorBoundary}
            >
              <IconRefresh />
              {t('try-again')}
            </Button>
          </Empty.Content>
        </Empty>
      </motion.div>
      {children && (
        <div className="flex w-full justify-center">{children}</div>
      )}
    </div>
  );
};
