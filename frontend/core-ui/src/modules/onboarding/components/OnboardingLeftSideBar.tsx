import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import { Logo } from '@/auth/components/Logo';
import type { OnboardingStepDef } from './onboardingSteps';
import { OnboardingStepItem } from './OnboardingStepItem';
import { getOnboardingStepForScreen } from './onboardingSteps';

const mobileStepVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 48 : -48,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -48 : 48,
  }),
};

const PanelGlow = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute -bottom-32 -left-32 -z-10 size-[32rem] rounded-full bg-primary/15 blur-3xl"
  />
);

export const OnboardingLeftSideBar = ({
  steps,
  currentStep,
  onSelectStep,
}: {
  steps: OnboardingStepDef[];
  currentStep: number;
  onSelectStep: (step: number) => void;
}) => {
  const [direction, setDirection] = useState(1);
  const prevStepRef = useRef(currentStep);

  useEffect(() => {
    if (currentStep === prevStepRef.current) {
      return;
    }

    setDirection(currentStep > prevStepRef.current ? 1 : -1);
    prevStepRef.current = currentStep;
  }, [currentStep]);

  const current = getOnboardingStepForScreen(steps, currentStep);
  const CurrentIcon = current.icon;

  return (
    <>
      <div className="hidden h-full p-3 lg:flex lg:w-1/2">
        <div className="relative isolate flex flex-1 flex-col gap-8 overflow-hidden rounded-3xl bg-sidebar p-8 shadow-card">
          <PanelGlow />
          <Logo className="h-8 text-foreground" />
          <div className="flex flex-1 flex-col justify-center gap-2 px-4">
            {steps.map((step) => (
              <OnboardingStepItem
                key={step.step}
                step={step}
                isSelected={currentStep === step.step}
                isChecked={currentStep > step.step}
                onSelect={onSelectStep}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="w-full p-3 lg:hidden">
        <div className="relative isolate flex min-h-[220px] items-center justify-center overflow-hidden rounded-3xl bg-sidebar px-5 py-6 shadow-card">
          <PanelGlow />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={mobileStepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-card text-primary shadow-card">
                <CurrentIcon className="size-6" />
              </div>
              <h4 className="mt-3 max-w-[280px] text-center text-xl font-semibold leading-tight tracking-tight text-foreground">
                {current.title}
              </h4>
              <span className="mt-1 block max-w-[320px] text-center text-sm text-muted-foreground">
                {current.subtitle}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};
