import { Label, RadioGroup } from 'erxes-ui/components';
import { forwardRef, useId, ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from 'erxes-ui/lib';
import { type RadioGroupProps } from './radio-group';

export interface ChoiceboxGroupProps
  extends Omit<RadioGroupProps, 'className'> {
  className?: string;
  direction?: 'column' | 'row';
  spacing?: 'default' | 'tight' | 'loose';
}

const ChoiceboxGroupRoot = forwardRef<HTMLDivElement, ChoiceboxGroupProps>(
  (
    {
      children,
      className,
      direction = 'column',
      spacing = 'default',
      value,
      onValueChange,
      defaultValue,
      ...props
    },
    ref,
  ) => {
    return (
      <RadioGroup
        ref={ref}
        className={cn('w-full')}
        value={value}
        onValueChange={onValueChange}
        defaultValue={defaultValue}
        {...props}
      >
        <div
          className={cn(
            'flex w-full h-max gap-2',
            direction === 'column' ? 'flex-col' : 'flex-row',
            className,
          )}
        >
          {children}
        </div>
      </RadioGroup>
    );
  },
);

ChoiceboxGroupRoot.displayName = 'ChoiceboxGroup';

export interface ChoiceboxItemProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  value: string;
  title?: React.ReactNode;
  disabled?: boolean;
  children: ReactNode;
}
const ChoiceboxItem = forwardRef<HTMLLabelElement, ChoiceboxItemProps>(
  ({ className, value, title, disabled, children }, ref) => {
    const id = useId();
    return (
      <label
        key={`${id}-${value}`}
        ref={ref}
        className={cn(
          'relative h-min w-full cursor-pointer justify-center rounded-xl bg-card shadow-button-outline outline-hidden transition-[background-color,box-shadow] ease-out hover:bg-accent has-focus-visible:shadow-focus',
        )}
      >
        <RadioGroup.Item
          id={`${id}-${value}`}
          value={value}
          className="peer sr-only after:absolute after:inset-0"
          disabled={disabled}
        />
        <div
          className={cn(
            'flex h-full w-full flex-col gap-1.5 rounded-xl p-3 transition-[background-color,box-shadow,color] ease-out peer-data-[state=checked]:bg-primary/8 peer-data-[state=checked]:text-primary peer-data-[state=checked]:shadow-[inset_0_0_0_1.5px_var(--primary)]',
            className,
          )}
        >
          {title && (
            <Label
              htmlFor={`${id}-${value}`}
              className="text-xs font-medium text-muted-foreground"
            >
              {title}
            </Label>
          )}
          <span id={`${id}-1-description`} className="text-sm font-medium">
            {children}
          </span>
        </div>
      </label>
    );
  },
);

ChoiceboxItem.displayName = 'ChoiceboxGroup.Item';

export const ChoiceboxGroup = Object.assign(ChoiceboxGroupRoot, {
  Item: ChoiceboxItem,
});
