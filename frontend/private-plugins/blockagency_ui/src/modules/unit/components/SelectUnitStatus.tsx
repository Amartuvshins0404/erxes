import { Select } from 'erxes-ui';
import { useUpdateUnitStatus } from '../hooks/useUpdateUnitStatus';
import { BlockUnitStatus } from '../types/unit';
import { UNIT_LEASE_STATUS } from '../constants/status';

interface Props {
  unitId: string;
  status?: BlockUnitStatus;
}

export const SelectUnitStatus = ({ unitId, status = 'vacant' }: Props) => {
  const { updateStatus, loading } = useUpdateUnitStatus();

  return (
    <Select
      value={status}
      onValueChange={(val) => updateStatus(unitId, val)}
      disabled={loading}
    >
      <Select.Trigger className="h-7 w-[110px] text-xs border-none shadow-none focus:ring-0 px-2">
        <Select.Value>
          <span style={{ color: UNIT_LEASE_STATUS[status]?.color }}>
            {UNIT_LEASE_STATUS[status]?.en || status}
          </span>
        </Select.Value>
      </Select.Trigger>
      <Select.Content>
        {Object.entries(UNIT_LEASE_STATUS).map(([key, value]) => (
          <Select.Item key={key} value={key}>
            <span style={{ color: value.color }}>{value.en}</span>
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
};
