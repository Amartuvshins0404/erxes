import * as React from 'react';

import { Toast as ToastPrimitives } from 'radix-ui';
import {
  IconAlertCircleFilled,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconInfoCircleFilled,
  IconX,
} from '@tabler/icons-react';
import { cva } from 'class-variance-authority';

import { cn } from '../lib/utils';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'pointer-events-none fixed top-0 z-100 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl bg-popover p-4 pr-10 text-popover-foreground shadow-xl transition-all duration-200 ease-out data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-(--radix-toast-swipe-end-x) data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full sm:data-[state=open]:slide-in-from-bottom-full',
);

const ToastRoot = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & {
    variant?: 'success' | 'warning' | 'destructive' | 'default';
  }
>(({ className, variant, children, ...props }, ref) => {
  let icon = null;

  switch (variant) {
    case 'success':
      icon = <IconCircleCheckFilled className="text-success" />;
      break;
    case 'warning':
      icon = <IconAlertCircleFilled className="text-warning" />;
      break;
    case 'destructive':
      icon = <IconCircleXFilled className="text-destructive" />;
      break;
    default:
      icon = <IconInfoCircleFilled className="text-info" />;
      break;
  }

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants(), className)}
      {...props}
    >
      <div className="mt-px flex-none [&>svg]:size-4.5">{icon}</div>
      {children}
    </ToastPrimitives.Root>
  );
});
ToastRoot.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-card px-3 text-xs font-medium shadow-button-outline outline-hidden transition-colors ease-out hover:bg-accent focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-2.5 top-2.5 flex size-6 cursor-pointer items-center justify-center rounded-full text-muted-foreground opacity-0 outline-hidden transition-[opacity,background-color,color] ease-out hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:shadow-focus group-hover:opacity-100',
      className,
    )}
    toast-close=""
    {...props}
  >
    <IconX className="size-3.5" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-medium leading-snug', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export type ToastProps = React.ComponentPropsWithoutRef<typeof ToastRoot>;

export type ToastActionElement = React.ReactElement<typeof ToastAction>;

export const Toast = Object.assign(ToastRoot, {
  Provider: ToastProvider,
  Viewport: ToastViewport,
  Action: ToastAction,
  Close: ToastClose,
  Title: ToastTitle,
  Description: ToastDescription,
});
