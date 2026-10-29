import * as React from 'react';
import { Toggle as TogglePrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

export const toggleVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full text-sm font-medium text-muted-foreground outline-hidden transition-[background-color,color,box-shadow] ease-out hover:bg-accent hover:text-foreground focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline:
          'bg-card shadow-button-outline hover:bg-accent data-[state=on]:bg-accent',
      },
      size: {
        default: 'h-8 min-w-8 px-3',
        sm: 'h-7 min-w-7 px-2.5 text-xs',
        lg: 'h-9 min-w-9 px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
));

Toggle.displayName = TogglePrimitive.Root.displayName;
