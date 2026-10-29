import * as React from 'react';
import { Dialog as SheetPrimitive } from 'radix-ui';
import { IconX } from '@tabler/icons-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Button } from './button';
import { cn } from '../lib/utils';

const SheetTrigger = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Trigger>
>(({ ...props }, ref) => <SheetPrimitive.Trigger ref={ref} {...props} />);
SheetTrigger.displayName = SheetPrimitive.Trigger.displayName;

const SheetRoot = ({
  ...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Root>) => (
  <SheetPrimitive.Root {...props} />
);
SheetRoot.displayName = SheetPrimitive.Root.displayName;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-overlay backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:duration-200 data-[state=closed]:duration-200 data-[state=closed]:[animation-fill-mode:forwards]',
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  'fixed z-50 flex flex-col overflow-hidden rounded-3xl bg-card text-card-foreground shadow-xl outline-hidden ease-out data-[state=closed]:duration-200 data-[state=open]:duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:[animation-fill-mode:forwards]',
  {
    variants: {
      side: {
        top: 'inset-x-2 top-2 max-h-[calc(100dvh-1rem)] data-[state=closed]:slide-out-to-top-full data-[state=open]:slide-in-from-top-full',
        bottom:
          'inset-x-2 bottom-2 max-h-[calc(100dvh-1rem)] data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full',
        left: 'inset-y-2 left-2 h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] md:w-3/4 data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-left-full sm:max-w-md',
        right:
          'inset-y-2 right-2 h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] md:w-3/4 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full sm:max-w-md',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
);

export const SheetPortal = ({
  ...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Portal>) => (
  <SheetPrimitive.Portal {...props} />
);

SheetPortal.displayName = SheetPrimitive.Portal.displayName;

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetView = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay>
      <SheetPrimitive.Content
        ref={ref}
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
      </SheetPrimitive.Content>
    </SheetOverlay>
  </SheetPortal>
));
SheetView.displayName = SheetPrimitive.Content.displayName;

export const SheetClose = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Close>
>(({ asChild, ...props }, ref) => {
  if (asChild) {
    return <SheetPrimitive.Close ref={ref} {...props} asChild />;
  }

  return (
    <SheetPrimitive.Close ref={ref} {...props} asChild>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'ml-auto text-muted-foreground hover:text-foreground',
          props.className,
        )}
      >
        <IconX />
      </Button>
    </SheetPrimitive.Close>
  );
});
SheetClose.displayName = SheetPrimitive.Close.displayName;

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex h-14 flex-none items-center gap-2 border-b border-border px-5',
      className,
    )}
    {...props}
  />
);
SheetHeader.displayName = 'SheetHeader';

const SheetContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('min-h-0 flex-1', className)} {...props} />
);
SheetContent.displayName = 'SheetContent';

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex h-16 flex-none flex-row items-center gap-2 border-t border-border px-5 sm:justify-end',
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = 'SheetFooter';

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn(
      'text-base font-semibold leading-none tracking-tight text-foreground',
      className,
    )}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('mt-1.5 text-sm text-muted-foreground', className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export const Sheet = Object.assign(SheetRoot, {
  Trigger: SheetTrigger,
  Overlay: SheetOverlay,
  View: SheetView,
  Content: SheetContent,
  Header: SheetHeader,
  Footer: SheetFooter,
  Title: SheetTitle,
  Description: SheetDescription,
  Close: SheetClose,
});
