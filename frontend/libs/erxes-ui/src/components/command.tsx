import * as React from 'react';

import { IconSearch } from '@tabler/icons-react';
import { cva } from 'class-variance-authority';
import { Command as CommandPrimitive } from 'cmdk';
import { Dialog, DialogProps } from './dialog';
import { cn } from '../lib/utils';
import { useEffect, useRef } from 'react';
import { mergeRefs } from 'react-merge-refs';

const CommandRoot = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'flex h-full w-full flex-col overflow-hidden bg-transparent text-popover-foreground outline-hidden',
      className,
    )}
    {...props}
  />
));
CommandRoot.displayName = CommandPrimitive.displayName;

type CommandDialogProps = DialogProps & {
  dialogContentClassName?: string;
};

const CommandDialog = ({
  children,
  dialogContentClassName,
  ...props
}: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <Dialog.Content
        className={cn(
          'overflow-hidden p-0 rounded-3xl border-0 bg-popover',
          dialogContentClassName,
        )}
      >
        <CommandRoot className="[&_[cmdk-input-wrapper]_svg]:size-4.5 **:[[cmdk-input]]:h-12 **:[[cmdk-item]]:h-10 **:[[cmdk-item]]:px-3">
          {children}
        </CommandRoot>
      </Dialog.Content>
    </Dialog>
  );
};

const commanInputVariants = cva(
  'flex h-9 w-full bg-transparent px-3.5 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-transparent',
        secondary: 'bg-transparent',
      },
    },
  },
);

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & {
    variant?: 'primary' | 'secondary';
    wrapperClassName?: string;
    focusOnMount?: boolean;
  }
>(
  (
    {
      className,
      variant = 'secondary',
      wrapperClassName,
      focusOnMount,
      ...props
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (inputRef.current && focusOnMount) {
        inputRef.current.focus();
      }
    }, [focusOnMount]);

    if (variant === 'primary') {
      return (
        <div
          className={cn('flex items-center gap-2 border-b border-border px-3.5', wrapperClassName)}
          cmdk-input-wrapper=""
        >
          <IconSearch className="size-4 shrink-0 text-muted-foreground" />
          <CommandPrimitive.Input
            ref={mergeRefs([inputRef, ref])}
            className={cn(
              commanInputVariants({ variant: 'primary' }),
              'pl-0',
              className,
            )}
            {...props}
          />
        </div>
      );
    }

    return (
      <div
        className={cn(
          'flex items-center border-b border-border',
          wrapperClassName,
        )}
      >
        <CommandPrimitive.Input
          ref={mergeRefs([inputRef, ref])}
          className={cn(
            commanInputVariants({ variant: 'secondary' }),
            className,
          )}
          {...props}
          placeholder={props.placeholder || 'Search'}
        />
      </div>
    );
  },
);

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(
      'max-h-72 scroll-py-1.5 overflow-y-auto overscroll-contain p-1.5 hide-scroll focus-within:outline-hidden focus-within:[&>div]:outline-hidden',
      className,
    )}
    {...props}
  />
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-8 text-center text-sm text-muted-foreground"
    {...props}
  />
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'overflow-hidden text-foreground **:[[cmdk-group-heading]]:px-2.5 **:[[cmdk-group-heading]]:pb-1 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground',
      className,
    )}
    {...props}
  />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn('-mx-1.5 my-1.5 h-px bg-border', className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex h-8 cursor-default select-none items-center gap-2 rounded-lg px-2.5 text-sm outline-hidden transition-colors ease-out data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0',
      className,
    )}
    {...props}
  />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandActionItem = ({
  icon: Icon,
  label,
  onSelect,
  disabled,
  trailing,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: React.ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  trailing?: React.ReactNode;
  className?: string;
}) => (
  <CommandItem
    className={cn('justify-between', className)}
    onSelect={onSelect}
    disabled={disabled}
  >
    <div className="flex gap-2 items-center">
      <Icon className="size-4" />
      <div className="flex items-center">{label}</div>
    </div>
    {trailing}
  </CommandItem>
);
CommandActionItem.displayName = 'CommandActionItem';

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        'ml-auto pl-4 font-mono text-xs tracking-wide text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
};
CommandShortcut.displayName = 'CommandShortcut';

export const Command = Object.assign(CommandRoot, {
  Dialog: CommandDialog,
  Input: CommandInput,
  List: CommandList,
  Empty: CommandEmpty,
  Group: CommandGroup,
  Item: CommandItem,
  ActionItem: CommandActionItem,
  Shortcut: CommandShortcut,
  Separator: CommandSeparator,
  Primitive: CommandPrimitive,
});
