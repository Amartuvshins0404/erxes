import { Select } from 'erxes-ui';

const INTERVAL_MINUTES = 30;

const pad = (value: number) => String(value).padStart(2, '0');

const buildIntervals = (step: number) => {
  const out: string[] = [];

  for (let minutes = 0; minutes < 24 * 60; minutes += step) {
    out.push(`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`);
  }

  return out;
};

const INTERVALS = buildIntervals(INTERVAL_MINUTES);

export const TimeSelect = ({
  value,
  onChange,
  disabled,
  placeholder = 'Select time',
  'aria-label': ariaLabel,
}: {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  'aria-label'?: string;
}) => {
  const options =
    value && !INTERVALS.includes(value)
      ? [...INTERVALS, value].sort()
      : INTERVALS;

  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger disabled={disabled} aria-label={ariaLabel}>
        <Select.Value placeholder={placeholder} />
      </Select.Trigger>
      <Select.Content>
        {options.map((interval) => (
          <Select.Item key={interval} value={interval}>
            {interval}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
};
