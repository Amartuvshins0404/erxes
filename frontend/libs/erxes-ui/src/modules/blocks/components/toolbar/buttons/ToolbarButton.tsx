import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';
import { Button } from 'erxes-ui/components';
import { cn } from 'erxes-ui/lib';

type ToolbarButtonProps = Omit<
  ComponentPropsWithoutRef<typeof Button>,
  'variant'
> & {
  variant?: Exclude<
    ComponentPropsWithoutRef<typeof Button>['variant'],
    'contrast'
  >;
};

export const ToolbarButton = forwardRef<
  ElementRef<typeof Button>,
  ToolbarButtonProps
>(({ className, ...props }, ref) => (
  <Button
    ref={ref}
    className={cn(
      'transition-none enabled:pointer-events-auto',
      'hover:bg-(--color-primary)/15! hover:text-(--color-primary)!',
      'data-[state=open]:bg-(--color-primary)/10! data-[state=open]:text-(--color-primary)!',
      className,
    )}
    {...props}
  />
));

ToolbarButton.displayName = 'ToolbarButton';
