import { Select } from 'erxes-ui';

const makeIntervals = (minutes: number) => {
  const out = [];
  const total = 24 * 60;

  for (let t = 0; t < total; t += minutes) {
    const h = String(Math.floor(t / 60)).padStart(2, '0');
    const m = String(t % 60).padStart(2, '0');
    out.push(`${h}:${m}`);
  }
  return out;
};

export const ProjectTime = ({
  value,
  onChange,
  disabled,
  onBlur,
}: {
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  onBlur?: () => void;
}) => {
  const intervals = makeIntervals(30);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger disabled={disabled} onBlur={onBlur}>
        <Select.Value placeholder="Select time" />
      </Select.Trigger>
      <Select.Content>
        {intervals.map((interval) => (
          <Select.Item value={interval || ''}>{interval}</Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
};
