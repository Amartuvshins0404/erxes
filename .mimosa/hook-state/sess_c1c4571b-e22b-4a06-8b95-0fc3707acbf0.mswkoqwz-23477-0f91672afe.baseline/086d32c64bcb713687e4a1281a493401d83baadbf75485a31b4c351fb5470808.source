import {
  CONTRACT_STAGE_COLORS,
  LOCKED_UNIT_COLOR,
} from '@/contract-status/constants';
import { IUnit } from '@/unit/types/unitType';
import { IconLockFilled } from '@tabler/icons-react';
import { cn, useQueryState } from 'erxes-ui';

export const StackingUnitItem = ({
  number,
  unitType,
  _id,
  activeContract,
  locked,
}: IUnit) => {
  const [, setUnitId] = useQueryState<string>('unitId');

  const { size } = unitType || {};

  const stageType = activeContract?.statusType;
  const stagePreset = stageType
    ? CONTRACT_STAGE_COLORS[stageType as keyof typeof CONTRACT_STAGE_COLORS]
    : undefined;
  const isSigned = stageType === 'signed';
  const backgroundColor = locked
    ? LOCKED_UNIT_COLOR
    : stagePreset?.color || 'var(--border)';
  const stageLabel = locked ? 'Locked' : stagePreset?.en || 'Available';

  return (
    <div
      key={number}
      className={cn(
        'blk:size-28 flex-none overflow-hidden min-w-px bgborder relative',
        (locked || isSigned) && 'text-white',
      )}
      onClick={() => setUnitId(_id)}
      style={{ backgroundColor }}
    >
      <div className="p-3">
        <div className="font-bold mb-4 flex items-center gap-1">
          {number}
          {locked && <IconLockFilled className="size-4" />}
        </div>

        <div className="text-xs">{size} m²</div>
        <div className="text-xs">{stageLabel}</div>
      </div>
    </div>
  );
};
