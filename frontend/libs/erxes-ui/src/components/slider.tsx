import * as React from 'react';
import { Slider as SliderPrimitive } from 'radix-ui';

import { cn } from 'erxes-ui/lib';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    hideThumb?: boolean;
  }
>(({ className, hideThumb, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex w-full touch-none select-none items-center',
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted shadow-[inset_0_0_0_1px_var(--border)]">
      <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
    </SliderPrimitive.Track>
    {!hideThumb && (
      <SliderPrimitive.Thumb className="block size-4 cursor-grab rounded-full bg-card shadow-md outline-hidden transition-[box-shadow,transform] ease-out hover:scale-110 focus-visible:shadow-focus active:cursor-grabbing disabled:pointer-events-none disabled:opacity-50 dark:bg-foreground" />
    )}
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
