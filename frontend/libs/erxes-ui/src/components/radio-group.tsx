import * as React from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { cn } from 'erxes-ui/lib';

export type RadioGroupProps = React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Root
>;

const RadioGroupRoot = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn('grid gap-3', className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroupRoot.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'grid aspect-square size-4 shrink-0 cursor-pointer place-items-center rounded-full bg-card shadow-[inset_0_0_0_1px_var(--border-strong)] outline-hidden transition-[background-color,box-shadow] ease-out hover:shadow-[inset_0_0_0_1px_var(--scroll)] focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:shadow-focus-destructive data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:shadow-button-primary',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center text-current animate-in zoom-in-50 fade-in-0 duration-150">
        <svg
          width="6"
          height="6"
          viewBox="0 0 6 6"
          fill="currentcolor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="3" cy="3" r="3" />
        </svg>
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export const RadioGroup = Object.assign(RadioGroupRoot, {
  Item: RadioGroupItem,
});
