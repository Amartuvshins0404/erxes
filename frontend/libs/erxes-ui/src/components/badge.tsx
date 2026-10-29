import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';
import { Button } from './button';
import { IconX } from '@tabler/icons-react';

export const badgeVariants = cva(
  'inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-medium transition-colors ease-out outline-hidden focus-visible:shadow-focus [&>svg]:size-3.5 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary/12 text-primary',
        secondary: 'bg-secondary text-secondary-foreground shadow-2xs',
        outline: 'bg-transparent text-foreground shadow-button-outline',
        ghost: 'bg-transparent text-foreground hover:bg-accent',
        success:
          'bg-success/14 text-[color-mix(in_oklch,var(--success)_75%,var(--foreground))]',
        warning:
          'bg-warning/16 text-[color-mix(in_oklch,var(--warning)_65%,var(--foreground))]',
        destructive: 'bg-destructive/12 text-destructive',
        info: 'bg-info/14 text-info',
        solid: 'bg-primary text-primary-foreground',
        'solid-success': 'bg-success text-success-foreground',
        'solid-warning': 'bg-warning text-warning-foreground',
        'solid-destructive': 'bg-destructive text-destructive-foreground',
        'solid-info': 'bg-info text-info-foreground',
      },
      size: {
        sm: 'h-5 px-2 text-[11px]',
        default: 'h-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  onClose?: () => void;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, children, onClose, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          badgeVariants({ variant, size }),
          onClose && 'pr-1',
          className,
        )}
        {...props}
      >
        {children}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="size-4 rounded-full p-0 opacity-70 hover:bg-current/15 hover:opacity-100 active:scale-100"
            asChild
          >
            <IconX className="size-3.5 flex-none" />
          </Button>
        )}
      </div>
    );
  },
);
