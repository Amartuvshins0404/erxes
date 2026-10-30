import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';
import { Toggle } from 'erxes-ui/components';
import { cn } from 'erxes-ui/lib';

export const ToolbarToggle = forwardRef<
  ElementRef<typeof Toggle>,
  ComponentPropsWithoutRef<typeof Toggle>
>(({ className, ...props }, ref) => (
  <Toggle
    ref={ref}
    className={cn(
      'rounded-lg! transition-colors enabled:pointer-events-auto',
      'hover:bg-accent! hover:text-foreground!',
      'active:bg-accent! data-[state=on]:bg-primary/10! data-[state=on]:text-primary!',
      className,
    )}
    {...props}
  />
));

ToolbarToggle.displayName = 'ToolbarToggle';
