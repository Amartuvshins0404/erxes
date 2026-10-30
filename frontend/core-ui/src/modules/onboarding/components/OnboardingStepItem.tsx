import { IconCheck } from '@tabler/icons-react';
import type { OnboardingStepDef } from './onboardingSteps';
import { Button, cn } from 'erxes-ui';
import { motion } from 'framer-motion';

export const OnboardingStepItem = ({
  step,
  isSelected,
  isChecked,
  onSelect,
}: {
  step: OnboardingStepDef;
  isSelected: boolean;
  isChecked: boolean;
  onSelect: (step: number) => void;
}) => {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
    >
      <Button
        variant="ghost"
        disabled={!isChecked}
        onClick={() => onSelect(step.step)}
        aria-current={isSelected ? 'step' : undefined}
        className={cn(
          'h-auto w-full justify-start gap-4 whitespace-normal rounded-2xl p-3 text-left font-normal',
          isSelected && 'bg-accent disabled:opacity-100',
          !isSelected && !isChecked && 'disabled:opacity-60',
        )}
      >
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl shadow-card transition-colors',
            isChecked
              ? 'bg-success text-success-foreground'
              : 'bg-card text-muted-foreground',
            isSelected && 'text-primary',
          )}
        >
          {isChecked ? (
            <IconCheck className="size-5" />
          ) : (
            Icon && <Icon className="size-5" />
          )}
        </span>
        <span className="flex flex-col gap-0.5">
          <span
            className={cn(
              'text-sm font-semibold transition-colors',
              isSelected ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {step.title}
          </span>
          <span className="text-xs text-muted-foreground">
            {step.subtitle}
          </span>
        </span>
      </Button>
    </motion.div>
  );
};
