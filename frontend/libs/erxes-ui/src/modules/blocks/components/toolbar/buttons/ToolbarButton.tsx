import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';
import { Button } from 'erxes-ui/components';
import { cn } from 'erxes-ui/lib';

export const ToolbarButton = forwardRef<
  ElementRef<typeof Button>,
  ComponentPropsWithoutRef<typeof Button>
>(({ className, ...props }, ref) => (
  <Button
    ref={ref}
    className={cn(
      'rounded-lg! transition-colors enabled:pointer-events-auto',
      'hover:bg-accent! hover:text-foreground!',
      'data-[state=open]:bg-accent! data-[state=open]:text-foreground!',
      className,
    )}
    {...props}
  />
));

ToolbarButton.displayName = 'ToolbarButton';
