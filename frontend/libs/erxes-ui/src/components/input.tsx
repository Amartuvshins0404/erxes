import * as React from 'react';

import { cva, VariantProps } from 'class-variance-authority';

import { cn } from 'erxes-ui/lib/utils';
import { Except } from 'type-fest';
import { IMaskInput } from 'react-imask';
import { fieldClassName, fieldSizeClassNames } from './styles';

export const inputVariants = cva(fieldClassName, {
  variants: {
    size: fieldSizeClassNames,
    type: {
      file: 'py-1 pl-1 file:mr-2 file:h-6 file:cursor-pointer file:rounded-full file:border-0 file:bg-secondary file:px-2.5 file:text-xs file:font-medium file:text-foreground',
      search:
        '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none',
      default: '',
      number:
        '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
    },
    variant: {
      default: '',
      secondary:
        'bg-muted shadow-none hover:bg-accent hover:shadow-none focus-visible:bg-card focus-visible:shadow-focus',
    },
  },
  defaultVariants: {
    type: 'default',
    variant: 'default',
    size: 'default',
  },
});

export type InputProps = Except<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size'
> &
  Except<VariantProps<typeof inputVariants>, 'type'>;

const InputMain = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, size, ...props }, ref) => {
    return (
      <input
        type={type}
        autoComplete="off"
        className={cn(
          inputVariants({
            type:
              type === 'file'
                ? 'file'
                : type === 'search'
                ? 'search'
                : 'default',
            variant,
            size,
          }),
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

InputMain.displayName = 'Input';

export const InputNumber = React.forwardRef<
  React.ElementRef<typeof IMaskInput>,
  Except<
    React.ComponentPropsWithoutRef<typeof IMaskInput>,
    'onChange' | 'value'
  > & {
    onChange?: (value?: number | '') => void;
    value?: number;
  }
>(({ value, onChange, className, ...props }, ref) => {
  return (
    <IMaskInput
      ref={ref}
      mask={Number as any}
      onAccept={(value) => {
        onChange?.(value ? Number(value) : '');
      }}
      value={value + ''}
      autoComplete="off"
      radix="."
      thousandsSeparator={','}
      className={cn(inputVariants({ type: 'number' }), className)}
      unmask
      {...props}
    />
  );
});

InputNumber.displayName = 'InputNumber';

export const Input = Object.assign(InputMain, {
  Number: InputNumber,
});
