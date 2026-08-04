import { DatePicker } from 'erxes-ui';
import { TimeSelect } from '@/events/components/TimeSelect';

const pad = (value: number) => String(value).padStart(2, '0');

const toTimeString = (date: Date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const isValidDate = (value: Date) => !Number.isNaN(value.getTime());

export const DateTimeField = ({
  value,
  onChange,
  placeholder = 'Pick a date',
  'aria-label': ariaLabel,
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  'aria-label'?: string;
}) => {
  const current = value ? new Date(value) : undefined;
  const date = current && !Number.isNaN(current.getTime()) ? current : undefined;

  const handleDateChange = (
    next: Date | Date[] | { from?: Date } | undefined,
  ) => {
    const picked = next as Date | undefined;

    if (!picked || !(picked instanceof Date) || !isValidDate(picked)) {
      onChange('');
      return;
    }

    const merged = new Date(picked);
    merged.setHours(date?.getHours() ?? 0, date?.getMinutes() ?? 0, 0, 0);

    if (!isValidDate(merged)) {
      return;
    }

    onChange(merged.toISOString());
  };

  const handleTimeChange = (next: string) => {
    const [hours, minutes] = next.split(':').map(Number);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return;
    }

    const merged = date ? new Date(date) : new Date();
    merged.setHours(hours, minutes, 0, 0);

    if (!isValidDate(merged)) {
      return;
    }

    onChange(merged.toISOString());
  };

  return (
    <div className="flex items-center gap-2">
      <DatePicker
        value={date}
        onChange={handleDateChange}
        placeholder={placeholder}
        className="flex-auto"
      />
      <div className="w-32 flex-none">
        <TimeSelect
          value={date ? toTimeString(date) : undefined}
          onChange={handleTimeChange}
          disabled={!date}
          aria-label={ariaLabel}
        />
      </div>
    </div>
  );
};
