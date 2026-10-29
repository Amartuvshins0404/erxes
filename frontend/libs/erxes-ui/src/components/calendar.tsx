import * as React from 'react';
import {
  DayFlag,
  DayPicker,
  DropdownNavProps,
  DropdownProps,
  SelectionState,
  UI,
} from 'react-day-picker';

import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
} from '@tabler/icons-react';

import { buttonVariants } from './button';
import { Select } from './select';
import { cn } from '../lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// Common classNames for both calendar variants
const getBaseClassNames = (customClassNames = {}) => ({
  [UI.CaptionLabel]: 'text-sm font-medium',
  [UI.MonthGrid]: 'w-full border-collapse',
  [SelectionState.range_end]: 'day-range-end',
  [SelectionState.selected]:
    'rounded-full bg-primary text-primary-foreground shadow-button-primary',
  [SelectionState.range_middle]:
    'rounded-lg shadow-none aria-selected:bg-accent aria-selected:text-accent-foreground',
  [DayFlag.today]: 'font-semibold not-data-selected:text-primary',
  [DayFlag.outside]:
    'day-outside text-muted-foreground opacity-60 aria-selected:opacity-50',
  [DayFlag.disabled]: 'text-muted-foreground opacity-50',
  [DayFlag.hidden]: 'invisible',
  [UI.Day]:
    'relative size-8 rounded-full p-0 text-center text-sm focus-within:relative focus-within:z-20',
  [UI.DayButton]: cn(
    buttonVariants({ variant: 'ghost' }),
    'size-8 rounded-full p-0 font-normal hover:bg-accent in-data-selected:hover:bg-transparent',
  ),
  ...customClassNames,
});

export const Calendar = React.forwardRef<React.JSX.Element, CalendarProps>(
  ({ className, classNames, showOutsideDays, ...props }, ref) => {
    const handleCalendarChange = (
      _value: string | number,
      _e: React.ChangeEventHandler<HTMLSelectElement>,
    ) => {
      const _event = {
        target: {
          value: String(_value),
        },
      } as React.ChangeEvent<HTMLSelectElement>;
      _e(_event);
    };
    return (
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn('p-3', className)}
        classNames={getBaseClassNames({
          [UI.Months]: 'relative',
          [UI.Month]: 'space-y-4 ml-0',
          [UI.MonthCaption]: 'flex justify-center items-center h-7',
          [UI.PreviousMonthButton]: cn(
            buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
            'absolute left-0 top-0 text-muted-foreground hover:text-foreground',
          ),
          [UI.NextMonthButton]: cn(
            buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
            'absolute right-0 top-0 text-muted-foreground hover:text-foreground',
          ),
          [UI.Weekdays]: 'flex gap-1',
          [UI.Weekday]:
            'w-8 text-xs font-medium text-muted-foreground',
          [UI.Week]: 'flex w-full mt-2 gap-1',
          ...classNames,
        })}
        captionLayout="dropdown"
        defaultMonth={new Date()}
        startMonth={new Date(1980, 6)}
        endMonth={new Date(new Date().getFullYear() + 10, 11)}
        components={{
          DropdownNav: (props: DropdownNavProps) => {
            return (
              <div className="flex w-full items-center gap-2 justify-center">
                {props.children}
              </div>
            );
          },
          Dropdown: (props: DropdownProps) => {
            return (
              <Select
                value={String(props.value)}
                onValueChange={(value) => {
                  if (props.onChange) {
                    handleCalendarChange(value, props.onChange);
                  }
                }}
              >
                <Select.Trigger
                  size="sm"
                  className="w-fit flex-none rounded-full font-medium"
                >
                  <Select.Value className="gap-1" />
                </Select.Trigger>
                <Select.Content className="max-h-[min(26rem,var(--radix-select-content-available-height))]">
                  {props.options?.map((option) => (
                    <Select.Item
                      key={option.value}
                      value={String(option.value)}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            );
          },
          Chevron: ({ ...props }) => <Chevron {...props} />,
        }}
        {...props}
      />
    );
  },
);

export const CalendarTwoMonths = React.forwardRef<
  React.JSX.Element,
  CalendarProps
>(({ className, classNames, showOutsideDays, ...props }, ref) => {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(className)}
      classNames={getBaseClassNames({
        [UI.Months]: 'relative inline-flex',
        [UI.Month]:
          'space-y-4 ml-0 first-of-type:mr-12 first-of-type:relative first-of-type:after:absolute first-of-type:after:w-px first-of-type:after:h-auto first-of-type:after:inset-y-0 first-of-type:after:-right-6 first-of-type:after:bg-border',
        [UI.MonthCaption]: 'flex items-center h-7',
        [UI.PreviousMonthButton]: cn(
          buttonVariants({ variant: 'secondary', size: 'icon-sm' }),
          'absolute right-10 top-0',
        ),
        [UI.NextMonthButton]: cn(
          buttonVariants({ variant: 'secondary', size: 'icon-sm' }),
          'absolute right-1 top-0',
        ),
        [UI.Weekdays]: 'flex w-full border-b border-border',
        [UI.Weekday]:
          'h-7 w-8 text-xs font-medium text-muted-foreground',
        [UI.Week]: 'flex w-full mt-0.5',
        ...classNames,
      })}
      components={{
        Chevron: ({ ...props }) => <Chevron {...props} />,
      }}
      numberOfMonths={2}
      {...props}
    />
  );
});

const Chevron = ({ orientation = 'left' }) => {
  switch (orientation) {
    case 'left':
      return <IconChevronLeft className="h-4 w-4" />;
    case 'right':
      return <IconChevronRight className="h-4 w-4" />;
    case 'up':
      return <IconChevronUp className="h-4 w-4" />;
    case 'down':
      return <IconChevronDown className="h-4 w-4" />;
    default:
      return null;
  }
};
