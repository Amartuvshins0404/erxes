import { useMotionValue, useTransform, animate, motion } from 'motion/react';
import { useEffect } from 'react';

interface CountUpProps {
  to: number;
  duration?: number;
  delay?: number;
  formatter?: (value: number) => string;
}

export function CountUp({
  to,
  duration = 1.2,
  delay = 0,
  formatter = (v) => Math.floor(v).toLocaleString(),
}: CountUpProps) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (v) => formatter(v));

  useEffect(() => {
    const controls = animate(motionValue, to, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
    });

    return controls.stop;
  }, [to]);

  return <motion.span>{display}</motion.span>;
}
