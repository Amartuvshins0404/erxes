import * as React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { cn } from '../lib/utils';
import { Button } from './button';
import { IconX } from '@tabler/icons-react';

type CommandBarProps = React.PropsWithChildren<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  disableAutoFocus?: boolean;
}>;

const Root = ({
  open = false,
  onOpenChange,
  defaultOpen = false,
  disableAutoFocus = true,
  children,
}: CommandBarProps) => {
  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      defaultOpen={defaultOpen}
    >
      <PopoverPrimitive.Trigger
        className={cn(
          'fixed bottom-10 left-1/2 h-px w-px -translate-x-1/2 z-50',
        )}
      />

      <PopoverPrimitive.Content
        side="top"
        sideOffset={0}
        onOpenAutoFocus={(e) => {
          if (disableAutoFocus) {
            e.preventDefault();
          }
        }}
        className={cn(
          'z-50 duration-200 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-bottom-2',
        )}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
};
Root.displayName = 'CommandBar';

const Value = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'> & {
    onClose?: () => void;
  }
>(({ className, onClose, children, ...props }, ref) => {
  return (
    <div className="flex items-center rounded-full bg-secondary">
      <Button
        variant="secondary"
        className={cn(
          'cursor-default active:scale-100',
          onClose && 'pr-1.5',
          className,
        )}
        asChild
      >
        <div ref={ref} {...props}>
          {children}
        </div>
      </Button>
      {onClose && (
        <Button
          variant="ghost"
          className="mr-1 text-muted-foreground hover:text-foreground"
          size="icon-sm"
          onClick={onClose}
        >
          <IconX />
        </Button>
      )}
    </div>
  );
});
Value.displayName = 'CommandBar.Value';

const Bar = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'relative flex items-center gap-x-1 overflow-hidden rounded-full bg-popover p-1.5 text-popover-foreground shadow-xl',
        className,
      )}
      {...props}
    />
  );
});
Bar.displayName = 'CommandBar.Bar';

export const CommandBar = Object.assign(Root, {
  Value,
  Bar,
});
