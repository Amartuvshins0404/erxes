import * as React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { cn } from 'erxes-ui/lib/utils';
import { floatingAnimationClassName, floatingSurfaceClassName } from './styles';

export type PopoverProps = React.ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Root
>;

export const popoverClassName = cn(
  floatingSurfaceClassName,
  'w-72 p-1.5 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-150 ease-out',
);

const PopoverPortal = ({
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Portal>) => (
  <PopoverPrimitive.Portal {...props} />
);

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    disableTransition?: boolean;
  }
>(
  (
    {
      className,
      align = 'center',
      disableTransition,
      sideOffset = 6,
      ...props
    },
    ref,
  ) => (
    <PopoverPortal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          popoverClassName,
          !disableTransition && floatingAnimationClassName,
          className,
        )}
        {...props}
      />
    </PopoverPortal>
  ),
);
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export const Popover = Object.assign(PopoverPrimitive.Root, {
  Trigger: PopoverPrimitive.Trigger,
  Content: PopoverContent,
  Anchor: PopoverPrimitive.Anchor,
  Close: PopoverPrimitive.Close,
});
