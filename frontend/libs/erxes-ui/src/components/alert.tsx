import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';

const alertVariants = cva(
  'relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-2xl px-4 py-3.5 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground shadow-card',
        info: 'bg-info/10 text-info ring-1 ring-inset ring-info/20 [&_[data-slot=alert-description]]:text-foreground/80',
        success:
          'bg-success/10 text-[color-mix(in_oklch,var(--success)_75%,var(--foreground))] ring-1 ring-inset ring-success/20 [&_[data-slot=alert-description]]:text-foreground/80',
        warning:
          'bg-warning/12 text-[color-mix(in_oklch,var(--warning)_65%,var(--foreground))] ring-1 ring-inset ring-warning/20 [&_[data-slot=alert-description]]:text-foreground/80',
        destructive:
          'bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20 [&_[data-slot=alert-description]]:text-foreground/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function AlertRoot({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight',
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  );
}

export const Alert = Object.assign(AlertRoot, {
  Title: AlertTitle,
  Description: AlertDescription,
});
