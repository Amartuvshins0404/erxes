import { IconStar } from '@tabler/icons-react';
import { Button, cn } from 'erxes-ui';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useToggleFavorite } from '../hooks/useToggleFavorite';
import { FavoriteToggleParams } from '../types';

const FAVORITE_PARTICLES = [
  { id: 'top', radius: 18, scale: 0.8, duration: 0.6, size: 4 },
  { id: 'right', radius: 23, scale: 1, duration: 0.64, size: 5 },
  { id: 'bottom-right', radius: 21, scale: 0.9, duration: 0.62, size: 4 },
  { id: 'bottom-left', radius: 26, scale: 1.15, duration: 0.68, size: 6 },
  { id: 'left', radius: 20, scale: 1.05, duration: 0.66, size: 5 },
] as const;

const animations = {
  icon: {
    initial: { scale: 1, rotate: 0 },
    tapActive: { scale: 0.85, rotate: -10 },
    tapCompleted: { scale: 1, rotate: 0 },
  },
  burst: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: [0, 1.4, 1], opacity: [0, 0.4, 0] },
    transition: { duration: 0.7, ease: 'easeOut' },
  },
  particles: FAVORITE_PARTICLES.map((particle, index) => {
    const angle = (index / FAVORITE_PARTICLES.length) * (2 * Math.PI);

    return {
      initial: { scale: 0, opacity: 0.3, x: 0, y: 0 },
      animate: {
        scale: [0, particle.scale, 0],
        opacity: [0.3, 0.8, 0],
        x: [0, Math.cos(angle) * particle.radius],
        y: [0, Math.sin(angle) * particle.radius * 0.75],
      },
      transition: {
        duration: particle.duration,
        delay: index * 0.04,
        ease: 'easeOut',
      },
    };
  }),
};

export function FavoriteToggleIconButton(
  params: Readonly<FavoriteToggleParams>,
) {
  const { isFavorite, toggleFavorite } = useToggleFavorite(params);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    void toggleFavorite();
    if (!isFavorite) {
      setIsAnimating(true);
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <Button
        variant={isFavorite ? 'secondary' : 'ghost'}
        size="icon"
        onClick={handleToggle}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: isFavorite ? 1.1 : 1 }}
          whileTap={
            isFavorite
              ? animations.icon.tapCompleted
              : animations.icon.tapActive
          }
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className="relative flex items-center justify-center"
        >
          <IconStar
            className={isFavorite ? 'opacity-0' : 'opacity-60'}
            size={16}
            aria-hidden="true"
          />

          <IconStar
            className={cn(
              'absolute inset-0 fill-warning text-warning transition-all duration-300',
              isFavorite ? 'opacity-100' : 'opacity-0',
            )}
            size={16}
            aria-hidden="true"
          />

          <AnimatePresence>
            {isAnimating && isFavorite && (
              <motion.div
                className="absolute inset-0 rounded-full bg-warning/30 blur-[2px]"
                {...animations.burst}
                onAnimationComplete={() => setIsAnimating(false)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </Button>

      <AnimatePresence>
        {isAnimating && isFavorite && (
          <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {FAVORITE_PARTICLES.map((particle, index) => {
              const particleAnimation = animations.particles[index];

              return (
                <motion.div
                  key={particle.id}
                  className="absolute rounded-full bg-warning blur-[1px]"
                  style={{ width: particle.size, height: particle.size }}
                  initial={particleAnimation.initial}
                  animate={particleAnimation.animate}
                  transition={particleAnimation.transition}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
