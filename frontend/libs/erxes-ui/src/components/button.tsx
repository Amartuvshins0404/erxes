import * as React from 'react';

import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { IconLoader2 } from '@tabler/icons-react';

import { cn } from 'erxes-ui/lib';

export const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-medium cursor-pointer select-none outline-hidden transition-[background-color,color,box-shadow,transform,opacity] ease-out focus-visible:shadow-focus active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-button-primary hover:brightness-110',
        destructive:
          'bg-destructive text-destructive-foreground shadow-button-primary hover:brightness-110 focus-visible:shadow-focus-destructive',
        outline:
          'bg-card text-foreground shadow-button-outline hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
        ghost: 'bg-transparent hover:bg-accent',
        link: 'bg-transparent text-primary underline-offset-4 hover:underline active:scale-100',
        contrast:
          'bg-foreground text-background shadow-xs hover:bg-foreground/85',
      },
      size: {
        default: 'h-8',
        sm: 'h-7 px-3 text-xs gap-1 [&>svg]:size-3.5',
        lg: 'h-9 px-4',
        icon: 'size-8 px-0',
        'icon-sm': 'size-7 px-0 [&>svg]:size-3.5',
        'icon-lg': 'size-9 px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot.Root : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        type="button"
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        data-loading={loading || undefined}
        {...props}
      >
        {loading && !asChild && <IconLoader2 className="animate-spin" />}
        {children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';
