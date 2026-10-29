import * as React from 'react';
import { HoverCard as HoverCardPrimitive } from 'radix-ui';
import { cn } from '../lib/utils';
import { floatingAnimationClassName, floatingSurfaceClassName } from './styles';

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = 'center', sideOffset = 6, ...props }, ref) => (
  <HoverCardPrimitive.Portal>
    <HoverCardPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        floatingSurfaceClassName,
        floatingAnimationClassName,
        'w-64 p-4',
        className,
      )}
      {...props}
    />
  </HoverCardPrimitive.Portal>
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export const HoverCard = Object.assign(HoverCardPrimitive.Root, {
  Trigger: HoverCardPrimitive.Trigger,
  Content: HoverCardContent,
});
