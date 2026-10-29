import * as React from 'react';

import { cn } from 'erxes-ui/lib';

/**
 * This component is based on the `kbd` element and supports all of its props
 */
export const Kbd = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<'kbd'> & {
    variant?: 'background' | 'foreground';
  }
>(({ children, className, variant = 'background', ...props }, ref) => {
  return (
    <kbd
      {...props}
      ref={ref}
      className={cn(
        'inline-flex h-5 w-fit min-w-5 items-center justify-center rounded-md px-1 font-sans text-[11px] font-medium leading-none',
        variant === 'background' && 'bg-current/15 text-current',
        variant === 'foreground' &&
          'bg-muted text-muted-foreground shadow-2xs',
        className,
      )}
    >
      {children}
    </kbd>
  );
});
Kbd.displayName = 'Kbd';
