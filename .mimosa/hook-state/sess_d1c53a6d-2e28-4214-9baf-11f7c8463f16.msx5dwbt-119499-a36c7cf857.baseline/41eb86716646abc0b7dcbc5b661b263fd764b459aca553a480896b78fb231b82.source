import { cn, Tooltip } from 'erxes-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { humanizeOrderError } from '../utils/humanizeOrderError';

export const OrderErrorText = ({
  error,
  className,
}: {
  error?: string | null;
  className?: string;
}) => {
  const { t } = useTranslation('mushop');
  const [showRaw, setShowRaw] = useState(false);

  if (!error) return null;

  const { reason } = humanizeOrderError(error);

  return (
    <Tooltip.Provider>
      <Tooltip>
        <Tooltip.Trigger asChild>
          <span
            className={cn(
              'text-destructive cursor-pointer decoration-dotted underline-offset-2',
              className,
            )}
            onClick={(e) => {
              e.stopPropagation();
              setShowRaw((prev) => !prev);
            }}
          >
            {showRaw ? error : reason}
          </span>
        </Tooltip.Trigger>
        <Tooltip.Content>
          {showRaw
            ? t('Click to show a friendly explanation')
            : t('Click to show the actual error')}
        </Tooltip.Content>
      </Tooltip>
    </Tooltip.Provider>
  );
};
