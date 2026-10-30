import { IconCircleDashed, IconCircleDashedCheck } from '@tabler/icons-react';
import { cn } from 'erxes-ui';
import { useTranslation } from 'react-i18next';

type TProps = {
  value: string;
  reTypeValue: string;
};

const STRENGTH_TONES = [
  'bg-border',
  'bg-destructive',
  'bg-destructive',
  'bg-warning',
  'bg-success',
  'bg-success',
];

export const PasswordStrength = ({ value, reTypeValue }: TProps) => {
  const { t } = useTranslation('settings', { keyPrefix: 'change-password' });

  const requirements = [
    { met: /.{8,}/.test(value), text: t('atleast-8') },
    { met: /[0-9]/.test(value), text: t('least-number') },
    { met: /[a-z]/.test(value), text: t('least-lowercase') },
    { met: /[A-Z]/.test(value), text: t('least-uppercase') },
    {
      met: value.length > 0 && value === reTypeValue,
      text: t('password-same'),
    },
  ];
  const score = requirements.filter((req) => req.met).length;

  return (
    <div className="flex size-full flex-col items-start gap-3 p-2">
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={requirements.length}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            STRENGTH_TONES[score],
          )}
          style={{ width: `${(score / requirements.length) * 100}%` }}
        />
      </div>
      <ul className="space-y-1.5">
        {requirements.map((req) => (
          <li key={req.text} className="flex items-center gap-2">
            {req.met ? (
              <IconCircleDashedCheck
                size={16}
                className="text-success"
                aria-hidden="true"
              />
            ) : (
              <IconCircleDashed
                size={16}
                className="text-muted-foreground"
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                'text-xs',
                req.met ? 'text-success' : 'text-muted-foreground',
              )}
            >
              {req.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
